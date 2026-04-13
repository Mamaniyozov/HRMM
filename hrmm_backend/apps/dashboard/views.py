from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.leave_management.models import LeaveRequest
from apps.reports.models import Report
from apps.reports.views import IsAuthenticatedHRMM


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get_reports_queryset(self, user):
        queryset = Report.objects.all()
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return queryset.filter(department_id=user.department_id)
        if user.role == "UNIT_HEAD" and user.unit_id_id:
            return queryset.filter(created_by__unit_id=user.unit_id)
        return queryset.filter(created_by=user)

    def get_leaves_queryset(self, user):
        queryset = LeaveRequest.objects.all()
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
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
