from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationCreateSerializer, NotificationSerializer
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset
from config.responses import api_success


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        notifications = Notification.objects.filter(user_id=request.user).order_by("-created_at")
        is_read = request.query_params.get("is_read")

        if is_read in {"true", "false"}:
            notifications = notifications.filter(is_read=(is_read == "true"))

        return paginate_queryset(request, notifications, NotificationSerializer)

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
        return api_success(
            message="Notification created",
            data=NotificationSerializer(notification, context={"request": request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request, notification_id):
        notification = Notification.objects.filter(id=notification_id, user_id=request.user).first()
        if not notification:
            return api_success(message="Notification not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return api_success(data=NotificationSerializer(notification).data)


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request):
        unread = Notification.objects.filter(user_id=request.user, is_read=False)
        unread.update(is_read=True, read_at=timezone.now())
        return api_success(message="All notifications marked as read")
