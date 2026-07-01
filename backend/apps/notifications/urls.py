from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notifications'),
    path('<int:pk>/read/', views.MarkAsReadView.as_view(), name='notification-read'),
]
