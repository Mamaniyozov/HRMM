from django.db import models


class RevokedToken(models.Model):
    jti = models.CharField(max_length=255, unique=True)
    token_type = models.CharField(max_length=20)
    revoked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-revoked_at",)

    def __str__(self):
        return f"{self.token_type}:{self.jti}"
