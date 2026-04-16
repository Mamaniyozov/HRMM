from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from apps.audit.services import create_audit_log
from config.responses import api_success
from apps.reports.views import IsAuthenticatedHRMM
from .serializers import LoginSerializer, LogoutSerializer, MeSerializer, PasswordChangeSerializer
from .tokens import get_tokens_for_user




class LoginView(APIView):
    authentication_classes = []  # login uchun auth keremas
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at", "updated_at"])
        create_audit_log(
            actor=user,
            action="LOGIN",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} tizimga kirdi",
            request=request,
        )

        return api_success(
            message="Login successful",
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "job_role": user.job_role,
                    "job_level": user.job_level,
                },
            },
            status_code=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        return api_success(data=MeSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="LOGOUT",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} tizimdan chiqdi",
            request=request,
        )
        return api_success(message="Logout successful")


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="PASSWORD_CHANGE",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} parolini yangiladi",
            request=request,
        )
        return api_success(message="Password changed successfully")
