from django.urls import path
from .views import (
    UserCreateView,
    UserDeleteView,
    UserListView,
    UserDetailView,
    UserUpdateView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user_list"),
    path("create/", UserCreateView.as_view(), name="user_create"),
    path("<uuid:user_id>/", UserDetailView.as_view(), name="user_detail"),
    path("<uuid:user_id>/update/", UserUpdateView.as_view(), name="user_update"),
    path("<uuid:user_id>/delete/", UserDeleteView.as_view(), name="user_delete"),
]
