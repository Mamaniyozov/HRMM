import logging

from rest_framework import status
from rest_framework.views import APIView

from apps.aida.models import ChatMessage, ChatSession
from apps.aida.serializers import (
    ChatMessageSerializer,
    ChatRequestSerializer,
    ChatSessionSerializer,
)
from apps.aida.services import chat_with_claude
from apps.reports.views import IsAuthenticatedHRMM
from config.responses import api_success

logger = logging.getLogger("hrmm.aida")


class AidaChatView(APIView):
    """POST /api/v1/aida/chat/ — AIDA AI yordamchisiga xabar yuborish."""

    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        current_language = user.language or "uz"
        current_page = data.get("current_page", "")
        current_report_id = data.get("current_report_id")
        voice_mode = data.get("voice_mode", False)
        user_message = data["message"]

        session_id = data.get("session_id")
        if session_id:
            session = ChatSession.objects.filter(id=session_id, user=user, is_active=True).first()
            if not session:
                return api_success(
                    message="Sessiya topilmadi yoki yopilgan.",
                    data=None,
                    status_code=status.HTTP_404_NOT_FOUND,
                )
        else:
            session = ChatSession.objects.create(user=user, title=user_message[:80])

        ChatMessage.objects.create(
            session=session,
            role="user",
            content=user_message,
            language=current_language,
            voice_mode=voice_mode,
            current_page=current_page,
            current_report_id=current_report_id,
        )

        try:
            result = chat_with_claude(
                session=session,
                user_message=user_message,
                user=user,
                current_language=current_language,
                current_page=current_page,
                current_report_id=current_report_id,
                voice_mode=voice_mode,
            )
        except RuntimeError as exc:
            ChatMessage.objects.create(
                session=session,
                role="assistant",
                content=str(exc),
                language=current_language,
                voice_mode=voice_mode,
                current_page=current_page,
            )
            return api_success(
                message=str(exc),
                data={"session_id": str(session.id), "error": True},
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        assistant_msg = ChatMessage.objects.create(
            session=session,
            role="assistant",
            content=result["content"],
            language=current_language,
            voice_mode=voice_mode,
            current_page=current_page,
            tokens_used=result["tokens_used"],
        )

        if not session.title and session.messages.count() <= 2:
            session.title = user_message[:80]
            session.save(update_fields=["title"])

        return api_success(
            data={
                "session_id": str(session.id),
                "message_id": str(assistant_msg.id),
                "content": result["content"],
                "model": result["model"],
                "tokens_used": result["tokens_used"],
                "voice_mode": voice_mode,
            },
            message="AIDA javob berdi.",
        )


class AidaSessionListView(APIView):
    """GET /api/v1/aida/sessions/ — foydalanuvchi sessiyalari ro'yxati."""

    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user, is_active=True).order_by("-updated_at")[:20]
        data = []
        for s in sessions:
            data.append(
                {
                    "id": str(s.id),
                    "title": s.title,
                    "message_count": s.messages.count(),
                    "updated_at": s.updated_at.isoformat(),
                }
            )
        return api_success(data=data)


class AidaSessionDetailView(APIView):
    """GET /api/v1/aida/sessions/<id>/ — sessiya tarixi.
    DELETE — sessiyani yopish."""

    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, session_id):
        session = ChatSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return api_success(message="Sessiya topilmadi.", data=None, status_code=status.HTTP_404_NOT_FOUND)
        messages = session.messages.order_by("created_at")
        return api_success(
            data={
                "session": ChatSessionSerializer(session).data,
                "messages": ChatMessageSerializer(messages, many=True).data,
            }
        )

    def delete(self, request, session_id):
        session = ChatSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return api_success(message="Sessiya topilmadi.", data=None, status_code=status.HTTP_404_NOT_FOUND)
        session.is_active = False
        session.save(update_fields=["is_active", "updated_at"])
        return api_success(message="Sessiya yopildi.")
