from django.db import models
from django.conf import settings
from user.models import Artist


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Album(TimeStampedModel):
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="albums")
    title = models.CharField(max_length=255)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    genre = models.CharField(max_length=100, blank=True)
    cover_art = models.ImageField(upload_to="albums/covers/", null=True, blank=True)
    track_count = models.PositiveIntegerField(default=0)
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.title} by {self.artist.stage_name}"


class Track(TimeStampedModel):
    class ReleaseType(models.TextChoices):
        SINGLE = "single", "Single"
        ALBUM = "album", "Album"

    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="tracks")
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="tracks", null=True, blank=True)
    title = models.CharField(max_length=255)
    release_type = models.CharField(max_length=20, choices=ReleaseType.choices, default=ReleaseType.SINGLE)
    genre = models.CharField(max_length=100, blank=True)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    co_artists = models.JSONField(default=list, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    cover_art = models.ImageField(upload_to="tracks/covers/", null=True, blank=True)
    audio_file = models.FileField(upload_to="tracks/audio/")
    lyrics = models.TextField(blank=True, null=True)
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)
    
    # NEW: Store the feature bundles
    audio_features = models.JSONField(default=dict, blank=True)
    meta_features = models.JSONField(default=dict, blank=True)
    behav_features = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.title} by {self.artist.stage_name}"

    # Properties to seamlessly expose the JSON data to recommender.py
    @property
    def mert_embedding(self): return self.audio_features.get("mert_embedding")
    
    @property
    def clap_embedding(self): return self.audio_features.get("clap_embedding")
    
    @property
    def tonnetz(self): return self.audio_features.get("tonnetz")
    
    @property
    def chroma_cens(self): return self.audio_features.get("chroma_cens")
    
    @property
    def hpss_vectors(self): return self.audio_features.get("hpss_vectors")
    
    @property
    def cyclic_tempogram(self): return self.audio_features.get("cyclic_tempogram")
    
    @property
    def ssm_fingerprint(self): return self.audio_features.get("ssm_fingerprint")
    
    @property
    def groove_vector(self): return self.audio_features.get("groove_vector")
    
    @property
    def onset_stats(self): return self.audio_features.get("onset_stats")


class Playlist(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlists")
    name = models.CharField(max_length=255)
    cover_art = models.ImageField(upload_to="playlists/covers/", null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} by {self.user.display_name}"


class PlaylistTrack(TimeStampedModel):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="playlist_tracks")
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="playlist_appearances")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "created_at")
        unique_together = (("playlist", "track"),)

    def __str__(self):
        return f"{self.track.title} in {self.playlist.name}"


class StreamEvent(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stream_events")
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="stream_events")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username} played {self.track.title}"