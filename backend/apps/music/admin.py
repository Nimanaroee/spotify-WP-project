from django.contrib import admin
from .models import Genre, Album, Track, StreamEvent

admin.site.register(Genre)
admin.site.register(Album)
admin.site.register(Track)
admin.site.register(StreamEvent)
