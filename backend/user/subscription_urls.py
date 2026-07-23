from django.urls import path

from .views import SubscriptionFeeListView

urlpatterns = [
    path("", SubscriptionFeeListView.as_view(), name="subscription-fees"),
]
