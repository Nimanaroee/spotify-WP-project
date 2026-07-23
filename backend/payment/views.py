from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    SubscriptionPaymentCreateSerializer,
    SubscriptionPaymentLogSerializer,
)


@extend_schema(tags=["payments"])
class SubscriptionPaymentCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Create a subscription payment log",
        description=(
            "Mock a successful payment for a subscription upgrade. The submitted "
            "amount must match the configured monthly fee multiplied by duration. "
            "Use the returned log ID to activate the subscription."
        ),
        request=SubscriptionPaymentCreateSerializer,
        responses={200: SubscriptionPaymentLogSerializer},
        examples=[
            OpenApiExample(
                "Payment request",
                value={
                    "amount": 59.97,
                    "duration_months": 3,
                    "account_type": "gold",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Successful payment log",
                value={
                    "id": 42,
                    "amount": 59.97,
                    "duration_months": 3,
                    "account_type": "gold",
                    "status": "successful",
                    "subscription_applied_at": None,
                    "created_at": "2026-07-23T12:00:00Z",
                },
                response_only=True,
                status_codes=["200"],
            ),
        ],
    )
    def post(self, request):
        serializer = SubscriptionPaymentCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        payment_log = serializer.save()
        return Response(
            SubscriptionPaymentLogSerializer(payment_log).data,
            status=status.HTTP_200_OK,
        )
