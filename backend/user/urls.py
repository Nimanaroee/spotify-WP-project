from django.urls import path
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import TokenRefreshView

from . import schema
from .views import (
    ArtistRegistrationView,
    CurrentUserView,
    ListenerRegistrationView,
    LoginView,
    LogoutView,
)

DocumentedTokenRefreshView = extend_schema(
    tags=schema.AUTH_TAG,
    summary="Refresh access token",
    description=(
        "Exchange a valid refresh token for a new access token. "
        "Blacklisted or expired refresh tokens are rejected with `401`."
    ),
    auth=schema.PUBLIC,
    examples=schema.TOKEN_REFRESH_EXAMPLES,
)(TokenRefreshView)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", DocumentedTokenRefreshView.as_view(), name="token-refresh"),
    path("register/listener/", ListenerRegistrationView.as_view(), name="register-listener"),
    path("register/artist/", ArtistRegistrationView.as_view(), name="register-artist"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
