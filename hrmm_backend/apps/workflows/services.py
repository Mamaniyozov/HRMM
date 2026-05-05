from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.notifications.services import create_notification
from apps.workflows.models import ApprovalHistory
from apps.users.models import User


ROLE_APPROVAL_MATRIX = {
    "UNIT_HEAD": {
        "pending_status": "PENDING_L2",
        "approved_status": "PENDING_L3",
        "next_level": 3,
    },
    "DEPT_HEAD": {
        "pending_status": "PENDING_L3",
        "approved_status": "PENDING_L4",
        "next_level": 4,
    },
    "DIRECTOR": {
        "pending_status": "PENDING_L4",
        "approved_status": "APPROVED",
        "next_level": 4,
    },
}


def _request_meta(request):
    return {
        "ip_address": request.META.get("REMOTE_ADDR"),
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
    }


def _create_history(report, approver, action, comment, previous_status, new_status, request):
    meta = _request_meta(request)
    return ApprovalHistory.objects.create(
        report_id=report,
        approver_id=approver,
        approval_level=report.current_approval_level,
        action=action,
        comment=comment or "",
        previous_status=previous_status,
        new_status=new_status,
        ip_address=meta["ip_address"],
        user_agent=meta["user_agent"],
    )


def _notify_users(users, *, title, message, notification_type, reference_type, reference_id):
    for user in users:
        create_notification(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_type=reference_type,
            reference_id=reference_id,
        )


def _next_approvers_for_report(report):
    if report.status == "PENDING_L2" and report.created_by.unit_id:
        return User.objects.filter(id=report.created_by.unit_id.head_user_id, is_active=True)
    if report.status == "PENDING_L3" and report.department_id:
        return User.objects.filter(id=report.department_id.head_user_id, is_active=True)
    if report.status == "PENDING_L4":
        return User.objects.filter(role="DIRECTOR", is_active=True)
    return User.objects.none()


@transaction.atomic
def perform_workflow_action(report, actor, action, comment, request):
    previous_status = report.status

    if action in {"APPROVE", "REJECT", "REQUEST_REVISION"} and actor.id == report.created_by_id:
        raise PermissionDenied("Report egasi o'z reportini tasdiqlay olmaydi.")

    if action == "SUBMIT":
        if actor.id != report.created_by_id:
            raise PermissionDenied("Hisobotni faqat uni yaratgan foydalanuvchi yubora oladi.")
        if report.status not in {"DRAFT", "REVISION"}:
            raise ValidationError("Faqat draft yoki revision holatidagi hisobot yuboriladi.")

        report.status = "PENDING_L2"
        report.current_approval_level = 2
        report.save(update_fields=["status", "current_approval_level", "updated_at"])
        _create_history(report, actor, action, comment, previous_status, report.status, request)
        _notify_users(
            _next_approvers_for_report(report),
            title="New report pending approval",
            message=f"{report.report_number} tasdiqlash uchun yuborildi.",
            notification_type="APPROVAL",
            reference_type="reports.Report",
            reference_id=report.id,
        )
        return report

    if action == "ARCHIVE":
        if actor.role != "DIRECTOR":
            raise PermissionDenied("Faqat direktor hisobotni arxivlay oladi.")
        if report.status != "APPROVED":
            raise ValidationError("Faqat approved holatdagi hisobot arxivlanadi.")

        report.status = "ARCHIVED"
        report.save(update_fields=["status", "updated_at"])
        _create_history(report, actor, action, comment, previous_status, report.status, request)
        create_notification(
            user=report.created_by,
            title="Report archived",
            message=f"{report.report_number} arxivlandi.",
            notification_type="INFO",
            reference_type="reports.Report",
            reference_id=report.id,
        )
        return report

    role_config = ROLE_APPROVAL_MATRIX.get(actor.role)
    if not role_config:
        raise PermissionDenied("Sizda tasdiqlash vakolati yo'q.")

    if report.status != role_config["pending_status"]:
        raise ValidationError("Hisobot sizning tasdiqlash bosqichingizda emas.")

    if action == "APPROVE":
        report.status = role_config["approved_status"]
        report.current_approval_level = role_config["next_level"]
    elif action == "REJECT":
        report.status = "REJECTED"
    elif action == "REQUEST_REVISION":
        report.status = "REVISION"
        report.current_approval_level = 1
    else:
        raise ValidationError("Noto'g'ri action yuborildi.")

    report.save(update_fields=["status", "current_approval_level", "updated_at"])
    _create_history(report, actor, action, comment, previous_status, report.status, request)

    if action == "APPROVE":
        if report.status == "APPROVED":
            create_notification(
                user=report.created_by,
                title="Report approved",
                message=f"{report.report_number} yakuniy tasdiqdan o'tdi.",
                notification_type="INFO",
                reference_type="reports.Report",
                reference_id=report.id,
            )
        else:
            _notify_users(
                _next_approvers_for_report(report),
                title="Report waiting for approval",
                message=f"{report.report_number} keyingi bosqichga o'tdi.",
                notification_type="APPROVAL",
                reference_type="reports.Report",
                reference_id=report.id,
            )
    elif action == "REJECT":
        create_notification(
            user=report.created_by,
            title="Report rejected",
            message=f"{report.report_number} rad etildi.",
            notification_type="REJECTION",
            reference_type="reports.Report",
            reference_id=report.id,
        )
    elif action == "REQUEST_REVISION":
        create_notification(
            user=report.created_by,
            title="Report sent for revision",
            message=f"{report.report_number} qayta ko'rib chiqish uchun qaytarildi.",
            notification_type="INFO",
            reference_type="reports.Report",
            reference_id=report.id,
        )
    return report
