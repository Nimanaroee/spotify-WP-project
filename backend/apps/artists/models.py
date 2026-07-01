"""Preliminary schema — refine once the official Phase 2 backend spec is released.

ArtistProfile model

Responsibilities (TODO):
    - [ ] ArtistProfile fields
"""
from django.db import models


class ArtistProfile(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE)
    stage_name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    verification_status = models.CharField(max_length=20, default='pending')
