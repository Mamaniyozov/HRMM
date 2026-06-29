import uuid
import os

from django.db import models
from django.contrib.auth.hashers import make_password
from django.conf import settings


def _get_fernet():
    try:
        from cryptography.fernet import Fernet
        import hashlib
        key = os.getenv("FIELD_ENCRYPTION_KEY", "")
        if not key:
            key = settings.SECRET_KEY
        fernet_key = hashlib.sha256(key.encode()).digest()
        return Fernet(fernet_key)
    except Exception:
        return None


class TOTPEncryptedField(models.CharField):
    """CharField that encrypts totp_secret at rest using Fernet."""

    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        fernet = _get_fernet()
        if fernet:
            try:
                return fernet.decrypt(value.encode()).decode()
            except Exception:
                return value
        return value

    def get_prep_value(self, value):
        if not value:
            return value
        fernet = _get_fernet()
        if fernet and not value.startswith("gAAAA"):
            try:
                return fernet.encrypt(value.encode()).decode()
            except Exception:
                return value
        return value

class User(models.Model):
    ROLE_CHOICES = [
        ("SPECIALIST", "Mutaxassis"),
        ("UNIT_HEAD", "Bo'linma rahbari"),
        ("DEPT_HEAD", "Bo'lim boshlig'i"),
        ("DIRECTOR", "Direktor"),
    ]
    JOB_ROLE_CHOICES = [
        ("DEVOPS", "DevOps muhandisi"),
        ("IT_ENGINEER", "IT muhandisi"),
        ("ANDROID_DEV", "Android dasturchi"),
        ("BACKEND_DEV", "Backend dasturchi"),
        ("FRONTEND_DEV", "Frontend dasturchi"),
        ("MANAGER", "Menejer"),
        ("DIRECTOR", "Direktor"),
    ]
    JOB_LEVEL_CHOICES = [
        ("JUNIOR", "Boshlang'ich (Junior)"),
        ("MIDDLE", "O'rta (Middle)"),
        ("SENIOR", "Yuqori (Senior)"),
    ]
    LANGUAGE_CHOICES = [
        ("uz", "O'zbekcha"),
        ("ru", "Ruscha"),
        ("en", "Inglizcha"),
        ("tr", "Turkcha"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="SPECIALIST")
    job_role = models.CharField(max_length=30, choices=JOB_ROLE_CHOICES, null=True, blank=True)
    job_level = models.CharField(max_length=20, choices=JOB_LEVEL_CHOICES, null=True, blank=True)
    department_id = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="department_users",
        db_column="department_id",
    )
    unit_id = models.ForeignKey(
        "units.Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="unit_users",
        db_column="unit_id",
    )
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="uz")
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    two_factor_confirmed_at = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    totp_secret = TOTPEncryptedField(max_length=256, null=True, blank=True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_username(self):
        return self.username

    def save(self, *args, **kwargs):
        if self.password_hash and not self.password_hash.startswith("pbkdf2_"):
            self.password_hash = make_password(self.password_hash)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} - {self.full_name}"


class UserFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="feedback_entries",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.author.username} - {self.rating}"
