"""Preliminary schema — refine once the official Phase 2 backend spec is released.

User model (AbstractUser + role, display_name, birth_date, gender, profile_picture,
notification_settings); Follow model
Spec reference: <phase1.md section> | users

Responsibilities (TODO):
    - [ ] define User and Follow models

Notes: keep minimal for Phase 1
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('listener', 'Listener'),
        ('artist', 'Artist'),
        ('support', 'Support'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='listener')
    display_name = models.CharField(max_length=150, blank=True)


class Follow(models.Model):
    follower = models.ForeignKey('users.User', related_name='following', on_delete=models.CASCADE)
    followed = models.ForeignKey('users.User', related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
