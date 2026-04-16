from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.departments.models import Department
from apps.leave_management.models import LeaveRequest
from apps.leave_management.views import LeaveCalendarView, LeaveListCreateView, LeaveReviewView
from apps.users.models import User


class LeaveManagementTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.department = Department.objects.create(name="HR", code="HR")
        self.employee = User.objects.create(
            username="employee",
            email="employee@example.com",
            password_hash="password123",
            full_name="Employee User",
            role="SPECIALIST",
            department_id=self.department,
        )
        self.dept_head = User.objects.create(
            username="depthead",
            email="depthead@example.com",
            password_hash="password123",
            full_name="Dept Head",
            role="DEPT_HEAD",
            department_id=self.department,
        )
        self.leave_request = LeaveRequest.objects.create(
            requested_by=self.employee,
            leave_type="ANNUAL",
            reason="Family trip",
            start_date="2026-05-01",
            end_date="2026-05-03",
            total_days=3,
        )

    def test_department_head_can_approve_leave(self):
        request = self.factory.post(
            f"/api/v1/leaves/{self.leave_request.id}/review/",
            {"action": "APPROVE", "review_comment": "Approved"},
            format="json",
        )
        force_authenticate(request, user=self.dept_head)

        response = LeaveReviewView.as_view()(request, leave_id=self.leave_request.id)
        self.leave_request.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.leave_request.status, "APPROVED")

    def test_employee_cannot_create_overlapping_leave(self):
        request = self.factory.post(
            "/api/v1/leaves/",
            {
                "leave_type": "ANNUAL",
                "reason": "Overlap",
                "start_date": "2026-05-02",
                "end_date": "2026-05-04",
            },
            format="json",
        )
        force_authenticate(request, user=self.employee)

        response = LeaveListCreateView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_calendar_returns_approved_leaves(self):
        self.leave_request.status = "APPROVED"
        self.leave_request.save(update_fields=["status"])

        request = self.factory.get("/api/v1/leaves/calendar/")
        force_authenticate(request, user=self.dept_head)

        response = LeaveCalendarView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]), 1)
