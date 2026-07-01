from django.urls import path
from . import views

urlpatterns = [
    path('', views.ArtistVerificationRequestListView.as_view(), name='artist-requests'),
    path('<int:pk>/', views.ArtistProfileView.as_view(), name='artist-detail'),
    path('<int:pk>/decision/', views.ArtistVerificationDecisionView.as_view(), name='artist-decision'),
]
