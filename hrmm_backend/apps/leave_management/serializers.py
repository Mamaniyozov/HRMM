from datetime import timedelta

from rest_framework import serializers

from apps.leave_management.models import LeaveRequest


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ["leave_type", "reason", "start_date", "end_date", "screenshot"]

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError("end_date start_date dan oldin bo'lishi mumkin emas.")

        request = self.context.get("request")
        if request and getattr(request, "user", None):
            overlapping_request = LeaveRequest.objects.filter(
                requested_by=request.user,
                status__in=["PENDING", "APPROVED"],
                start_date__lte=attrs["end_date"],
                end_date__gte=attrs["start_date"],
            ).exists()
            if overlapping_request:
                raise serializers.ValidationError("Bu sana oralig'ida allaqachon ta'til so'rovi mavjud.")
        return attrs

    def create(self, validated_data):
        total_days = (validated_data["end_date"] - validated_data["start_date"]) + timedelta(days=1)
        validated_data["total_days"] = total_days.days
        return super().create(validated_data)


class LeaveRequestListSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)
    screenshot_url = serializers.SerializerMethodField()
    leave_number = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "leave_number",
            "requested_by",
            "requested_by_name",
            "reviewed_by",
            "reviewed_by_name",
            "leave_type",
            "reason",
            "start_date",
            "end_date",
            "total_days",
            "status",
            "review_comment",
            "screenshot",
            "screenshot_url",
            "created_at",
            "updated_at",
        ]

    def get_screenshot_url(self, obj):
        request = self.context.get("request")
        if not obj.screenshot:
            return None
        if request:
            return request.build_absolute_uri(obj.screenshot.url)
        return obj.screenshot.url


class LeaveReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT", "CANCEL"])
    review_comment = serializers.CharField(required=False, allow_blank=True, default="")
