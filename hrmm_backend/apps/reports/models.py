import uuid
from django.db import models
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
    content = models.TextField(null=True)
    category_id = models.UUIDField(null=True)
    created_by = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    created_at = models.DateTimeField(auto_now_add=True)