"""Preliminary schema — refine once the official Phase 2 backend spec is released.

MonthlyArtistAudit model
"""
from django.db import models


class MonthlyArtistAudit(models.Model):
    artist = models.ForeignKey('users.User', on_delete=models.CASCADE)
    period_year = models.IntegerField()
    period_month = models.IntegerField()
    unique_listeners_count = models.IntegerField(default=0)
    total_streams_count = models.IntegerField(default=0)
    reward_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
