from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('me/', views.MeView.as_view(), name='me'),
    path('profile/<str:username>/', views.ProfileView.as_view(), name='profile'),
    path('follow/<str:username>/', views.FollowToggleView.as_view(), name='follow-toggle'),
]
