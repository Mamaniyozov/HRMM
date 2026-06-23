from django.contrib import admin
from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "target_type", "target_id", "actor", "created_at")
    list_filter = ("action", "target_type", "created_at")
    search_fields = ("target_id", "description", "actor__username", "actor__full_name")
    ordering = ("-created_at",)
