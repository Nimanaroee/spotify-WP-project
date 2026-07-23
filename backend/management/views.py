from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import Artist

from . import schema, services
from .models import MonthlyArtistAudit, SubscriptionPricing, SupportTicket
from .permissions import IsAdmin, IsSupportOrAdmin
from .serializers import (
    ArtistVerificationRequestSerializer,
    CreateTicketSerializer,
    MonthlyArtistAuditSerializer,
    RejectVerificationSerializer,
    ReplyToTicketSerializer,
    RevenueReportSerializer,
    SubscriptionPricingSerializer,
    SupportTicketDetailSerializer,
    SupportTicketListSerializer,
)


@extend_schema(
    tags=schema.SUPPORT_TAG,
    summary="Submit a support ticket",
    description="Create a support ticket with an initial message. Any authenticated user may submit one.",
    request=CreateTicketSerializer,
    responses={201: SupportTicketDetailSerializer},
)
class CreateTicketView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = CreateTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = services.create_ticket(
            request.user,
            serializer.validated_data["subject"],
            serializer.validated_data["message"],
        )
        return Response(
            SupportTicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=schema.SUPPORT_TAG,
    summary="List support tickets",
    description="List all support tickets, newest first. Support and admin roles only.",
    responses={200: SupportTicketListSerializer, 403: schema.FORBIDDEN_RESPONSE},
)
class TicketListView(generics.ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = SupportTicketListSerializer
    queryset = SupportTicket.objects.all()


@extend_schema(
    tags=schema.SUPPORT_TAG,
    summary="Get a ticket with its message thread",
    responses={
        200: SupportTicketDetailSerializer,
        403: schema.FORBIDDEN_RESPONSE,
        404: schema.NOT_FOUND_RESPONSE,
    },
)
class TicketDetailView(generics.RetrieveAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = SupportTicketDetailSerializer
    queryset = SupportTicket.objects.all()


@extend_schema(
    tags=schema.SUPPORT_TAG,
    summary="Reply to a ticket",
    description="Adds a staff message and sets the ticket status to `answered`. Fails on closed tickets.",
    request=ReplyToTicketSerializer,
    responses={
        200: SupportTicketDetailSerializer,
        400: OpenApiTypes.OBJECT,
        403: schema.FORBIDDEN_RESPONSE,
    },
)
class TicketReplyView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        serializer = ReplyToTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.reply_to_ticket(ticket, request.user, serializer.validated_data["message"])
        return Response(SupportTicketDetailSerializer(ticket).data)


@extend_schema(
    tags=schema.SUPPORT_TAG,
    summary="Close a ticket",
    request=None,
    responses={200: SupportTicketDetailSerializer, 403: schema.FORBIDDEN_RESPONSE},
)
class TicketCloseView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        services.close_ticket(ticket)
        return Response(SupportTicketDetailSerializer(ticket).data)


@extend_schema(
    tags=schema.VERIFICATION_TAG,
    summary="List artist verification requests",
    description=(
        "An artist account itself is the verification request; there is no separate "
        "request object. Filter with `status` (`pending`, `approved`, `rejected`)."
    ),
    parameters=[
        OpenApiParameter(
            "status",
            OpenApiTypes.STR,
            OpenApiParameter.QUERY,
            required=False,
            description="Filter by verification_status.",
        ),
    ],
    responses={200: ArtistVerificationRequestSerializer, 403: schema.FORBIDDEN_RESPONSE},
)
class VerificationRequestListView(generics.ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistVerificationRequestSerializer

    def get_queryset(self):
        queryset = Artist.objects.all()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(verification_status=status_filter)
        return queryset


@extend_schema(
    tags=schema.VERIFICATION_TAG,
    summary="Get a single verification request",
    description="`pk` is the artist's user id.",
    responses={
        200: ArtistVerificationRequestSerializer,
        403: schema.FORBIDDEN_RESPONSE,
        404: schema.NOT_FOUND_RESPONSE,
    },
)
class VerificationRequestDetailView(generics.RetrieveAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistVerificationRequestSerializer
    queryset = Artist.objects.all()


@extend_schema(
    tags=schema.VERIFICATION_TAG,
    summary="Approve an artist verification request",
    description=(
        "Sets verification_status to `approved`, activates the artist account, and "
        "notifies the artist. Fails with 400 if the request was already processed."
    ),
    request=None,
    responses={
        200: ArtistVerificationRequestSerializer,
        400: OpenApiTypes.OBJECT,
        403: schema.FORBIDDEN_RESPONSE,
    },
)
class VerificationApproveView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        artist = get_object_or_404(Artist, pk=pk)
        services.approve_verification(artist)
        return Response(ArtistVerificationRequestSerializer(artist).data)


@extend_schema(
    tags=schema.VERIFICATION_TAG,
    summary="Reject an artist verification request",
    description="Requires a non-empty `reason`. Notifies the artist with the reason.",
    request=RejectVerificationSerializer,
    responses={
        200: ArtistVerificationRequestSerializer,
        400: OpenApiTypes.OBJECT,
        403: schema.FORBIDDEN_RESPONSE,
    },
)
class VerificationRejectView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        artist = get_object_or_404(Artist, pk=pk)
        serializer = RejectVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.reject_verification(artist, serializer.validated_data["reason"])
        return Response(ArtistVerificationRequestSerializer(artist).data)


@extend_schema(
    tags=schema.AUDITING_TAG,
    summary="List monthly artist audits",
    description="Filter by `year` and `month`. Support and admin roles only.",
    parameters=[
        OpenApiParameter("year", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
        OpenApiParameter("month", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
    ],
    responses={200: MonthlyArtistAuditSerializer, 403: schema.FORBIDDEN_RESPONSE},
)
class MonthlyAuditListView(generics.ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = MonthlyArtistAuditSerializer

    def get_queryset(self):
        queryset = MonthlyArtistAudit.objects.select_related("artist")
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            queryset = queryset.filter(period_year=year)
        if month:
            queryset = queryset.filter(period_month=month)
        return queryset


@extend_schema(
    tags=schema.AUDITING_TAG,
    summary="Settle an artist's monthly payout",
    description=(
        "Marks the audit as settled and notifies the artist with the payout amount. "
        "Admin-only. Fails with 400 if already settled."
    ),
    request=None,
    responses={
        200: MonthlyArtistAuditSerializer,
        400: OpenApiTypes.OBJECT,
        403: schema.FORBIDDEN_RESPONSE,
    },
)
class MonthlyAuditSettleView(APIView):
    permission_classes = (IsAdmin,)

    def post(self, request, pk):
        audit = get_object_or_404(MonthlyArtistAudit, pk=pk)
        services.settle_audit(audit)
        return Response(MonthlyArtistAuditSerializer(audit).data)


@extend_schema_view(
    get=extend_schema(
        tags=schema.SUBSCRIPTION_ADMIN_TAG,
        summary="Get subscription pricing",
        description="Returns the single subscription pricing record (created on first access). Admin-only.",
        responses={200: SubscriptionPricingSerializer, 403: schema.FORBIDDEN_RESPONSE},
    ),
    put=extend_schema(
        tags=schema.SUBSCRIPTION_ADMIN_TAG,
        summary="Update subscription pricing",
        description="Both prices must be greater than 0. Admin-only.",
        request=SubscriptionPricingSerializer,
        responses={
            200: SubscriptionPricingSerializer,
            400: OpenApiTypes.OBJECT,
            403: schema.FORBIDDEN_RESPONSE,
        },
    ),
    patch=extend_schema(
        tags=schema.SUBSCRIPTION_ADMIN_TAG,
        summary="Partially update subscription pricing",
        request=SubscriptionPricingSerializer,
        responses={
            200: SubscriptionPricingSerializer,
            400: OpenApiTypes.OBJECT,
            403: schema.FORBIDDEN_RESPONSE,
        },
    ),
)
class SubscriptionPricingView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "put", "patch", "head", "options")
    permission_classes = (IsAdmin,)
    serializer_class = SubscriptionPricingSerializer

    def get_object(self):
        return SubscriptionPricing.current()


@extend_schema(
    tags=schema.SUBSCRIPTION_ADMIN_TAG,
    summary="Get the monthly revenue report",
    description="Computes subscriber counts per tier and total revenue for the given period. Admin-only.",
    parameters=[
        OpenApiParameter("year", OpenApiTypes.INT, OpenApiParameter.QUERY, required=True),
        OpenApiParameter("month", OpenApiTypes.INT, OpenApiParameter.QUERY, required=True),
    ],
    responses={200: RevenueReportSerializer, 403: schema.FORBIDDEN_RESPONSE},
)
class RevenueReportView(APIView):
    permission_classes = (IsAdmin,)

    def get(self, request):
        year = int(request.query_params.get("year"))
        month = int(request.query_params.get("month"))
        report = services.get_revenue_report(year, month)
        return Response(RevenueReportSerializer(report).data)
