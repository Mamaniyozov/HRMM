import uuid

from django.db import models


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
