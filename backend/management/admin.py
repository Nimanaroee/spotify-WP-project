from django.contrib import admin

from .models import MonthlyArtistAudit, SubscriptionPricing, SupportTicket, TicketMessage


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "subject", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("subject", "user__email", "user__username")
    inlines = (TicketMessageInline,)


@admin.register(MonthlyArtistAudit)
class MonthlyArtistAuditAdmin(admin.ModelAdmin):
    list_display = (
        "artist",
        "period_year",
        "period_month",
        "unique_listeners_count",
        "total_streams_count",
        "payout_amount",
        "payment_status",
    )
    list_filter = ("payment_status", "period_year", "period_month")
    search_fields = ("artist__display_name", "artist__email")


@admin.register(SubscriptionPricing)
class SubscriptionPricingAdmin(admin.ModelAdmin):
    list_display = ("silver_price", "gold_price", "updated_at")
