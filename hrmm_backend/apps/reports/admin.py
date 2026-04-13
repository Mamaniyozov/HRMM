from django.contrib import admin
from apps.reports.models import Report, ReportAttachment


class ReportAttachmentInline(admin.TabularInline):
    model = ReportAttachment
    extra = 0
    fields = ("file_name", "file_type", "file_size", "upload_by", "is_deleted", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "report_number",
        "title",
        "department_id",
        "status",
        "current_approval_level",
        "created_by",
        "created_at",
    )
    list_filter = ("status", "department_id", "created_at")
    search_fields = ("report_number", "title", "summary")
    ordering = ("-created_at",)
    inlines = [ReportAttachmentInline]


@admin.register(ReportAttachment)
class ReportAttachmentAdmin(admin.ModelAdmin):
    list_display = ("file_name", "report_id", "file_type", "file_size", "upload_by", "is_deleted", "created_at")
    list_filter = ("file_type", "is_deleted", "created_at")
    search_fields = ("file_name", "checksum", "file_path")
    ordering = ("-created_at",)
