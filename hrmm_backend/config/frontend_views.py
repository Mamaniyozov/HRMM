from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404


FRONTEND_DIR = settings.BASE_DIR.parent / "hrmm_frontend"


def _serve_frontend_file(filename: str, content_type: str) -> FileResponse:
    file_path = FRONTEND_DIR / filename
    if not file_path.exists():
        raise Http404(f"Frontend asset not found: {filename}")
    return FileResponse(file_path.open("rb"), content_type=content_type)


def frontend_index(_request):
    return _serve_frontend_file("index.html", "text/html; charset=utf-8")


def frontend_app_js(_request):
    return _serve_frontend_file("app.js", "application/javascript; charset=utf-8")


def frontend_styles_css(_request):
    return _serve_frontend_file("styles.css", "text/css; charset=utf-8")
