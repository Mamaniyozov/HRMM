from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.notifications.models import Notification, notification_attachment_upload_to
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

    def test_notification_attachment_upload_path_uses_short_basename(self):
        path = notification_attachment_upload_to(
            self.notification,
            r"b205e5e8-e0da-4017-99a3-5ec3167b9b88\Screenshot_2026-04-22_164051_3ACUclV.png",
        )
        self.assertTrue(path.startswith(f"notifications/{self.user.id}/{self.notification.id}/"))
        self.assertNotIn("\\", path)
        self.assertLessEqual(len(path), 255)

    def test_user_can_create_notification_with_screenshot(self):
        upload = SimpleUploadedFile("Screenshot_2026-04-22_164051_3ACUclV.png", b"fake-image", content_type="image/png")
        response = self.client.post(
            "/api/v1/notifications/",
            {
                "title": "Ops update",
                "message": "Server planned maintenance",
                "type": "INFO",
                "reference_type": "USER_NOTIFICATION",
                "reference_id": str(self.user.id),
                "screenshot": upload,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        created = Notification.objects.exclude(id=self.notification.id).get()
        self.assertTrue(created.screenshot.name.startswith(f"notifications/{self.user.id}/{created.id}/"))
