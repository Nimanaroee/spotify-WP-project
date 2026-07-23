from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification
from .services import notify_staff, notify_user

User = get_user_model()


class NotificationApiTests(APITestCase):
    """
    Contract expected by the frontend (frontend/src/lib/api/notificationService.ts):
    - list is a *plain array* (pagination disabled), each item has
      id, category, title, message, link, is_read, created_at.
    - only the requesting user's own notifications are ever returned.
    - mark-read / mark-all-read / delete are scoped to the current user.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="listener@example.com",
            username="listener",
            password="password123",
            display_name="Listener One",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            username="other",
            password="password123",
            display_name="Other User",
        )
        self.list_url = reverse("notification-list")

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_plain_array_of_own_notifications_only(self):
        notify_user(self.user, category="new_ticket", title="Mine", message="hi")
        notify_user(self.other_user, category="new_ticket", title="Not mine", message="hi")

        self.client.force_authenticate(self.user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

        item = response.data[0]
        for field in ("id", "category", "title", "message", "link", "is_read", "created_at"):
            self.assertIn(field, item)
        self.assertEqual(item["title"], "Mine")
        self.assertFalse(item["is_read"])

    def test_notify_staff_only_reaches_support_and_admin_roles(self):
        support = User.objects.create_user(
            email="support@example.com",
            username="support",
            password="password123",
            display_name="Support One",
            role=User.Role.SUPPORT,
        )
        admin = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="password123",
            display_name="Admin One",
            role=User.Role.ADMIN,
        )

        notify_staff(category="new_ticket", title="Ping staff", message="")

        self.assertTrue(Notification.objects.filter(recipient=support).exists())
        self.assertTrue(Notification.objects.filter(recipient=admin).exists())
        self.assertFalse(Notification.objects.filter(recipient=self.user).exists())

    def test_mark_notification_as_read(self):
        notification = notify_user(self.user, category="new_ticket", title="Mine", message="")
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("notification-mark-read", kwargs={"pk": notification.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_cannot_mark_another_users_notification_as_read(self):
        notification = notify_user(self.other_user, category="new_ticket", title="Not mine", message="")
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("notification-mark-read", kwargs={"pk": notification.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        notification.refresh_from_db()
        self.assertFalse(notification.is_read)

    def test_mark_all_read_only_affects_own_unread_notifications(self):
        mine_unread = notify_user(self.user, category="new_ticket", title="A", message="")
        mine_read = notify_user(self.user, category="new_ticket", title="B", message="")
        mine_read.is_read = True
        mine_read.save(update_fields=("is_read",))
        others = notify_user(self.other_user, category="new_ticket", title="C", message="")

        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("notification-mark-all-read"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        mine_unread.refresh_from_db()
        others.refresh_from_db()
        self.assertTrue(mine_unread.is_read)
        self.assertFalse(others.is_read)

    def test_delete_notification(self):
        notification = notify_user(self.user, category="new_ticket", title="Mine", message="")
        self.client.force_authenticate(self.user)

        response = self.client.delete(
            reverse("notification-delete", kwargs={"pk": notification.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=notification.pk).exists())

    def test_cannot_delete_another_users_notification(self):
        notification = notify_user(self.other_user, category="new_ticket", title="Not mine", message="")
        self.client.force_authenticate(self.user)

        response = self.client.delete(
            reverse("notification-delete", kwargs={"pk": notification.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Notification.objects.filter(pk=notification.pk).exists())
