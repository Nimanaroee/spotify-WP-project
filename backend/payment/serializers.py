from decimal import Decimal

from rest_framework import serializers

from user.models import SubscriptionFee, User
from user.services import SUBSCRIPTION_TIER_RANK

from .models import SubscriptionPaymentLog


class SubscriptionPaymentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPaymentLog
        fields = (
            "id",
            "amount",
            "duration_months",
            "account_type",
            "status",
            "subscription_applied_at",
            "created_at",
        )
        read_only_fields = fields
        extra_kwargs = {
            "amount": {"coerce_to_string": False},
        }


class SubscriptionPaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    duration_months = serializers.ChoiceField(
        choices=(1, 3, 6, 12),
        help_text="One of: 1, 3, 6, 12.",
    )
    account_type = serializers.ChoiceField(
        choices=(
            User.SubscriptionTier.SILVER,
            User.SubscriptionTier.GOLD,
        ),
        help_text="One of: silver, gold.",
    )

    def validate(self, attrs):
        user = self.context["request"].user
        account_type = attrs["account_type"]
        if SUBSCRIPTION_TIER_RANK[account_type] <= SUBSCRIPTION_TIER_RANK[
            user.get_effective_subscription_tier()
        ]:
            raise serializers.ValidationError(
                {"account_type": "You can only pay to upgrade to a higher subscription tier."}
            )

        try:
            fee = SubscriptionFee.objects.get(subscription_tier=account_type)
        except SubscriptionFee.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"account_type": "No monthly fee is configured for this subscription tier."}
            ) from exc

        expected_amount = fee.price_per_month * attrs["duration_months"]
        if attrs["amount"] != expected_amount:
            raise serializers.ValidationError(
                {
                    "amount": (
                        "Amount must equal the configured monthly fee multiplied by "
                        f"the duration ({expected_amount})."
                    )
                }
            )
        return attrs

    def create(self, validated_data):
        return SubscriptionPaymentLog.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )
