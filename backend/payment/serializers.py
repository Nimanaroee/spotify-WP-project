from rest_framework import serializers

from management.services import get_subscription_fee
from user.models import User
from user.services import SUBSCRIPTION_TIER_RANK

from .models import SubscriptionPaymentLog
from .services import get_gateway_amount


class SubscriptionPaymentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPaymentLog
        fields = (
            "id",
            "amount",
            "duration_months",
            "account_type",
            "status",
            "authority",
            "ref_id",
            "gateway_message",
            "subscription_applied_at",
            "created_at",
        )
        read_only_fields = fields
        extra_kwargs = {
            "amount": {"coerce_to_string": False},
        }


class SubscriptionPaymentCreateSerializer(serializers.Serializer):
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
        if (
            SUBSCRIPTION_TIER_RANK[account_type]
            <= SUBSCRIPTION_TIER_RANK[user.get_effective_subscription_tier()]
        ):
            raise serializers.ValidationError(
                {
                    "account_type": "You can only pay to upgrade to a higher subscription tier."
                }
            )

        attrs["amount"] = get_subscription_fee(account_type) * attrs["duration_months"]
        if get_gateway_amount(attrs["amount"]) < 1000:
            raise serializers.ValidationError(
                {
                    "account_type": (
                        "This subscription price is below Zarinpal's 1,000 IRR "
                        "minimum payment amount."
                    )
                }
            )
        return attrs


class SubscriptionPaymentInitiateSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    redirect_url = serializers.URLField(read_only=True)
