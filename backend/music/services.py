from django.db import transaction, models
from rest_framework.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from user.models import User
from .models import Album, Track, Playlist, PlaylistTrack, StreamEvent
from .audio_features import extract_advanced_features


PLAYLIST_LIMITS = {
    User.SubscriptionTier.BASIC: 6,
    User.SubscriptionTier.SILVER: 100,
    User.SubscriptionTier.GOLD: float('inf'),
}

@transaction.atomic
def publish_release(artist, validated_data):
    release_type = validated_data.get("release_type")
    title = validated_data.get("title")
    genre = validated_data.get("genre", "")
    release_year = validated_data.get("release_year")
    co_artists = validated_data.get("co_artists", [])
    cover_art = validated_data.get("cover_art")
    tracks_data = validated_data.get("tracks", [])

    album = None
    if release_type == Track.ReleaseType.ALBUM:
        album = Album.objects.create(
            artist=artist,
            title=title,
            release_year=release_year,
            genre=genre,
            cover_art=cover_art,
            track_count=len(tracks_data),
        )

    created_tracks = []
    for track_data in tracks_data:
        track_title = track_data.get("title") if release_type == Track.ReleaseType.ALBUM else title
        
        track = Track.objects.create(
            artist=artist,
            album=album,
            title=track_title,
            release_type=release_type,
            genre=genre,
            release_year=release_year,
            co_artists=co_artists,
            cover_art=cover_art,
            audio_file=track_data.get("audio_file"),
            lyrics=track_data.get("lyrics", ""),
            duration_seconds=track_data.get("duration_seconds"),
        )
        
        # Extract and save the audio DNA vector
        # Capture optional neural flags passed in during tests
        enable_neural = track_data.get("enable_neural", False)
        device = track_data.get("device", "cpu")
        
        bundle = extract_advanced_features(
            track.audio_file, 
            enable_neural=enable_neural, 
            device=device
        )
        if bundle:
            track.audio_features = bundle.to_flat_dict()
            track.save(update_fields=["audio_features", "updated_at"])
            
        created_tracks.append(track)

    return created_tracks


@transaction.atomic
def update_track(artist, track, validated_data):
    if track.artist_id != artist.id:
        raise ValidationError("You do not have permission to modify this track.")

    audio_updated = "audio_file" in validated_data

    for field, value in validated_data.items():
        setattr(track, field, value)
    
    track.save()
    
    # Re-extract DNA if a new audio file was uploaded
    if audio_updated:
        bundle = extract_advanced_features(track.audio_file, enable_neural=False)
        if bundle:
            track.audio_features = bundle.to_flat_dict()
            track.save(update_fields=["audio_features", "updated_at"])

    if track.album_id:
        album = track.album
        sync_fields = ["genre", "release_year", "cover_art"]
        needs_sync = False
        for sf in sync_fields:
            if sf in validated_data and validated_data[sf]:
                setattr(album, sf, validated_data[sf])
                needs_sync = True
        if needs_sync:
            album.save()

    return track


@transaction.atomic
def delete_track(artist, track):
    if track.artist_id != artist.id:
        raise ValidationError("You do not have permission to delete this track.")

    album = track.album
    track.delete()

    if album:
        remaining_tracks = album.tracks.count()
        if remaining_tracks == 0:
            album.delete()
        else:
            album.track_count = remaining_tracks
            album.save(update_fields=["track_count", "updated_at"])


@transaction.atomic
def create_playlist(user, name, cover_art=None):
    tier = user.get_effective_subscription_tier()
    limit = PLAYLIST_LIMITS.get(tier, 6)
    
    if Playlist.objects.filter(user=user).count() >= limit:
        raise ValidationError(f"Playlist limit reached for your {tier} subscription.")
        
    return Playlist.objects.create(user=user, name=name, cover_art=cover_art)


@transaction.atomic
def update_playlist(user, playlist, name=None, cover_art=None):
    if playlist.user_id != user.id:
        raise ValidationError("You do not have permission to modify this playlist.")
    
    update_fields = ["updated_at"]
    
    if name is not None:
        playlist.name = name
        update_fields.append("name")
        
    if cover_art is not None:
        playlist.cover_art = cover_art
        update_fields.append("cover_art")
        
    playlist.save(update_fields=update_fields)
    return playlist


@transaction.atomic
def delete_playlist(user, playlist):
    if playlist.user_id != user.id:
        raise ValidationError("You do not have permission to delete this playlist.")
    playlist.delete()


@transaction.atomic
def toggle_track_in_playlist(user, playlist, track, state):
    if playlist.user_id != user.id:
        raise ValidationError("You do not have permission to modify this playlist.")
    
    if state:
        # Add track if not already in the playlist
        if not PlaylistTrack.objects.filter(playlist=playlist, track=track).exists():
            max_pos = PlaylistTrack.objects.filter(playlist=playlist).aggregate(models.Max('position'))['position__max']
            next_pos = (max_pos or 0) + 1
            PlaylistTrack.objects.create(playlist=playlist, track=track, position=next_pos)
    else:
        # Remove track
        PlaylistTrack.objects.filter(playlist=playlist, track=track).delete()
        
    return playlist


@transaction.atomic
def record_play(user, track):
    tier = user.get_effective_subscription_tier()
    
    # 1. Enforce Basic Tier Daily Limit (60)
    if tier == User.SubscriptionTier.BASIC and user.streamed_today >= 60:
        raise ValidationError("Daily stream limit reached. Upgrade to Silver or Gold to continue listening.")

    # 2. Early Access Gate (Gold Only)
    is_early_access = track.created_at >= timezone.now() - timedelta(days=7)
    if is_early_access and tier != User.SubscriptionTier.GOLD and user.role not in [User.Role.ARTIST, User.Role.ADMIN]:
        raise ValidationError("This track is in Early Access. Upgrade to Gold to listen.")

    # 3. Abuse Prevention (Debounce)
    recent_play = StreamEvent.objects.filter(
        user=user, 
        track=track, 
        created_at__gte=timezone.now() - timedelta(seconds=30)
    ).exists()

    if not recent_play:
        StreamEvent.objects.create(user=user, track=track)

        # Update User Daily Streams
        user.streamed_today += 1
        user.save(update_fields=['streamed_today', 'updated_at'])

        # Update Track Streams & Listeners
        is_first_listen = not StreamEvent.objects.filter(user=user, track=track).exclude(id=StreamEvent.objects.last().id).exists()
        track.stream_count += 1
        if is_first_listen:
            track.listener_count += 1
        track.save(update_fields=['stream_count', 'listener_count', 'updated_at'])

        # Update Album Streams & Listeners
        if track.album_id:
            album = track.album
            album.stream_count += 1
            if is_first_listen:
                album.listener_count += 1
            album.save(update_fields=['stream_count', 'listener_count', 'updated_at'])
            
        # Update Artist Listeners & Streams
        artist = track.artist
        artist.total_streams += 1
        if is_first_listen:
            artist.listener_count += 1
        artist.save(update_fields=['total_streams', 'listener_count', 'updated_at'])

    return track