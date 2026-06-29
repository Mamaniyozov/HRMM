"""Shared helpers for validating user-uploaded files.

Centralises file-size, extension and content-type checks so every upload
endpoint (reports, notifications, leave screenshots) applies the same rules.
"""
from pathlib import Path

from rest_framework.exceptions import ValidationError


# Conservative defaults — override via env if needed.
DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Allowed file extensions grouped by purpose.
ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv", ".md", ".rtf",
}
ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
}
ALLOWED_ARCHIVE_EXTENSIONS = {".zip", ".tar", ".gz", ".7z"}

# Combined set used by generic document/screenshot uploads.
ALLOWED_UPLOAD_EXTENSIONS = (
    ALLOWED_DOCUMENT_EXTENSIONS
    | ALLOWED_IMAGE_EXTENSIONS
    | ALLOWED_ARCHIVE_EXTENSIONS
)

# Mapping of allowed extensions to a conservative content-type allowlist.
# Empty set means "do not verify content-type for this extension".
EXTENSION_CONTENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".gif": {"image/gif"},
    ".webp": {"image/webp"},
    ".bmp": {"image/bmp"},
    ".txt": {"text/plain"},
    ".csv": {"text/csv", "application/vnd.ms-excel"},
    ".md": {"text/markdown", "text/plain"},
    ".zip": {"application/zip", "application/x-zip-compressed"},
}


def _safe_basename(filename: str) -> str:
    """Strip any path components from *filename* to prevent path traversal."""
    return Path(str(filename or "")).name or "upload"


def validate_upload(
    uploaded_file,
    *,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
    allowed_extensions: frozenset[str] | set[str] | None = None,
    verify_content_type: bool = True,
) -> str:
    """Validate *uploaded_file* and return a sanitised file name.

    Raises ``rest_framework.exceptions.ValidationError`` on any violation.
    """
    if uploaded_file is None:
        raise ValidationError("Fayl yuborilmadi.")

    if uploaded_file.size > max_size:
        raise ValidationError(
            f"Fayl hajmi {max_size // (1024 * 1024)} MB dan oshmasligi kerak."
        )

    raw_name = getattr(uploaded_file, "name", "") or ""
    safe_name = _safe_basename(raw_name)
    if not safe_name or safe_name in {".", ".."}:
        raise ValidationError("Noto'g'ri fayl nomi.")

    ext = Path(safe_name).suffix.lower()
    extensions = allowed_extensions or ALLOWED_UPLOAD_EXTENSIONS
    if ext not in extensions:
        raise ValidationError(
            f"Ruxsat etilmagan fayl turi: '{ext}'. "
            f"Ruxsat etilgan: {', '.join(sorted(extensions))}"
        )

    if verify_content_type:
        allowed_cts = EXTENSION_CONTENT_TYPES.get(ext)
        if allowed_cts:
            actual_ct = (getattr(uploaded_file, "content_type", "") or "").lower()
            # Browsers sometimes send ";charset=..." or extra params.
            actual_ct = actual_ct.split(";", 1)[0].strip()
            if actual_ct and actual_ct not in allowed_cts:
                raise ValidationError(
                    f"Fayl content-type '{actual_ct}' kengaytma '{ext}' ga mos kelmadi."
                )

    # Magic bytes verification — detect actual file type from content
    _verify_magic_bytes(uploaded_file, ext)

    return safe_name


# Magic byte signatures for common file types.
_MAGIC_SIGNATURES = {
    ".pdf": [b"%PDF"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".gif": [b"GIF87a", b"GIF89a"],
    ".zip": [b"PK\x03\x04", b"PK\x05\x06"],
    ".bmp": [b"BM"],
    ".webp": [b"RIFF"],
}


def _verify_magic_bytes(uploaded_file, ext):
    """Check that the file's magic bytes match the expected type for *ext*."""
    expected = _MAGIC_SIGNATURES.get(ext)
    if not expected:
        return  # No signature to check for this extension

    pos = uploaded_file.tell() if hasattr(uploaded_file, "tell") else None
    try:
        uploaded_file.seek(0)
        header = uploaded_file.read(16)
    finally:
        if pos is not None and hasattr(uploaded_file, "seek"):
            uploaded_file.seek(pos)

    if not header:
        return  # Empty file, let other validators catch it

    if not any(header.startswith(sig) for sig in expected):
        raise ValidationError(
            f"Fayl tarkibi kengaytma '{ext}' ga mos kelmadi (magic bytes mismatch)."
        )
