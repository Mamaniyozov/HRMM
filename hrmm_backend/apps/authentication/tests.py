from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.authentication.tokens import get_tokens_for_user


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

    def test_me_returns_current_user_profile(self):
        user = User.objects.get(username="authuser")
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["username"], "authuser")

    def test_password_change_updates_password_hash(self):
        user = User.objects.get(username="authuser")
        self.client.force_authenticate(user=user)

        response = self.client.put(
            "/api/v1/auth/password/",
            {"current_password": "12345678", "new_password": "newpass123"},
            format="json",
        )

        user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.password_hash.startswith("pbkdf2_"))

    def test_logout_blacklists_refresh_token(self):
        user = User.objects.get(username="authuser")
        self.client.force_authenticate(user=user)
        tokens = get_tokens_for_user(user)

        response = self.client.post(
            "/api/v1/auth/logout/",
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
