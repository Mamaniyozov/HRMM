import uuid

from django.db import models


class RevokedToken(models.Model):
    jti = models.CharField(max_length=255, unique=True)
    token_type = models.CharField(max_length=20)
    revoked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-revoked_at",)

    def __str__(self):
        return f"{self.token_type}:{self.jti}"


class EmailOTPChallenge(models.Model):
    PURPOSE_CHOICES = [
        ("LOGIN", "Kirish"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="email_otp_challenges",
    )
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default="LOGIN")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username}:{self.purpose}:{self.created_at.isoformat()}"


class QRLoginChallenge(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Kutilmoqda"),
        ("APPROVED", "Tasdiqlandi"),
        ("REJECTED", "Rad etildi"),
        ("EXPIRED", "Muddati tugagan"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="qr_login_challenges",
    )
    challenge_token = models.CharField(max_length=255, unique=True)
    short_token = models.CharField(max_length=32, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    approved_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_qr_login_challenges",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username}:qr_login:{self.status}:{self.created_at.isoformat()}"
