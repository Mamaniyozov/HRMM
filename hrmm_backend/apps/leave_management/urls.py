from django.urls import path

from apps.leave_management.views import LeaveCalendarView, LeaveDetailView, LeaveListCreateView, LeaveReviewView


urlpatterns = [
    path("", LeaveListCreateView.as_view(), name="leave_list_create"),
    path("calendar/", LeaveCalendarView.as_view(), name="leave_calendar"),
    path("<uuid:leave_id>/", LeaveDetailView.as_view(), name="leave_detail"),
    path("<uuid:leave_id>/review/", LeaveReviewView.as_view(), name="leave_review"),
]
