from rest_framework import serializers

from user.models import Artist

from .models import MonthlyArtistAudit, SubscriptionPricing, SupportTicket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.display_name", read_only=True)

    class Meta:
        model = TicketMessage
        fields = ("id", "ticket", "sender", "sender_name", "message", "created_at")
        read_only_fields = ("id", "ticket", "sender", "sender_name", "created_at")


class SupportTicketListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = SupportTicket
        fields = ("id", "user", "user_name", "subject", "status", "created_at", "updated_at")
        read_only_fields = fields


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.display_name", read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id",
            "user",
            "user_name",
            "subject",
            "status",
            "created_at",
            "updated_at",
            "messages",
        )
        read_only_fields = fields


class CreateTicketSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()


class ReplyToTicketSerializer(serializers.Serializer):
    message = serializers.CharField()


class RejectVerificationSerializer(serializers.Serializer):
    reason = serializers.CharField()


class ArtistVerificationRequestSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="pk", read_only=True)

    class Meta:
        model = Artist
        fields = (
            "user_id",
            "stage_name",
            "email",
            "portfolio_links",
            "verification_status",
            "rejection_reason",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class MonthlyArtistAuditSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)

    class Meta:
        model = MonthlyArtistAudit
        fields = (
            "id",
            "artist_id",
            "artist_name",
            "period_year",
            "period_month",
            "unique_listeners_count",
            "total_streams_count",
            "payout_amount",
            "payment_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SubscriptionPricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPricing
        fields = ("silver_price", "gold_price", "updated_at")
        read_only_fields = ("updated_at",)

    def validate_silver_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Silver price must be greater than 0.")
        return value

    def validate_gold_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Gold price must be greater than 0.")
        return value


class SubscriptionDistributionSerializer(serializers.Serializer):
    tier = serializers.CharField()
    user_count = serializers.IntegerField()
    percentage = serializers.FloatField()


class RevenueReportSerializer(serializers.Serializer):
    period_year = serializers.IntegerField()
    period_month = serializers.IntegerField()
    total_subscription_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    subscription_distribution = SubscriptionDistributionSerializer(many=True)
