from apps.audit.models import AuditLog


def create_audit_log(*, actor=None, action="", target_type="", target_id=None, description="", request=None):
    ip_address = None
    user_agent = ""
    if request is not None:
        ip_address = request.META.get("REMOTE_ADDR")
        user_agent = request.META.get("HTTP_USER_AGENT", "")

    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else "",
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
    )
