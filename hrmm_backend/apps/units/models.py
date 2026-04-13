import uuid

from django.db import models


class Unit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department_id = models.ForeignKey(
        "departments.Department",
        on_delete=models.CASCADE,
        related_name="units",
        db_column="department_id",
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    head_user_id = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="headed_units",
        db_column="head_user_id",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"
