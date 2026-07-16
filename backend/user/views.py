from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ArtistRegistrationSerializer,
    CurrentUserSerializer,
    ListenerRegistrationSerializer,
    LoginSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class ListenerRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ListenerRegistrationSerializer


class ArtistRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ArtistRegistrationSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)
