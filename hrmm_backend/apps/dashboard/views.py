from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.departments.models import Department
from apps.leave_management.models import LeaveRequest
from apps.notifications.models import Notification
from apps.reports.models import Report
from apps.reports.views import IsAuthenticatedHRMM
from apps.users.models import User
from apps.workflows.models import ApprovalHistory

REVIEWABLE_NOTIFICATION_TYPES = ("FEATURE_REQUEST", "USER_NOTIFICATION")
PENDING_REPORT_STATUSES = ("PENDING_L2", "PENDING_L3", "PENDING_L4")


def reviewable_report_statuses_for_user(user):
    if user.role == "DIRECTOR":
        return PENDING_REPORT_STATUSES
    if user.role == "DEPT_HEAD":
        return ("PENDING_L2", "PENDING_L3")
    if user.role == "UNIT_HEAD":
        return ("PENDING_L2",)
    return ()


def pending_notifications_for_user(user):
    if user.role not in {"DEPT_HEAD", "DIRECTOR"}:
        return []

    queryset = Notification.objects.exclude(
        reference_type=Notification.REVIEWER_ALERT_REFERENCE_TYPE
    ).filter(
        reference_type__in=Notification.REVIEWABLE_REFERENCE_TYPES,
        status="PENDING",
    )

    if user.role == "DEPT_HEAD":
        queryset = queryset.filter(submitted_by__department_id=user.department_id)

    pending_notifications = list(
        queryset.values(
            "id",
            "title",
            "message",
            "status",
            "reference_type",
            "submitted_by__full_name",
            "created_at",
        )[:10]
    )
    for item in pending_notifications:
        item["item_type"] = "notification"
        item["created_by__full_name"] = item.pop("submitted_by__full_name", None)
    return pending_notifications


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
        pending_reports = list(
            reports.filter(status__in=reviewable_report_statuses_for_user(request.user))
            .values("id", "report_number", "title", "status", "created_by__full_name")[:10]
        )
        for item in pending_reports:
            item["item_type"] = "report"

        pending_leaves = []
        if request.user.role in {"DEPT_HEAD", "DIRECTOR"}:
            pending_leaves = list(
                leaves.filter(status="PENDING")
                .values("id", "leave_number", "leave_type", "reason", "status", "requested_by__full_name")[:10]
            )
        for item in pending_leaves:
            item["item_type"] = "leave"
            item["title"] = item.get("reason") or item.get("leave_type")
            item["created_by__full_name"] = item.pop("requested_by__full_name", None)

        pending_notifications = pending_notifications_for_user(request.user)
        pending_approvals = pending_reports + pending_leaves + pending_notifications

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
                    "pending_reports": reports.filter(status__in=PENDING_REPORT_STATUSES).count(),
                    "archived_reports": reports.filter(status="ARCHIVED").count(),
                },
                "department_comparison": department_comparison,
                "category_distribution": category_distribution,
                "approval_level_distribution": approval_levels,
            }
        )


class DashboardOperationsView(DashboardStatsView):
    """Bo'limlar bo'yicha ariza, bildirishnoma, funksiya talabi va hisobot statistikasi."""

    permission_classes = [IsAuthenticatedHRMM]

    def _departments_for_user(self, user):
        departments = Department.objects.filter(is_active=True).order_by("name")
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return departments.filter(id=user.department_id_id)
        return departments

    def _notification_queryset(self, user):
        queryset = Notification.objects.exclude(reference_type=Notification.REVIEWER_ALERT_REFERENCE_TYPE).filter(
            reference_type__in=REVIEWABLE_NOTIFICATION_TYPES
        )
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return queryset.filter(
                Q(submitted_by__department_id=user.department_id_id)
                | Q(user_id__department_id=user.department_id_id)
            )
        if user.role == "UNIT_HEAD" and user.unit_id_id:
            return queryset.filter(
                Q(submitted_by__unit_id=user.unit_id_id) | Q(user_id__unit_id=user.unit_id_id)
            )
        return queryset.filter(Q(submitted_by=user) | Q(user_id=user))

    def _department_notification_q(self, department_id):
        return Q(submitted_by__department_id=department_id) | Q(
            submitted_by__isnull=True, user_id__department_id=department_id
        )

    def get(self, request):
        user = request.user
        reports = self.get_reports_queryset(user)
        leaves = self.get_leaves_queryset(user)
        notifications = self._notification_queryset(user)
        departments = self._departments_for_user(user)

        department_rows = []
        for department in departments:
            dept_reports = reports.filter(department_id=department)
            dept_leaves = leaves.filter(requested_by__department_id=department)
            dept_notifications = notifications.filter(self._department_notification_q(department.id))
            dept_features = dept_notifications.filter(reference_type="FEATURE_REQUEST")

            department_rows.append(
                {
                    "department_id": str(department.id),
                    "department_name": department.name,
                    "department_code": department.code,
                    "leaves": {
                        "total": dept_leaves.count(),
                        "pending": dept_leaves.filter(status="PENDING").count(),
                        "approved": dept_leaves.filter(status="APPROVED").count(),
                        "rejected": dept_leaves.filter(status="REJECTED").count(),
                    },
                    "reports": {
                        "total": dept_reports.count(),
                        "pending": dept_reports.filter(status__in=PENDING_REPORT_STATUSES).count(),
                        "approved": dept_reports.filter(status="APPROVED").count(),
                        "rejected": dept_reports.filter(status="REJECTED").count(),
                    },
                    "notifications": {
                        "total": dept_notifications.count(),
                        "pending": dept_notifications.filter(status="PENDING").count(),
                        "approved": dept_notifications.filter(status__in=["APPROVED", "REJECTED"]).count(),
                    },
                    "feature_requests": {
                        "total": dept_features.count(),
                        "pending": dept_features.filter(status="PENDING").count(),
                        "approved": dept_features.filter(status__in=["APPROVED", "REJECTED"]).count(),
                    },
                }
            )

        feature_notifications = notifications.filter(reference_type="FEATURE_REQUEST")
        overall = {
            "leaves": {
                "total": leaves.count(),
                "pending": leaves.filter(status="PENDING").count(),
                "approved": leaves.filter(status="APPROVED").count(),
            },
            "reports": {
                "total": reports.count(),
                "pending": reports.filter(status__in=PENDING_REPORT_STATUSES).count(),
                "approved": reports.filter(status="APPROVED").count(),
            },
            "notifications": {
                "total": notifications.count(),
                "pending": notifications.filter(status="PENDING").count(),
                "approved": notifications.filter(status__in=["APPROVED", "REJECTED"]).count(),
            },
            "feature_requests": {
                "total": feature_notifications.count(),
                "pending": feature_notifications.filter(status="PENDING").count(),
                "approved": feature_notifications.filter(status__in=["APPROVED", "REJECTED"]).count(),
            },
        }

        return Response({"overall": overall, "departments": department_rows})


class DashboardReviewHistoryView(APIView):
    """Foydalanuvchi bajargan tasdiqlash / rad etish / ko'rib chiqishlar tarixi."""

    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        user = request.user
        entries = []

        report_history = (
            ApprovalHistory.objects.filter(approver_id=user)
            .select_related("report_id", "report_id__created_by")
            .order_by("-created_at")[:120]
        )
        for item in report_history:
            report = item.report_id
            entries.append(
                {
                    "item_type": "report",
                    "item_id": str(report.id),
                    "reference": report.report_number,
                    "title": report.title,
                    "action": item.action,
                    "previous_status": item.previous_status,
                    "new_status": item.new_status,
                    "comment": item.comment or "",
                    "subject_name": getattr(report.created_by, "full_name", None) or "-",
                    "created_at": item.created_at.isoformat(),
                }
            )

        reviewed_leaves = (
            LeaveRequest.objects.filter(reviewed_by=user)
            .exclude(status="PENDING")
            .select_related("requested_by")
            .order_by("-updated_at")[:120]
        )
        for leave in reviewed_leaves:
            action = "APPROVE" if leave.status == "APPROVED" else leave.status
            entries.append(
                {
                    "item_type": "leave",
                    "item_id": str(leave.id),
                    "reference": leave.leave_number or str(leave.id)[:8],
                    "title": leave.reason or leave.leave_type,
                    "action": action,
                    "previous_status": "PENDING",
                    "new_status": leave.status,
                    "comment": leave.review_comment or "",
                    "subject_name": getattr(leave.requested_by, "full_name", None) or "-",
                    "created_at": leave.updated_at.isoformat(),
                }
            )

        reviewed_notifications = (
            Notification.objects.filter(
                reviewed_by=user,
                status__in=["APPROVED", "REJECTED"],
            )
            .exclude(reference_type=Notification.REVIEWER_ALERT_REFERENCE_TYPE)
            .select_related("submitted_by")
            .order_by("-read_at", "-created_at")[:120]
        )
        for notification in reviewed_notifications:
            item_type = (
                "feature_request"
                if notification.reference_type == "FEATURE_REQUEST"
                else "notification"
            )
            action = "APPROVE" if notification.status == "APPROVED" else "REJECT"
            entries.append(
                {
                    "item_type": item_type,
                    "item_id": str(notification.id),
                    "reference": notification.notification_number or str(notification.id)[:8],
                    "title": notification.title,
                    "action": action,
                    "previous_status": "PENDING",
                    "new_status": notification.status,
                    "comment": notification.review_comment or "",
                    "subject_name": getattr(notification.submitted_by, "full_name", None) or "-",
                    "created_at": (notification.read_at or notification.created_at).isoformat(),
                }
            )

        entries.sort(key=lambda row: row["created_at"], reverse=True)
        limit = min(int(request.query_params.get("limit", 80)), 200)
        results = entries[:limit]

        return Response({"count": len(results), "results": results})
