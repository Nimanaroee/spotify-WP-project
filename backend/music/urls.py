from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArtistReleaseViewSet, PlaylistViewSet, CatalogSearchView, AlbumViewSet, TrackPlayView, HomeDataView

router = DefaultRouter()
router.register("artist/releases", ArtistReleaseViewSet, basename="artist-release")
router.register("playlists", PlaylistViewSet, basename="playlist")
router.register("albums", AlbumViewSet, basename="album")

urlpatterns = [
    path("", include(router.urls)),
    path("catalog/search/", CatalogSearchView.as_view(), name="catalog-search"),
    path("catalog/home/", HomeDataView.as_view(), name="catalog-home"),
    path("tracks/<int:pk>/play/", TrackPlayView.as_view(), name="track-play"),
]