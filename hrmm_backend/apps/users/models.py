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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    job_role = models.CharField(max_length=30, choices=JOB_ROLE_CHOICES, null=True, blank=True)
    job_level = models.CharField(max_length=10, choices=JOB_LEVEL_CHOICES, null=True, blank=True)
    department_id = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        db_column="department_id",
    )
    unit_id = models.ForeignKey(
        "units.Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        db_column="unit_id",
    )
    is_active = models.BooleanField(default=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
