"""
Serve the vanilla-JS frontend from *hrmm_frontend/*.

In production the assets also go through WhiteNoise (collectstatic), but
these views guarantee the SPA works even when WhiteNoise has not been run
(local dev, tests, etc.).

Cache-busting: on first import this module computes a short content-hash for
app.js and styles.css. The hash is injected into index.html as a query string
so browsers fetch fresh copies after every deploy — no manual ?v= bumps needed.
"""

import hashlib
import mimetypes
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.utils._os import safe_join


FRONTEND_CANDIDATE_DIRS = [
    settings.BASE_DIR.parent / "hrmm_frontend",
    settings.BASE_DIR / "hrmm_frontend",
    Path("/app/hrmm_frontend"),
]


SAFE_STATIC_EXTENSIONS = {
    ".js",
    ".mjs",
    ".css",
    ".html",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".woff",
    ".woff2",
    ".ttf",
    ".map",
}


def _find_frontend_file(filename: str) -> Path | None:
    filename = filename.lstrip("/")
    if not filename or ".." in filename:
        return None
    for directory in FRONTEND_CANDIDATE_DIRS:
        try:
            file_path = Path(safe_join(str(directory), filename))
        except ValueError:
            continue
        if file_path.exists() and file_path.is_file():
            if Path(filename).suffix.lower() not in SAFE_STATIC_EXTENSIONS:
                continue
            return file_path
    return None


# ---------------------------------------------------------------------------
# Content-hash cache-busting
# ---------------------------------------------------------------------------

def _file_hash(filename: str) -> str:
    """Return first 8 hex chars of the MD5 of *filename*'s contents."""
    path = _find_frontend_file(filename)
    if not path:
        return "0"
    try:
        digest = hashlib.md5(path.read_bytes()).hexdigest()  # noqa: S324
        return digest[:8]
    except OSError:
        return "0"


# Compute hashes once at process start (gunicorn forks after import).
_ASSET_HASHES: dict[str, str] = {}


def _get_hash(filename: str) -> str:
    if filename not in _ASSET_HASHES:
        _ASSET_HASHES[filename] = _file_hash(filename)
    return _ASSET_HASHES[filename]


def _inject_hashes(html: str) -> str:
    """Replace bare asset references with cache-busted versions."""
    # styles.css?v=... or styles.css  →  styles.css?h=<hash>
    html = re.sub(
        r'(href="styles\.css)(\?[^"]*)?(")',
        lambda m: f'{m.group(1)}?h={_get_hash("styles.css")}{m.group(3)}',
        html,
    )
    # app.js?v=... or app.js  →  app.js?h=<hash>
    html = re.sub(
        r'(src="app\.js)(\?[^"]*)?(")',
        lambda m: f'{m.group(1)}?h={_get_hash("app.js")}{m.group(3)}',
        html,
    )
    return html


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

def _serve_frontend_file(filename: str, content_type: str) -> FileResponse:
    file_path = _find_frontend_file(filename)
    if not file_path:
        raise Http404(f"Frontend asset not found: {filename}")
    return FileResponse(file_path.open("rb"), content_type=content_type)


def frontend_index(_request):
    index_file = _find_frontend_file("index.html")
    if index_file:
        html = index_file.read_text(encoding="utf-8")
        html = _inject_hashes(html)
        from django.http import HttpResponse
        return HttpResponse(html, content_type="text/html; charset=utf-8")

    return JsonResponse(
        {
            "success": True,
            "message": "HRMM backend is running.",
            "data": {
                "api_docs": "/api/docs/",
                "schema": "/api/schema/",
            },
        }
    )


def frontend_static(_request, filename):
    """Serve any safe static file from the frontend directory (e.g. src/*.js)."""
    file_path = _find_frontend_file(filename)
    if not file_path:
        raise Http404(f"Frontend asset not found: {filename}")
    content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
    return FileResponse(file_path.open("rb"), content_type=content_type)
