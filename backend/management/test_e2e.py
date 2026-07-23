"""
End-to-end tests that walk full multi-step flows across the management,
notifications and user apps the way a real client (the frontend) would:
one authenticated session issuing a sequence of requests, asserting on
state changes and side effects (notifications) at each step.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from user.models import Artist

from .models import MonthlyArtistAudit, SupportTicket

User = get_user_model()


class SupportTicketLifecycleE2ETests(APITestCase):
    def setUp(self):
        self.listener = User.objects.create_user(
            email="listener@example.com",
            username="listener",
            password="password123",
            display_name="Layla Listener",
        )
        self.support = User.objects.create_user(
            email="support@example.com",
            username="support",
            password="password123",
            display_name="Sara Support",
            role=User.Role.SUPPORT,
        )

    def test_ticket_created_answered_then_closed(self):
        # 1. Listener opens a ticket.
        self.client.force_authenticate(self.listener)
        create_response = self.client.post(
            reverse("create-ticket"),
            {"subject": "App crashes on startup", "message": "Happens every time."},
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        ticket_id = create_response.data["id"]

        self.assertTrue(
            Notification.objects.filter(recipient=self.support, category="new_ticket").exists()
        )

        # A listener has no staff access to the management queue.
        listener_list = self.client.get(reverse("ticket-list"))
        self.assertEqual(listener_list.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Support sees the ticket in the queue.
        self.client.force_authenticate(self.support)
        queue_response = self.client.get(reverse("ticket-list"))
        self.assertEqual(queue_response.status_code, status.HTTP_200_OK)
        self.assertEqual(queue_response.data["count"], 1)
        self.assertEqual(queue_response.data["results"][0]["status"], "open")

        # 3. Support replies -> ticket becomes "answered", listener is notified.
        reply_response = self.client.post(
            reverse("ticket-reply", kwargs={"pk": ticket_id}),
            {"message": "Please try clearing the app cache."},
        )
        self.assertEqual(reply_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reply_response.data["status"], "answered")
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.listener, category="ticket_reply"
            ).exists()
        )

        # 4. Listener reads the full thread.
        self.client.force_authenticate(self.listener)
        # Listener can't hit the staff detail endpoint (staff-only by design);
        # confirm the underlying data is what the reply produced instead.
        ticket = SupportTicket.objects.get(pk=ticket_id)
        self.assertEqual(ticket.messages.count(), 2)

        # 5. Support closes the ticket.
        self.client.force_authenticate(self.support)
        close_response = self.client.post(reverse("ticket-close", kwargs={"pk": ticket_id}))
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)
        self.assertEqual(close_response.data["status"], "closed")

        # 6. No further replies are accepted once closed.
        reopened_reply = self.client.post(
            reverse("ticket-reply", kwargs={"pk": ticket_id}), {"message": "one more thing"}
        )
        self.assertEqual(reopened_reply.status_code, status.HTTP_400_BAD_REQUEST)


class ArtistOnboardingToPayoutE2ETests(APITestCase):
    def setUp(self):
        self.support = User.objects.create_user(
            email="support@example.com",
            username="support",
            password="password123",
            display_name="Sara Support",
            role=User.Role.SUPPORT,
        )
        self.admin = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="password123",
            display_name="Amir Admin",
            role=User.Role.ADMIN,
        )

    def test_registration_through_approval_to_settled_payout(self):
        # 1. Artist self-registers -> starts pending & inactive, staff notified.
        register_response = self.client.post(
            reverse("register-artist"),
            {
                "email": "newartist@example.com",
                "password": "StrongPass123!",
                "password_confirmation": "StrongPass123!",
                "stage_name": "New Wave",
                "portfolio_links": ["https://soundcloud.com/newwave"],
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        artist = Artist.objects.get(email="newartist@example.com")
        self.assertEqual(artist.verification_status, Artist.VerificationStatus.PENDING)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.support, category="artist_verification_request"
            ).exists()
        )

        # 2. Support reviews the pending queue and approves.
        self.client.force_authenticate(self.support)
        pending_list = self.client.get(
            reverse("verification-request-list"), {"status": "pending"}
        )
        self.assertEqual(pending_list.status_code, status.HTTP_200_OK)
        self.assertIn(artist.email, [row["email"] for row in pending_list.data["results"]])

        approve_response = self.client.post(
            reverse("verification-request-approve", kwargs={"pk": artist.pk})
        )
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        artist.refresh_from_db()
        self.assertEqual(artist.verification_status, Artist.VerificationStatus.APPROVED)
        self.assertTrue(artist.is_active)
        self.assertTrue(
            Notification.objects.filter(
                recipient=artist, category="account_approval"
            ).exists()
        )

        # 3. A month later, an admin records the artist's monthly audit and settles it.
        audit = MonthlyArtistAudit.objects.create(
            artist=artist,
            period_year=2026,
            period_month=7,
            unique_listeners_count=5000,
            total_streams_count=21000,
            payout_amount="310.00",
        )

        self.client.force_authenticate(self.admin)
        audit_list = self.client.get(reverse("audit-list"), {"year": 2026, "month": 7})
        self.assertEqual(audit_list.data["count"], 1)
        self.assertEqual(audit_list.data["results"][0]["payment_status"], "pending")

        settle_response = self.client.post(reverse("audit-settle", kwargs={"pk": audit.pk}))
        self.assertEqual(settle_response.status_code, status.HTTP_200_OK)
        self.assertEqual(settle_response.data["payment_status"], "settled")
        self.assertTrue(
            Notification.objects.filter(
                recipient=artist, category="monthly_payout"
            ).exists()
        )

        # 4. The artist can now see their payout notification via the notifications API.
        self.client.force_authenticate(artist)
        notifications_response = self.client.get(reverse("notification-list"))
        self.assertEqual(notifications_response.status_code, status.HTTP_200_OK)
        categories = [n["category"] for n in notifications_response.data]
        self.assertIn("account_approval", categories)
        self.assertIn("monthly_payout", categories)

    def test_rejected_artist_is_notified_and_can_be_seen_in_full_history(self):
        register_response = self.client.post(
            reverse("register-artist"),
            {
                "email": "rejectme@example.com",
                "password": "StrongPass123!",
                "password_confirmation": "StrongPass123!",
                "stage_name": "Reject Me",
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        artist = Artist.objects.get(email="rejectme@example.com")

        self.client.force_authenticate(self.admin)
        reject_response = self.client.post(
            reverse("verification-request-reject", kwargs={"pk": artist.pk}),
            {"reason": "Could not verify original ownership of submitted tracks."},
        )
        self.assertEqual(reject_response.status_code, status.HTTP_200_OK)

        artist.refresh_from_db()
        self.assertEqual(artist.verification_status, Artist.VerificationStatus.REJECTED)
        self.assertFalse(artist.is_active)

        full_history = self.client.get(reverse("verification-request-list"))
        emails = [row["email"] for row in full_history.data["results"]]
        self.assertIn(artist.email, emails)

        self.assertTrue(
            Notification.objects.filter(
                recipient=artist, category="account_rejection"
            ).exists()
        )
