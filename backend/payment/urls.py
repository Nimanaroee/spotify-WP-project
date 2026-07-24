from django.urls import path

from .views import SubscriptionPaymentCallbackView, SubscriptionPaymentCreateView

urlpatterns = [
    path("", SubscriptionPaymentCreateView.as_view(), name="payment"),
    path("callback/", SubscriptionPaymentCallbackView.as_view(), name="payment-callback"),
]
