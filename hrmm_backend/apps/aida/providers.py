"""AIDA uchun provider-agnostic AI adapterlari — Gemini, Groq (OpenAI-compatible) va Anthropic.

Barcha providerlar bir xil `AidaProvider` interfeysini amalga oshiradi, shuning
uchun `apps.aida.services` qaysi provider ishlatilayotganini bilishi shart emas.
Almashtirish faqat `AI_PROVIDER` environment o'zgaruvchisi orqali bo'ladi.
"""

from __future__ import annotations

import json
import logging
import time
from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import Any

import anthropic
import openai
from django.conf import settings

from apps.aida.schemas import AidaResponse, FunctionCall
from apps.aida.tools import to_anthropic_format, to_openai_format

logger = logging.getLogger("hrmm.aida")

REQUEST_TIMEOUT = 30.0
MAX_RETRIES = 3
# 429 (rate limit) atayin bu ro'yxatda YO'Q: band bo'lganda darhol foydalanuvchiga
# tushunarli xabar qaytishi kerak, kutish/qayta urinish bilan kechiktirilmasdan.
RETRYABLE_EXCEPTIONS = (
    anthropic.APIConnectionError,
    anthropic.InternalServerError,
    openai.APIConnectionError,
    openai.InternalServerError,
)


def _with_retry(func, *args, **kwargs):
    """3 marta exponential backoff (0.5s, 1s, 2s) bilan qayta urinish."""
    delay = 0.5
    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            return func(*args, **kwargs)
        except RETRYABLE_EXCEPTIONS as exc:
            last_exc = exc
            if attempt == MAX_RETRIES - 1:
                break
            logger.warning("AIDA provider retry %s/%s: %s", attempt + 1, MAX_RETRIES, exc)
            time.sleep(delay)
            delay *= 2
    raise last_exc


class AidaProvider(ABC):
    """Gemini, Groq va Anthropic uchun umumiy interfeys."""

    @abstractmethod
    def generate(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> AidaResponse:
        """Bitta so'rov yuboradi, tool chaqiruvlari bo'lsa ham qaytaradi."""

    @abstractmethod
    def generate_with_tool_results(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, Any]],
        assistant_response: AidaResponse,
        tool_results: list[FunctionCall],
    ) -> AidaResponse:
        """Bajarilgan tool natijalarini provider'ga qaytarib, yakuniy javobni oladi."""

    @abstractmethod
    def stream(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> Iterator[str]:
        """Matn bo'laklarini generator sifatida qaytaradi (SSE uchun)."""


class _OpenAICompatibleProvider(AidaProvider):
    """Gemini va Groq uchun umumiy amalga oshirish — ikkalasi ham OpenAI-compatible
    endpoint va bir xil `openai` kutubxonasi orqali ishlaydi, farq faqat
    `base_url`/`api_key`/model default'ida. Konkret provider klasslari faqat
    `__init__`ni belgilaydi."""

    client: openai.OpenAI
    model: str
    max_tokens: int
    temperature: float
    provider_label: str = "OpenAI-compatible"

    def _build_messages(self, system_prompt: str, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [{"role": "system", "content": system_prompt}, *messages]

    def _parse_response(self, response) -> AidaResponse:
        choice = response.choices[0]
        text = choice.message.content or ""
        function_calls = None
        if choice.message.tool_calls:
            # Ba'zi modellar (masalan Groq'dagi Llama) bitta javobda bir nechta
            # tool_call qaytarishi mumkin — hammasi ro'yxatga yig'iladi va
            # apps.aida.services.generate_response ularni ketma-ket bajaradi.
            function_calls = [
                FunctionCall(
                    id=tc.id,
                    name=tc.function.name,
                    arguments=json.loads(tc.function.arguments or "{}"),
                )
                for tc in choice.message.tool_calls
            ]
        tokens_used = response.usage.total_tokens if response.usage else 0
        return AidaResponse(
            text=text,
            function_calls=function_calls,
            tokens_used=tokens_used,
            model=self.model,
            raw=choice.message,
        )

    def generate(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> AidaResponse:
        response = _with_retry(
            self.client.chat.completions.create,
            model=self.model,
            messages=self._build_messages(system_prompt, messages),
            tools=to_openai_format(),
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )
        return self._parse_response(response)

    def generate_with_tool_results(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, Any]],
        assistant_response: AidaResponse,
        tool_results: list[FunctionCall],
    ) -> AidaResponse:
        assistant_message = assistant_response.raw
        tool_result_messages = [
            {
                "role": "tool",
                "tool_call_id": fc.id,
                "content": json.dumps(fc.result, ensure_ascii=False),
            }
            for fc in tool_results
        ]
        full_messages = [
            *self._build_messages(system_prompt, messages),
            assistant_message,
            *tool_result_messages,
        ]
        response = _with_retry(
            self.client.chat.completions.create,
            model=self.model,
            messages=full_messages,
            tools=to_openai_format(),
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )
        return self._parse_response(response)

    def stream(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> Iterator[str]:
        # To'liq retry: agar oqim ochilgandan keyin uzilsa, butun so'rov qaytadan
        # boshlanadi (allaqachon yuborilgan matn frontend'da qoladi — bu
        # streaming uchun eng oddiy va yetarlicha to'g'ri yechim). 429'da
        # qayta urinilmaydi (RETRYABLE_EXCEPTIONS'da yo'q) — darhol ko'tariladi.
        delay = 0.5
        last_exc = None
        for attempt in range(MAX_RETRIES):
            try:
                stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=self._build_messages(system_prompt, messages),
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
                return
            except RETRYABLE_EXCEPTIONS as exc:
                last_exc = exc
                if attempt == MAX_RETRIES - 1:
                    break
                logger.warning(
                    "AIDA %s stream retry %s/%s: %s", self.provider_label, attempt + 1, MAX_RETRIES, exc
                )
                time.sleep(delay)
                delay *= 2
        raise last_exc


class GeminiProvider(_OpenAICompatibleProvider):
    """Google Gemini — OpenAI-compatible endpoint orqali (`openai` kutubxonasi)."""

    provider_label = "Gemini"

    def __init__(self):
        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY sozlanmagan.")
        self.model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
        self.max_tokens = getattr(settings, "AIDA_MAX_TOKENS", 1000)
        self.temperature = getattr(settings, "AIDA_TEMPERATURE", 0.3)
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url=getattr(
                settings,
                "GEMINI_BASE_URL",
                "https://generativelanguage.googleapis.com/v1beta/openai/",
            ),
            timeout=REQUEST_TIMEOUT,
        )


class GroqProvider(_OpenAICompatibleProvider):
    """Groq — OpenAI-compatible endpoint orqali (`openai` kutubxonasi)."""

    provider_label = "Groq"

    def __init__(self):
        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY sozlanmagan.")
        self.model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        self.max_tokens = getattr(settings, "AIDA_MAX_TOKENS", 1000)
        self.temperature = getattr(settings, "AIDA_TEMPERATURE", 0.3)
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url=getattr(settings, "GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
            timeout=REQUEST_TIMEOUT,
        )


class AnthropicProvider(AidaProvider):
    """Anthropic Claude — rasmiy `anthropic` kutubxonasi orqali."""

    def __init__(self):
        api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY sozlanmagan.")
        self.model = getattr(settings, "ANTHROPIC_MODEL", "claude-haiku-4-5")
        self.max_tokens = getattr(settings, "AIDA_MAX_TOKENS", 1000)
        self.temperature = getattr(settings, "AIDA_TEMPERATURE", 0.3)
        self.client = anthropic.Anthropic(api_key=api_key, timeout=REQUEST_TIMEOUT)

    def _parse_response(self, response) -> AidaResponse:
        text = ""
        function_calls = []
        for block in response.content:
            if block.type == "text":
                text += block.text
            elif block.type == "tool_use":
                function_calls.append(FunctionCall(id=block.id, name=block.name, arguments=block.input))
        tokens_used = response.usage.input_tokens + response.usage.output_tokens
        return AidaResponse(
            text=text,
            function_calls=function_calls or None,
            tokens_used=tokens_used,
            model=self.model,
            raw=response.content,
        )

    def generate(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> AidaResponse:
        response = _with_retry(
            self.client.messages.create,
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=messages,
            tools=to_anthropic_format(),
        )
        return self._parse_response(response)

    def generate_with_tool_results(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, Any]],
        assistant_response: AidaResponse,
        tool_results: list[FunctionCall],
    ) -> AidaResponse:
        tool_result_blocks = [
            {
                "type": "tool_result",
                "tool_use_id": fc.id,
                "content": json.dumps(fc.result, ensure_ascii=False),
            }
            for fc in tool_results
        ]
        full_messages = [
            *messages,
            {"role": "assistant", "content": assistant_response.raw},
            {"role": "user", "content": tool_result_blocks},
        ]
        response = _with_retry(
            self.client.messages.create,
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=full_messages,
            tools=to_anthropic_format(),
        )
        return self._parse_response(response)

    def stream(self, *, system_prompt: str, messages: list[dict[str, Any]]) -> Iterator[str]:
        # To'liq retry: agar oqim ochilgandan keyin uzilsa, butun so'rov qaytadan
        # boshlanadi (allaqachon yuborilgan matn frontend'da qoladi — bu
        # streaming uchun eng oddiy va yetarlicha to'g'ri yechim). 429'da
        # qayta urinilmaydi (RETRYABLE_EXCEPTIONS'da yo'q) — darhol ko'tariladi.
        delay = 0.5
        last_exc = None
        for attempt in range(MAX_RETRIES):
            try:
                with self.client.messages.stream(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    system=system_prompt,
                    messages=messages,
                ) as stream:
                    yield from stream.text_stream
                return
            except RETRYABLE_EXCEPTIONS as exc:
                last_exc = exc
                if attempt == MAX_RETRIES - 1:
                    break
                logger.warning("AIDA Anthropic stream retry %s/%s: %s", attempt + 1, MAX_RETRIES, exc)
                time.sleep(delay)
                delay *= 2
        raise last_exc


def get_provider() -> AidaProvider:
    """`AI_PROVIDER` env o'zgaruvchisi asosida provider tanlaydi."""
    provider_name = getattr(settings, "AI_PROVIDER", "gemini").lower()
    if provider_name == "anthropic":
        return AnthropicProvider()
    if provider_name == "gemini":
        return GeminiProvider()
    if provider_name == "groq":
        return GroqProvider()
    raise RuntimeError(
        f"Noma'lum AI_PROVIDER: {provider_name!r}. 'gemini', 'anthropic' yoki 'groq' bo'lishi kerak."
    )
