"""AIDA javob shakllari — provider-agnostic dataclasslar.

Loyihada pydantic ishlatilmaydi (DRF serializers bilan ishlaydi), shuning uchun
bu yerda oddiy `dataclass` ishlatiladi — Gemini va Anthropic provider'lari
bir xil shaklda javob qaytarishi uchun umumiy interfeys.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class FunctionCall:
    """Provider tomonidan so'ralgan bitta function/tool chaqiruvi."""

    id: str
    name: str
    arguments: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] | None = None


@dataclass
class AidaResponse:
    """Provider'dan qaytadigan yakuniy javob."""

    text: str
    function_calls: list[FunctionCall] | None = None
    tokens_used: int = 0
    model: str = ""
    raw: Any = None
    """Provider-ichki xom javob (masalan Claude'ning assistant xabari yoki
    OpenAI-compat choice obyekti). Faqat tool-call round-trip uchun ishlatiladi
    — frontend'ga hech qachon serializatsiya qilinmaydi."""
