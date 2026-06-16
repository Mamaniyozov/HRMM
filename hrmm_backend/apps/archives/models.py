import uuid

from django.db import models


class ArchiveLog(models.Model):
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_SUCCESS, "Muvaffaqiyatli"),
        (STATUS_FAILED, "Muvaffaqiyatsiz"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    archived_at = models.DateTimeField(auto_now_add=True)
    record_count = models.PositiveIntegerField(default=0)
    file_size_kb = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ("-archived_at",)
        indexes = [
            models.Index(fields=["-archived_at"], name="idx_archive_log_archived_at"),
        ]

    def __str__(self):
        return f"{self.archived_at:%Y-%m-%d %H:%M} — {self.status} ({self.record_count})"
