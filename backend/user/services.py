import calendar
from datetime import datetime

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import User as UserModel

User = get_user_model()

SUBSCRIPTION_TIER_RANK = {
    UserModel.SubscriptionTier.BASIC: 0,
    UserModel.SubscriptionTier.SILVER: 1,
    UserModel.SubscriptionTier.GOLD: 2,
}


def _sync_follow_counts(user_ids):
    for user in User.objects.filter(id__in=user_ids):
        user.followers_count = user.followers.count()
        user.following_count = user.following.count()
        user.save(update_fields=("followers_count", "following_count", "updated_at"))


@transaction.atomic
def update_profile(user, validated_data):
    for field, value in validated_data.items():
        setattr(user, field, value)
    if validated_data:
        user.save()

    user.refresh_from_db()
    return user


@transaction.atomic
def update_artist_profile(artist, validated_data):
    missing = object()
    profile_picture = validated_data.pop("profile_photo", missing)

    for field, value in validated_data.items():
        setattr(artist, field, value)
    if profile_picture is not missing:
        artist.profile_picture = profile_picture
    if validated_data or profile_picture is not missing:
        artist.save()

    artist.refresh_from_db()
    return artist


@transaction.atomic
def follow_user(user, target):
    if user.pk == target.pk:
        raise ValidationError({"username": "A user cannot follow themselves."})

    user.following.add(target)
    _sync_follow_counts({user.id, target.id})


@transaction.atomic
def unfollow_user(user, target):
    user.following.remove(target)
    _sync_follow_counts({user.id, target.id})


def add_months(value: datetime, months: int) -> datetime:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def activate_subscription(
    user,
    *,
    subscription_tier,
    duration_months,
    payment_log_id,
):
    from payment.models import SubscriptionPaymentLog

    with transaction.atomic():
        locked_user = UserModel.objects.select_for_update().get(pk=user.pk)
        payment_log = (
            SubscriptionPaymentLog.objects.select_for_update()
            .filter(
                pk=payment_log_id,
                user=locked_user,
                account_type=subscription_tier,
                duration_months=duration_months,
                status=SubscriptionPaymentLog.Status.SUCCESSFUL,
                subscription_applied_at__isnull=True,
            )
            .first()
        )
        if payment_log is None:
            raise ValueError(
                "A matching unapplied payment log is required to activate a subscription."
            )

        current_tier = locked_user.get_effective_subscription_tier()
        if SUBSCRIPTION_TIER_RANK[subscription_tier] <= SUBSCRIPTION_TIER_RANK[
            current_tier
        ]:
            raise ValueError("You can only upgrade to a higher subscription tier.")

        now = timezone.now()
        starts_at = now
        if (
            locked_user.subscription_expires_at is not None
            and locked_user.subscription_expires_at > now
        ):
            starts_at = locked_user.subscription_expires_at

        locked_user.subscription_tier = subscription_tier
        locked_user.subscription_expires_at = add_months(starts_at, duration_months)
        locked_user.save(
            update_fields=("subscription_tier", "subscription_expires_at", "updated_at")
        )
        payment_log.subscription_applied_at = now
        payment_log.save(update_fields=("subscription_applied_at", "updated_at"))
        return locked_user
