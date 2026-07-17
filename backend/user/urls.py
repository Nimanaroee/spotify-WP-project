from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ArtistRegistrationView,
    CurrentUserView,
    ListenerRegistrationView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("register/listener/", ListenerRegistrationView.as_view(), name="register-listener"),
    path("register/artist/", ArtistRegistrationView.as_view(), name="register-artist"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
