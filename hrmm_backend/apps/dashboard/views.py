from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.departments.models import Department
from apps.leave_management.models import LeaveRequest
from apps.reports.models import Report
from apps.reports.views import IsAuthenticatedHRMM
from apps.users.models import User


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get_reports_queryset(self, user):
        queryset = Report.objects.all()
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id:
            return queryset.filter(department_id=user.department_id)
        if user.role == "UNIT_HEAD" and user.unit_id:
            return queryset.filter(created_by__unit_id=user.unit_id)
        return queryset.filter(created_by=user)

    def get_leaves_queryset(self, user):
        queryset = LeaveRequest.objects.all()
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id:
            return queryset.filter(requested_by__department_id=user.department_id)
        return queryset.filter(requested_by=user)

    def get(self, request):
        reports = self.get_reports_queryset(request.user)
        leaves = self.get_leaves_queryset(request.user)

        report_stats = reports.aggregate(
            total_reports=Count("id"),
            draft_reports=Count("id", filter=Q(status="DRAFT")),
            pending_reports=Count("id", filter=Q(status__in=["PENDING_L2", "PENDING_L3", "PENDING_L4"])),
            approved_reports=Count("id", filter=Q(status="APPROVED")),
            rejected_reports=Count("id", filter=Q(status="REJECTED")),
            revision_reports=Count("id", filter=Q(status="REVISION")),
            archived_reports=Count("id", filter=Q(status="ARCHIVED")),
        )
        leave_stats = leaves.aggregate(
            total_leave_requests=Count("id"),
            pending_leave_requests=Count("id", filter=Q(status="PENDING")),
            approved_leave_requests=Count("id", filter=Q(status="APPROVED")),
            rejected_leave_requests=Count("id", filter=Q(status="REJECTED")),
            cancelled_leave_requests=Count("id", filter=Q(status="CANCELLED")),
        )

        recent_reports = list(
            reports.select_related("created_by")
            .order_by("-created_at")
            .values("id", "report_number", "title", "status", "created_by__full_name")[:5]
        )
        recent_leaves = list(
            leaves.select_related("requested_by")
            .order_by("-created_at")
            .values("id", "leave_type", "status", "requested_by__full_name", "start_date", "end_date")[:5]
        )

        return Response(
            {
                "reports": report_stats,
                "leaves": leave_stats,
                "recent_reports": recent_reports,
                "recent_leaves": recent_leaves,
            }
        )


class DashboardAdminView(DashboardStatsView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        if request.user.role not in {"UNIT_HEAD", "DEPT_HEAD", "DIRECTOR"}:
            return Response({"detail": "Admin dashboard uchun vakolat yetarli emas."}, status=403)

        reports = self.get_reports_queryset(request.user)
        leaves = self.get_leaves_queryset(request.user)

        if request.user.role == "UNIT_HEAD":
            employees = User.objects.filter(unit_id=request.user.unit_id, is_active=True)
        elif request.user.role == "DEPT_HEAD":
            employees = User.objects.filter(department_id=request.user.department_id, is_active=True)
        else:
            employees = User.objects.filter(is_active=True)

        report_distribution = list(
            reports.values("status").annotate(count=Count("id")).order_by("status")
        )
        employees_on_leave = leaves.filter(status="APPROVED").values("requested_by__full_name", "start_date", "end_date")[:10]
        pending_approvals = list(
            reports.filter(status__in=["PENDING_L2", "PENDING_L3", "PENDING_L4"])
            .values("id", "report_number", "title", "status", "created_by__full_name")[:10]
        )

        return Response(
            {
                "employees": {
                    "total_employees": employees.count(),
                    "employees_on_leave": leaves.filter(status="APPROVED").count(),
                    "active_reports": reports.exclude(status__in=["APPROVED", "ARCHIVED"]).count(),
                },
                "pending_approvals": pending_approvals,
                "report_distribution": report_distribution,
                "employees_on_leave": list(employees_on_leave),
            }
        )


class DashboardAnalyticsView(DashboardStatsView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        if request.user.role not in {"DEPT_HEAD", "DIRECTOR"}:
            return Response({"detail": "Analytics dashboard uchun vakolat yetarli emas."}, status=403)

        reports = self.get_reports_queryset(request.user)
        departments = Department.objects.filter(is_active=True)

        department_comparison = []
        for department in departments:
            department_reports = reports.filter(department_id=department)
            if request.user.role == "DEPT_HEAD" and request.user.department_id.id != department.id:
                continue

            department_comparison.append(
                {
                    "department_name": department.name,
                    "total_reports": department_reports.count(),
                    "approved_reports": department_reports.filter(status="APPROVED").count(),
                    "pending_reports": department_reports.filter(status__in=["PENDING_L2", "PENDING_L3", "PENDING_L4"]).count(),
                    "rejected_reports": department_reports.filter(status="REJECTED").count(),
                }
            )

        category_distribution = list(
            reports.values("category_id").annotate(count=Count("id")).order_by("-count")
        )
        approval_levels = list(
            reports.values("current_approval_level").annotate(count=Count("id")).order_by("current_approval_level")
        )

        return Response(
            {
                "overall": {
                    "total_reports": reports.count(),
                    "approved_reports": reports.filter(status="APPROVED").count(),
                    "pending_reports": reports.filter(status__in=["PENDING_L2", "PENDING_L3", "PENDING_L4"]).count(),
                    "archived_reports": reports.filter(status="ARCHIVED").count(),
                },
                "department_comparison": department_comparison,
                "category_distribution": category_distribution,
                "approval_level_distribution": approval_levels,
            }
        )
