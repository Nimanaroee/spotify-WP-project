from django.urls import path

from .views import FollowView, ProfileView, PublicProfileView

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "profiles/<str:user_name>/",
        PublicProfileView.as_view(),
        name="public-profile",
    ),
    path("follows/<str:username>/", FollowView.as_view(), name="follow"),
]
