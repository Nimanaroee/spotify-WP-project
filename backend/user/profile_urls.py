from django.urls import path

from .views import (
    ArtistProfileView,
    FollowView,
    PreferencesView,
    ProfileView,
    PublicProfileView,
    SubscriptionView,
)

urlpatterns = [
    path("profile/listener/", ProfileView.as_view(), name="profile"),
    path("profile/artist/", ArtistProfileView.as_view(), name="artist-profile"),
    path("preferences/", PreferencesView.as_view(), name="preferences"),
    path("subscription/", SubscriptionView.as_view(), name="subscription"),
    path(
        "profiles/<str:user_name>/",
        PublicProfileView.as_view(),
        name="public-profile",
    ),
    path("follows/<str:username>/", FollowView.as_view(), name="follow"),
]
