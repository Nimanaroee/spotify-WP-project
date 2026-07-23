from django.urls import path

from .views import (
    CreateTicketView,
    MonthlyAuditListView,
    MonthlyAuditSettleView,
    RevenueReportView,
    SubscriptionPricingView,
    TicketCloseView,
    TicketDetailView,
    TicketListView,
    TicketReplyView,
    VerificationApproveView,
    VerificationRejectView,
    VerificationRequestDetailView,
    VerificationRequestListView,
)

urlpatterns = [
    path("tickets/", CreateTicketView.as_view(), name="create-ticket"),
    path("management/tickets/", TicketListView.as_view(), name="ticket-list"),
    path("management/tickets/<int:pk>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("management/tickets/<int:pk>/reply/", TicketReplyView.as_view(), name="ticket-reply"),
    path("management/tickets/<int:pk>/close/", TicketCloseView.as_view(), name="ticket-close"),
    path(
        "management/verification-requests/",
        VerificationRequestListView.as_view(),
        name="verification-request-list",
    ),
    path(
        "management/verification-requests/<int:pk>/",
        VerificationRequestDetailView.as_view(),
        name="verification-request-detail",
    ),
    path(
        "management/verification-requests/<int:pk>/approve/",
        VerificationApproveView.as_view(),
        name="verification-request-approve",
    ),
    path(
        "management/verification-requests/<int:pk>/reject/",
        VerificationRejectView.as_view(),
        name="verification-request-reject",
    ),
    path("management/audits/", MonthlyAuditListView.as_view(), name="audit-list"),
    path(
        "management/audits/<int:pk>/settle/",
        MonthlyAuditSettleView.as_view(),
        name="audit-settle",
    ),
    path(
        "management/subscription-pricing/",
        SubscriptionPricingView.as_view(),
        name="subscription-pricing",
    ),
    path(
        "management/revenue-report/",
        RevenueReportView.as_view(),
        name="revenue-report",
    ),
]
