import logging
from urllib.parse import urlencode

from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.urls import reverse
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes,
    extend_schema,
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.serializers import SubscriptionReadSerializer
from user.services import activate_subscription

from .models import SubscriptionPaymentLog
from .serializers import (
    SubscriptionPaymentCreateSerializer,
    SubscriptionPaymentInitiateSerializer,
    SubscriptionPaymentLogSerializer,
)
from .services import (
    ZarinpalGatewayError,
    get_gateway_base_url,
    request_payment,
    verify_payment,
)

logger = logging.getLogger(__name__)


def redirect_to_settings(payment_status):
    query_string = urlencode({"payment": payment_status})
    return HttpResponseRedirect(
        f"{settings.FRONTEND_URL}/settings/?{query_string}"
    )


@extend_schema(tags=["payments"])
class SubscriptionPaymentCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Start a Zarinpal subscription payment",
        description=(
            "Creates a pending subscription payment, sends it to Zarinpal, and "
            "returns the gateway URL. The server calculates the amount from the "
            "configured subscription fee."
        ),
        request=SubscriptionPaymentCreateSerializer,
        responses={201: SubscriptionPaymentInitiateSerializer},
        examples=[
            OpenApiExample(
                "Payment request",
                value={"duration_months": 3, "account_type": "gold"},
                request_only=True,
            ),
            OpenApiExample(
                "Payment redirect",
                value={
                    "id": 42,
                    "redirect_url": (
                        "https://payment.zarinpal.com/pg/StartPay/"
                        "A0000000000000000000000000000wwOGYpd"
                    ),
                },
                response_only=True,
                status_codes=["201"],
            ),
        ],
    )
    def post(self, request):
        serializer = SubscriptionPaymentCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        payment_log = SubscriptionPaymentLog.objects.create(
            user=request.user,
            **serializer.validated_data,
        )
        callback_url = request.build_absolute_uri(reverse("payment-callback"))
        description = (
            f"{payment_log.get_account_type_display()} subscription for "
            f"{payment_log.duration_months} month(s)"
        )

        try:
            gateway_response = request_payment(
                amount=payment_log.amount,
                description=description,
                callback_url=callback_url,
                metadata={
                    "email": request.user.email,
                    "order_id": str(payment_log.id),
                },
            )
        except ZarinpalGatewayError as exc:
            logger.warning(
                "Zarinpal payment request failed. payment_log_id=%s code=%s "
                "message=%s response=%s",
                payment_log.id,
                exc.code,
                str(exc),
                exc.payload,
            )
            payment_log.status = SubscriptionPaymentLog.Status.FAILED
            payment_log.gateway_request = exc.payload
            payment_log.gateway_message = str(exc)
            payment_log.save(
                update_fields=(
                    "status",
                    "gateway_request",
                    "gateway_message",
                    "updated_at",
                )
            )
            return Response(
                {"detail": str(exc), "gateway_code": exc.code},
                status=exc.http_status,
            )

        gateway_data = gateway_response["data"]
        payment_log.authority = gateway_data["authority"]
        payment_log.gateway_request = gateway_response
        payment_log.gateway_message = gateway_data.get("message", "")
        payment_log.save(
            update_fields=(
                "authority",
                "gateway_request",
                "gateway_message",
                "updated_at",
            )
        )
        return Response(
            {
                "id": payment_log.id,
                "redirect_url": (
                    f"{get_gateway_base_url()}/pg/StartPay/{payment_log.authority}"
                ),
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["payments"])
class SubscriptionPaymentCallbackView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    @extend_schema(
        summary="Verify a Zarinpal subscription payment",
        description=(
            "Zarinpal redirects the customer here after checkout. This endpoint "
            "verifies the authority with Zarinpal, records the gateway response, "
            "and activates the subscription after a successful verification."
        ),
        parameters=[
            OpenApiParameter(
                "Authority",
                OpenApiTypes.STR,
                OpenApiParameter.QUERY,
                required=True,
            ),
            OpenApiParameter(
                "Status",
                OpenApiTypes.STR,
                OpenApiParameter.QUERY,
                required=True,
            ),
        ],
        responses={302: None, 400: None, 502: None},
    )
    def get(self, request):
        authority = request.query_params.get("Authority")
        gateway_status = request.query_params.get("Status")
        if not authority:
            return Response(
                {"detail": "Zarinpal did not return a payment authority."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment_log = SubscriptionPaymentLog.objects.select_related("user").get(
                authority=authority
            )
        except SubscriptionPaymentLog.DoesNotExist:
            return Response(
                {"detail": "This payment request was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if gateway_status != "OK":
            payment_log.status = SubscriptionPaymentLog.Status.FAILED
            payment_log.gateway_message = "The payment was cancelled or unsuccessful."
            payment_log.save(update_fields=("status", "gateway_message", "updated_at"))
            return redirect_to_settings("cancelled")

        if payment_log.subscription_applied_at is not None:
            return Response(
                {
                    "message": "This payment was already verified.",
                    "payment": SubscriptionPaymentLogSerializer(payment_log).data,
                    "subscription": SubscriptionReadSerializer(payment_log.user).data,
                }
            )

        try:
            gateway_response = verify_payment(
                amount=payment_log.amount,
                authority=payment_log.authority,
            )
        except ZarinpalGatewayError as exc:
            logger.warning(
                "Zarinpal payment verification failed. payment_log_id=%s code=%s "
                "message=%s response=%s",
                payment_log.id,
                exc.code,
                str(exc),
                exc.payload,
            )
            payment_log.status = SubscriptionPaymentLog.Status.FAILED
            payment_log.gateway_verify = exc.payload
            payment_log.gateway_message = str(exc)
            payment_log.save(
                update_fields=(
                    "status",
                    "gateway_verify",
                    "gateway_message",
                    "updated_at",
                )
            )
            return Response(
                {
                    "detail": str(exc),
                    "gateway_code": exc.code,
                    "payment_id": payment_log.id,
                },
                status=exc.http_status,
            )

        gateway_data = gateway_response["data"]
        with transaction.atomic():
            payment_log = SubscriptionPaymentLog.objects.select_for_update().get(
                pk=payment_log.pk
            )
            payment_log.status = SubscriptionPaymentLog.Status.SUCCESSFUL
            payment_log.gateway_verify = gateway_response
            payment_log.gateway_message = gateway_data.get("message", "")
            payment_log.ref_id = gateway_data.get("ref_id")
            payment_log.save(
                update_fields=(
                    "status",
                    "gateway_verify",
                    "gateway_message",
                    "ref_id",
                    "updated_at",
                )
            )
            activate_subscription(
                payment_log.user,
                subscription_tier=payment_log.account_type,
                duration_months=payment_log.duration_months,
                payment_log_id=payment_log.id,
            )

        payment_log.refresh_from_db()
        return redirect_to_settings("success")
