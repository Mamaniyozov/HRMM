import hashlib

from django.db.models import Count, Q
from django.http import FileResponse, Http404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from config.api_utils import paginate_queryset
from config.responses import api_success
from apps.reports.models import Report, ReportAttachment
from apps.reports.serializers import (
    ReportAttachmentSerializer,
    ReportCreateSerializer,
    ReportDetailSerializer,
    ReportListSerializer,
    ReportUpdateSerializer,
    ApprovalHistorySerializer,
    WorkflowActionSerializer,
)
from apps.workflows.services import perform_workflow_action


class IsAuthenticatedHRMM(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "id", None))


def _report_queryset_for_user(user):
    queryset = Report.objects.select_related("created_by", "department_id").prefetch_related(
        "attachments",
        "approval_history__approver_id",
    ).filter(is_deleted=False)

    if user.role == "DIRECTOR":
        return queryset
    if user.role == "DEPT_HEAD" and user.department_id_id:
        return queryset.filter(department_id=user.department_id)
    if user.role == "UNIT_HEAD" and user.unit_id_id:
        return queryset.filter(created_by__unit_id=user.unit_id)
    return queryset.filter(created_by=user)


class ReportListCreateView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        reports = _report_queryset_for_user(request.user).annotate(attachment_count=Count("attachments"))
        status_filter = request.query_params.get("status")
        department_id = request.query_params.get("department_id")
        search = request.query_params.get("search")

        if status_filter:
            reports = reports.filter(status=status_filter)
        if department_id:
            reports = reports.filter(department_id_id=department_id)
        if search:
            reports = reports.filter(Q(title__icontains=search) | Q(report_number__icontains=search))

        return paginate_queryset(request, reports.order_by("-created_at"), ReportListSerializer)

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save(
            created_by=request.user,
            department_id=serializer.validated_data.get("department_id") or request.user.department_id,
        )
        create_audit_log(
            actor=request.user,
            action="REPORT_CREATE",
            target_type="reports.Report",
            target_id=report.id,
            description=f"{report.report_number} report yaratildi",
            request=request,
        )
        return Response(
            ReportDetailSerializer(report, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, report_id):
        report = _report_queryset_for_user(request.user).filter(id=report_id).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        return api_success(data=ReportDetailSerializer(report, context={"request": request}).data)

    def put(self, request, report_id):
        report = Report.objects.filter(id=report_id, created_by=request.user, is_deleted=False).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        if report.status not in {"DRAFT", "REVISION"}:
            return api_success(
                message="Faqat draft yoki revision holatidagi reportni yangilash mumkin",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReportUpdateSerializer(report, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="REPORT_UPDATE",
            target_type="reports.Report",
            target_id=report.id,
            description=f"{report.report_number} report yangilandi",
            request=request,
        )
        return api_success(data=ReportDetailSerializer(report, context={"request": request}).data)

    def delete(self, request, report_id):
        report = Report.objects.filter(id=report_id, is_deleted=False).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        if request.user.id != report.created_by_id and request.user.role != "DIRECTOR":
            return api_success(message="Sizda reportni o'chirish vakolati yo'q", data=None, status_code=status.HTTP_403_FORBIDDEN)

        report.is_deleted = True
        report.save(update_fields=["is_deleted", "updated_at"])
        create_audit_log(
            actor=request.user,
            action="REPORT_DELETE",
            target_type="reports.Report",
            target_id=report.id,
            description=f"{report.report_number} report soft delete qilindi",
            request=request,
        )
        return api_success(message="Report deleted successfully")


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, report_id):
        report = _report_queryset_for_user(request.user).filter(id=report_id).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        history = report.approval_history.select_related("approver_id").all()
        return api_success(data=ApprovalHistorySerializer(history, many=True).data)


class ReportAttachmentListCreateView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, report_id):
        report = _report_queryset_for_user(request.user).filter(id=report_id).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        attachments = report.attachments.filter(is_deleted=False).select_related("upload_by")
        return api_success(data=ReportAttachmentSerializer(attachments, many=True, context={"request": request}).data)

    def post(self, request, report_id):
        report = Report.objects.filter(id=report_id, created_by=request.user).first()
        if not report:
            return api_success(
                message="Attachment qo'shish uchun report egasi bo'lishingiz kerak",
                data=None,
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if report.status not in {"DRAFT", "REVISION"}:
            return api_success(
                message="Faqat draft yoki revision holatidagi reportga attachment qo'shish mumkin",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return api_success(message="file maydoni yuborilishi kerak", data=None, status_code=status.HTTP_400_BAD_REQUEST)
        if uploaded_file.size > 10 * 1024 * 1024:
            return api_success(message="Fayl hajmi 10 MB dan oshmasligi kerak", data=None, status_code=status.HTTP_400_BAD_REQUEST)

        checksum = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            checksum.update(chunk)
        uploaded_file.seek(0)

        attachment = ReportAttachment.objects.create(
            report_id=report,
            file=uploaded_file,
            file_name=uploaded_file.name,
            file_type=uploaded_file.content_type or "application/octet-stream",
            file_path="",
            file_size=uploaded_file.size,
            checksum=checksum.hexdigest(),
            upload_by=request.user,
        )
        attachment.file_path = attachment.file.name
        attachment.save(update_fields=["file_path"])
        create_audit_log(
            actor=request.user,
            action="ATTACHMENT_UPLOAD",
            target_type="reports.ReportAttachment",
            target_id=attachment.id,
            description=f"{attachment.file_name} fayli yuklandi",
            request=request,
        )

        return api_success(
            data=ReportAttachmentSerializer(attachment, context={"request": request}).data,
            message="Attachment uploaded",
            status_code=status.HTTP_201_CREATED,
        )


class AttachmentDownloadView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, attachment_id):
        attachment = ReportAttachment.objects.select_related("report_id", "upload_by").filter(id=attachment_id, is_deleted=False).first()
        if not attachment:
            raise Http404("Attachment not found")

        report = _report_queryset_for_user(request.user).filter(id=attachment.report_id_id).first()
        if not report:
            return api_success(message="Attachment not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        response = FileResponse(attachment.file.open("rb"), as_attachment=True, filename=attachment.file_name)
        response["Content-Type"] = attachment.file_type or "application/octet-stream"
        return response


class AttachmentDeleteView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def delete(self, request, attachment_id):
        attachment = ReportAttachment.objects.select_related("report_id").filter(id=attachment_id, is_deleted=False).first()
        if not attachment:
            return api_success(message="Attachment not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        report = attachment.report_id
        if request.user.id != report.created_by_id and request.user.role != "DIRECTOR":
            return api_success(message="Sizda attachmentni o'chirish vakolati yo'q", data=None, status_code=status.HTTP_403_FORBIDDEN)
        if report.status not in {"DRAFT", "REVISION"}:
            return api_success(message="Faqat draft yoki revision report attachmenti o'chiriladi", data=None, status_code=status.HTTP_400_BAD_REQUEST)

        attachment.is_deleted = True
        attachment.save(update_fields=["is_deleted"])
        create_audit_log(
            actor=request.user,
            action="ATTACHMENT_DELETE",
            target_type="reports.ReportAttachment",
            target_id=attachment.id,
            description=f"{attachment.file_name} attachment soft delete qilindi",
            request=request,
        )
        return api_success(message="Attachment deleted successfully")


class ReportWorkflowActionView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request, report_id):
        report = Report.objects.select_related("created_by", "department_id").filter(id=report_id).first()
        if not report:
            return api_success(message="Report not found", data=None, status_code=status.HTTP_404_NOT_FOUND)

        serializer = WorkflowActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = perform_workflow_action(
            report=report,
            actor=request.user,
            action=serializer.validated_data["action"],
            comment=serializer.validated_data.get("comment", ""),
            request=request,
        )
        create_audit_log(
            actor=request.user,
            action=f"REPORT_{serializer.validated_data['action']}",
            target_type="reports.Report",
            target_id=report.id,
            description=f"{report.report_number} uchun {serializer.validated_data['action']} bajarildi",
            request=request,
        )
        return api_success(data=ReportDetailSerializer(report, context={"request": request}).data)
