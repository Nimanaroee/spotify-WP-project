from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils.text import slugify
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Artist

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
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


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
            is_active=False,
        )
        artist.set_password(password)
        artist.save()
        return artist

    def to_representation(self, instance):
        return {
            "status": "pending_approval",
            "message": "Your artist account request is pending approval.",
            "user": CurrentUserSerializer(instance, context=self.context).data,
        }
