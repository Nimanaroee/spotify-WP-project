"""Preliminary schema — refine once the official Phase 2 backend spec is released.

TimeStampedModel abstract base (created_at/updated_at)
Spec reference: <phase1.md section> | core utilities

Responsibilities (TODO):
    - [ ] provide timestamped abstract base model

Notes: used by other apps as base class
"""
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
