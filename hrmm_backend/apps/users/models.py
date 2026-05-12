import uuid

from django.db import models
from django.contrib.auth.hashers import make_password

class User(models.Model):
    ROLE_CHOICES = [
        ("SPECIALIST", "Specialist"),
        ("UNIT_HEAD", "Unit Head"),
        ("DEPT_HEAD", "Department Head"),
        ("DIRECTOR", "Director"),
    ]
    JOB_ROLE_CHOICES = [
        ("DEVOPS", "DevOps"),
        ("IT_ENGINEER", "IT Engineer"),
        ("ANDROID_DEV", "Android Developer"),
        ("BACKEND_DEV", "Backend Developer"),
        ("FRONTEND_DEV", "Frontend Developer"),
        ("MANAGER", "Manager"),
        ("DIRECTOR", "Director"),
    ]
    JOB_LEVEL_CHOICES = [
        ("JUNIOR", "Junior"),
        ("MIDDLE", "Middle"),
        ("SENIOR", "Senior"),
    ]
    LANGUAGE_CHOICES = [
        ("uz", "Uzbek"),
        ("ru", "Russian"),
        ("en", "English"),
        ("tr", "Turkish"),
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
    totp_secret = models.CharField(max_length=64, null=True, blank=True)

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
