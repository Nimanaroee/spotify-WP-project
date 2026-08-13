import re
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Album, Track, Playlist


class TrackReadSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artist_username = serializers.CharField(source="artist.username", read_only=True)
    album_name = serializers.CharField(source="album.title", read_only=True, default=None)
    audio_url = serializers.FileField(source="audio_file", read_only=True)

    class Meta:
        model = Track
        fields = (
            "id", "title", "artist_id", "artist_name", "artist_username", "album_id", "album_name",
            "cover_art", "duration_seconds", "release_type", "audio_url", "lyrics",
            "genre", "release_year", "co_artists", "listener_count", "stream_count",
            "created_at", "updated_at"
        )
        read_only_fields = fields


class PublishTrackItemSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    audio_file = serializers.FileField(allow_empty_file=False)
    lyrics = serializers.CharField(required=False, allow_blank=True)
    duration_seconds = serializers.IntegerField(required=False, allow_null=True)


class PublishReleaseSerializer(serializers.Serializer):
    release_type = serializers.ChoiceField(choices=Track.ReleaseType.choices)
    title = serializers.CharField(max_length=255)
    genre = serializers.CharField(max_length=100, required=False, allow_blank=True)
    release_year = serializers.IntegerField(required=False, allow_null=True)
    co_artists = serializers.ListField(
        child=serializers.CharField(max_length=255), required=False, default=list
    )
    cover_art = serializers.ImageField(required=False, allow_null=True)
    tracks = PublishTrackItemSerializer(many=True)

    def to_internal_value(self, data):
        if hasattr(data, "getlist"):
            parsed_data = data.dict()
            tracks_dict = {}
            for key, value in data.items():
                if key.startswith("tracks["):
                    match = re.match(r"tracks\[(\d+)\]\[?([a-zA-Z_]+)\]?", key)
                    if match:
                        index, field = int(match.group(1)), match.group(2)
                        if index not in tracks_dict:
                            tracks_dict[index] = {}
                        tracks_dict[index][field] = value

            if tracks_dict:
                parsed_data["tracks"] = [tracks_dict[i] for i in sorted(tracks_dict.keys())]

            co_artists = data.getlist("co_artists") or data.getlist("co_artists[]")
            if co_artists:
                parsed_data["co_artists"] = co_artists

            data = parsed_data

        return super().to_internal_value(data)

    def validate(self, attrs):
        release_type = attrs.get("release_type")
        tracks = attrs.get("tracks", [])
        
        if release_type == Track.ReleaseType.SINGLE and len(tracks) != 1:
            raise serializers.ValidationError({"tracks": "A single must contain exactly one track."})
        if release_type == Track.ReleaseType.ALBUM and len(tracks) < 2:
            raise serializers.ValidationError({"tracks": "An album must contain at least two tracks."})
            
        return attrs


class TrackUpdateSerializer(serializers.ModelSerializer):
    audio_url = serializers.FileField(source="audio_file", required=False)

    class Meta:
        model = Track
        fields = (
            "title", "genre", "release_year", "co_artists",
            "lyrics", "cover_art", "audio_url"
        )
        extra_kwargs = {
            "title": {"required": False},
        }


class PlaylistReadSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source="user_id", read_only=True)
    track_count = serializers.SerializerMethodField()
    tracks = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ("id", "name", "owner_id", "cover_art", "track_count", "tracks", "created_at", "updated_at")
        read_only_fields = fields
        
    @extend_schema_field(serializers.IntegerField())
    def get_track_count(self, obj):
        return obj.playlist_tracks.count()
        
    @extend_schema_field(TrackReadSerializer(many=True))
    def get_tracks(self, obj):
        pts = obj.playlist_tracks.select_related("track", "track__artist", "track__album").all()
        return TrackReadSerializer([pt.track for pt in pts], many=True, context=self.context).data


class PlaylistCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ("name",)
        
    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Playlist name cannot be blank.")
        return value.strip()


class ToggleTrackSerializer(serializers.Serializer):
    track_id = serializers.IntegerField()
    state = serializers.BooleanField(help_text="True to add, False to remove")


class AlbumReadSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artist_username = serializers.CharField(source="artist.username", read_only=True)
    tracks = TrackReadSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = (
            "id", "title", "artist_id", "artist_name", "artist_username", "cover_art", "release_type",
            "release_year", "genre", "track_count", "listener_count", "stream_count",
            "tracks", "created_at", "updated_at"
        )
        read_only_fields = fields


class CatalogItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    artist_id = serializers.IntegerField(source="artist.id")
    artist_name = serializers.CharField(source="artist.stage_name")
    artist_username = serializers.CharField(source="artist.username")
    cover_art = serializers.ImageField(allow_null=True)
    release_type = serializers.CharField()
    release_year = serializers.IntegerField(allow_null=True)
    itemType = serializers.SerializerMethodField()
    
    album_id = serializers.IntegerField(allow_null=True, required=False)
    album_name = serializers.CharField(source="album.title", allow_null=True, required=False)
    duration_seconds = serializers.IntegerField(allow_null=True, required=False)
    audio_url = serializers.FileField(source="audio_file", allow_null=True, required=False)
    lyrics = serializers.CharField(allow_null=True, required=False)
    listener_count = serializers.IntegerField(default=0)
    stream_count = serializers.IntegerField(default=0)

    def get_itemType(self, obj):
        return "album" if isinstance(obj, Album) else "track"


class HomeDataSerializer(serializers.Serializer):
    recent_playlists = PlaylistReadSerializer(many=True)
    latest_albums = AlbumReadSerializer(many=True)
    top_songs = TrackReadSerializer(many=True)
    latest_releases = TrackReadSerializer(many=True)
    early_access = TrackReadSerializer(many=True)
    recommended_tracks = TrackReadSerializer(many=True)