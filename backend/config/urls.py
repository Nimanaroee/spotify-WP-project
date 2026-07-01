from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/docs/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/artists/', include('apps.artists.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/music/', include('apps.music.urls')),
    path('api/v1/playlists/', include('apps.playlists.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/tickets/', include('apps.tickets.urls')),
    path('api/v1/audits/', include('apps.audits.urls')),
]
