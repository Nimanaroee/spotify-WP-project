from django.urls import path

from .views import SubscriptionPaymentCreateView

urlpatterns = [
    path("", SubscriptionPaymentCreateView.as_view(), name="payment"),
]
