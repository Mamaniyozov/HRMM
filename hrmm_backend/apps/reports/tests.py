from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.departments.models import Department
from apps.reports.models import Report, ReportAttachment
from apps.reports.views import ReportAttachmentListCreateView, ReportHistoryView, ReportListCreateView
from apps.workflows.models import ApprovalHistory
from apps.users.models import User


@override_settings(MEDIA_ROOT="C:/Users/maman/Documents/HRMM/hrmm_backend/test_media")
class ReportAttachmentUploadTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.department = Department.objects.create(name="IT", code="IT")
        self.user = User.objects.create(
            username="reporter",
            email="reporter@example.com",
            password_hash="password123",
            full_name="Reporter User",
            role="SPECIALIST",
            department_id=self.department,
        )
        self.report = Report.objects.create(
            report_number="REP-UP-1",
            title="Upload report",
            summary="summary",
            department_id=self.department,
            created_by=self.user,
        )

    def test_owner_can_upload_attachment(self):
        uploaded = SimpleUploadedFile("test.txt", b"hello hrmm", content_type="text/plain")
        request = self.factory.post(
            f"/api/v1/reports/{self.report.id}/attachments/",
            {"file": uploaded},
            format="multipart",
        )
        force_authenticate(request, user=self.user)

        response = ReportAttachmentListCreateView.as_view()(request, report_id=self.report.id)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ReportAttachment.objects.count(), 1)
        attachment = ReportAttachment.objects.first()
        self.assertEqual(attachment.file_name, "test.txt")
        self.assertTrue(bool(attachment.checksum))

    def test_cannot_upload_attachment_to_submitted_report(self):
        self.report.status = "PENDING_L2"
        self.report.save(update_fields=["status"])
        uploaded = SimpleUploadedFile("test.txt", b"hello hrmm", content_type="text/plain")
        request = self.factory.post(
            f"/api/v1/reports/{self.report.id}/attachments/",
            {"file": uploaded},
            format="multipart",
        )
        force_authenticate(request, user=self.user)

        response = ReportAttachmentListCreateView.as_view()(request, report_id=self.report.id)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_director_cannot_create_report_for_other_department(self):
        other_department = Department.objects.create(name="Finance", code="FIN")
        request = self.factory.post(
            "/api/v1/reports/",
            {
                "report_number": "REP-UP-2",
                "title": "Other dept report",
                "summary": "summary",
                "department_id": str(other_department.id),
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        response = ReportListCreateView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_update_report_in_draft(self):
        request = self.factory.put(
            f"/api/v1/reports/{self.report.id}/",
            {"title": "Updated title"},
            format="json",
        )
        force_authenticate(request, user=self.user)

        from apps.reports.views import ReportDetailView

        response = ReportDetailView.as_view()(request, report_id=self.report.id)
        self.report.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.report.title, "Updated title")

    def test_owner_can_soft_delete_report(self):
        request = self.factory.delete(f"/api/v1/reports/{self.report.id}/")
        force_authenticate(request, user=self.user)

        from apps.reports.views import ReportDetailView

        response = ReportDetailView.as_view()(request, report_id=self.report.id)
        self.report.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.report.is_deleted)

    def test_history_endpoint_returns_approval_history(self):
        ApprovalHistory.objects.create(
            report_id=self.report,
            approver_id=self.user,
            approval_level=1,
            action="SUBMIT",
            comment="sent",
            previous_status="DRAFT",
            new_status="PENDING_L2",
        )
        request = self.factory.get(f"/api/v1/reports/{self.report.id}/history/")
        force_authenticate(request, user=self.user)

        response = ReportHistoryView.as_view()(request, report_id=self.report.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]), 1)
