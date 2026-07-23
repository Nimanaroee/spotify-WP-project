from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from user.models import User

from .models import SubscriptionPaymentLog


class SubscriptionPaymentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="payment@example.com",
            username="payment_user",
            password="password123",
            display_name="Payment User",
        )
        self.other_user = User.objects.create_user(
            email="other-payment@example.com",
            username="other_payment_user",
            password="password123",
            display_name="Other Payment User",
        )
        self.url = reverse("payment")

    def test_payment_requires_authentication(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_payment_creates_successful_log_for_configured_price(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            self.url,
            {
                "amount": "29.97",
                "duration_months": 3,
                "account_type": "silver",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], Decimal("29.97"))
        payment_log = SubscriptionPaymentLog.objects.get(pk=response.data["id"])
        self.assertEqual(payment_log.user, self.user)
        self.assertEqual(payment_log.account_type, User.SubscriptionTier.SILVER)

    def test_payment_rejects_wrong_price_and_lower_tier(self):
        self.client.force_authenticate(self.user)

        wrong_price_response = self.client.post(
            self.url,
            {
                "amount": "1.00",
                "duration_months": 3,
                "account_type": "silver",
            },
            format="json",
        )
        lower_tier_response = self.client.post(
            self.url,
            {
                "amount": "0.01",
                "duration_months": 1,
                "account_type": "basic",
            },
            format="json",
        )

        self.assertEqual(wrong_price_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(lower_tier_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SubscriptionPaymentLog.objects.count(), 0)


class SubscriptionFeeApiTests(APITestCase):
    def test_subscription_fee_list_is_public_and_returns_seeded_fees(self):
        response = self.client.get(reverse("subscription-fees"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(
            {
                row["subscription_tier"]: row["price_per_month"]
                for row in response.data["results"]
            },
            {
                "basic": Decimal("0.00"),
                "silver": Decimal("9.99"),
                "gold": Decimal("19.99"),
            },
        )
