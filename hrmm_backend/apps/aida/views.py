import json

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.views import APIView

from apps.aida.models import ChatMessage, ChatSession
from apps.aida.providers import get_provider
from apps.aida.serializers import (
    ChatMessageSerializer,
    ChatRequestSerializer,
    ChatSessionSerializer,
    ConversationListSerializer,
)
from apps.aida.services import build_conversation_messages, chat_with_claude, describe_provider_error
from apps.aida.system_prompt import build_system_prompt
from apps.aida.throttling import AidaChatThrottle
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset
from config.responses import api_success


class AidaChatView(APIView):
    """POST /api/v1/aida/chat/ — AIDA AI yordamchisiga xabar yuborish."""

    permission_classes = [IsAuthenticatedHRMM]
    throttle_classes = [AidaChatThrottle]

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

        conversation_id = data.get("conversation_id")
        if conversation_id:
            session = ChatSession.objects.filter(id=conversation_id, user=user, is_active=True).first()
            if not session:
                return api_success(
                    message="Suhbat topilmadi yoki yopilgan.",
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
                request=request,
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
                data={"conversation_id": str(session.id), "error": True},
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
            tool_calls=result["function_calls"],
        )

        if not session.title and session.messages.count() <= 2:
            session.title = user_message[:80]
            session.save(update_fields=["title"])

        return api_success(
            data={
                "conversation_id": str(session.id),
                "message_id": str(assistant_msg.id),
                "content": result["content"],
                "model": result["model"],
                "tokens_used": result["tokens_used"],
                "voice_mode": voice_mode,
                "function_calls": result["function_calls"],
            },
            message="AIDA javob berdi.",
        )


class AidaChatStreamView(APIView):
    """GET /api/v1/aida/chat/stream/ — SSE orqali AIDA javobini oqim ko'rinishida olish.

    Query params: message (majburiy), conversation_id, current_page, current_report_id, voice_mode.
    Diqqat: streaming rejimida function-calling ishlatilmaydi (faqat matn oqimi) —
    tool chaqiruvlari kerak bo'lgan so'rovlar uchun oddiy POST /chat/ endpointidan foydalaning.
    Brauzerning native EventSource'i custom header (Authorization) qo'llamaydi —
    frontend `fetch()` + `ReadableStream` bilan token'ni header orqali yuborishi kerak.
    """

    permission_classes = [IsAuthenticatedHRMM]
    throttle_classes = [AidaChatThrottle]

    def get(self, request):
        serializer = ChatRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        current_language = user.language or "uz"
        current_page = data.get("current_page", "")
        current_report_id = data.get("current_report_id")
        voice_mode = data.get("voice_mode", False)
        user_message = data["message"]

        conversation_id = data.get("conversation_id")
        if conversation_id:
            session = ChatSession.objects.filter(id=conversation_id, user=user, is_active=True).first()
            if not session:
                return api_success(
                    message="Suhbat topilmadi yoki yopilgan.",
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

        system_prompt = build_system_prompt(
            user=user,
            current_language=current_language,
            current_page=current_page,
            current_report_id=current_report_id,
            voice_mode=voice_mode,
        )
        messages = build_conversation_messages(session, user_message)

        def event_stream():
            full_text = []
            try:
                provider = get_provider()
                for delta in provider.stream(system_prompt=system_prompt, messages=messages):
                    full_text.append(delta)
                    yield f"data: {json.dumps({'delta': delta}, ensure_ascii=False)}\n\n"
            except Exception as exc:  # noqa: BLE001 — SSE ichida xatolikni oqim orqali yuborish kerak
                message = describe_provider_error(exc)
                yield f"event: error\ndata: {json.dumps({'message': message}, ensure_ascii=False)}\n\n"
                return

            content = "".join(full_text)
            assistant_msg = ChatMessage.objects.create(
                session=session,
                role="assistant",
                content=content,
                language=current_language,
                voice_mode=voice_mode,
                current_page=current_page,
            )
            if not session.title and session.messages.count() <= 2:
                session.title = user_message[:80]
                session.save(update_fields=["title"])

            yield "event: done\ndata: {}\n\n".format(
                json.dumps(
                    {
                        "conversation_id": str(session.id),
                        "message_id": str(assistant_msg.id),
                    },
                    ensure_ascii=False,
                )
            )

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class AidaConversationListCreateView(APIView):
    """GET /api/v1/aida/conversations/ — foydalanuvchi suhbatlari ro'yxati (sahifalangan).
    POST — yangi bo'sh suhbat yaratish."""

    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        conversations = ChatSession.objects.filter(user=request.user, is_active=True).order_by("-updated_at")
        return paginate_queryset(request, conversations, ConversationListSerializer, default_page_size=20)

    def post(self, request):
        session = ChatSession.objects.create(user=request.user)
        return api_success(
            data=ConversationListSerializer(session).data,
            message="Yangi suhbat yaratildi.",
            status_code=status.HTTP_201_CREATED,
        )


class AidaConversationDetailView(APIView):
    """GET /api/v1/aida/conversations/<id>/ — suhbat + barcha xabarlari.
    DELETE — suhbatni yopish (soft delete)."""

    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request, conversation_id):
        session = ChatSession.objects.filter(id=conversation_id, user=request.user).first()
        if not session:
            return api_success(message="Suhbat topilmadi.", data=None, status_code=status.HTTP_404_NOT_FOUND)
        messages = session.messages.order_by("created_at")
        return api_success(
            data={
                "conversation": ChatSessionSerializer(session).data,
                "messages": ChatMessageSerializer(messages, many=True).data,
            }
        )

    def delete(self, request, conversation_id):
        session = ChatSession.objects.filter(id=conversation_id, user=request.user).first()
        if not session:
            return api_success(message="Suhbat topilmadi.", data=None, status_code=status.HTTP_404_NOT_FOUND)
        session.is_active = False
        session.save(update_fields=["is_active", "updated_at"])
        return api_success(message="Suhbat o'chirildi.")
