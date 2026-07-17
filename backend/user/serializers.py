from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils.text import slugify
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema_field

from .models import Artist
from .services import update_profile

User = get_user_model()


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "display_name",
            "role",
            "birth_date",
            "gender",
            "profile_picture",
            "subscription_tier",
            "followers_count",
            "following_count",
            "streamed_today",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class UserShortInfoSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source="profile_picture", read_only=True)

    class Meta:
        model = User
        fields = ("display_name", "username", "avatar")
        read_only_fields = fields


class ProfileReadSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="username", read_only=True)
    bearth_date = serializers.DateField(source="birth_date", read_only=True)
    num_following = serializers.IntegerField(source="following_count", read_only=True)
    num_follower = serializers.IntegerField(source="followers_count", read_only=True)
    subscription = serializers.CharField(source="subscription_tier", read_only=True)
    profile_photo = serializers.ImageField(source="profile_picture", read_only=True)
    followers = serializers.SerializerMethodField()
    followings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "user_name",
            "display_name",
            "bearth_date",
            "gender",
            "num_following",
            "num_follower",
            "streamed_today",
            "subscription",
            "profile_photo",
            "followings",
            "followers",
        )
        read_only_fields = fields

    @extend_schema_field(UserShortInfoSerializer(many=True))
    def get_followers(self, user):
        followers = user.followers.order_by("display_name", "username")
        return UserShortInfoSerializer(
            followers,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(UserShortInfoSerializer(many=True))
    def get_followings(self, user):
        followings = user.following.order_by("display_name", "username")
        return UserShortInfoSerializer(
            followings,
            many=True,
            context=self.context,
        ).data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    bearth_date = serializers.DateField(
        source="birth_date",
        required=False,
        allow_null=True,
    )
    profile_photo = serializers.ImageField(
        source="profile_picture",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = (
            "display_name",
            "gender",
            "bearth_date",
            "profile_photo",
        )
        extra_kwargs = {
            "display_name": {"required": False},
            "gender": {"required": False, "allow_null": True},
        }

    def validate_display_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Display name cannot be blank.")
        return value

    def validate(self, attrs):
        relationship_fields = {
            field
            for field in ("followers", "followings", "following")
            if field in self.initial_data
        }
        if relationship_fields:
            raise serializers.ValidationError(
                {
                    field: "Follow relationships must use the follow API."
                    for field in relationship_fields
                }
            )
        return attrs

    def update(self, instance, validated_data):
        return update_profile(instance, validated_data)


class FollowStatusSerializer(serializers.Serializer):
    user = UserShortInfoSerializer(read_only=True)
    is_following = serializers.BooleanField(read_only=True)


class PublicArtistProfileSerializer(serializers.ModelSerializer):
    is_verified = serializers.BooleanField(source="is_approved", read_only=True)

    class Meta:
        model = Artist
        fields = (
            "stage_name",
            "bio",
            "verification_status",
            "is_verified",
            "listener_count",
            "total_streams",
        )
        read_only_fields = fields


class ProfileAlbumSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    artist_id = serializers.IntegerField(read_only=True)
    artist_name = serializers.CharField(read_only=True)
    cover_art = serializers.URLField(read_only=True, allow_null=True)
    release_type = serializers.CharField(read_only=True)
    release_year = serializers.IntegerField(read_only=True, allow_null=True)
    track_count = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True, allow_null=True)


class ProfileTrackSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    artist_id = serializers.IntegerField(read_only=True)
    artist_name = serializers.CharField(read_only=True)
    album_id = serializers.IntegerField(read_only=True, allow_null=True)
    album_name = serializers.CharField(read_only=True, allow_null=True)
    cover_art = serializers.URLField(read_only=True, allow_null=True)
    duration_seconds = serializers.IntegerField(read_only=True, allow_null=True)
    release_type = serializers.CharField(read_only=True)
    audio_url = serializers.URLField(read_only=True, allow_null=True)
    lyrics = serializers.CharField(read_only=True, allow_null=True)
    genre = serializers.CharField(read_only=True, allow_null=True)
    release_year = serializers.IntegerField(read_only=True, allow_null=True)
    listener_count = serializers.IntegerField(read_only=True, allow_null=True)
    stream_count = serializers.IntegerField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True, allow_null=True)


class PublicProfileReadSerializer(ProfileReadSerializer):
    role = serializers.CharField(read_only=True)
    is_following = serializers.SerializerMethodField()
    artist_profile = serializers.SerializerMethodField()
    albums = serializers.SerializerMethodField()
    singles = serializers.SerializerMethodField()

    class Meta(ProfileReadSerializer.Meta):
        fields = ProfileReadSerializer.Meta.fields + (
            "role",
            "is_following",
            "artist_profile",
            "albums",
            "singles",
        )
        read_only_fields = fields

    @extend_schema_field(serializers.BooleanField())
    def get_is_following(self, user):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and request.user.following.filter(pk=user.pk).exists()
        )

    @extend_schema_field(PublicArtistProfileSerializer(allow_null=True))
    def get_artist_profile(self, user):
        try:
            artist = user.artist
        except Artist.DoesNotExist:
            return None
        return PublicArtistProfileSerializer(
            artist,
            context=self.context,
        ).data

    @extend_schema_field(ProfileAlbumSerializer(many=True))
    def get_albums(self, user):
        return []

    @extend_schema_field(ProfileTrackSerializer(many=True))
    def get_singles(self, user):
        return []


class LoginSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    def validate(self, attrs):
        email = attrs.get(self.username_field, "").strip().lower()
        password = attrs.get("password", "")
        request = self.context.get("request")
        self.user = authenticate(request=request, email=email, password=password)

        if self.user is None:
            try:
                candidate = User.objects.get(email=email, role=User.Role.ARTIST)
            except User.DoesNotExist as exc:
                raise AuthenticationFailed(
                    self.error_messages["no_active_account"],
                    "no_active_account",
                ) from exc

            if not candidate.check_password(password):
                raise AuthenticationFailed(
                    self.error_messages["no_active_account"],
                    "no_active_account",
                )
            self.user = candidate

        if not self.user.is_active and self.user.role != User.Role.ARTIST:
            raise AuthenticationFailed(
                self.error_messages["no_active_account"],
                "no_active_account",
            )

        refresh = self.get_token(self.user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
        data["user"] = CurrentUserSerializer(self.user, context=self.context).data
        return data


class BaseRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["password"] != attrs.pop("password_confirmation"):
            raise serializers.ValidationError(
                {"password_confirmation": "Passwords do not match."}
            )
        return attrs

    def build_username(self, source):
        base = slugify(source).replace("-", "_") or "user"
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base}_{suffix}"
        return username


class ListenerRegistrationSerializer(BaseRegistrationSerializer):
    privacy_policy_accepted = serializers.BooleanField()

    class Meta:
        model = User
        fields = (
            "display_name",
            "email",
            "password",
            "password_confirmation",
            "birth_date",
            "gender",
            "privacy_policy_accepted",
        )

    def validate_privacy_policy_accepted(self, value):
        if not value:
            raise serializers.ValidationError("Privacy policy must be accepted.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("privacy_policy_accepted", None)
        user = User(
            **validated_data,
            username=self.build_username(validated_data["display_name"]),
            role=User.Role.LISTENER,
        )
        user.set_password(password)
        user.save()
        return user

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": CurrentUserSerializer(instance, context=self.context).data,
        }


class ArtistRegistrationSerializer(BaseRegistrationSerializer):
    stage_name = serializers.CharField(max_length=150, write_only=True)
    portfolio_links = serializers.ListField(
        child=serializers.CharField(allow_blank=False, trim_whitespace=True),
        allow_empty=False,
        required=False,
    )

    class Meta:
        model = Artist
        fields = (
            "email",
            "password",
            "password_confirmation",
            "stage_name",
            "portfolio_links",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        stage_name = validated_data.pop("stage_name").strip()
        artist = Artist(
            **validated_data,
            username=self.build_username(stage_name),
            stage_name=stage_name,
            display_name=stage_name,
            role=User.Role.ARTIST,
        )
        artist.set_password(password)
        artist.save()
        return artist

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": CurrentUserSerializer(instance, context=self.context).data,
        }
