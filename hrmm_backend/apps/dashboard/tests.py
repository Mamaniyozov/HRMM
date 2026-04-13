from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dashboard.views import DashboardStatsView
from apps.departments.models import Department
from apps.leave_management.models import LeaveRequest
from apps.reports.models import Report
from apps.users.models import User


class DashboardStatsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.department = Department.objects.create(name="Ops", code="OPS")
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
