from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Artist, Preferences, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "username", "display_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "username", "display_name")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "Profile",
            {
                "fields": (
                    "display_name",
                    "role",
                    "birth_date",
                    "gender",
                    "profile_picture",
                    "subscription_tier",
                    "following",
                    "followers_count",
                    "following_count",
                    "streamed_today",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Profile",
            {
                "fields": (
                    "email",
                    "display_name",
                    "role",
                    "birth_date",
                    "gender",
                )
            },
        ),
    )


@admin.register(Artist)
class ArtistAdmin(UserAdmin):
    model = Artist
    list_display = (
        "email",
        "username",
        "stage_name",
        "verification_status",
        "is_approved",
        "is_active",
    )
    list_filter = ("verification_status", "is_active")
    search_fields = ("email", "username", "stage_name", "display_name")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "Profile",
            {
                "fields": (
                    "display_name",
                    "role",
                    "birth_date",
                    "gender",
                    "profile_picture",
                    "subscription_tier",
                    "following",
                    "followers_count",
                    "following_count",
                    "streamed_today",
                )
            },
        ),
        (
            "Artist",
            {
                "fields": (
                    "stage_name",
                    "bio",
                    "portfolio_links",
                    "verification_status",
                    "listener_count",
                    "total_streams",
                    "rejection_reason",
                )
            },
        ),
    )


@admin.register(Preferences)
class PreferencesAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "theme",
        "notification_limit",
        "notification_sound_enabled",
        "language",
        "system_voice",
        "updated_at",
    )
    list_filter = (
        "theme",
        "notification_sound_enabled",
        "language",
        "system_voice",
    )
    search_fields = ("user__email", "user__username", "user__display_name")
