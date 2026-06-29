from django.db import transaction
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


def is_reviewer_alert(notification):
    if notification.reference_type == Notification.REVIEWER_ALERT_REFERENCE_TYPE:
        return True
    return notification.type == "APPROVAL" and str(notification.title or "").startswith("Yangi so'rov:")


def resolve_notification_for_review(notification):
    """Map manager alert copies to the original pending request."""
    if is_reviewer_alert(notification) and notification.reference_id:
        original = Notification.objects.filter(id=notification.reference_id).first()
        if original and original.reference_type in Notification.REVIEWABLE_REFERENCE_TYPES:
            return original

    if notification.reference_type in Notification.REVIEWABLE_REFERENCE_TYPES:
        return notification

    return None


def sync_reviewer_alerts(source_notification, *, new_status):
    Notification.objects.filter(
        reference_id=str(source_notification.id),
    ).filter(
        Q(reference_type=Notification.REVIEWER_ALERT_REFERENCE_TYPE) | Q(type="APPROVAL")
    ).update(is_read=True, status=new_status)


def notification_queryset_for_user(user):
    queryset = Notification.objects.select_related("submitted_by", "reviewed_by", "user_id").order_by("-created_at")
    own = Q(user_id=user)
    pending_request = Q(
        status="PENDING",
        reference_type__in=Notification.REVIEWABLE_REFERENCE_TYPES,
        submitted_by__isnull=False,
    )
    if user.role == "DIRECTOR":
        return queryset.filter(own | pending_request).distinct()
    if user.role == "DEPT_HEAD" and user.department_id_id:
        pending_request &= Q(submitted_by__department_id=user.department_id_id)
        return queryset.filter(own | pending_request).distinct()
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
                    submitted_by=request.user,
                    title=f"Yangi so'rov: {notification.title}",
                    message=notification.message,
                    notification_type="APPROVAL",
                    reference_type=Notification.REVIEWER_ALERT_REFERENCE_TYPE,
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

        with transaction.atomic():
            notification = notification_queryset_for_user(request.user).select_for_update().select_related("submitted_by", "user_id").filter(id=notification_id).first()
            if not notification:
                return api_success(message="Notification not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

            target = resolve_notification_for_review(notification)
            if not target:
                return api_success(
                    message="Faqat funksiya talabi yoki foydalanuvchi bildirishnomasi ko'rib chiqiladi",
                    data=None,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            if target.status not in {None, "PENDING"}:
                return api_success(
                    message="Bu so'rov allaqachon ko'rib chiqilgan",
                    data=NotificationSerializer(target, context={"request": request}).data,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            if request.user.role == "DEPT_HEAD":
                submitter_department_id = getattr(target.submitted_by, "department_id_id", None)
                if submitter_department_id and submitter_department_id != request.user.department_id_id:
                    return api_success(message="Faqat o'z bo'limingiz so'rovlarini ko'ra olasiz", data=None, status_code=403)

            serializer = NotificationReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            action = serializer.validated_data["action"]
            comment = serializer.validated_data.get("review_comment", "")

            if action == "REJECT" and not comment:
                return api_success(message="Rad etish uchun izoh majburiy", data=None, status_code=400)

            new_status = "APPROVED" if action == "APPROVE" else "REJECTED"
            target.status = new_status
            target.reviewed_by = request.user
            target.review_comment = comment
            target.is_read = True
            target.read_at = timezone.now()
            target.save(update_fields=["status", "reviewed_by", "review_comment", "is_read", "read_at"])

            sync_reviewer_alerts(target, new_status=new_status)

            submitter = target.submitted_by or target.user_id
            if submitter:
                create_notification(
                    user=submitter,
                    submitted_by=target.submitted_by,
                    title=f"So'rovingiz {action.lower()} qilindi",
                    message=f"{target.title}: {comment or 'Izoh kiritilmagan'}",
                    notification_type="INFO" if action == "APPROVE" else "REJECTION",
                    reference_type=target.reference_type,
                    reference_id=str(target.id),
                )

            create_audit_log(
                actor=request.user,
                action=f"NOTIFICATION_{action}",
                target_type="notifications.Notification",
                target_id=target.id,
                description=f"{target.title} {action.lower()} qilindi",
                request=request,
            )
        return api_success(data=NotificationSerializer(target, context={"request": request}).data)
