from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dashboard.views import (
    DashboardAdminView,
    DashboardAnalyticsView,
    DashboardOperationsView,
    DashboardStatsView,
)
from apps.departments.models import Department
from apps.leave_management.models import LeaveRequest
from apps.notifications.models import Notification
from apps.reports.models import Report
from apps.users.models import User


class DashboardStatsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        unique_code = f"OPS{uuid4().hex[:8].upper()}"
        self.department = Department.objects.create(name="Ops", code=unique_code)
        self.director = User.objects.create(
            username="directorstats",
            email="directorstats@example.com",
            password_hash="password123",
            full_name="Director Stats",
            role="DIRECTOR",
        )
        self.employee = User.objects.create(
            username="employee2",
            email="employee2@example.com",
            password_hash="password123",
            full_name="Employee Two",
            role="SPECIALIST",
            department_id=self.department,
        )
        Report.objects.create(
            report_number="REP-STAT-1",
            title="Stats report",
            summary="summary",
            department_id=self.department,
            created_by=self.employee,
            status="APPROVED",
        )
        LeaveRequest.objects.create(
            requested_by=self.employee,
            leave_type="ANNUAL",
            reason="Rest",
            start_date="2026-06-01",
            end_date="2026-06-02",
            total_days=2,
            status="PENDING",
        )

    def test_dashboard_stats_returns_aggregates(self):
        request = self.factory.get("/api/v1/dashboard/stats/")
        force_authenticate(request, user=self.director)

        response = DashboardStatsView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reports"]["approved_reports"], 1)
        self.assertEqual(response.data["leaves"]["pending_leave_requests"], 1)

    def test_dashboard_admin_returns_management_summary(self):
        request = self.factory.get("/api/v1/dashboard/admin/")
        force_authenticate(request, user=self.director)

        response = DashboardAdminView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("employees", response.data)
        self.assertIn("pending_approvals", response.data)

    def test_dashboard_admin_returns_only_actionable_report_approvals(self):
        dept_head = User.objects.create(
            username="deptheadstats",
            email="deptheadstats@example.com",
            password_hash="password123",
            full_name="Dept Head Stats",
            role="DEPT_HEAD",
            department_id=self.department,
        )
        for number, status in [
            ("REP-PENDING-2", "PENDING_L2"),
            ("REP-PENDING-3", "PENDING_L3"),
            ("REP-PENDING-4", "PENDING_L4"),
        ]:
            Report.objects.create(
                report_number=number,
                title=number,
                summary="summary",
                department_id=self.department,
                created_by=self.employee,
                status=status,
            )

        request = self.factory.get("/api/v1/dashboard/admin/")
        force_authenticate(request, user=dept_head)

        response = DashboardAdminView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        pending_numbers = {
            item["report_number"]
            for item in response.data["pending_approvals"]
            if item["item_type"] == "report"
        }
        self.assertEqual(pending_numbers, {"REP-PENDING-2", "REP-PENDING-3"})

    def test_dashboard_analytics_returns_department_comparison(self):
        request = self.factory.get("/api/v1/dashboard/analytics/")
        force_authenticate(request, user=self.director)

        response = DashboardAnalyticsView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("department_comparison", response.data)

    def test_dashboard_operations_returns_department_breakdown(self):
        Notification.objects.create(
            user_id=self.director,
            submitted_by=self.employee,
            title="Feature",
            message="Need export",
            type="INFO",
            reference_type="FEATURE_REQUEST",
            status="PENDING",
        )
        request = self.factory.get("/api/v1/dashboard/operations/")
        force_authenticate(request, user=self.director)

        response = DashboardOperationsView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("overall", response.data)
        self.assertIn("departments", response.data)
        self.assertGreaterEqual(len(response.data["departments"]), 1)
        row = response.data["departments"][0]
        self.assertIn("leaves", row)
        self.assertIn("reports", row)
        self.assertIn("notifications", row)
        self.assertIn("feature_requests", row)
