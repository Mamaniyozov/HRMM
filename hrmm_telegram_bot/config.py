import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
HRMM_API_BASE_URL = os.getenv("HRMM_API_BASE_URL", "https://hrmm-production-b4ec.up.railway.app").rstrip("/")
SESSIONS_FILE = os.getenv("SESSIONS_FILE", str(Path(__file__).parent / "hrmm_bot_sessions.json"))
PORT = int(os.getenv("PORT", "8080"))
