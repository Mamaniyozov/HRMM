import uuid
from django.db import models

class User(models.Model):
    ROLE_CHOICES = [
        ("SPECIALIST", "Specialist"),
        ("UNIT_HEAD", "Unit Head"),
        ("DEPT_HEAD", "Department Head"),
        ("DIRECTOR", "Director"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    department_id = models.UUIDField(null=True)
    unit_id = models.UUIDField(null=True)

    is_active = models.BooleanField(default=True)
    phone = models.CharField(max_length=20, null=True)
    avatar_url = models.CharField(max_length=500, null=True)

    last_login_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)