from rest_framework import serializers

from config.uploads import ALLOWED_IMAGE_EXTENSIONS, validate_upload
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    screenshot_url = serializers.SerializerMethodField()
    notification_number = serializers.IntegerField(read_only=True)
    submitted_by_name = serializers.CharField(source="submitted_by.full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_number",
            "title",
            "message",
            "type",
            "reference_type",
            "reference_id",
            "status",
            "review_comment",
            "submitted_by",
            "submitted_by_name",
            "reviewed_by",
            "reviewed_by_name",
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

    def validate_screenshot(self, value):
        if not value:
            return value
        # Screenshots must be images only.
        safe_name = validate_upload(value, allowed_extensions=ALLOWED_IMAGE_EXTENSIONS)
        # Re-assign sanitised name to the file object so the storage backend
        # uses it when generating the upload path.
        try:
            value.name = safe_name
        except Exception:
            pass
        return value

    def create(self, validated_data):
        request = self.context["request"]
        reference_type = validated_data.get("reference_type") or ""
        review_status = None
        if reference_type in Notification.REVIEWABLE_REFERENCE_TYPES:
            review_status = "PENDING"
        notification = Notification(
            user_id=request.user,
            submitted_by=request.user,
            status=review_status,
            **validated_data,
        )
        notification.save()
        return notification


class NotificationReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT"])
    review_comment = serializers.CharField(required=False, allow_blank=True, default="")
