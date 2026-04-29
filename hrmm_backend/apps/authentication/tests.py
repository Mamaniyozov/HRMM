from django.test import TestCase, override_settings
from django.core import mail
from rest_framework.test import APIClient

from apps.users.models import User
from apps.authentication.tokens import get_tokens_for_user
from apps.authentication.two_factor import generate_totp_secret, get_totp


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
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

    def test_login_returns_email_otp_challenge(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "12345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["verification_method"], "email")
        self.assertIn("challenge_id", response.data["data"])
        self.assertEqual(len(mail.outbox), 1)

    def test_login_requires_two_factor_when_enabled(self):
        user = User.objects.get(username="authuser")
        user.email = ""
        user.totp_secret = generate_totp_secret()
        user.two_factor_enabled = True
        user.save(update_fields=["email", "totp_secret", "two_factor_enabled", "updated_at"])

        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "12345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["data"]["requires_two_factor"])
        self.assertIn("challenge_token", response.data["data"])
        self.assertNotIn("access", response.data["data"])

    def test_verify_two_factor_login_returns_tokens(self):
        user = User.objects.get(username="authuser")
        user.email = ""
        user.totp_secret = generate_totp_secret()
        user.two_factor_enabled = True
        user.save(update_fields=["email", "totp_secret", "two_factor_enabled", "updated_at"])

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "12345678"},
            format="json",
        )
        verify_response = self.client.post(
            "/api/v1/auth/login/verify-2fa/",
            {
                "challenge_token": login_response.data["data"]["challenge_token"],
                "code": get_totp(user.totp_secret),
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertIn("access", verify_response.data["data"])

    def test_verify_email_otp_returns_tokens(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "12345678"},
            format="json",
        )
        body = mail.outbox[0].body
        code = next((part.strip() for part in body.splitlines() if part.strip().isdigit() and len(part.strip()) == 6), None)

        verify_response = self.client.post(
            "/api/v1/auth/login/verify-email-otp/",
            {
                "challenge_id": response.data["data"]["challenge_id"],
                "code": code,
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertIn("access", verify_response.data["data"])

    def test_authenticated_user_can_enable_two_factor(self):
        user = User.objects.get(username="authuser")
        self.client.force_authenticate(user=user)

        setup_response = self.client.post("/api/v1/auth/two-factor/setup/", {}, format="json")
        user.refresh_from_db()

        verify_response = self.client.post(
            "/api/v1/auth/two-factor/verify/",
            {"code": get_totp(user.totp_secret)},
            format="json",
        )
        user.refresh_from_db()

        self.assertEqual(setup_response.status_code, 200)
        self.assertTrue(setup_response.data["data"]["secret"])
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(user.two_factor_enabled)

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
