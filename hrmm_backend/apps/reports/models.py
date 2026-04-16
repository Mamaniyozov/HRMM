import uuid

from django.db import models


def report_attachment_upload_to(instance, filename):
    return f"reports/{instance.report_id_id}/attachments/{filename}"


class Report(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PENDING_L2", "Pending Level 2"),
        ("PENDING_L3", "Pending Level 3"),
        ("PENDING_L4", "Pending Level 4"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("REVISION", "Revision"),
        ("ARCHIVED", "Archived"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=300)
    summary = models.TextField()
    content = models.TextField(null=True, blank=True)
    category_id = models.UUIDField(null=True)
    department_id = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        db_column="department_id",
    )
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="reports_created",
        db_column="created_by",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    current_approval_level = models.PositiveSmallIntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"], name="idx_reports_status"),
            models.Index(fields=["created_by"], name="idx_reports_created_by"),
            models.Index(fields=["department_id", "status"], name="idx_reports_department"),
            models.Index(fields=["-created_at"], name="idx_reports_created_at"),
        ]

    def __str__(self):
        return f"{self.report_number} - {self.title}"


class ReportAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_id = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="attachments",
        db_column="report_id",
    )
    file = models.FileField(upload_to=report_attachment_upload_to, null=True, blank=True)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    checksum = models.CharField(max_length=64)
    upload_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_attachments",
        db_column="upload_by",
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["report_id"], name="idx_attachments_report"),
        ]

    def __str__(self):
        return self.file_name
