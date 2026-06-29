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

    def test_director_can_self_approve_own_report_to_final_approval(self):
        request = self.factory.post("/api/v1/reports/")
        report = Report.objects.create(
            report_number="REP-002",
            title="Director Report",
            summary="Summary",
            created_by=self.director,
            department_id=self.department,
            status="PENDING_L2",
            current_approval_level=2,
        )

        perform_workflow_action(report, self.director, "APPROVE", "director self approve", request)
        report.refresh_from_db()
        self.assertEqual(report.status, "APPROVED")

    def test_department_head_can_self_approve_own_report_to_director_step(self):
        request = self.factory.post("/api/v1/reports/")
        report = Report.objects.create(
            report_number="REP-003",
            title="Dept Head Report",
            summary="Summary",
            created_by=self.dept_head,
            department_id=self.department,
            status="PENDING_L2",
            current_approval_level=2,
        )

        perform_workflow_action(report, self.dept_head, "APPROVE", "dept self approve", request)
        report.refresh_from_db()
        self.assertEqual(report.status, "PENDING_L4")

    def test_unit_head_cannot_approve_other_unit_report(self):
        request = self.factory.post("/api/v1/reports/")
        other_unit = Unit.objects.create(name="Frontend", code="FE", department_id=self.department)
        other_unit_head = User.objects.create(
            username="other_unit_head",
            email="other_unit_head@example.com",
            password_hash="password123",
            full_name="Other Unit Head",
            role="UNIT_HEAD",
            department_id=self.department,
            unit_id=other_unit,
        )
        report = Report.objects.create(
            report_number="REP-004",
            title="Other Unit Report",
            summary="Summary",
            created_by=self.specialist,
            department_id=self.department,
            status="PENDING_L2",
            current_approval_level=2,
        )
        with self.assertRaises(PermissionDenied):
            perform_workflow_action(report, other_unit_head, "APPROVE", "cross-unit", request)

    def test_dept_head_cannot_approve_other_department_report(self):
        request = self.factory.post("/api/v1/reports/")
        other_dept = Department.objects.create(name="Frontend", code="FE")
        other_dept_head = User.objects.create(
            username="other_dept_head",
            email="other_dept_head@example.com",
            password_hash="password123",
            full_name="Other Dept Head",
            role="DEPT_HEAD",
            department_id=other_dept,
        )
        report = Report.objects.create(
            report_number="REP-005",
            title="Other Dept Report",
            summary="Summary",
            created_by=self.specialist,
            department_id=self.department,
            status="PENDING_L3",
            current_approval_level=3,
        )
        with self.assertRaises(PermissionDenied):
            perform_workflow_action(report, other_dept_head, "APPROVE", "cross-dept", request)

    def test_specialist_cannot_approve_any_report(self):
        request = self.factory.post("/api/v1/reports/")
        report = Report.objects.create(
            report_number="REP-006",
            title="Test Report",
            summary="Summary",
            created_by=self.dept_head,
            department_id=self.department,
            status="PENDING_L2",
            current_approval_level=2,
        )
        with self.assertRaises(PermissionDenied):
            perform_workflow_action(report, self.specialist, "APPROVE", "specialist approve", request)
