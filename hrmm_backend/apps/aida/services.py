"""Anthropic Claude API integratsiyasi — AIDA AI yordamchisi uchun."""

import logging

import anthropic

from django.conf import settings

from apps.aida.system_prompt import build_system_prompt

logger = logging.getLogger("hrmm.aida")

CLAUDE_MODEL = getattr(settings, "AIDA_MODEL", "claude-sonnet-4-20250514")
MAX_TOKENS = getattr(settings, "AIDA_MAX_TOKENS", 1024)
TEMPERATURE = getattr(settings, "AIDA_TEMPERATURE", 0.7)
MAX_HISTORY_MESSAGES = getattr(settings, "AIDA_MAX_HISTORY", 20)


def _get_client():
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "") or ""
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY sozlanmagan.")
    return anthropic.Anthropic(api_key=api_key)


def _build_messages(session, user_message):
    """Convert stored chat history into Claude API messages format."""
    history = session.messages.order_by("created_at").values("role", "content")[
        :MAX_HISTORY_MESSAGES
    ]
    messages = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages


def chat_with_claude(
    *,
    session,
    user_message,
    user,
    current_language,
    current_page,
    current_report_id,
    voice_mode,
):
    """Send a chat request to Claude and return the response text.

    Returns:
        dict: {"content": str, "tokens_used": int, "model": str}
    """
    system_prompt = build_system_prompt(
        user=user,
        current_language=current_language,
        current_page=current_page,
        current_report_id=current_report_id,
        voice_mode=voice_mode,
    )

    messages = _build_messages(session, user_message)

    try:
        client = _get_client()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            system=system_prompt,
            messages=messages,
        )
        content = ""
        for block in response.content:
            if hasattr(block, "text"):
                content += block.text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens
        return {
            "content": content,
            "tokens_used": tokens_used,
            "model": CLAUDE_MODEL,
        }
    except anthropic.APIStatusError as exc:
        logger.error("Claude API error: %s — %s", exc.status_code, exc.message)
        if exc.status_code == 401:
            raise RuntimeError("AIDA API kaliti noto'g'ri yoki muddati o'tgan.")
        if exc.status_code == 429:
            raise RuntimeError("AIDA so'rovlar chegarasiga yetildi. Birozdan keyin urinib ko'ring.")
        raise RuntimeError(f"AIDA xizmatida xatolik yuz berdi (HTTP {exc.status_code}).")
    except anthropic.APIConnectionError:
        logger.error("Claude API connection error")
        raise RuntimeError("AIDA xizmatiga ulanib bo'lmadi. Internet aloqasini tekshiring.")
    except Exception as exc:
        logger.exception("Unexpected Claude API error: %s", exc)
        raise RuntimeError("AIDA bilan aloqada kutilmagan xatolik yuz berdi.")
