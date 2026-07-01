from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'albums', views.AlbumViewSet, basename='album')
router.register(r'tracks', views.TrackViewSet, basename='track')

urlpatterns = [
    path('', include(router.urls)),
    path('stream/', views.StreamEventCreateView.as_view(), name='stream-event'),
]
