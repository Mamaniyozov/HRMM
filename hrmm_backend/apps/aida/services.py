"""AIDA chat servisi — barcha AI chaqiruvlar shu fayl orqali o'tadi.

Provider tanlovi (Gemini / Anthropic) `apps.aida.providers.get_provider()` orqali
`AI_PROVIDER` environment o'zgaruvchisiga qarab amalga oshadi — bu faylda
provider-specific kod yo'q, faqat orkestratsiya (tarix, system prompt, tool-call
loop, xatolik handling).
"""

import logging

import anthropic
import openai
from django.conf import settings

from apps.aida.providers import get_provider
from apps.aida.schemas import AidaResponse
from apps.aida.system_prompt import build_system_prompt
from apps.aida.tools import execute_tool_call

logger = logging.getLogger("hrmm.aida")

MAX_HISTORY_MESSAGES = getattr(settings, "AIDA_MAX_HISTORY", 20)

# Anthropic va OpenAI-compatible (Gemini) SDK'lari bir xil nomlangan
# exception'larni eksport qiladi — ikkalasini ham bitta joyda ushlaymiz.
AUTH_ERRORS = (anthropic.AuthenticationError, openai.AuthenticationError)
NOT_FOUND_ERRORS = (anthropic.NotFoundError, openai.NotFoundError)
RATE_LIMIT_ERRORS = (anthropic.RateLimitError, openai.RateLimitError)
STATUS_ERRORS = (anthropic.APIStatusError, openai.APIStatusError)
CONNECTION_ERRORS = (anthropic.APIConnectionError, openai.APIConnectionError)


def describe_provider_error(exc: Exception) -> str:
    """Provider xatosini foydalanuvchiga tushunarli o'zbekcha xabarga aylantiradi.

    `generate_response` (POST /chat/) va SSE stream view ikkalasi ham shu
    funksiyadan foydalanadi — xabar matni bir joyda saqlanadi.
    """
    if isinstance(exc, AUTH_ERRORS):
        logger.error("AIDA provider authentication error: %s", exc)
        return "AIDA API kaliti noto'g'ri yoki muddati o'tgan."
    if isinstance(exc, NOT_FOUND_ERRORS):
        logger.error("AIDA provider not found error: %s", exc)
        return "AIDA modeli topilmadi. Model nomini tekshiring."
    if isinstance(exc, RATE_LIMIT_ERRORS):
        logger.error("AIDA provider rate limit error: %s", exc)
        return "AIDA hozircha band, birozdan keyin qayta urinib ko'ring."
    if isinstance(exc, STATUS_ERRORS):
        logger.error("AIDA provider error: %s — %s", exc.status_code, exc.message)
        if exc.status_code == 400 and "credit balance" in str(exc.message).lower():
            return (
                "AIDA xizmati uchun creditlar tugagan. Provayder konsolida "
                "(Anthropic: console.anthropic.com/settings/billing, Gemini: aistudio.google.com) "
                "billing bo'limini tekshiring."
            )
        if exc.status_code >= 500:
            return "AIDA xizmatida vaqtinchalik uzilish yuz berdi. Birozdan keyin urinib ko'ring."
        return f"AIDA xizmatida xatolik yuz berdi (HTTP {exc.status_code})."
    if isinstance(exc, CONNECTION_ERRORS):
        logger.error("AIDA provider connection error")
        return "AIDA xizmatiga ulanib bo'lmadi. Internet aloqasini tekshiring."
    logger.exception("Unexpected AIDA provider error: %s", exc)
    return "AIDA bilan aloqada kutilmagan xatolik yuz berdi."


def build_conversation_messages(session, user_message):
    """Convert stored chat history (Postgres, ChatMessage) into provider messages format."""
    history = session.messages.order_by("created_at").values("role", "content")[
        :MAX_HISTORY_MESSAGES
    ]
    messages = [{"role": msg["role"], "content": msg["content"]} for msg in history]
    messages.append({"role": "user", "content": user_message})
    return messages


def generate_response(
    *,
    session,
    user_message,
    user,
    current_language,
    current_page,
    current_report_id,
    voice_mode,
    request,
) -> AidaResponse:
    """AI provider'dan javob oladi, kerak bo'lsa function call'larni RBAC bilan bajaradi.

    Function-call loop faqat BITTA iteratsiya bilan cheklangan: model tool
    so'rasa, natija bajarilib qaytariladi va yakuniy matn javobi olinadi.
    Bu ortiqcha murakkablikni (cheksiz tool-loop) oldini oladi.
    """
    system_prompt = build_system_prompt(
        user=user,
        current_language=current_language,
        current_page=current_page,
        current_report_id=current_report_id,
        voice_mode=voice_mode,
    )
    messages = build_conversation_messages(session, user_message)

    try:
        provider = get_provider()
        response = provider.generate(system_prompt=system_prompt, messages=messages)

        if response.function_calls:
            for fc in response.function_calls:
                fc.result = execute_tool_call(fc.name, fc.arguments, actor=user, request=request)
            response = provider.generate_with_tool_results(
                system_prompt=system_prompt,
                messages=messages,
                assistant_response=response,
                tool_results=response.function_calls,
            )
        return response

    except RuntimeError:
        raise
    except Exception as exc:
        raise RuntimeError(describe_provider_error(exc))


def chat_with_claude(
    *,
    session,
    user_message,
    user,
    current_language,
    current_page,
    current_report_id,
    voice_mode,
    request=None,
):
    """Backward-compat wrapper — mavjud views.py shu nom bilan chaqiradi.

    Qaytaradi: dict {"content": str, "tokens_used": int, "model": str,
    "function_calls": list[dict] | None}
    """
    response = generate_response(
        session=session,
        user_message=user_message,
        user=user,
        current_language=current_language,
        current_page=current_page,
        current_report_id=current_report_id,
        voice_mode=voice_mode,
        request=request,
    )
    return {
        "content": response.text,
        "tokens_used": response.tokens_used,
        "model": response.model,
        "function_calls": (
            [{"name": fc.name, "arguments": fc.arguments, "result": fc.result} for fc in response.function_calls]
            if response.function_calls
            else None
        ),
    }
