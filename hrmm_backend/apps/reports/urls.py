from django.urls import path

from apps.reports.views import (
    AttachmentDeleteView,
    AttachmentDownloadView,
    ReportAttachmentListCreateView,
    ReportDetailView,
    ReportHistoryView,
    ReportListCreateView,
    ReportWorkflowActionView,
)


urlpatterns = [
    path("", ReportListCreateView.as_view(), name="report_list_create"),
    path("<uuid:report_id>/", ReportDetailView.as_view(), name="report_detail"),
    path("<uuid:report_id>/history/", ReportHistoryView.as_view(), name="report_history"),
    path("<uuid:report_id>/attachments/", ReportAttachmentListCreateView.as_view(), name="report_attachments"),
    path("<uuid:report_id>/actions/", ReportWorkflowActionView.as_view(), name="report_action"),
    path("attachments/<uuid:attachment_id>/download/", AttachmentDownloadView.as_view(), name="attachment_download"),
    path("attachments/<uuid:attachment_id>/", AttachmentDeleteView.as_view(), name="attachment_delete"),
]
