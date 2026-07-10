"""AIDA function-calling (tool) qatlami.

Bitta manba (`TOOL_DEFINITIONS`) — ikkala provider formatiga konvertatsiya
qilinadi (OpenAI-compatible Gemini va Anthropic). `execute_tool_call` har bir
chaqiruvni bajarishdan oldin RBAC tekshiruvini majburiy qiladi — AI function
call so'ragani ruxsat degani emas, haqiqiy vakolat tekshiruvi har doim
`apps.workflows.services.perform_workflow_action` va mavjud report
querysetlari orqali amalga oshadi.
"""

from typing import Any

from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.reports.models import Report
from apps.reports.serializers import ReportCreateSerializer
from apps.reports.views import _report_queryset_for_user
from apps.workflows.services import perform_workflow_action

NAVIGATE_PAGES = {"dashboard", "reports", "report_detail", "leaves", "notifications"}

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "create_report",
        "description": (
            "Yangi hisobot yaratish (DRAFT holatida). Foydalanuvchi hisobot "
            "yaratmoqchi bo'lganda, kerakli maydonlarni to'ldirib chaqiring."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Hisobot sarlavhasi"},
                "summary": {"type": "string", "description": "Qisqacha mazmuni"},
                "content": {"type": "string", "description": "To'liq matn (ixtiyoriy)"},
                "priority": {
                    "type": "string",
                    "enum": ["LOW", "NORMAL", "HIGH", "CRITICAL"],
                    "description": "Muhimlik darajasi",
                },
                "category_id": {"type": "string", "description": "Kategoriya UUID (ixtiyoriy)"},
            },
            "required": ["title", "summary"],
        },
    },
    {
        "name": "submit_report",
        "description": "Hisobotni tasdiqlash jarayoniga yuborish (DRAFT yoki REVISION -> PENDING_L2).",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {"type": "string", "description": "Hisobot UUID"},
            },
            "required": ["report_id"],
        },
    },
    {
        "name": "approve_report",
        "description": "Hisobotni joriy bosqichda tasdiqlash. Faqat mos vakolatga ega rol bajara oladi.",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {"type": "string", "description": "Hisobot UUID"},
                "comment": {"type": "string", "description": "Tasdiqlash izohi (majburiy)"},
            },
            "required": ["report_id", "comment"],
        },
    },
    {
        "name": "reject_report",
        "description": "Hisobotni rad etish. Faqat mos vakolatga ega rol bajara oladi.",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {"type": "string", "description": "Hisobot UUID"},
                "comment": {"type": "string", "description": "Rad etish sababi (majburiy)"},
            },
            "required": ["report_id", "comment"],
        },
    },
    {
        "name": "get_reports",
        "description": "Foydalanuvchi ko'ra oladigan hisobotlar ro'yxatini olish (RBAC bo'yicha cheklangan).",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "description": "Status bo'yicha filtr (ixtiyoriy): DRAFT, PENDING_L2, PENDING_L3, PENDING_L4, APPROVED, REJECTED, REVISION, ARCHIVED",
                },
                "limit": {"type": "integer", "description": "Qaytariladigan hisobotlar soni", "default": 10},
            },
            "required": [],
        },
    },
    {
        "name": "navigate_to",
        "description": "Frontend'da foydalanuvchini boshqa sahifaga yo'naltirish.",
        "parameters": {
            "type": "object",
            "properties": {
                "page": {
                    "type": "string",
                    "enum": sorted(NAVIGATE_PAGES),
                    "description": "O'tish kerak bo'lgan sahifa",
                },
                "entity_id": {"type": "string", "description": "Sahifaga tegishli obyekt UUID (ixtiyoriy)"},
            },
            "required": ["page"],
        },
    },
]


def to_openai_format(tools: list[dict[str, Any]] = TOOL_DEFINITIONS) -> list[dict[str, Any]]:
    """TOOL_DEFINITIONS'ni OpenAI-compatible (Gemini) tools formatiga o'giradi."""
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        }
        for tool in tools
    ]


def to_anthropic_format(tools: list[dict[str, Any]] = TOOL_DEFINITIONS) -> list[dict[str, Any]]:
    """TOOL_DEFINITIONS'ni Anthropic tools formatiga o'giradi."""
    return [
        {
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"],
        }
        for tool in tools
    ]


def _create_report(arguments: dict[str, Any], *, actor, request) -> dict[str, Any]:
    serializer = ReportCreateSerializer(
        data={
            "title": arguments.get("title", ""),
            "summary": arguments.get("summary", ""),
            "content": arguments.get("content"),
            "priority": arguments.get("priority", "NORMAL"),
            "category_id": arguments.get("category_id"),
        },
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)
    report = serializer.save(
        created_by=actor,
        department_id=serializer.validated_data.get("department_id") or actor.department_id,
    )
    return {
        "report_id": str(report.id),
        "report_number": report.report_number,
        "status": report.status,
        "message": f"Hisobot yaratildi: {report.report_number} (DRAFT holatida).",
    }


def _get_report_or_error(report_id: str, actor) -> Report:
    report = _report_queryset_for_user(actor).filter(id=report_id).first()
    if not report:
        raise ValidationError("Hisobot topilmadi yoki sizda unga kirish huquqi yo'q.")
    return report


def _workflow_action(action: str, arguments: dict[str, Any], *, actor, request) -> dict[str, Any]:
    report = _get_report_or_error(arguments.get("report_id", ""), actor)
    report = perform_workflow_action(
        report=report,
        actor=actor,
        action=action,
        comment=arguments.get("comment", ""),
        request=request,
    )
    return {
        "report_id": str(report.id),
        "report_number": report.report_number,
        "status": report.status,
        "message": f"{report.report_number} uchun {action} muvaffaqiyatli bajarildi. Yangi holat: {report.status}.",
    }


def _get_reports(arguments: dict[str, Any], *, actor, request) -> dict[str, Any]:
    queryset = _report_queryset_for_user(actor)
    status_filter = arguments.get("status")
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    limit = min(int(arguments.get("limit") or 10), 50)
    reports = list(
        queryset.order_by("-created_at").values(
            "id", "report_number", "title", "status", "priority", "created_at"
        )[:limit]
    )
    for r in reports:
        r["id"] = str(r["id"])
        r["created_at"] = r["created_at"].isoformat()
    return {"reports": reports, "count": len(reports)}


def _navigate_to(arguments: dict[str, Any], *, actor, request) -> dict[str, Any]:
    page = arguments.get("page")
    if page not in NAVIGATE_PAGES:
        raise ValidationError(f"Noto'g'ri sahifa: {page}")
    return {"action": "navigate", "page": page, "entity_id": arguments.get("entity_id")}


_HANDLERS = {
    "create_report": _create_report,
    "submit_report": lambda args, **kw: _workflow_action("SUBMIT", args, **kw),
    "approve_report": lambda args, **kw: _workflow_action("APPROVE", args, **kw),
    "reject_report": lambda args, **kw: _workflow_action("REJECT", args, **kw),
    "get_reports": _get_reports,
    "navigate_to": _navigate_to,
}


def execute_tool_call(name: str, arguments: dict[str, Any], *, actor, request) -> dict[str, Any]:
    """Bitta tool chaqiruvini RBAC tekshiruvi bilan bajaradi.

    AI qaytargan function call hech qachon to'g'ridan-to'g'ri ishonch bilan
    bajarilmaydi — har bir amal mavjud RBAC/state-machine servislari
    (`perform_workflow_action`, `_report_queryset_for_user`,
    `ReportCreateSerializer`) orqali o'tadi. Xatolik bo'lsa, bu chat oqimini
    to'xtatmaydi — xatolik matni modelga qaytariladi, u foydalanuvchiga
    tushuntiradi.
    """
    handler = _HANDLERS.get(name)
    if not handler:
        return {"error": True, "message": f"Noma'lum funksiya: {name}"}

    try:
        return handler(arguments, actor=actor, request=request)
    except PermissionDenied as exc:
        return {"error": True, "message": str(exc)}
    except ValidationError as exc:
        detail = exc.detail
        message = "; ".join(str(v) for v in detail) if isinstance(detail, (list, dict)) else str(detail)
        return {"error": True, "message": message}
    except Exception as exc:  # noqa: BLE001 — tool xatolari modelga qaytishi kerak, chat uzilmasligi uchun
        return {"error": True, "message": f"Amalni bajarishda xatolik: {exc}"}
