from django.contrib import admin

from .models import StreamEvent


@admin.register(StreamEvent)
class StreamEventAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "track", "created_at")
    list_filter = ("created_at", "track__artist")
    search_fields = (
        "user__email",
        "user__username",
        "track__title",
        "track__artist__stage_name",
    )
    ordering = ("-created_at",)
