from django.core import mail
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.departments.models import Department
from apps.reports.models import Report
from apps.users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuditLogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="Engineering", code="ENG")
        self.director = User.objects.create(
            username="director_audit",
            email="director_audit@example.com",
            password_hash="password123",
            full_name="Director Audit",
            role="DIRECTOR",
        )
        self.specialist = User.objects.create(
            username="specialist_audit",
            email="specialist_audit@example.com",
            password_hash="password123",
            full_name="Specialist Audit",
            role="SPECIALIST",
            department_id=self.department,
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def _extract_email_otp(self):
        body = mail.outbox[0].body
        import re

        match = re.search(r"\b\d{6}\b", body)
        return match.group(0) if match else None

    def test_director_can_list_audit_logs(self):
        self._auth(self.director)
        self.client.post(
            "/api/v1/departments/",
            {"name": "QA Department", "code": "QA"},
            format="json",
        )
        response = self.client.get("/api/v1/audit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_non_director_sees_empty_audit_logs(self):
        self._auth(self.specialist)
        response = self.client.get("/api/v1/audit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_audit_log_written_on_report_create(self):
        self._auth(self.specialist)
        response = self.client.post(
            "/api/v1/reports/",
            {
                "report_number": "REP-AUDIT-1",
                "title": "Audit Report",
                "summary": "Summary",
                "department_id": str(self.department.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            AuditLog.objects.filter(
                action="REPORT_CREATE", target_type="reports.Report"
            ).exists()
        )

    def test_audit_log_written_on_report_update_and_delete(self):
        report = Report.objects.create(
            report_number="REP-AUDIT-2",
            title="Audit Report",
            summary="Summary",
            department_id=self.department,
            created_by=self.specialist,
        )
        self._auth(self.specialist)
        response = self.client.put(
            f"/api/v1/reports/{report.id}/",
            {"title": "Updated Audit Report"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            AuditLog.objects.filter(
                action="REPORT_UPDATE", target_type="reports.Report"
            ).exists()
        )

        response = self.client.delete(f"/api/v1/reports/{report.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            AuditLog.objects.filter(
                action="REPORT_DELETE", target_type="reports.Report"
            ).exists()
        )

    def test_audit_log_written_on_user_create(self):
        self._auth(self.director)
        response = self.client.post(
            "/api/v1/users/create/",
            {
                "username": "new_user_audit",
                "email": "new_user_audit@example.com",
                "full_name": "New User",
                "password": "password123",
                "role": "SPECIALIST",
                "department_id": str(self.department.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            AuditLog.objects.filter(
                action="USER_CREATE", target_type="users.User"
            ).exists()
        )

    def test_audit_log_written_on_login_and_logout(self):
        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.director.username, "password": "password123"},
            format="json",
        )
        challenge_id = login_response.data["data"]["challenge_id"]
        code = self._extract_email_otp()
        self.assertIsNotNone(code)

        self.client.post(
            "/api/v1/auth/login/verify-email-otp/",
            {"challenge_id": challenge_id, "code": code},
            format="json",
        )
        self.assertTrue(
            AuditLog.objects.filter(
                action="LOGIN_EMAIL_OTP", target_type="users.User"
            ).exists()
        )

        self._auth(self.director)
        from apps.authentication.tokens import get_tokens_for_user

        tokens = get_tokens_for_user(self.director)
        self.client.post(
            "/api/v1/auth/logout/",
            {"refresh": tokens["refresh"]},
            format="json",
        )
        self.assertTrue(
            AuditLog.objects.filter(
                action="LOGOUT", target_type="users.User"
            ).exists()
        )
