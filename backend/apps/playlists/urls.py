from django.urls import path
from . import views

urlpatterns = [
    path('', views.PlaylistListView.as_view(), name='playlists'),
    path('<int:pk>/', views.PlaylistDetailView.as_view(), name='playlist-detail'),
]
