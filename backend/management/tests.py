from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from user.models import Artist

from .models import MonthlyArtistAudit, SubscriptionPricing, SupportTicket, TicketMessage

User = get_user_model()


def create_user(email, role=User.Role.LISTENER, **extra):
    return User.objects.create_user(
        email=email,
        username=email.split("@")[0],
        password="password123",
        display_name=email.split("@")[0].title(),
        role=role,
        **extra,
    )


def create_artist(email, stage_name, **extra):
    artist = Artist(
        email=email,
        username=email.split("@")[0],
        stage_name=stage_name,
        display_name=stage_name,
        role=User.Role.ARTIST,
        **extra,
    )
    artist.set_password("password123")
    artist.save()
    return artist


class TicketApiTests(APITestCase):
    """
    Contract expected by the frontend (frontend/src/lib/api/managementService.ts):
    - POST /tickets/ -> ticket with id, user, user_name, subject, status, created_at, updated_at.
    - GET /management/tickets/ -> paginated {count, next, previous, results}, staff-only.
    - GET /management/tickets/{id}/ -> ticket + messages[] with
      id, ticket, sender, sender_name, message, created_at.
    - POST .../reply/ -> answered status, notifies the ticket owner (unless staff replies to self).
    - POST .../close/ -> closed status; further replies are rejected.
    """

    def setUp(self):
        self.listener = create_user("listener@example.com")
        self.support = create_user("support@example.com", role=User.Role.SUPPORT)
        self.admin = create_user("admin@example.com", role=User.Role.ADMIN)
        self.create_url = reverse("create-ticket")
        self.list_url = reverse("ticket-list")

    def test_create_ticket_requires_authentication(self):
        response = self.client.post(self.create_url, {"subject": "Help", "message": "hi"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listener_can_create_ticket_and_staff_get_notified(self):
        self.client.force_authenticate(self.listener)

        response = self.client.post(
            self.create_url, {"subject": "Playback issue", "message": "It skips."}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        for field in ("id", "user", "user_name", "subject", "status", "created_at", "updated_at"):
            self.assertIn(field, response.data)
        self.assertEqual(response.data["status"], "open")
        self.assertEqual(response.data["user"], self.listener.pk)

        ticket = SupportTicket.objects.get(pk=response.data["id"])
        self.assertEqual(ticket.messages.count(), 1)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.support, category="new_ticket"
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(recipient=self.admin, category="new_ticket").exists()
        )

    def test_listener_cannot_list_tickets(self):
        self.client.force_authenticate(self.listener)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_can_list_tickets_paginated(self):
        SupportTicket.objects.create(user=self.listener, subject="A")
        self.client.force_authenticate(self.support)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("count", "next", "previous", "results"):
            self.assertIn(field, response.data)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["subject"], "A")

    def test_ticket_detail_includes_messages_with_sender_name(self):
        ticket = SupportTicket.objects.create(user=self.listener, subject="Billing")
        TicketMessage.objects.create(ticket=ticket, sender=self.listener, message="Charged twice")
        self.client.force_authenticate(self.support)

        response = self.client.get(reverse("ticket-detail", kwargs={"pk": ticket.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["messages"]), 1)
        message = response.data["messages"][0]
        for field in ("id", "ticket", "sender", "sender_name", "message", "created_at"):
            self.assertIn(field, message)
        self.assertEqual(message["sender_name"], self.listener.display_name)

    def test_staff_reply_sets_answered_and_notifies_owner(self):
        ticket = SupportTicket.objects.create(user=self.listener, subject="Billing")
        self.client.force_authenticate(self.support)

        response = self.client.post(
            reverse("ticket-reply", kwargs={"pk": ticket.pk}),
            {"message": "Looking into it."},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "answered")
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.listener, category="ticket_reply"
            ).exists()
        )

    def test_reply_to_closed_ticket_is_rejected(self):
        ticket = SupportTicket.objects.create(
            user=self.listener, subject="Billing", status=SupportTicket.Status.CLOSED
        )
        self.client.force_authenticate(self.support)

        response = self.client.post(
            reverse("ticket-reply", kwargs={"pk": ticket.pk}), {"message": "Too late"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listener_cannot_reply_or_close(self):
        ticket = SupportTicket.objects.create(user=self.listener, subject="Billing")
        self.client.force_authenticate(self.listener)

        reply = self.client.post(
            reverse("ticket-reply", kwargs={"pk": ticket.pk}), {"message": "hi"}
        )
        close = self.client.post(reverse("ticket-close", kwargs={"pk": ticket.pk}))

        self.assertEqual(reply.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(close.status_code, status.HTTP_403_FORBIDDEN)

    def test_close_ticket(self):
        ticket = SupportTicket.objects.create(user=self.listener, subject="Billing")
        self.client.force_authenticate(self.support)

        response = self.client.post(reverse("ticket-close", kwargs={"pk": ticket.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "closed")


class VerificationApiTests(APITestCase):
    """
    Contract: Artist itself IS the verification request (no separate model).
    GET .../verification-requests/?status=pending filters by verification_status.
    approve()/reject() enforce the "already processed" guard and notify the artist.
    """

    def setUp(self):
        self.support = create_user("support@example.com", role=User.Role.SUPPORT)
        self.admin = create_user("admin@example.com", role=User.Role.ADMIN)
        self.pending_artist = create_artist(
            "pending@example.com",
            "Pending Artist",
            portfolio_links=["https://soundcloud.com/pending"],
        )
        self.approved_artist = create_artist(
            "approved@example.com",
            "Approved Artist",
            verification_status=Artist.VerificationStatus.APPROVED,
        )
        self.list_url = reverse("verification-request-list")

    def test_requires_staff_role(self):
        listener = create_user("listener@example.com")
        self.client.force_authenticate(listener)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_filters_by_pending_status(self):
        self.client.force_authenticate(self.support)

        response = self.client.get(self.list_url, {"status": "pending"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [item["email"] for item in response.data["results"]]
        self.assertIn(self.pending_artist.email, emails)
        self.assertNotIn(self.approved_artist.email, emails)

    def test_detail_uses_artist_pk_as_request_id(self):
        self.client.force_authenticate(self.support)

        response = self.client.get(
            reverse("verification-request-detail", kwargs={"pk": self.pending_artist.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user_id"], self.pending_artist.pk)
        self.assertEqual(response.data["stage_name"], "Pending Artist")

    def test_approve_activates_artist_and_notifies(self):
        self.assertFalse(self.pending_artist.is_active)
        self.client.force_authenticate(self.support)

        response = self.client.post(
            reverse("verification-request-approve", kwargs={"pk": self.pending_artist.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_artist.refresh_from_db()
        self.assertEqual(self.pending_artist.verification_status, Artist.VerificationStatus.APPROVED)
        self.assertTrue(self.pending_artist.is_active)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.pending_artist, category="account_approval"
            ).exists()
        )

    def test_approve_already_processed_returns_400(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            reverse("verification-request-approve", kwargs={"pk": self.approved_artist.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_requires_reason(self):
        self.client.force_authenticate(self.support)

        response = self.client.post(
            reverse("verification-request-reject", kwargs={"pk": self.pending_artist.pk}), {}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_sets_reason_and_notifies(self):
        self.client.force_authenticate(self.support)

        response = self.client.post(
            reverse("verification-request-reject", kwargs={"pk": self.pending_artist.pk}),
            {"reason": "Links are not verifiable."},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_artist.refresh_from_db()
        self.assertEqual(self.pending_artist.verification_status, Artist.VerificationStatus.REJECTED)
        self.assertEqual(self.pending_artist.rejection_reason, "Links are not verifiable.")
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.pending_artist, category="account_rejection"
            ).exists()
        )


class MonthlyAuditApiTests(APITestCase):
    def setUp(self):
        self.support = create_user("support@example.com", role=User.Role.SUPPORT)
        self.admin = create_user("admin@example.com", role=User.Role.ADMIN)
        self.artist = create_artist(
            "artist@example.com", "Artist One", verification_status=Artist.VerificationStatus.APPROVED
        )
        self.audit = MonthlyArtistAudit.objects.create(
            artist=self.artist,
            period_year=2026,
            period_month=7,
            unique_listeners_count=100,
            total_streams_count=500,
            payout_amount="42.50",
        )
        self.list_url = reverse("audit-list")

    def test_list_filters_by_year_and_month(self):
        MonthlyArtistAudit.objects.create(
            artist=self.artist, period_year=2026, period_month=6
        )
        self.client.force_authenticate(self.support)

        response = self.client.get(self.list_url, {"year": 2026, "month": 7})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        item = response.data["results"][0]
        for field in (
            "id",
            "artist_id",
            "artist_name",
            "period_year",
            "period_month",
            "unique_listeners_count",
            "total_streams_count",
            "payout_amount",
            "payment_status",
        ):
            self.assertIn(field, item)
        self.assertEqual(item["artist_id"], self.artist.pk)

    def test_support_can_view_but_not_settle(self):
        self.client.force_authenticate(self.support)

        response = self.client.post(reverse("audit-settle", kwargs={"pk": self.audit.pk}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_settle_and_artist_is_notified(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(reverse("audit-settle", kwargs={"pk": self.audit.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.audit.refresh_from_db()
        self.assertEqual(self.audit.payment_status, MonthlyArtistAudit.PaymentStatus.SETTLED)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.artist, category="monthly_payout"
            ).exists()
        )

    def test_settling_twice_fails(self):
        self.client.force_authenticate(self.admin)
        self.client.post(reverse("audit-settle", kwargs={"pk": self.audit.pk}))

        response = self.client.post(reverse("audit-settle", kwargs={"pk": self.audit.pk}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SubscriptionPricingApiTests(APITestCase):
    def setUp(self):
        self.admin = create_user("admin@example.com", role=User.Role.ADMIN)
        self.support = create_user("support@example.com", role=User.Role.SUPPORT)
        self.url = reverse("subscription-pricing")

    def test_get_pricing_creates_default_singleton(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(SubscriptionPricing.objects.count(), 1)
        for field in ("silver_price", "gold_price", "updated_at"):
            self.assertIn(field, response.data)

    def test_support_cannot_view_or_update_pricing(self):
        self.client.force_authenticate(self.support)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_pricing(self):
        self.client.force_authenticate(self.admin)

        response = self.client.put(self.url, {"silver_price": "12.50", "gold_price": "24.99"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pricing = SubscriptionPricing.current()
        self.assertEqual(str(pricing.silver_price), "12.50")
        self.assertEqual(str(pricing.gold_price), "24.99")

    def test_update_rejects_non_positive_prices(self):
        self.client.force_authenticate(self.admin)

        response = self.client.put(self.url, {"silver_price": "0", "gold_price": "10"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RevenueReportApiTests(APITestCase):
    def setUp(self):
        self.admin = create_user("admin@example.com", role=User.Role.ADMIN)
        create_user("basic@example.com", subscription_tier=User.SubscriptionTier.BASIC)
        create_user("silver@example.com", subscription_tier=User.SubscriptionTier.SILVER)
        create_user("gold1@example.com", subscription_tier=User.SubscriptionTier.GOLD)
        create_user("gold2@example.com", subscription_tier=User.SubscriptionTier.GOLD)
        SubscriptionPricing.objects.create(pk=1, silver_price="10.00", gold_price="20.00")
        self.url = reverse("revenue-report")

    def test_computes_total_revenue_and_distribution(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url, {"year": 2026, "month": 7})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 1 silver * 10.00 + 2 gold * 20.00 = 50.00
        self.assertEqual(str(response.data["total_subscription_revenue"]), "50.00")
        distribution = {row["tier"]: row for row in response.data["subscription_distribution"]}
        self.assertEqual(distribution["basic"]["user_count"], 1)
        self.assertEqual(distribution["silver"]["user_count"], 1)
        self.assertEqual(distribution["gold"]["user_count"], 2)

    def test_non_admin_forbidden(self):
        support = create_user("support@example.com", role=User.Role.SUPPORT)
        self.client.force_authenticate(support)

        response = self.client.get(self.url, {"year": 2026, "month": 7})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
