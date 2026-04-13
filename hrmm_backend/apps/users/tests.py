from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


class UserDeleteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.director = User.objects.create(
            username="director_delete",
            email="director_delete@example.com",
            password_hash="12345678",
            full_name="Director Delete",
            role="DIRECTOR",
            is_active=True,
        )
        self.target_user = User.objects.create(
            username="target_user",
            email="target_user@example.com",
            password_hash="12345678",
            full_name="Target User",
            role="SPECIALIST",
            is_active=True,
        )
        self.client.force_authenticate(user=self.director)

    def test_director_can_soft_delete_user(self):
        response = self.client.delete(f"/api/v1/users/{self.target_user.id}/delete/")
        self.target_user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.target_user.is_active)

    def test_director_cannot_delete_self(self):
        response = self.client.delete(f"/api/v1/users/{self.director.id}/delete/")

        self.assertEqual(response.status_code, 400)
