from django.urls import path

from apps.reports.views import (
    ReportAttachmentListCreateView,
    ReportDetailView,
    ReportListCreateView,
    ReportWorkflowActionView,
)


urlpatterns = [
    path("", ReportListCreateView.as_view(), name="report_list_create"),
    path("<uuid:report_id>/", ReportDetailView.as_view(), name="report_detail"),
    path("<uuid:report_id>/attachments/", ReportAttachmentListCreateView.as_view(), name="report_attachments"),
    path("<uuid:report_id>/actions/", ReportWorkflowActionView.as_view(), name="report_action"),
]
