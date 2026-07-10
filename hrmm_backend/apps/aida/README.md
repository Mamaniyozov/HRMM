# AIDA — provider-agnostic AI yordamchi

AIDA barcha AI chaqiruvlarini bitta joydan (`apps/aida/services.py`) boshqaradi.
Provider (Google Gemini yoki Anthropic Claude) `AI_PROVIDER` environment
o'zgaruvchisi orqali tanlanadi — kodni o'zgartirish shart emas.

## Fayl tuzilishi

| Fayl | Vazifasi |
|---|---|
| `services.py` | Orkestratsiya: tarix, system prompt, tool-call loop, xatolik handling |
| `providers.py` | `GeminiProvider` (OpenAI-compatible endpoint) va `AnthropicProvider` (rasmiy `anthropic` SDK) |
| `tools.py` | Function-calling tool definitionlari + ikkala formatga konvertor + RBAC-gated executor |
| `schemas.py` | `FunctionCall` / `AidaResponse` dataclasslari |
| `system_prompt.py` + `prompts/aida_system_prompt.md` | System prompt shabloni |
| `throttling.py` | `AI_PROVIDER`dan mustaqil, foydalanuvchi bo'yicha 10/daqiqa rate limit |
| `views.py` | `POST /api/v1/aida/chat/` va `GET /api/v1/aida/chat/stream/` (SSE) |

## Gemini'dan Anthropic'ga o'tish (production)

Faqat **2 ta environment o'zgaruvchisini** almashtirish kifoya:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

`ANTHROPIC_MODEL` (default `claude-haiku-4-5`) va boshqa sozlamalar o'zgarishsiz qoladi.
Orqaga (Anthropic'dan Gemini'ga) qaytish uchun ham xuddi shu — `AI_PROVIDER=gemini` +
`GEMINI_API_KEY` yetarli.

## Environment o'zgaruvchilari

| O'zgaruvchi | Default | Izoh |
|---|---|---|
| `AI_PROVIDER` | `gemini` | `gemini` yoki `anthropic` |
| `GEMINI_API_KEY` | — | Gemini uchun majburiy (`AI_PROVIDER=gemini` bo'lsa) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | |
| `GEMINI_BASE_URL` | Google'ning rasmiy OpenAI-compat URL'i | Odatda o'zgartirilmaydi |
| `ANTHROPIC_API_KEY` | — | Anthropic uchun majburiy (`AI_PROVIDER=anthropic` bo'lsa) |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5` | |
| `AIDA_MAX_TOKENS` | `1000` | Ikkala provider uchun umumiy |
| `AIDA_TEMPERATURE` | `0.3` | Ikkala provider uchun umumiy |
| `AIDA_MAX_HISTORY` | `20` | Kontekstga qo'shiladigan oxirgi xabarlar soni |
| `REDIS_URL` | — | Bo'lmasa Django LocMemCache'ga o'tadi (rate limit ko'p worker orasida noto'g'ri hisoblanishi mumkin) |

## RBAC va function calling

AI hech qachon to'g'ridan-to'g'ri ma'lumotlar bazasini o'zgartirmaydi. Har bir
function call (`create_report`, `submit_report`, `approve_report`,
`reject_report`, `get_reports`, `navigate_to`) `apps/aida/tools.py::execute_tool_call`
orqali o'tadi va u mavjud RBAC/state-machine servislarini qayta ishlatadi:

- `apps.workflows.services.perform_workflow_action` — tasdiqlash/rad etish, rol va status-o'tish tekshiruvi
- `apps.reports.views._report_queryset_for_user` — foydalanuvchi ko'ra oladigan hisobotlar
- `apps.reports.serializers.ReportCreateSerializer` — yangi hisobot yaratish validatsiyasi

Ruxsatsiz amal so'ralsa (masalan SPECIALIST `approve_report` chaqirsa),
`PermissionDenied` ushlanadi va AI'ga tushunarli xato matni qaytariladi — chat
oqimi uzilmaydi, lekin hech qanday DB o'zgarishi sodir bo'lmaydi.

## Suhbat tarixi va streaming

Suhbat tarixi Redis'da emas, **Postgres**'da (`ChatSession`/`ChatMessage`
modellari) saqlanadi — bu allaqachon mavjud, doimiy va sessiyalar ro'yxati
(`GET /api/v1/aida/sessions/`) bilan integratsiyalashgan, shuning uchun Redis
TTL'ga ko'chirilmadi.

`GET /api/v1/aida/chat/stream/` faqat matn oqimini (SSE) beradi — streaming
rejimida function-calling ishlatilmaydi. Tool chaqiruvi kerak bo'lgan
so'rovlar uchun `POST /api/v1/aida/chat/` ishlatiladi.
