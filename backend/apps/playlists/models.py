"""Preliminary schema — refine once the official Phase 2 backend spec is released.

Playlist and PlaylistTrack models
"""
from django.db import models


class Playlist(models.Model):
    owner = models.ForeignKey('users.User', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)


class PlaylistTrack(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    track = models.ForeignKey('music.Track', on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
