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


def create_notification_with_translation(*, user, title_uz, title_ru, title_en, title_tr, message_uz, message_ru, message_en, message_tr, notification_type="INFO", reference_type="", reference_id=""):
    language_map = {
        "uz": {"title": title_uz, "message": message_uz},
        "ru": {"title": title_ru, "message": message_ru},
        "en": {"title": title_en, "message": message_en},
        "tr": {"title": title_tr, "message": message_tr},
    }
    
    user_language = getattr(user, "language", "uz")
    content = language_map.get(user_language, language_map["uz"])
    
    return Notification.objects.create(
        user_id=user,
        title=content["title"],
        message=content["message"],
        type=notification_type,
        reference_type=reference_type or None,
        reference_id=str(reference_id) if reference_id else None,
    )
