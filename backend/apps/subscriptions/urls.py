from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plans'),
    path('admin/update-price/', views.AdminPriceUpdateView.as_view(), name='admin-update-price'),
    path('me/', views.MySubscriptionView.as_view(), name='my-subscription'),
]
