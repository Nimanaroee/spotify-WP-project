"""Preliminary schema — refine once the official Phase 2 backend spec is released.

SubscriptionPlan and UserSubscription models
"""
from django.db import models


class SubscriptionPlan(models.Model):
    tier = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    streams_per_day = models.PositiveIntegerField(null=True, blank=True)
    playlist_limit = models.PositiveIntegerField(null=True, blank=True)


class UserSubscription(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
