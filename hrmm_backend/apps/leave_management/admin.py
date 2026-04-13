from django.contrib import admin

from apps.leave_management.models import LeaveRequest


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        "requested_by",
        "leave_type",
        "start_date",
        "end_date",
        "total_days",
        "status",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("leave_type", "status", "created_at")
    search_fields = ("requested_by__username", "requested_by__full_name", "reason", "review_comment")
    ordering = ("-created_at",)
