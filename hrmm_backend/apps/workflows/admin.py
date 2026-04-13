from django.contrib import admin
from apps.workflows.models import ApprovalHistory


@admin.register(ApprovalHistory)
class ApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "report_id",
        "approver_id",
        "approval_level",
        "action",
        "previous_status",
        "new_status",
        "created_at",
    )
    list_filter = ("action", "approval_level", "new_status", "created_at")
    search_fields = ("comment",)
    ordering = ("-created_at",)
