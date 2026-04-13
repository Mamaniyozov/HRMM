from django.urls import path

from apps.leave_management.views import LeaveDetailView, LeaveListCreateView, LeaveReviewView


urlpatterns = [
    path("", LeaveListCreateView.as_view(), name="leave_list_create"),
    path("<uuid:leave_id>/", LeaveDetailView.as_view(), name="leave_detail"),
    path("<uuid:leave_id>/review/", LeaveReviewView.as_view(), name="leave_review"),
]
