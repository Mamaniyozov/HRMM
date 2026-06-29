import uuid

from django.db import models, transaction


def report_attachment_upload_to(instance, filename):
    return f"reports/{instance.report_id.id}/attachments/{filename}"


class Report(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Qoralama"),
        ("PENDING_L2", "2-daraja tasdiqlash kutilmoqda"),
        ("PENDING_L3", "3-daraja tasdiqlash kutilmoqda"),
        ("PENDING_L4", "4-daraja tasdiqlash kutilmoqda"),
        ("APPROVED", "Tasdiqlangan"),
        ("REJECTED", "Rad etilgan"),
        ("REVISION", "Qayta ko'rib chiqish"),
        ("ARCHIVED", "Arxivlangan"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sequence_number = models.PositiveIntegerField(null=True, blank=True, unique=True)
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
        return f"#{self.sequence_number} - {self.title}"

    def save(self, *args, **kwargs):
        if self.sequence_number is None and not self.pk:
            from django.db import connection
            with transaction.atomic():
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT nextval('report_sequence_number_seq')")
                        row = cursor.fetchone()
                        self.sequence_number = row[0]
                except Exception:
                    last = Report.objects.aggregate(
                        max_seq=models.Max("sequence_number")
                    )
                    self.sequence_number = (last["max_seq"] or 0) + 1
        super().save(*args, **kwargs)


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
