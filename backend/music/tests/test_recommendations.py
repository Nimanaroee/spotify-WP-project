import os
from django.core.management.base import BaseCommand
from django.core.files import File
from user.models import User, Artist
from music.models import Track, StreamEvent
from music.services import publish_release
from music.recommender import get_recommendations_for_user

class Command(BaseCommand):
    help = "Test the recommendation engine with real audio files."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dir', 
            type=str, 
            help='Directory containing the audio files', 
            required=True
        )

    def handle(self, *args, **options):
        directory = options['dir']
        
        target_files = [
            '8.m4a', 'porch_1.mp3', 'porch_2.mp3', 'pop_1.m4a',
            'hardstyle_1.m4a', 'hardstyle_3.m4a', 'hardstyle_4.m4a',
            'rap.mp3', 'rap_2.m4a', 'rap_5.m4a', 'hard_5.mp3',
            'cas_1.m4a', 'cas_2.m4a', 'cas_3.m4a'
        ]

        # Ensure directory exists
        if not os.path.exists(directory):
            self.stdout.write(self.style.ERROR(f"Directory {directory} does not exist."))
            return

        # Setup Test Users
        self.stdout.write(self.style.WARNING("Creating test artist and listener..."))
        artist, _ = Artist.objects.get_or_create(
            email="test_artist@example.com", 
            username="test_artist",
            stage_name="Test Artist",
            role=User.Role.ARTIST,
            verification_status=Artist.VerificationStatus.APPROVED
        )
        
        listener, _ = User.objects.get_or_create(
            email="test_listener@example.com", 
            username="test_listener",
            role=User.Role.LISTENER
        )
        
        # Clear old test data
        Track.objects.filter(artist=artist).delete()
        StreamEvent.objects.filter(user=listener).delete()

        tracks_created = []

        # 1. Ingest & Extract Features
        self.stdout.write(self.style.WARNING(f"\nProcessing audio files from {directory}..."))
        for filename in target_files:
            filepath = os.path.join(directory, filename)
            
            if not os.path.exists(filepath):
                self.stdout.write(self.style.ERROR(f"  Missing file: {filename}"))
                continue

            self.stdout.write(f"  Extracting features for: {filename}...")
            
            with open(filepath, 'rb') as f:
                django_file = File(f, name=filename)
                payload = {
                    "release_type": Track.ReleaseType.SINGLE,
                    "title": filename,  # Using filename as title for easy tracking
                    "tracks": [{"title": filename, "audio_file": django_file}]
                }
                # This triggers the extraction pipeline internally!
                published = publish_release(artist, payload)
                tracks_created.extend(published)

        if not tracks_created:
            self.stdout.write(self.style.ERROR("No tracks were processed. Exiting."))
            return

        # 2. Run Test Scenarios
        self.stdout.write(self.style.SUCCESS("\nExtraction Complete! Running Scenarios..."))

        def run_scenario(target_filename):
            target_track = next((t for t in tracks_created if t.title == target_filename), None)
            if not target_track:
                self.stdout.write(self.style.ERROR(f"Could not find {target_filename} in DB."))
                return

            # Clear previous streams, simulate listening to the target track
            StreamEvent.objects.filter(user=listener).delete()
            StreamEvent.objects.create(user=listener, track=target_track)

            recs = get_recommendations_for_user(listener, limit=3)
            
            self.stdout.write(self.style.WARNING(f"\n▶ User listened to: {target_track.title}"))
            self.stdout.write(self.style.SUCCESS("  Recommendations:"))
            for i, rec in enumerate(recs, 1):
                self.stdout.write(f"    {i}. {rec.title}")

        # Let's test different genres
        run_scenario('rap.mp3')
        run_scenario('cas_1.m4a')
        run_scenario('hardstyle_1.m4a')

        self.stdout.write(self.style.SUCCESS("\nTest Complete!"))