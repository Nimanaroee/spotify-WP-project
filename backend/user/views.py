from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from . import schema
from .models import Artist, Preferences, SubscriptionFee
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
    SubscriptionFeeSerializer,
    SubscriptionUpdateSerializer,
    TokenResponseSerializer,
)
from .services import follow_user, unfollow_user

User = get_user_model()


@extend_schema(tags=schema.AUTH_TAG)
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(
        summary="Log in",
        description=(
            "Authenticate with email and password. Returns a JWT refresh/access "
            "pair plus the authenticated user. Artists pending verification may "
            "log in but stay inactive until approved."
        ),
        auth=schema.PUBLIC,
        responses={200: TokenResponseSerializer},
        examples=schema.LOGIN_EXAMPLES,
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


@extend_schema(tags=schema.AUTH_TAG)
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Log out",
        description=(
            "Blacklist the given refresh token. The token must belong to the "
            "authenticated user. Responds with `204 No Content` on success."
        ),
        request=LogoutSerializer,
        responses={204: None, 400: None},
        examples=schema.LOGOUT_EXAMPLES,
    )
    def post(self, request):
        serializer = LogoutSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=schema.AUTH_TAG,
    summary="Register a listener",
    description=(
        "Create a listener account. The account is active immediately and the "
        "response contains a JWT pair plus the created user, so the client can "
        "log in without a separate call."
    ),
    auth=schema.PUBLIC,
    responses={201: TokenResponseSerializer},
    examples=schema.REGISTER_LISTENER_EXAMPLES,
)
class ListenerRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ListenerRegistrationSerializer


@extend_schema(
    tags=schema.AUTH_TAG,
    summary="Register an artist",
    description=(
        "Create an artist account. The artist starts with "
        "`verification_status = pending` and becomes fully active once an admin "
        "approves the portfolio. The response contains a JWT pair plus the "
        "created user."
    ),
    auth=schema.PUBLIC,
    responses={201: TokenResponseSerializer},
    examples=schema.REGISTER_ARTIST_EXAMPLES,
)
class ArtistRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ArtistRegistrationSerializer


@extend_schema(tags=schema.AUTH_TAG)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get the authenticated user",
        description="Return the profile of the user owning the access token.",
        responses=CurrentUserSerializer,
        examples=schema.CURRENT_USER_EXAMPLES,
    )
    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


@extend_schema(tags=schema.USERS_TAG)
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

    @extend_schema(
        summary="Get own profile",
        description=(
            "Return the authenticated user's profile, including follow counts "
            "and follower/following lists. Use the follow API to change "
            "follow relationships."
        ),
        responses=ProfileReadSerializer,
        examples=schema.PROFILE_EXAMPLES,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update own profile",
        description=(
            "Partially update the authenticated user's profile. Accepts JSON or "
            "multipart form-data (required when uploading `profile_photo`). "
            "Follow relationships are read-only here. Basic subscription "
            "accounts cannot change `profile_photo`."
        ),
        request=ProfileUpdateSerializer,
        responses=ProfileReadSerializer,
        examples=schema.PROFILE_EXAMPLES,
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


@extend_schema(tags=schema.USERS_TAG)
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

    @extend_schema(
        summary="Get own artist profile",
        description=(
            "Return the authenticated artist's profile including verification "
            "status, albums and singles. Only artist accounts can use this "
            "endpoint; listeners receive `403`."
        ),
        responses=PublicProfileReadSerializer,
        examples=schema.ARTIST_PROFILE_EXAMPLES,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update own artist profile",
        description=(
            "Partially update the authenticated artist's stage name, bio and "
            "profile photo. Accepts JSON or multipart form-data (required when "
            "uploading `profile_photo`)."
        ),
        request=ArtistProfileUpdateSerializer,
        responses=PublicProfileReadSerializer,
        examples=schema.ARTIST_PROFILE_EXAMPLES,
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


@extend_schema(tags=schema.USERS_TAG)
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

    @extend_schema(
        summary="Get own preferences",
        description=(
            "Return the authenticated user's preferences. A preferences row "
            "with default values is created on first access."
        ),
        responses=PreferencesReadSerializer,
        examples=schema.PREFERENCES_EXAMPLES,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update own preferences",
        description="Partially update the authenticated user's preferences.",
        request=PreferencesUpdateSerializer,
        responses=PreferencesReadSerializer,
        examples=schema.PREFERENCES_EXAMPLES,
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


@extend_schema(tags=schema.USERS_TAG)
class SubscriptionView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "put", "head", "options")
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return SubscriptionUpdateSerializer
        return SubscriptionReadSerializer

    @extend_schema(
        summary="Get own subscription",
        description=(
            "Return the authenticated user's effective subscription tier and "
            "expiration. Expired paid subscriptions are returned as `basic`."
        ),
        responses=SubscriptionReadSerializer,
        examples=schema.SUBSCRIPTION_EXAMPLES,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Activate a paid subscription",
        description=(
            "Activate a higher paid tier using the matching payment receipt from "
            "`POST /api/v1/payment/`. The expiration is calculated from the "
            "selected duration."
        ),
        request=SubscriptionUpdateSerializer,
        responses=SubscriptionReadSerializer,
        examples=schema.SUBSCRIPTION_EXAMPLES,
    )
    def put(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(
            SubscriptionReadSerializer(
                updated_user,
                context=self.get_serializer_context(),
            ).data
        )


@extend_schema(tags=["subscriptions"])
class SubscriptionFeeListView(generics.ListAPIView):
    serializer_class = SubscriptionFeeSerializer
    permission_classes = (AllowAny,)
    queryset = SubscriptionFee.objects.all()

    @extend_schema(
        summary="List subscription monthly fees",
        description=(
            "Return the monthly fee configured for each subscription tier. "
            "This endpoint is public so pricing can be shown before purchase."
        ),
        responses=SubscriptionFeeSerializer(many=True),
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


@extend_schema(
    tags=schema.USERS_TAG,
    parameters=[
        OpenApiParameter(
            "username",
            OpenApiTypes.STR,
            OpenApiParameter.PATH,
            description="Username of the target user.",
        ),
    ],
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

    @extend_schema(
        summary="Check follow status",
        description="Return whether the authenticated user follows the target user.",
        responses=FollowStatusSerializer,
        examples=schema.FOLLOW_STATUS_EXAMPLES,
    )
    def get(self, request, username):
        target = self.get_target(username)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Follow a user",
        description=(
            "Follow the target user. Idempotent: following an already-followed "
            "user succeeds again. Responds with `201` and the resulting status."
        ),
        request=None,
        responses={201: FollowStatusSerializer},
        examples=schema.FOLLOW_STATUS_EXAMPLES,
    )
    def post(self, request, username):
        target = self.get_target(username)
        follow_user(request.user, target)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Unfollow a user",
        description="Unfollow the target user. Idempotent: unfollowing a user that is not followed succeeds.",
        request=None,
        responses=FollowStatusSerializer,
        examples=schema.FOLLOW_STATUS_EXAMPLES,
    )
    def delete(self, request, username):
        target = self.get_target(username)
        unfollow_user(request.user, target)
        serializer = FollowStatusSerializer(
            self.get_response_data(request, target),
            context={"request": request},
        )
        return Response(serializer.data)


@extend_schema(
    tags=schema.USERS_TAG,
    summary="Get a public profile",
    description=(
        "Return the public profile of any user, including follow counts, "
        "whether the authenticated user follows them, and (for artists) the "
        "artist profile, albums and singles."
    ),
    parameters=[
        OpenApiParameter(
            "user_name",
            OpenApiTypes.STR,
            OpenApiParameter.PATH,
            description="Username of the profile owner.",
        ),
    ],
    responses=PublicProfileReadSerializer,
    examples=schema.PUBLIC_PROFILE_EXAMPLES,
)
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
