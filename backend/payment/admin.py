from django.contrib import admin

from .models import SubscriptionPaymentLog


@admin.register(SubscriptionPaymentLog)
class SubscriptionPaymentLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "account_type",
        "duration_months",
        "amount",
        "status",
        "subscription_applied_at",
        "created_at",
    )
    list_filter = ("account_type", "status")
    search_fields = ("user__email", "user__username")
    readonly_fields = ("created_at", "updated_at", "subscription_applied_at")
