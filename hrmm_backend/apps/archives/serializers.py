from rest_framework import serializers

from apps.archives.models import ArchiveLog


class ArchiveLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchiveLog
        fields = [
            "id",
            "archived_at",
            "record_count",
            "file_size_kb",
            "status",
            "error_message",
        ]
