from django.contrib import admin
from apps.audit.models import AuditLog, User


@admin.register(User)
class AuditUserAdmin(admin.ModelAdmin):
    list_display = ("username", "full_name", "email", "role", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("username", "full_name", "email")
    ordering = ("-created_at",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "target_type", "target_id", "actor", "created_at")
    list_filter = ("action", "target_type", "created_at")
    search_fields = ("target_id", "description", "actor__username", "actor__full_name")
    ordering = ("-created_at",)
