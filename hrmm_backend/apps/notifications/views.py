from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationCreateSerializer,
    NotificationReviewSerializer,
    NotificationSerializer,
)
from apps.notifications.services import create_notification
from apps.reports.views import IsAuthenticatedHRMM
from apps.users.models import User
from config.api_utils import paginate_queryset
from config.responses import api_success


def notification_queryset_for_user(user):
    queryset = Notification.objects.select_related("submitted_by", "reviewed_by", "user_id").order_by("-created_at")
    own = Q(user_id=user)
    if user.role == "DIRECTOR":
        incoming = Q(
            status="PENDING",
            reference_type__in=Notification.REVIEWABLE_REFERENCE_TYPES,
        )
        return queryset.filter(own | incoming).distinct()
    if user.role == "DEPT_HEAD" and user.department_id_id:
        incoming = Q(
            status="PENDING",
            reference_type__in=Notification.REVIEWABLE_REFERENCE_TYPES,
            submitted_by__department_id=user.department_id_id,
        )
        return queryset.filter(own | incoming).distinct()
    return queryset.filter(own)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        notifications = notification_queryset_for_user(request.user)
        is_read = request.query_params.get("is_read")
        status_filter = request.query_params.get("status")
        reference_type = request.query_params.get("reference_type")

        if is_read in {"true", "false"}:
            notifications = notifications.filter(is_read=(is_read == "true"))
        if status_filter:
            notifications = notifications.filter(status=status_filter)
        if reference_type:
            notifications = notifications.filter(reference_type=reference_type)

        return paginate_queryset(request, notifications, NotificationSerializer, context={"request": request})

    def post(self, request):
        serializer = NotificationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        create_audit_log(
            actor=request.user,
            action="NOTIFICATION_CREATE",
            target_type="notifications.Notification",
            target_id=notification.id,
            description=f"{request.user.username} yangi notification yaratdi",
            request=request,
        )
        if notification.reference_type in Notification.REVIEWABLE_REFERENCE_TYPES:
            reviewers = User.objects.filter(role__in=["DEPT_HEAD", "DIRECTOR"], is_active=True).exclude(
                id=request.user.id
            )
            if request.user.department_id_id:
                reviewers = reviewers.filter(
                    Q(role="DIRECTOR") | Q(department_id=request.user.department_id_id)
                )
            for reviewer in reviewers:
                create_notification(
                    user=reviewer,
                    title=f"Yangi so'rov: {notification.title}",
                    message=notification.message,
                    notification_type="APPROVAL",
                    reference_type=notification.reference_type,
                    reference_id=str(notification.id),
                )
        return api_success(
            message="Notification created",
            data=NotificationSerializer(notification, context={"request": request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request, notification_id):
        notification = notification_queryset_for_user(request.user).filter(id=notification_id).first()
        if not notification:
            return api_success(message="Notification not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return api_success(data=NotificationSerializer(notification, context={"request": request}).data)


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request):
        unread = notification_queryset_for_user(request.user).filter(is_read=False)
        unread.update(is_read=True, read_at=timezone.now())
        return api_success(message="All notifications marked as read")


class NotificationReviewView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request, notification_id):
        if request.user.role not in {"DEPT_HEAD", "DIRECTOR"}:
            return api_success(message="Sizda bildirishnomani ko'rib chiqish vakolati yo'q", data=None, status_code=403)

        notification = notification_queryset_for_user(request.user).filter(id=notification_id).first()
        if not notification:
            return api_success(message="Notification not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        if notification.reference_type not in Notification.REVIEWABLE_REFERENCE_TYPES:
            return api_success(
                message="Faqat funksiya talabi yoki foydalanuvchi bildirishnomasi ko'rib chiqiladi",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if notification.status not in {None, "PENDING"}:
            return api_success(message="Faqat kutilayotgan so'rovni ko'rib chiqish mumkin", data=None, status_code=400)

        if request.user.role == "DEPT_HEAD":
            submitter_department_id = getattr(notification.submitted_by, "department_id_id", None)
            if submitter_department_id and submitter_department_id != request.user.department_id_id:
                return api_success(message="Faqat o'z bo'limingiz so'rovlarini ko'ra olasiz", data=None, status_code=403)

        if notification.submitted_by_id == request.user.id:
            return api_success(message="O'z so'rovingizni tasdiqlay olmaysiz", data=None, status_code=403)

        serializer = NotificationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        comment = serializer.validated_data.get("review_comment", "")

        if action == "REJECT" and not comment:
            return api_success(message="Rad etish uchun izoh majburiy", data=None, status_code=400)

        notification.status = "APPROVED" if action == "APPROVE" else "REJECTED"
        notification.reviewed_by = request.user
        notification.review_comment = comment
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(
            update_fields=["status", "reviewed_by", "review_comment", "is_read", "read_at"]
        )

        submitter = notification.submitted_by or notification.user_id
        if submitter:
            create_notification(
                user=submitter,
                title=f"So'rovingiz {action.lower()} qilindi",
                message=f"{notification.title}: {comment or 'Izoh kiritilmagan'}",
                notification_type="INFO" if action == "APPROVE" else "REJECTION",
                reference_type=notification.reference_type,
                reference_id=str(notification.id),
            )

        create_audit_log(
            actor=request.user,
            action=f"NOTIFICATION_{action}",
            target_type="notifications.Notification",
            target_id=notification.id,
            description=f"{notification.title} {action.lower()} qilindi",
            request=request,
        )
        return api_success(data=NotificationSerializer(notification, context={"request": request}).data)
