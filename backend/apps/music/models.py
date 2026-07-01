"""Preliminary schema — refine once the official Phase 2 backend spec is released.

Genre, Album, Track, StreamEvent models
"""
from django.db import models


class Genre(models.Model):
    name = models.CharField(max_length=100)


class Album(models.Model):
    title = models.CharField(max_length=200)


class Track(models.Model):
    title = models.CharField(max_length=200)


class StreamEvent(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    listener = models.ForeignKey('users.User', on_delete=models.CASCADE)
    played_at = models.DateTimeField(auto_now_add=True)
