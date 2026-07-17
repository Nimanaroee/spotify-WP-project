from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ArtistProfileUpdateSerializer,
    ArtistRegistrationSerializer,
    CurrentUserSerializer,
    FollowStatusSerializer,
    ListenerRegistrationSerializer,
    LoginSerializer,
    LogoutSerializer,
    PreferencesReadSerializer,
    PreferencesUpdateSerializer,
    ProfileReadSerializer,
    ProfileUpdateSerializer,
    PublicProfileReadSerializer,
    SubscriptionReadSerializer,
    SubscriptionUpdateSerializer,
)
from .services import follow_user, unfollow_user
from .models import Artist, Preferences

User = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=LogoutSerializer, responses={204: None})
    def post(self, request):
        serializer = LogoutSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ListenerRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ListenerRegistrationSerializer


class ArtistRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ArtistRegistrationSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=CurrentUserSerializer)
    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class ProfileView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "patch", "head", "options")
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return (
            self.request.user.__class__.objects.prefetch_related(
                "followers",
                "following",
            )
            .get(pk=self.request.user.pk)
        )

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ProfileUpdateSerializer
        return ProfileReadSerializer

    @extend_schema(responses=ProfileReadSerializer)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ProfileUpdateSerializer,
        responses=ProfileReadSerializer,
    )
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            ProfileReadSerializer(
                instance,
                context=self.get_serializer_context(),
            ).data
        )


class ArtistProfileView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "patch", "head", "options")
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_classes = (IsAuthenticated,)

    def get_artist(self):
        try:
            return Artist.objects.get(pk=self.request.user.pk)
        except Artist.DoesNotExist:
            raise PermissionDenied("Only artists can access this profile.")

    def get_object(self):
        artist = self.get_artist()
        return (
            User.objects.prefetch_related("followers", "following")
            .get(pk=artist.pk)
        )

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ArtistProfileUpdateSerializer
        return PublicProfileReadSerializer

    @extend_schema(responses=PublicProfileReadSerializer)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ArtistProfileUpdateSerializer,
        responses=PublicProfileReadSerializer,
    )
    def patch(self, request, *args, **kwargs):
        artist = self.get_artist()
        serializer = self.get_serializer(
            artist,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = (
            User.objects.prefetch_related("followers", "following")
            .get(pk=artist.pk)
        )
        return Response(
            PublicProfileReadSerializer(
                user,
                context=self.get_serializer_context(),
            ).data
        )


class PreferencesView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        preferences, _ = Preferences.objects.get_or_create(user=self.request.user)
        return preferences

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return PreferencesUpdateSerializer
        return PreferencesReadSerializer

    @extend_schema(responses=PreferencesReadSerializer)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=PreferencesUpdateSerializer,
        responses=PreferencesReadSerializer,
    )
    def patch(self, request, *args, **kwargs):
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            PreferencesReadSerializer(
                preferences,
                context=self.get_serializer_context(),
            ).data
        )


class SubscriptionView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "put", "head", "options")
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return SubscriptionUpdateSerializer
        return SubscriptionReadSerializer

    @extend_schema(responses=SubscriptionReadSerializer)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=SubscriptionUpdateSerializer,
        responses=SubscriptionReadSerializer,
    )
    def put(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            SubscriptionReadSerializer(
                user,
                context=self.get_serializer_context(),
            ).data
        )


class FollowView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_target(self, username):
        return get_object_or_404(User, username=username)

    def get_response_data(self, request, target):
        return {
            "user": target,
            "is_following": request.user.following.filter(pk=target.pk).exists(),
        }

    @extend_schema(responses=FollowStatusSerializer)
    def get(self, request, username):
        target = self.get_target(username)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data)

    @extend_schema(request=None, responses={201: FollowStatusSerializer})
    def post(self, request, username):
        target = self.get_target(username)
        follow_user(request.user, target)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=FollowStatusSerializer)
    def delete(self, request, username):
        target = self.get_target(username)
        unfollow_user(request.user, target)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data)


class PublicProfileView(generics.RetrieveAPIView):
    http_method_names = ("get", "head", "options")
    permission_classes = (IsAuthenticated,)
    serializer_class = PublicProfileReadSerializer

    def get_object(self):
        return get_object_or_404(
            User.objects.prefetch_related(
                "followers",
                "following",
            ),
            username=self.kwargs["user_name"],
        )
