from django.test import RequestFactory, TestCase
from rest_framework.exceptions import PermissionDenied

from apps.departments.models import Department
from apps.reports.models import Report
from apps.units.models import Unit
from apps.users.models import User
from apps.workflows.services import perform_workflow_action


class WorkflowServiceTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.department = Department.objects.create(name="Backend", code="BE")
        self.unit = Unit.objects.create(name="API", code="API", department_id=self.department)

        self.specialist = User.objects.create(
            username="specialist",
            email="specialist@example.com",
            password_hash="password123",
            full_name="Spec User",
            role="SPECIALIST",
            department_id=self.department,
            unit_id=self.unit,
        )
        self.unit_head = User.objects.create(
            username="unit_head",
            email="unit_head@example.com",
            password_hash="password123",
            full_name="Unit Head",
            role="UNIT_HEAD",
            department_id=self.department,
            unit_id=self.unit,
        )
        self.dept_head = User.objects.create(
            username="dept_head",
            email="dept_head@example.com",
            password_hash="password123",
            full_name="Dept Head",
            role="DEPT_HEAD",
            department_id=self.department,
        )
        self.director = User.objects.create(
            username="director",
            email="director@example.com",
            password_hash="password123",
            full_name="Director",
            role="DIRECTOR",
        )
        self.report = Report.objects.create(
            report_number="REP-001",
            title="Weekly Report",
            summary="Summary",
            created_by=self.specialist,
            department_id=self.department,
        )

    def test_full_approval_flow(self):
        request = self.factory.post("/api/v1/reports/")

        perform_workflow_action(self.report, self.specialist, "SUBMIT", "submit", request)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "PENDING_L2")

        perform_workflow_action(self.report, self.unit_head, "APPROVE", "unit ok", request)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "PENDING_L3")

        perform_workflow_action(self.report, self.dept_head, "APPROVE", "dept ok", request)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "PENDING_L4")

        perform_workflow_action(self.report, self.director, "APPROVE", "director ok", request)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "APPROVED")

    def test_report_owner_cannot_self_approve(self):
        request = self.factory.post("/api/v1/reports/")
        perform_workflow_action(self.report, self.specialist, "SUBMIT", "submit", request)

        with self.assertRaises(PermissionDenied):
            perform_workflow_action(self.report, self.specialist, "APPROVE", "self approve", request)
