from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    screenshot_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "reference_type",
            "reference_id",
            "screenshot",
            "screenshot_url",
            "is_read",
            "read_at",
            "created_at",
        ]

    def get_screenshot_url(self, obj):
        request = self.context.get("request")
        if not obj.screenshot:
            return None
        if request:
            return request.build_absolute_uri(obj.screenshot.url)
        return obj.screenshot.url


class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["title", "message", "type", "reference_type", "reference_id", "screenshot"]

    def create(self, validated_data):
        request = self.context["request"]
        return Notification.objects.create(user_id=request.user, **validated_data)
