from django.contrib import admin
from apps.users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "full_name", "email", "role", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("username", "full_name", "email")
    ordering = ("-created_at",)
