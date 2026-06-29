import json
import threading
from pathlib import Path

from config import SESSIONS_FILE

_lock = threading.Lock()

try:
    from cryptography.fernet import Fernet
    import hashlib
    import os

    def _get_key():
        token = os.getenv("SESSION_ENCRYPTION_KEY", "")
        if not token:
            token = os.getenv("TELEGRAM_BOT_TOKEN", "fallback-dev-key")
        return Fernet(hashlib.sha256(token.encode()).digest()[:32].hex().encode()[:44])

    _fernet = None
    try:
        _fernet = Fernet(_get_key())
    except Exception:
        _fernet = None
except ImportError:
    _fernet = None


def _encrypt(data: str) -> str:
    if _fernet:
        return _fernet.encrypt(data.encode()).decode()
    return data


def _decrypt(data: str) -> str:
    if _fernet:
        try:
            return _fernet.decrypt(data.encode()).decode()
        except Exception:
            return data
    return data


def _load_all() -> dict:
    path = Path(SESSIONS_FILE)
    if not path.exists():
        return {}
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        if isinstance(data, dict) and data.get("_encrypted"):
            decrypted = _decrypt(data.get("_payload", ""))
            return json.loads(decrypted) if decrypted else {}
        return data
    except (json.JSONDecodeError, OSError):
        return {}


def _save_all(data: dict) -> None:
    path = Path(SESSIONS_FILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    if _fernet:
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        encrypted = _encrypt(payload)
        output = {"_encrypted": True, "_payload": encrypted}
        path.write_text(json.dumps(output), encoding="utf-8")
    else:
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
