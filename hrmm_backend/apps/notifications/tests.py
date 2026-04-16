from django.test import TestCase
from rest_framework.test import APIClient

from apps.notifications.models import Notification
from apps.users.models import User


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            username="notifuser",
            email="notif@example.com",
            password_hash="12345678",
            full_name="Notif User",
            role="SPECIALIST",
        )
        self.client.force_authenticate(user=self.user)
        self.notification = Notification.objects.create(
            user_id=self.user,
            title="Pending approval",
            message="A new report is waiting",
            type="APPROVAL",
        )

    def test_user_can_list_notifications(self):
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_user_can_mark_notification_as_read(self):
        response = self.client.put(f"/api/v1/notifications/{self.notification.id}/read/")
        self.notification.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.notification.is_read)
