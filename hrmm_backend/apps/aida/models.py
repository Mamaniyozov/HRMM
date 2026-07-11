import uuid

from django.db import models


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="aida_sessions",
        db_column="user_id",
    )
    title = models.CharField(max_length=300, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["user", "is_active"], name="idx_aida_session_user"),
        ]

    def __str__(self):
        return f"AIDA Session {self.id} — {self.user.username}"


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "Foydalanuvchi"),
        ("assistant", "AIDA"),
        ("tool", "Tool"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="session_id",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    tool_calls = models.JSONField(null=True, blank=True)
    language = models.CharField(max_length=5, default="uz")
    voice_mode = models.BooleanField(default=False)
    current_page = models.CharField(max_length=200, blank=True, default="")
    current_report_id = models.UUIDField(null=True, blank=True)
    tokens_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["session", "created_at"], name="idx_aida_msg_session"),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:80]}..."
