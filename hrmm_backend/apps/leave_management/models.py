import uuid

from django.db import models


def leave_screenshot_upload_to(instance, filename):
    return f"leaves/{instance.requested_by_id}/{instance.id}/{filename}"


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = [
        ("ANNUAL", "Annual"),
        ("SICK", "Sick"),
        ("UNPAID", "Unpaid"),
        ("MATERNITY", "Maternity"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    leave_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    requested_by = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="leave_requests",
        db_column="requested_by",
    )
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leave_requests",
        db_column="reviewed_by",
    )
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    review_comment = models.TextField(blank=True, default="")
    screenshot = models.FileField(upload_to=leave_screenshot_upload_to, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["requested_by", "status"], name="idx_leave_requested_status"),
            models.Index(fields=["start_date", "end_date"], name="idx_leave_dates"),
        ]

    def __str__(self):
        return f"{self.requested_by} - {self.leave_type} ({self.status})"
