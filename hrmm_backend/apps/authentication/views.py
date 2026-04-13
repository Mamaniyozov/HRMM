from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from apps.audit.services import create_audit_log
from config.responses import api_success
from .serializers import LoginSerializer
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
                },
            },
            status_code=status.HTTP_200_OK,
        )
