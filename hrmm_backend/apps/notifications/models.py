import uuid
from pathlib import Path

from django.db import models


def notification_attachment_upload_to(instance, filename):
    original_name = Path(str(filename)).name
    suffix = Path(original_name).suffix[:20]
    stem = Path(original_name).stem[:40] or "attachment"
    short_name = f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
    return f"notifications/{instance.user_id.id}/{instance.id}/{short_name}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("APPROVAL", "Approval"),
        ("REJECTION", "Rejection"),
        ("INFO", "Info"),
        ("REMINDER", "Reminder"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="notifications",
        db_column="user_id",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    reference_id = models.CharField(max_length=100, null=True, blank=True)
    screenshot = models.FileField(
        upload_to=notification_attachment_upload_to,
        max_length=255,
        null=True,
        blank=True,
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user_id", "is_read", "-created_at"], name="idx_notifications_user"),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.title}"
