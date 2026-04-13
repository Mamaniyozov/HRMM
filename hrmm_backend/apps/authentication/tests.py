from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User.objects.create(
            username="authuser",
            email="authuser@example.com",
            password_hash="12345678",
            full_name="Auth User",
            role="DIRECTOR",
            is_active=True,
        )

    def test_login_returns_tokens(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "12345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

    def test_login_rejects_invalid_password(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "wrongpass"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
