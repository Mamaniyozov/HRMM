from rest_framework import serializers

from apps.reports.models import Report, ReportAttachment
from apps.workflows.models import ApprovalHistory


class ReportAttachmentSerializer(serializers.ModelSerializer):
    upload_by_name = serializers.CharField(source="upload_by.full_name", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ReportAttachment
        fields = [
            "id",
            "file",
            "file_url",
            "file_name",
            "file_type",
            "file_path",
            "file_size",
            "checksum",
            "upload_by",
            "upload_by_name",
            "is_deleted",
            "created_at",
        ]
        read_only_fields = (
            "id",
            "file_url",
            "file_name",
            "file_type",
            "file_path",
            "file_size",
            "checksum",
            "upload_by",
            "upload_by_name",
            "created_at",
        )

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "report_number",
            "title",
            "summary",
            "content",
            "category_id",
            "department_id",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        department = attrs.get("department_id")
        report_number = attrs.get("report_number")

        if report_number and not report_number.strip():
            raise serializers.ValidationError({"report_number": "Report number bo'sh bo'lishi mumkin emas."})

        if request and request.user.role != "DIRECTOR":
            if department and request.user.department_id and department.id != request.user.department_id.id:
                raise serializers.ValidationError(
                    {"department_id": "Faqat o'zingizning departmentingizga report yarata olasiz."}
                )

        return attrs


class ReportListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    department_name = serializers.CharField(source="department_id.name", read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "report_number",
            "title",
            "status",
            "current_approval_level",
            "department_id",
            "department_name",
            "created_by",
            "created_by_name",
            "attachment_count",
            "created_at",
            "updated_at",
        ]


class ApprovalHistorySerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source="approver_id.full_name", read_only=True)

    class Meta:
        model = ApprovalHistory
        fields = [
            "id",
            "approval_level",
            "action",
            "comment",
            "previous_status",
            "new_status",
            "approver_id",
            "approver_name",
            "ip_address",
            "user_agent",
            "created_at",
        ]


class ReportDetailSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    department_name = serializers.CharField(source="department_id.name", read_only=True)
    attachments = ReportAttachmentSerializer(many=True, read_only=True)
    approval_history = ApprovalHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "report_number",
            "title",
            "summary",
            "content",
            "category_id",
            "department_id",
            "department_name",
            "created_by",
            "created_by_name",
            "status",
            "current_approval_level",
            "attachments",
            "approval_history",
            "created_at",
            "updated_at",
        ]


class WorkflowActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["SUBMIT", "APPROVE", "REJECT", "REQUEST_REVISION", "ARCHIVE"]
    )
    comment = serializers.CharField(allow_blank=True, required=False, default="")
