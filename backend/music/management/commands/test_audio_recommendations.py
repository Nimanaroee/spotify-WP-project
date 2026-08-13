"""
management/commands/test_recommendations.py

Integration test for the multi-tower hybrid recommendation engine.
Ingests real audio files, extracts MIR features, and runs scenario-based
validation across three genres.

Usage:
    python manage.py test_recommendations --dir /path/to/audio/files

Optional flags:
    --neural      Also run MERT / CLAP / Demucs / EnCodec extraction
                  (slow — requires GPU for reasonable throughput).
    --device      PyTorch device string, e.g. "cuda:0" (default: "cpu").
"""

import os

from django.core.files import File
from django.core.management.base import BaseCommand

from music.models import Track, StreamEvent
from music.recommender import get_recommendations_for_user
from music.services import publish_release
from user.models import Artist, User


# Tracks expected in --dir.  Grouped here for readable scenario labels.
TARGET_FILES = [
    "8.m4a",
    "porch_1.mp3",
    "porch_2.mp3",
    "pop_1.m4a",
    "hardstyle_1.m4a",
    "hardstyle_3.m4a",
    "hardstyle_4.m4a",
    "rap.mp3",
    "rap_2.m4a",
    "rap_5.m4a",
    "hard_5.mp3",
    "cas_1.m4a",
    "cas_2.m4a",
    "cas_3.m4a",
]

# Informal genre groups used for sanity-check output only.
GENRE_GROUPS = {
    "hardstyle": {"hardstyle_1.m4a", "hardstyle_3.m4a", "hardstyle_4.m4a", "hard_5.mp3"},
    "rap":       {"rap.mp3", "rap_2.m4a", "rap_5.m4a"},
    "casual":    {"cas_1.m4a", "cas_2.m4a", "cas_3.m4a"},
    "pop":       {"pop_1.m4a", "porch_1.mp3", "porch_2.mp3", "8.m4a"},
}


def _genre_of(filename: str) -> str:
    for genre, members in GENRE_GROUPS.items():
        if filename in members:
            return genre
    return "unknown"


class Command(BaseCommand):
    help = "Integration test for the multi-tower recommendation engine."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dir",
            type=str,
            required=True,
            help="Directory containing the test audio files.",
        )
        parser.add_argument(
            "--neural",
            action="store_true",
            default=False,
            help=(
                "Enable neural embedding extraction (MERT, CLAP, Demucs, EnCodec). "
                "Slow — GPU strongly recommended."
            ),
        )
        parser.add_argument(
            "--device",
            type=str,
            default="cpu",
            help="PyTorch device string (default: 'cpu').",
        )

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------

    def handle(self, *args, **options):
        directory = options["dir"]
        enable_neural = options["neural"]
        device = options["device"]

        if not os.path.exists(directory):
            self.stdout.write(self.style.ERROR(f"Directory not found: {directory}"))
            return

        if enable_neural:
            self.stdout.write(
                self.style.WARNING(
                    f"Neural extraction ENABLED (device={device}). "
                    "This may take several minutes per track."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "Neural extraction DISABLED (MIR signal features only). "
                    "Pass --neural to enable MERT / CLAP / Demucs / EnCodec."
                )
            )

        # 1. Setup test fixtures
        artist, listener = self._setup_users()

        # 2. Ingest audio files and extract features
        tracks_by_filename = self._ingest_tracks(
            directory, artist, enable_neural=enable_neural, device=device
        )

        if not tracks_by_filename:
            self.stdout.write(self.style.ERROR("No tracks were processed. Exiting."))
            return

        # 3. Run recommendation scenarios
        self.stdout.write(
            self.style.SUCCESS(
                f"\nExtraction complete ({len(tracks_by_filename)} tracks). "
                "Running recommendation scenarios...\n"
                + "─" * 60
            )
        )

        for seed_filename in ("rap.mp3", "cas_1.m4a", "hardstyle_1.m4a"):
            self._run_scenario(
                seed_filename,
                listener,
                tracks_by_filename,
                limit=3,
            )

        self.stdout.write(self.style.SUCCESS("\n" + "─" * 60 + "\nTest complete!"))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _setup_users(self):
        self.stdout.write(self.style.WARNING("Setting up test users..."))

        artist, _ = Artist.objects.get_or_create(
            email="test_artist@example.com",
            defaults={
                "username": "test_artist",
                "stage_name": "Test Artist",
                "role": User.Role.ARTIST,
                "verification_status": Artist.VerificationStatus.APPROVED,
            },
        )

        listener, _ = User.objects.get_or_create(
            email="test_listener@example.com",
            defaults={
                "username": "test_listener",
                "role": User.Role.LISTENER,
            },
        )

        # Wipe stale test data so reruns are idempotent
        Track.objects.filter(artist=artist).delete()
        StreamEvent.objects.filter(user=listener).delete()

        return artist, listener

    def _ingest_tracks(
        self,
        directory: str,
        artist,
        enable_neural: bool,
        device: str,
    ) -> dict[str, Track]:
        """
        Ingest each audio file via publish_release (which internally calls
        the full feature extraction pipeline) and return a filename → Track map.
        """
        self.stdout.write(
            self.style.WARNING(f"\nProcessing audio files from: {directory}")
        )

        tracks_by_filename: dict[str, Track] = {}

        for filename in TARGET_FILES:
            filepath = os.path.join(directory, filename)

            if not os.path.exists(filepath):
                self.stdout.write(self.style.ERROR(f"  [MISSING]  {filename}"))
                continue

            self.stdout.write(f"  [EXTRACT]  {filename} ...")

            try:
                with open(filepath, "rb") as f:
                    django_file = File(f, name=filename)
                    payload = {
                        "release_type": Track.ReleaseType.SINGLE,
                        "title": filename,
                        "tracks": [
                            {
                                "title": filename,
                                "audio_file": django_file,
                                # Pass neural flags through to the extraction pipeline.
                                # publish_release is expected to forward these to
                                # extract_advanced_features().
                                "enable_neural": enable_neural,
                                "device": device,
                            }
                        ],
                    }
                    published = publish_release(artist, payload)

                # publish_release returns a list of Track instances.
                # Guard against it returning release-wrapper objects.
                for item in published:
                    track = item if isinstance(item, Track) else getattr(item, "track", None)
                    if track is not None:
                        tracks_by_filename[filename] = track
                        self.stdout.write(
                            self.style.SUCCESS(f"             → saved as pk={track.pk}")
                        )

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f"  [FAILED]   {filename}: {exc}")
                )

        return tracks_by_filename

    def _run_scenario(
        self,
        seed_filename: str,
        listener,
        tracks_by_filename: dict[str, Track],
        limit: int,
    ):
        """
        Simulate a listening session (seed track only) and print the top-N
        recommendations with their per-modality scores and explanation labels.
        Also runs a genre-coherence sanity check.
        """
        seed_track = tracks_by_filename.get(seed_filename)
        if seed_track is None:
            self.stdout.write(
                self.style.ERROR(f"Scenario skipped — '{seed_filename}' not in DB.")
            )
            return

        # Simulate: user listened to exactly this one track
        StreamEvent.objects.filter(user=listener).delete()
        StreamEvent.objects.create(user=listener, track=seed_track)

        # get_recommendations_for_user returns List[RecommendationResult]
        results = get_recommendations_for_user(listener, limit=limit)

        seed_genre = _genre_of(seed_filename)
        self.stdout.write(
            self.style.WARNING(
                f"\n▶  Seed track : {seed_track.title}  [{seed_genre}]"
            )
        )
        self.stdout.write(
            f"   Fusion weights printed in DEBUG log — set LOG_LEVEL=DEBUG to see them.\n"
        )

        genre_hits = 0
        for i, rec in enumerate(results, start=1):
            # rec is a RecommendationResult — access the Track via rec.track
            track = rec.track
            rec_genre = _genre_of(track.title)
            genre_match = "✓" if rec_genre == seed_genre else "✗"
            if rec_genre == seed_genre:
                genre_hits += 1

            self.stdout.write(
                f"  {i}. {track.title:<28} [{rec_genre:<10}] {genre_match}\n"
                f"       score={rec.score:.4f}  "
                f"audio={rec.audio_similarity:.3f}  "
                f"meta={rec.meta_similarity:.3f}  "
                f"behav={rec.behav_similarity:.3f}\n"
                f"       reason: {rec.explanation()}"
            )

        # Sanity check: at least 1 of the top-3 should be same-genre
        # (only meaningful when enough same-genre tracks exist in the pool)
        same_genre_pool = sum(
            1 for fn in tracks_by_filename if _genre_of(fn) == seed_genre and fn != seed_filename
        )
        if same_genre_pool >= limit:
            if genre_hits == 0:
                self.stdout.write(
                    self.style.ERROR(
                        f"\n  [SANITY FAIL] 0/{limit} recommendations matched genre '{seed_genre}'. "
                        "Audio features may not be extracted correctly."
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"\n  [SANITY OK]   {genre_hits}/{limit} recommendations matched genre '{seed_genre}'."
                    )
                )