from apps.notifications.models import Notification


def create_notification(*, user, title, message, notification_type="INFO", reference_type="", reference_id=""):
    return Notification.objects.create(
        user_id=user,
        title=title,
        message=message,
        type=notification_type,
        reference_type=reference_type or None,
        reference_id=str(reference_id) if reference_id else None,
    )
