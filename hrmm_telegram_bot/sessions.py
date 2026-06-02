import json
import threading
from pathlib import Path

from config import SESSIONS_FILE

_lock = threading.Lock()


def _load_all() -> dict:
    path = Path(SESSIONS_FILE)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_all(data: dict) -> None:
    path = Path(SESSIONS_FILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_session(telegram_id: int) -> dict | None:
    with _lock:
        entry = _load_all().get(str(telegram_id))
        return dict(entry) if entry else None


def save_session(telegram_id: int, session: dict) -> None:
    with _lock:
        data = _load_all()
        data[str(telegram_id)] = session
        _save_all(data)


def clear_session(telegram_id: int) -> None:
    with _lock:
        data = _load_all()
        data.pop(str(telegram_id), None)
        _save_all(data)


def save_login_challenge(telegram_id: int, challenge: dict) -> None:
    session = get_session(telegram_id) or {}
    session["login_challenge"] = challenge
    save_session(telegram_id, session)


def pop_login_challenge(telegram_id: int) -> dict | None:
    session = get_session(telegram_id) or {}
    challenge = session.pop("login_challenge", None)
    if challenge:
        save_session(telegram_id, session)
    return challenge
