from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

User = get_user_model()


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
def follow_user(user, target):
    if user.pk == target.pk:
        raise ValidationError({"username": "A user cannot follow themselves."})

    user.following.add(target)
    _sync_follow_counts({user.id, target.id})


@transaction.atomic
def unfollow_user(user, target):
    user.following.remove(target)
    _sync_follow_counts({user.id, target.id})
