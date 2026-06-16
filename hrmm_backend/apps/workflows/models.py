import uuid

from django.db import models


class ApprovalHistory(models.Model):
    ACTION_CHOICES = [
        ("SUBMIT", "Yuborish"),
        ("APPROVE", "Tasdiqlash"),
        ("REJECT", "Rad etish"),
        ("REQUEST_REVISION", "Qayta ko'rib chiqishni so'rash"),
        ("ARCHIVE", "Arxivlash"),
    ]

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
    report_id = models.ForeignKey(
        "reports.Report",
        on_delete=models.CASCADE,
        related_name="approval_history",
        db_column="report_id",
    )
    approver_id = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="approvals",
        db_column="approver_id",
    )
    approval_level = models.PositiveSmallIntegerField()
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    comment = models.TextField()
    previous_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["report_id", "-created_at"], name="idx_approval_report"),
        ]

    def __str__(self):
        return f"{self.report_id} - {self.action}"
