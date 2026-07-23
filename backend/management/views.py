from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import Artist

from . import services
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


class TicketListView(generics.ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = SupportTicketListSerializer
    queryset = SupportTicket.objects.all()


class TicketDetailView(generics.RetrieveAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = SupportTicketDetailSerializer
    queryset = SupportTicket.objects.all()


class TicketReplyView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        serializer = ReplyToTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.reply_to_ticket(ticket, request.user, serializer.validated_data["message"])
        return Response(SupportTicketDetailSerializer(ticket).data)


class TicketCloseView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        services.close_ticket(ticket)
        return Response(SupportTicketDetailSerializer(ticket).data)


class VerificationRequestListView(generics.ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistVerificationRequestSerializer

    def get_queryset(self):
        queryset = Artist.objects.all()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(verification_status=status_filter)
        return queryset


class VerificationRequestDetailView(generics.RetrieveAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistVerificationRequestSerializer
    queryset = Artist.objects.all()


class VerificationApproveView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        artist = get_object_or_404(Artist, pk=pk)
        services.approve_verification(artist)
        return Response(ArtistVerificationRequestSerializer(artist).data)


class VerificationRejectView(APIView):
    permission_classes = (IsSupportOrAdmin,)

    def post(self, request, pk):
        artist = get_object_or_404(Artist, pk=pk)
        serializer = RejectVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.reject_verification(artist, serializer.validated_data["reason"])
        return Response(ArtistVerificationRequestSerializer(artist).data)


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


class MonthlyAuditSettleView(APIView):
    permission_classes = (IsAdmin,)

    def post(self, request, pk):
        audit = get_object_or_404(MonthlyArtistAudit, pk=pk)
        services.settle_audit(audit)
        return Response(MonthlyArtistAuditSerializer(audit).data)


class SubscriptionPricingView(generics.RetrieveUpdateAPIView):
    http_method_names = ("get", "put", "patch", "head", "options")
    permission_classes = (IsAdmin,)
    serializer_class = SubscriptionPricingSerializer

    def get_object(self):
        return SubscriptionPricing.current()


class RevenueReportView(APIView):
    permission_classes = (IsAdmin,)

    def get(self, request):
        year = int(request.query_params.get("year"))
        month = int(request.query_params.get("month"))
        report = services.get_revenue_report(year, month)
        return Response(RevenueReportSerializer(report).data)
