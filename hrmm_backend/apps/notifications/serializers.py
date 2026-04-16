from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "reference_type",
            "reference_id",
            "is_read",
            "read_at",
            "created_at",
        ]
