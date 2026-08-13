from datetime import timedelta
from itertools import chain

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from . import schema, services
from .models import Track, Playlist, Album
from .permissions import IsVerifiedArtist
from .recommender import get_recommendations_for_user
from .serializers import (
    PublishReleaseSerializer, 
    TrackReadSerializer, 
    TrackUpdateSerializer,
    PlaylistReadSerializer,
    PlaylistCreateUpdateSerializer,
    ToggleTrackSerializer,
    AlbumReadSerializer,
    CatalogItemSerializer,
    HomeDataSerializer
)


@extend_schema(tags=["catalog"])
class CatalogSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Search tracks and albums",
        parameters=[
            OpenApiParameter("query", OpenApiTypes.STR, description="Search term"),
            OpenApiParameter("sort_by", OpenApiTypes.STR, description="listener_count or release_date"),
        ],
        responses=CatalogItemSerializer(many=True)
    )
    def get(self, request):
        query = request.query_params.get("query", "").lower()
        sort_by = request.query_params.get("sort_by", "release_date")

        tracks = Track.objects.select_related("artist", "album").all()
        albums = Album.objects.select_related("artist").all()

        if query:
            tracks = tracks.filter(title__icontains=query) | tracks.filter(artist__stage_name__icontains=query)
            albums = albums.filter(title__icontains=query) | albums.filter(artist__stage_name__icontains=query)

        # Merge querysets
        results = list(chain(tracks, albums))

        if sort_by == "listener_count":
            results.sort(key=lambda x: getattr(x, "listener_count", 0), reverse=True)
        else:
            results.sort(key=lambda x: (getattr(x, "release_year", 0) or 0, x.created_at), reverse=True)

        serializer = CatalogItemSerializer(results[:50], many=True, context={"request": request})
        return Response(serializer.data)


@extend_schema(tags=["catalog"])
class AlbumViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AlbumReadSerializer
    queryset = Album.objects.select_related("artist").prefetch_related("tracks")


@extend_schema(tags=["catalog"])
class TrackPlayView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Record a track play",
        description="Records a stream event, enforces daily limits for basic users, and blocks early access tracks for non-gold users.",
        responses={200: TrackReadSerializer}
    )
    def post(self, request, pk):
        track = get_object_or_404(Track, pk=pk)
        try:
            services.record_play(request.user, track)
        except Exception as e:
            error_msg = e.detail[0] if hasattr(e, 'detail') and isinstance(e.detail, list) else str(e)
            return Response({"detail": error_msg}, status=status.HTTP_403_FORBIDDEN)
            
        return Response(TrackReadSerializer(track, context={"request": request}).data)

@extend_schema(tags=["catalog"])
class HomeDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Get home page showcasing data", responses=HomeDataSerializer)
    def get(self, request):
        now = timezone.now()
        early_access_threshold = now - timedelta(days=7)

        recent_playlists = Playlist.objects.filter(user=request.user).order_by("-updated_at")[:10]
        latest_albums = Album.objects.select_related("artist").order_by("-created_at")[:10]
        top_songs = Track.objects.select_related("artist", "album").order_by("-stream_count")[:10]
        latest_releases = Track.objects.select_related("artist", "album").order_by("-created_at")[:10]
        early_access = Track.objects.select_related("artist", "album").filter(created_at__gte=early_access_threshold).order_by("-created_at")[:6]

        recommendation_results = get_recommendations_for_user(request.user, limit=10)
        recommended_tracks = [res.track for res in recommendation_results]
        # Fetch personalized ML recommendations

        data = {
            "recent_playlists": recent_playlists,
            "latest_albums": latest_albums,
            "top_songs": top_songs,
            "latest_releases": latest_releases,
            "early_access": early_access,
            "recommended_tracks": recommended_tracks,
        }

        serializer = HomeDataSerializer(data, context={"request": request})
        return Response(serializer.data)

@extend_schema(tags=schema.ARTIST_STUDIO_TAG)
class ArtistReleaseViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsVerifiedArtist]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Track.objects.filter(artist=self.request.user.artist).select_related("album", "artist").order_by("-created_at")

    @extend_schema(summary="List artist releases", responses=TrackReadSerializer(many=True))
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TrackReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TrackReadSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(summary="Publish a new release", request=PublishReleaseSerializer, responses={201: TrackReadSerializer(many=True)})
    def create(self, request, *args, **kwargs):
        serializer = PublishReleaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tracks = services.publish_release(request.user.artist, serializer.validated_data)
        return Response(TrackReadSerializer(tracks, many=True).data, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Update a track", request=TrackUpdateSerializer, responses={200: TrackReadSerializer})
    def partial_update(self, request, *args, **kwargs):
        track = self.get_object()
        serializer = TrackUpdateSerializer(track, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        updated_track = services.update_track(request.user.artist, track, serializer.validated_data)
        return Response(TrackReadSerializer(updated_track).data)

    @extend_schema(summary="Delete a track")
    def destroy(self, request, *args, **kwargs):
        track = self.get_object()
        services.delete_track(request.user.artist, track)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=schema.PLAYLISTS_TAG)
class PlaylistViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for User Playlists.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Strict ownership: Users only see their own playlists.
        return Playlist.objects.filter(user=self.request.user).prefetch_related(
            "playlist_tracks__track",
            "playlist_tracks__track__artist",
            "playlist_tracks__track__album"
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PlaylistCreateUpdateSerializer
        if self.action == "toggle_track":
            return ToggleTrackSerializer
        return PlaylistReadSerializer

    @extend_schema(summary="Create a new playlist", responses={201: PlaylistReadSerializer})
    def perform_create(self, serializer):
        playlist = services.create_playlist(
            self.request.user, 
            serializer.validated_data["name"]
        )
        serializer.instance = playlist

    @extend_schema(summary="Create a new playlist", responses={201: PlaylistReadSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return full representation
        read_serializer = PlaylistReadSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Update playlist name", responses={200: PlaylistReadSerializer})
    def perform_update(self, serializer):
        playlist = services.rename_playlist(
            self.request.user, 
            self.get_object(), 
            serializer.validated_data["name"]
        )
        serializer.instance = playlist

    @extend_schema(summary="Update playlist name", responses={200: PlaylistReadSerializer})
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        read_serializer = PlaylistReadSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(read_serializer.data)

    @extend_schema(summary="Delete a playlist")
    def perform_destroy(self, instance):
        services.delete_playlist(self.request.user, instance)

    @extend_schema(
        summary="Toggle a track in a playlist",
        description="Adds a track to the playlist if state=True, or removes it if state=False.",
        request=ToggleTrackSerializer,
        responses={200: PlaylistReadSerializer}
    )
    @action(detail=True, methods=["post"])
    def toggle_track(self, request, pk=None):
        playlist = self.get_object()
        serializer = ToggleTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        track = get_object_or_404(Track, pk=serializer.validated_data["track_id"])
        state = serializer.validated_data["state"]
        
        services.toggle_track_in_playlist(request.user, playlist, track, state)
        
        updated_playlist = self.get_queryset().get(pk=playlist.pk)
        return Response(PlaylistReadSerializer(updated_playlist, context=self.get_serializer_context()).data)