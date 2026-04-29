from rest_framework.views import APIView
from rest_framework import status, permissions
from django.db.models import Q
from apps.audit.services import create_audit_log
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset
from config.responses import api_success
from apps.users.models import User, UserFeedback
from .serializers import (
    UserCreateSerializer,
    UserDetailSerializer,
    UserFeedbackSerializer,
    UserUpdateSerializer,
)


# --- Custom permission: only DIRECTOR can manage users ---
class IsDirector(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request.user, "id", None)) and getattr(request.user, "role", None) == "DIRECTOR"


# --- Create user ---
class UserCreateView(APIView):
    permission_classes = [IsDirector]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        create_audit_log(
            actor=request.user,
            action="USER_CREATE",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} foydalanuvchisi yaratildi",
            request=request,
        )
        return api_success(message="User successfully created", data={"id": str(user.id)}, status_code=status.HTTP_201_CREATED)


# --- List users ---
class UserListView(APIView):
    permission_classes = [IsDirector]

    def get(self, request):
        users = User.objects.filter(is_active=True).select_related("department_id", "unit_id").order_by("-created_at")
        search = request.query_params.get("search")
        role = request.query_params.get("role")
        job_role = request.query_params.get("job_role")
        job_level = request.query_params.get("job_level")

        if search:
            users = users.filter(
                Q(username__icontains=search) | Q(full_name__icontains=search) | Q(email__icontains=search)
            )
        if role:
            users = users.filter(role=role)
        if job_role:
            users = users.filter(job_role=job_role)
        if job_level:
            users = users.filter(job_level=job_level)

        return paginate_queryset(request, users, UserDetailSerializer)


# --- Single user detail ---
class UserDetailView(APIView):
    permission_classes = [IsDirector]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return api_success(message="User not found", data=None, status_code=404)

        serializer = UserDetailSerializer(user)
        return api_success(data=serializer.data)


# --- Update user ---
class UserUpdateView(APIView):
    permission_classes = [IsDirector]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return api_success(message="User not found", data=None, status_code=404)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="USER_UPDATE",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} foydalanuvchisi yangilandi",
            request=request,
        )

        return api_success(message="User updated successfully")


class UserDeleteView(APIView):
    permission_classes = [IsDirector]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return api_success(message="User not found", data=None, status_code=404)

        if request.user.id == user.id:
            return api_success(message="O'zingizni delete qila olmaysiz", data=None, status_code=400)

        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        create_audit_log(
            actor=request.user,
            action="USER_DELETE",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} foydalanuvchisi deactivate qilindi",
            request=request,
        )
        return api_success(message="User deleted successfully")


class UserFeedbackListCreateView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        feedback = UserFeedback.objects.select_related("author").all()
        return api_success(data=UserFeedbackSerializer(feedback, many=True).data)

    def post(self, request):
        serializer = UserFeedbackSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save()
        create_audit_log(
            actor=request.user,
            action="USER_FEEDBACK_CREATE",
            target_type="users.UserFeedback",
            target_id=feedback.id,
            description=f"{request.user.username} feedback qoldirdi",
            request=request,
        )
        return api_success(message="Feedback saved", data=UserFeedbackSerializer(feedback).data, status_code=status.HTTP_201_CREATED)
