from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        if request.user.role != "DIRECTOR":
            return paginate_queryset(request, AuditLog.objects.none(), AuditLogSerializer)

        logs = AuditLog.objects.select_related("actor").order_by("-created_at")
        action = request.query_params.get("action")
        target_type = request.query_params.get("target_type")

        if action:
            logs = logs.filter(action=action)
        if target_type:
            logs = logs.filter(target_type=target_type)

        return paginate_queryset(request, logs, AuditLogSerializer)
