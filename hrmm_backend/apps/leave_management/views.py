from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from config.api_utils import paginate_queryset
from config.responses import api_success
from apps.leave_management.models import LeaveRequest
from apps.notifications.services import create_notification
from apps.users.models import User
from apps.leave_management.serializers import (
    LeaveRequestCreateSerializer,
    LeaveRequestListSerializer,
    LeaveReviewSerializer,
)
from apps.reports.views import IsAuthenticatedHRMM


class LeaveListCreateView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get_queryset(self, user):
        queryset = LeaveRequest.objects.select_related("requested_by", "reviewed_by", "requested_by__department_id")
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return queryset.filter(requested_by__department_id=user.department_id)
        return queryset.filter(requested_by=user)

    def get(self, request):
        leaves = self.get_queryset(request.user)
        status_filter = request.query_params.get("status")
        leave_type = request.query_params.get("leave_type")

        if status_filter:
            leaves = leaves.filter(status=status_filter)
        if leave_type:
            leaves = leaves.filter(leave_type=leave_type)

        return paginate_queryset(request, leaves, LeaveRequestListSerializer)

    def post(self, request):
        serializer = LeaveRequestCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        leave_request = serializer.save(requested_by=request.user)
        create_audit_log(
            actor=request.user,
            action="LEAVE_CREATE",
            target_type="leave_management.LeaveRequest",
            target_id=leave_request.id,
            description="Yangi ta'til so'rovi yaratildi",
            request=request,
        )
        if request.user.department_id_id:
            reviewers = User.objects.filter(
                department_id=request.user.department_id,
                role__in=["DEPT_HEAD", "DIRECTOR"],
                is_active=True,
            ).exclude(id=request.user.id)
            for reviewer in reviewers:
                create_notification(
                    user=reviewer,
                    title="New leave request",
                    message=f"{request.user.full_name} yangi ta'til so'rovi yubordi.",
                    notification_type="APPROVAL",
                    reference_type="leave_management.LeaveRequest",
                    reference_id=leave_request.id,
                )
        return api_success(
            data=LeaveRequestListSerializer(leave_request, context={"request": request}).data,
            message="Leave request created",
            status_code=status.HTTP_201_CREATED,
        )


class LeaveDetailView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get_queryset(self, user):
        queryset = LeaveRequest.objects.select_related("requested_by", "reviewed_by")
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return queryset.filter(requested_by__department_id=user.department_id)
        return queryset.filter(requested_by=user)

    def get(self, request, leave_id):
        leave_request = self.get_queryset(request.user).filter(id=leave_id).first()
        if not leave_request:
            return api_success(message="Leave request not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        return api_success(data=LeaveRequestListSerializer(leave_request, context={"request": request}).data)


class LeaveReviewView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request, leave_id):
        leave_request = LeaveRequest.objects.select_related("requested_by").filter(id=leave_id).first()
        if not leave_request:
            return api_success(message="Leave request not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        comment = serializer.validated_data["review_comment"]

        if action == "CANCEL":
            if leave_request.requested_by_id != request.user.id:
                return api_success(message="Faqat egasi ta'til so'rovini bekor qila oladi", data=None, status_code=403)
            if leave_request.status != "PENDING":
                return api_success(message="Faqat pending so'rov bekor qilinadi", data=None, status_code=400)
            leave_request.status = "CANCELLED"
            leave_request.reviewed_by = request.user
            leave_request.review_comment = comment
            leave_request.save(update_fields=["status", "reviewed_by", "review_comment", "updated_at"])
            create_audit_log(
                actor=request.user,
                action="LEAVE_CANCEL",
                target_type="leave_management.LeaveRequest",
                target_id=leave_request.id,
                description="Ta'til so'rovi bekor qilindi",
                request=request,
            )
            create_notification(
                user=leave_request.requested_by,
                title="Leave request cancelled",
                message="Ta'til so'rovi bekor qilindi.",
                notification_type="INFO",
                reference_type="leave_management.LeaveRequest",
                reference_id=leave_request.id,
            )
            return api_success(data=LeaveRequestListSerializer(leave_request, context={"request": request}).data)

        if request.user.role not in {"DEPT_HEAD", "DIRECTOR"}:
            return api_success(message="Sizda leave review vakolati yo'q", data=None, status_code=403)

        if request.user.role == "DEPT_HEAD" and request.user.department_id_id != leave_request.requested_by.department_id_id:
            return api_success(message="Faqat o'z bo'limingiz so'rovlarini ko'ra olasiz", data=None, status_code=403)

        leave_request.status = "APPROVED" if action == "APPROVE" else "REJECTED"
        leave_request.reviewed_by = request.user
        leave_request.review_comment = comment
        leave_request.save(update_fields=["status", "reviewed_by", "review_comment", "updated_at"])
        create_audit_log(
            actor=request.user,
            action=f"LEAVE_{action}",
            target_type="leave_management.LeaveRequest",
            target_id=leave_request.id,
            description=f"Ta'til so'rovi {action.lower()} qilindi",
            request=request,
        )
        create_notification(
            user=leave_request.requested_by,
            title=f"Leave request {action.lower()}",
            message=f"Ta'til so'rovingiz {action.lower()} qilindi.",
            notification_type="INFO" if action == "APPROVE" else "REJECTION",
            reference_type="leave_management.LeaveRequest",
            reference_id=leave_request.id,
        )
        return api_success(data=LeaveRequestListSerializer(leave_request, context={"request": request}).data)


class LeaveCalendarView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get_queryset(self, user):
        queryset = LeaveRequest.objects.select_related("requested_by", "requested_by__department_id").filter(status="APPROVED")
        if user.role == "DIRECTOR":
            return queryset
        if user.role == "DEPT_HEAD" and user.department_id_id:
            return queryset.filter(requested_by__department_id=user.department_id)
        return queryset.filter(requested_by=user)

    def get(self, request):
        leaves = self.get_queryset(request.user)
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            leaves = leaves.filter(end_date__gte=start_date)
        if end_date:
            leaves = leaves.filter(start_date__lte=end_date)

        calendar_items = list(
            leaves.values(
                "id",
                "requested_by__full_name",
                "requested_by__department_id__name",
                "leave_type",
                "start_date",
                "end_date",
                "total_days",
                "status",
            )
        )
        return api_success(data=calendar_items)
