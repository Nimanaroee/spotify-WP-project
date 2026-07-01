"""Preliminary schema — refine once the official Phase 2 backend spec is released.

Notification model
"""
from django.db import models


class Notification(models.Model):
    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE)
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
