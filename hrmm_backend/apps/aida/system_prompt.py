"""AIDA system prompt — HRMM ichki AI yordamchisi uchun yo'riqnoma.

Asosiy matn `apps/aida/prompts/aida_system_prompt.md` faylida saqlanadi.
Runtime'da foydalanuvchi konteksti (role, language, page va h.k.) shu
promptga dinamik ravishda qo'shib yuboriladi.
"""

from datetime import date
from pathlib import Path

_PROMPT_PATH = Path(__file__).parent / "prompts" / "aida_system_prompt.md"


def _load_template() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def build_system_prompt(*, user, current_language, current_page, current_report_id, voice_mode):
    """Build the full system prompt with runtime context injected."""
    user_context = {
        "id": str(user.id),
        "full_name": user.full_name,
        "role": user.role,
        "department": getattr(user.department_id, "name", None) if user.department_id else None,
        "unit": getattr(user.unit_id, "name", None) if user.unit_id else None,
    }

    return _load_template().format(
        user_context=user_context,
        current_language=current_language,
        current_page=current_page or "unknown",
        current_report_id=current_report_id or "none",
        current_date=date.today().isoformat(),
        voice_mode=voice_mode,
    )
