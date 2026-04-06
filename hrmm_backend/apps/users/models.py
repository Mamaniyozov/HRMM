import uuid
from django.db import models
from django.contrib.auth.hashers import make_password   # <-- MUHIM

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.password_hash and not self.password_hash.startswith("pbkdf2_"):
            self.password_hash = make_password(self.password_hash)
        super().save(*args, **kwargs)