from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse


FRONTEND_CANDIDATE_DIRS = [
    settings.BASE_DIR.parent / "hrmm_frontend",
    settings.BASE_DIR / "hrmm_frontend",
    Path("/app/hrmm_frontend"),
]


def _find_frontend_file(filename: str) -> Path | None:
    for directory in FRONTEND_CANDIDATE_DIRS:
        file_path = directory / filename
        if file_path.exists():
            return file_path
    return None


def _serve_frontend_file(filename: str, content_type: str) -> FileResponse:
    file_path = _find_frontend_file(filename)
    if not file_path:
        raise Http404(f"Frontend asset not found: {filename}")
    return FileResponse(file_path.open("rb"), content_type=content_type)


def frontend_index(_request):
    index_file = _find_frontend_file("index.html")
    if index_file:
        return FileResponse(index_file.open("rb"), content_type="text/html; charset=utf-8")

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


def frontend_app_js(_request):
    return _serve_frontend_file("app.js", "application/javascript; charset=utf-8")


def frontend_styles_css(_request):
    return _serve_frontend_file("styles.css", "text/css; charset=utf-8")
