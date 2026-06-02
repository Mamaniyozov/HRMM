"""
HRMM Telegram bot — Railway da background worker sifatida ishlaydi.
"""

from __future__ import annotations

import asyncio
import logging
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from config import HRMM_API_BASE_URL, PORT, TELEGRAM_BOT_TOKEN
from hrmm_client import HRMMClient
from sessions import clear_session, get_session, pop_login_challenge, save_login_challenge, save_session

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("hrmm_bot")

HELP_TEXT = """
<b>HRMM Telegram bot</b>

<b>Kirish</b>
/login &lt;username&gt; &lt;parol&gt;
Agar 2FA so'rasa: <code>/code 123456</code>

<b>Ma'lumot</b>
/me — profilingiz
/stat — umumiy statistika
/navbat — kutilayotgan tasdiqlar
/bolimlar — bo'limlar bo'yicha jadval
/arizalar — so'nggi arizalar
/hisobotlar — so'nggi hisobotlar
/xabarlar — bildirishnomalar

<b>Boshqa</b>
/logout — chiqish
/help — yordam

API: {api}
""".format(api=HRMM_API_BASE_URL)


def _escape_html(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _client_for_user(telegram_id: int) -> tuple[HRMMClient | None, dict | None]:
    session = get_session(telegram_id)
    if not session or not session.get("access"):
        return None, session
    return HRMMClient(session["access"]), session


async def _reply(update: Update, text: str, *, html: bool = True) -> None:
    if not update.message:
        return
    kwargs = {"parse_mode": ParseMode.HTML} if html else {}
    # Telegram xabar limiti 4096
    if len(text) <= 4000:
        await update.message.reply_text(text, **kwargs)
        return
    chunk = ""
    for line in text.split("\n"):
        if len(chunk) + len(line) + 1 > 3800:
            await update.message.reply_text(chunk, **kwargs)
            chunk = line + "\n"
        else:
            chunk += line + "\n"
    if chunk.strip():
        await update.message.reply_text(chunk, **kwargs)


def _store_tokens(telegram_id: int, data: dict, user: dict) -> None:
    save_session(
        telegram_id,
        {
            "access": data.get("access"),
            "refresh": data.get("refresh"),
            "user": user,
        },
    )


async def start_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply(
        update,
        f"Assalomu alaykum! <b>HRMM</b> tizimi uchun bot.\n\n"
        f"Avval tizimga kiring:\n<code>/login username parol</code>\n\n"
        f"Yordam: /help",
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply(update, HELP_TEXT)


async def login_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args or len(context.args) < 2:
        await _reply(
            update,
            "Foydalanish:\n<code>/login username parol</code>\n\n"
            "Parolda bo'shliq bo'lsa, ikkala qismni alohida yozing.",
        )
        return

    username = context.args[0]
    password = " ".join(context.args[1:])
    telegram_id = update.effective_user.id

    try:
        payload = HRMMClient().login(username, password)
    except Exception as exc:
        await _reply(update, f"❌ Kirish xatosi: {_escape_html(str(exc))}")
        return

    data = payload.get("data") or {}
    if data.get("requires_two_factor"):
        method = data.get("verification_method", "authenticator")
        challenge = {
            "method": method,
            "challenge_token": data.get("challenge_token"),
            "challenge_id": data.get("challenge_id"),
        }
        save_login_challenge(telegram_id, challenge)
        if method == "email":
            await _reply(
                update,
                f"📧 Emailga kod yuborildi ({_escape_html(data.get('masked_email', ''))}).\n"
                f"Kodni kiriting: <code>/code 123456</code>",
            )
        else:
            await _reply(
                update,
                "🔐 Google Authenticator kodini kiriting:\n<code>/code 123456</code>",
            )
        return

    user = data.get("user") or {}
    _store_tokens(telegram_id, data, user)
    await _reply(
        update,
        f"✅ Muvaffaqiyatli kirdingiz!\n"
        f"<b>{_escape_html(user.get('full_name', ''))}</b> ({_escape_html(user.get('role', ''))})",
    )


async def code_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await _reply(update, "Foydalanish: <code>/code 123456</code>")
        return

    telegram_id = update.effective_user.id
    challenge = pop_login_challenge(telegram_id)
    if not challenge:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return

    code = context.args[0].strip()
    client = HRMMClient()

    try:
        if challenge.get("method") == "email":
            payload = client.verify_email_otp(challenge["challenge_id"], code)
        else:
            payload = client.verify_2fa(challenge["challenge_token"], code)
    except Exception as exc:
        save_login_challenge(telegram_id, challenge)
        await _reply(update, f"❌ Kod xatosi: {_escape_html(str(exc))}")
        return

    data = payload.get("data") or {}
    user = data.get("user") or {}
    _store_tokens(telegram_id, data, user)
    await _reply(
        update,
        f"✅ Tasdiqlandi! Xush kelibsiz, <b>{_escape_html(user.get('full_name', ''))}</b>",
    )


async def logout_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    clear_session(update.effective_user.id)
    await _reply(update, "👋 Tizimdan chiqdingiz. Qayta kirish: /login")


async def me_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client, session = _client_for_user(update.effective_user.id)
    if not client:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return
    try:
        payload = client.me()
        user = payload.get("data") or session.get("user") or {}
        await _reply(
            update,
            f"<b>Profil</b>\n"
            f"Ism: {_escape_html(user.get('full_name'))}\n"
            f"Login: {_escape_html(user.get('username'))}\n"
            f"Rol: {_escape_html(user.get('role'))}\n"
            f"Bo'lim: {_escape_html(user.get('department_name', '-'))}\n"
            f"Birlik: {_escape_html(user.get('unit_name', '-'))}",
        )
    except Exception as exc:
        await _reply(update, f"❌ {_escape_html(str(exc))}")


async def stat_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client, _ = _client_for_user(update.effective_user.id)
    if not client:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return
    try:
        stats = client.dashboard_stats()
        reports = stats.get("reports") or {}
        leaves = stats.get("leaves") or {}
        await _reply(
            update,
            "<b>Umumiy statistika</b>\n\n"
            f"<b>Hisobotlar</b>\n"
            f"Jami: {reports.get('total_reports', 0)}\n"
            f"Qoralama: {reports.get('draft_reports', 0)}\n"
            f"Kutilmoqda: {reports.get('pending_reports', 0)}\n"
            f"Tasdiqlangan: {reports.get('approved_reports', 0)}\n\n"
            f"<b>Arizalar</b>\n"
            f"Jami: {leaves.get('total_leave_requests', 0)}\n"
            f"Kutilmoqda: {leaves.get('pending_leave_requests', 0)}\n"
            f"Tasdiqlangan: {leaves.get('approved_leave_requests', 0)}",
        )
    except Exception as exc:
        await _reply(update, f"❌ {_escape_html(str(exc))}")


async def navbat_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client, session = _client_for_user(update.effective_user.id)
    if not client:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return

    role = (session.get("user") or {}).get("role", "")
    lines = ["<b>Kutilayotgan tasdiqlar</b>\n"]

    try:
        if role in {"DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"}:
            admin = client.dashboard_admin()
            pending = admin.get("pending_approvals") or []
            if not pending:
                lines.append("Navbat bo'sh ✅")
            for item in pending[:12]:
                title = item.get("title") or item.get("reason") or item.get("report_number") or "—"
                who = item.get("created_by__full_name") or item.get("requested_by__full_name") or "—"
                itype = item.get("item_type") or "report"
                lines.append(
                    f"• [{itype}] {_escape_html(title)}\n"
                    f"  {_escape_html(item.get('status', ''))} — {_escape_html(who)}"
                )
        else:
            leaves = client.leaves(page_size=5)
            reports = client.reports(page_size=5)
            for leave in leaves.get("results") or []:
                if leave.get("status") == "PENDING":
                    lines.append(f"• [ariza] {_escape_html(leave.get('reason', '—'))}")
            for report in reports.get("results") or []:
                st = report.get("status", "")
                if st and st.startswith("PENDING"):
                    lines.append(f"• [hisobot] {_escape_html(report.get('title', '—'))} ({st})")
            if len(lines) == 1:
                lines.append("Kutilayotgan element yo'q")
        await _reply(update, "\n".join(lines))
    except Exception as exc:
        await _reply(update, f"❌ {_escape_html(str(exc))}")


async def bolimlar_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client, _ = _client_for_user(update.effective_user.id)
    if not client:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return

    try:
        ops = client.dashboard_operations()
        overall = ops.get("overall") or {}
        departments = ops.get("departments") or []

        lines = [
            "<b>Bo'limlar bo'yicha ko'rinish</b>\n",
            "<b>Jami (barcha bo'limlar)</b>",
            _metric_line("Arizalar", overall.get("leaves")),
            _metric_line("Bildirishnomalar", overall.get("notifications")),
            _metric_line("Funksiya talablari", overall.get("feature_requests")),
            _metric_line("Hisobotlar", overall.get("reports")),
            "",
        ]

        for row in departments[:15]:
            name = _escape_html(row.get("department_name", "—"))
            lines.append(f"<b>{name}</b>")
            lines.append(_metric_line("  Arizalar", row.get("leaves")))
            lines.append(_metric_line("  Bildirishnoma", row.get("notifications")))
            lines.append(_metric_line("  Funksiya", row.get("feature_requests")))
            lines.append(_metric_line("  Hisobot", row.get("reports")))
            lines.append("")

        await _reply(update, "\n".join(lines))
    except Exception as exc:
        await _reply(update, f"❌ {_escape_html(str(exc))}")


def _metric_line(label: str, metric: dict | None) -> str:
    metric = metric or {}
    return (
        f"{label}: <b>{metric.get('total', 0)}</b> "
        f"(🟡 {metric.get('pending', 0)} kut. | 🟢 {metric.get('approved', 0)} tasd.)"
    )


async def arizalar_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _list_items(update, "arizalar", "Arizalar")


async def hisobotlar_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _list_items(update, "hisobotlar", "Hisobotlar")


async def xabarlar_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _list_items(update, "xabarlar", "Bildirishnomalar")


async def _list_items(update: Update, kind: str, title: str) -> None:
    client, _ = _client_for_user(update.effective_user.id)
    if not client:
        await _reply(update, "Avval <code>/login</code> qiling.")
        return

    try:
        if kind == "arizalar":
            data = client.leaves()
            rows = data.get("results") or []
            formatter = lambda r: (
                f"• {_escape_html(r.get('requested_by_name', '—'))}: "
                f"{_escape_html(r.get('leave_type', ''))} — <b>{_escape_html(r.get('status', ''))}</b>"
            )
        elif kind == "hisobotlar":
            data = client.reports()
            rows = data.get("results") or []
            formatter = lambda r: (
                f"• {_escape_html(r.get('report_number', r.get('id', '')[:8]))}: "
                f"{_escape_html(r.get('title', '—'))} — <b>{_escape_html(r.get('status', ''))}</b>"
            )
        else:
            data = client.notifications()
            rows = data.get("results") or []
            formatter = lambda r: (
                f"• {_escape_html(r.get('title', '—'))}\n"
                f"  {_escape_html(r.get('status') or r.get('type', ''))} — "
                f"{'o‘qilgan' if r.get('is_read') else 'yangi'}"
            )

        lines = [f"<b>{title}</b> (jami {data.get('count', len(rows))})\n"]
        if not rows:
            lines.append("Ma'lumot yo'q")
        else:
            lines.extend(formatter(r) for r in rows[:10])
        await _reply(update, "\n".join(lines))
    except Exception as exc:
        await _reply(update, f"❌ {_escape_html(str(exc))}")


async def unknown_msg(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message and update.message.text and not update.message.text.startswith("/"):
        await _reply(
            update,
            "Buyruq topilmadi. /help — barcha buyruqlar ro'yxati.",
        )


def _start_health_server() -> None:
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"HRMM Telegram bot is running")

        def log_message(self, *_args):
            return

    server = HTTPServer(("0.0.0.0", PORT), Handler)
    logger.info("Health server on port %s", PORT)
    server.serve_forever()


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise SystemExit("TELEGRAM_BOT_TOKEN o'rnatilmagan (.env yoki Railway Variables)")

    threading.Thread(target=_start_health_server, daemon=True).start()

    app = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )

    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("login", login_cmd))
    app.add_handler(CommandHandler("code", code_cmd))
    app.add_handler(CommandHandler("logout", logout_cmd))
    app.add_handler(CommandHandler("me", me_cmd))
    app.add_handler(CommandHandler("stat", stat_cmd))
    app.add_handler(CommandHandler("navbat", navbat_cmd))
    app.add_handler(CommandHandler("bolimlar", bolimlar_cmd))
    app.add_handler(CommandHandler("arizalar", arizalar_cmd))
    app.add_handler(CommandHandler("hisobotlar", hisobotlar_cmd))
    app.add_handler(CommandHandler("xabarlar", xabarlar_cmd))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown_msg))

    logger.info("HRMM bot ishga tushdi. API: %s", HRMM_API_BASE_URL)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
