from django.contrib import admin

from apps.archives.models import ArchiveLog


@admin.register(ArchiveLog)
class ArchiveLogAdmin(admin.ModelAdmin):
    list_display = ("archived_at", "record_count", "file_size_kb", "status")
    list_filter = ("status",)
    readonly_fields = ("archived_at", "record_count", "file_size_kb", "status", "error_message")
