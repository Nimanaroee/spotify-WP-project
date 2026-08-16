from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from management.models import SubscriptionPricing
from user.models import User

from .models import SubscriptionPaymentLog
from .services import (
    ZarinpalGatewayError,
    get_gateway_amount,
    get_gateway_base_url,
    request_payment,
    verify_payment,
)


class SubscriptionPaymentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="payment@example.com",
            username="payment_user",
            password="password123",
            display_name="Payment User",
        )
        self.url = reverse("payment")

    def test_payment_requires_authentication(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("payment.views.request_payment")
    def test_payment_starts_gateway_request_and_creates_pending_log(
        self, request_payment_mock
    ):
        request_payment_mock.return_value = {
            "data": {
                "code": 100,
                "message": "Success",
                "authority": "A-test-authority",
            },
            "errors": [],
        }
        self.client.force_authenticate(self.user)
        pricing = SubscriptionPricing.current()
        pricing.silver_price = "12.50"
        pricing.save(update_fields=("silver_price", "updated_at"))

        response = self.client.post(
            self.url,
            {"duration_months": 3, "account_type": "silver"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["redirect_url"],
            f"{get_gateway_base_url()}/pg/StartPay/A-test-authority",
        )
        payment_log = SubscriptionPaymentLog.objects.get(pk=response.data["id"])
        self.assertEqual(payment_log.user, self.user)
        self.assertEqual(payment_log.status, SubscriptionPaymentLog.Status.PENDING)
        self.assertEqual(payment_log.authority, "A-test-authority")
        self.assertEqual(str(payment_log.amount), "37.50")
        self.assertEqual(
            request_payment_mock.call_args.kwargs["amount"], payment_log.amount
        )

    @patch("payment.views.request_payment")
    def test_payment_stores_pretty_gateway_error(self, request_payment_mock):
        request_payment_mock.side_effect = ZarinpalGatewayError(
            "The payment terminal is invalid. Please contact support.",
            code=-10,
            payload={"errors": [{"code": -10}]},
            http_status=400,
        )
        self.client.force_authenticate(self.user)

        response = self.client.post(
            self.url,
            {"duration_months": 1, "account_type": "silver"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["gateway_code"], -10)
        payment_log = SubscriptionPaymentLog.objects.get()
        self.assertEqual(payment_log.status, SubscriptionPaymentLog.Status.FAILED)
        self.assertEqual(
            payment_log.gateway_message,
            "The payment terminal is invalid. Please contact support.",
        )

    @patch("payment.views.verify_payment")
    def test_callback_verifies_payment_and_activates_subscription(
        self, verify_payment_mock
    ):
        payment_log = SubscriptionPaymentLog.objects.create(
            user=self.user,
            amount="9.99",
            duration_months=1,
            account_type=User.SubscriptionTier.SILVER,
            authority="A-callback-authority",
        )
        verify_payment_mock.return_value = {
            "data": {
                "code": 100,
                "message": "Verified",
                "ref_id": 123456,
                "card_pan": "502229******5995",
            },
            "errors": [],
        }

        response = self.client.get(
            f"{reverse('payment-callback')}?Authority={payment_log.authority}&Status=OK"
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(
            response["Location"],
            "http://localhost:5173/settings/?payment=success",
        )
        payment_log.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(payment_log.status, SubscriptionPaymentLog.Status.SUCCESSFUL)
        self.assertEqual(payment_log.ref_id, 123456)
        self.assertIsNotNone(payment_log.subscription_applied_at)
        self.assertEqual(self.user.subscription_tier, User.SubscriptionTier.SILVER)
        verify_payment_mock.assert_called_once_with(
            amount=payment_log.amount,
            authority=payment_log.authority,
        )

    def test_callback_marks_cancelled_payment_as_failed(self):
        payment_log = SubscriptionPaymentLog.objects.create(
            user=self.user,
            amount="9.99",
            duration_months=1,
            account_type=User.SubscriptionTier.SILVER,
            authority="A-cancelled-authority",
        )

        response = self.client.get(
            f"{reverse('payment-callback')}?Authority={payment_log.authority}&Status=NOK"
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(
            response["Location"],
            "http://localhost:5173/settings/?payment=cancelled",
        )
        payment_log.refresh_from_db()
        self.assertEqual(payment_log.status, SubscriptionPaymentLog.Status.FAILED)


class ZarinpalAmountTests(APITestCase):
    def test_gateway_amount_converts_usd_to_rials(self):
        self.assertEqual(get_gateway_amount(Decimal("12.50")), 23750000)

    @override_settings(ZARINPAL_USD_TO_IRR_RATE="1900000")
    def test_gateway_amount_accepts_an_environment_string(self):
        self.assertEqual(get_gateway_amount(Decimal("12.50")), 23750000)

    @override_settings(ZARINPAL_MERCHANT_ID="test-merchant")
    @patch("payment.services._post_to_zarinpal")
    def test_request_and_verification_send_rial_amounts(self, post_mock):
        request_payment(
            amount=Decimal("12.50"),
            description="Silver subscription",
            callback_url="https://example.com/callback",
            metadata={},
        )
        verify_payment(amount=Decimal("12.50"), authority="A-test-authority")

        self.assertEqual(post_mock.call_args_list[0].args[1]["amount"], 23750000)
        self.assertEqual(post_mock.call_args_list[1].args[1]["amount"], 23750000)
