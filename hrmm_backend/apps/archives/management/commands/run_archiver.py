import asyncio
import json
import logging
import zipfile
from datetime import timedelta
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core import serializers
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.archives.models import ArchiveLog

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Archive records older than retention period, send ZIP to Telegram, and delete archived rows."

    def handle(self, *args, **options):
        retention_days = getattr(settings, "ARCHIVE_RETENTION_DAYS", 7)
        cutoff = timezone.now() - timedelta(days=retention_days)
        model_labels = getattr(settings, "ARCHIVE_MODELS", [])

        if not model_labels:
            self.stdout.write(self.style.WARNING("ARCHIVE_MODELS is empty — nothing to archive."))
            return

        self.stdout.write(f"Checking records older than {retention_days} days (before {cutoff.isoformat()})...")

        pending = self._collect_pending(cutoff, model_labels)
        total_pending = sum(queryset.count() for _, queryset in pending.values())

        if total_pending == 0:
            self.stdout.write("No records to archive")
            return

        self.stdout.write(f"Found {total_pending} record(s) across {len(pending)} model(s).")

        timestamp = timezone.now()
        zip_name = timestamp.strftime("archive_%Y-%m-%d_%H-%M.zip")
        output_dir = Path(getattr(settings, "ARCHIVE_OUTPUT_DIR", settings.BASE_DIR / "archives"))
        output_dir.mkdir(parents=True, exist_ok=True)
        zip_path = output_dir / zip_name

        per_model_counts = {}
        serialized_files = []

        try:
            for label, (model, queryset) in pending.items():
                count = queryset.count()
                if count == 0:
                    continue
                self.stdout.write(f"Serializing {label}: {count} record(s)...")
                json_data = serializers.serialize("json", queryset)
                filename = label.replace(".", "_") + ".json"
                serialized_files.append((filename, json_data))
                per_model_counts[label] = count

            metadata = {
                "timestamp": timestamp.isoformat(),
                "record_count": total_pending,
                "models": list(per_model_counts.keys()),
                "per_model_counts": per_model_counts,
            }

            self.stdout.write(f"Creating ZIP: {zip_path}...")
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                archive.writestr("metadata.json", json.dumps(metadata, indent=2, ensure_ascii=False))
                for filename, json_data in serialized_files:
                    archive.writestr(filename, json_data)

            file_size_bytes = zip_path.stat().st_size
            file_size_mb = file_size_bytes / (1024 * 1024)
            file_size_kb = max(1, int(file_size_bytes / 1024))

            caption = (
                f"HRMM arxiv — {timestamp:%Y-%m-%d %H:%M}\n"
                f"Jami yozuvlar: {total_pending}\n"
                f"Hajm: {file_size_mb:.2f} MB"
            )

            self.stdout.write("Sending archive to Telegram...")
            asyncio.run(self._send_telegram(zip_path, caption))

            self.stdout.write("Telegram delivery successful. Deleting archived records...")
            try:
                deleted_total = 0
                for label, (_, queryset) in pending.items():
                    deleted_count, _ = queryset.delete()
                    deleted_total += deleted_count
                    self.stdout.write(f"  Deleted {label}: {deleted_count}")
                self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_total} row(s) from database."))
            except Exception as delete_error:
                logger.exception("Archive delete failed after Telegram send")
                self._log_archive(
                    record_count=total_pending,
                    file_size_kb=file_size_kb,
                    status=ArchiveLog.STATUS_FAILED,
                    error_message=f"Delete failed: {delete_error}",
                )
                self.stdout.write(self.style.ERROR(f"Delete failed — records kept in DB: {delete_error}"))
                raise

            self._log_archive(
                record_count=total_pending,
                file_size_kb=file_size_kb,
                status=ArchiveLog.STATUS_SUCCESS,
                error_message="",
            )
            self.stdout.write(self.style.SUCCESS(f"Archive complete: {zip_name}"))

        except Exception as exc:
            logger.exception("Archive run failed")
            if zip_path.exists():
                try:
                    file_size_kb = max(1, int(zip_path.stat().st_size / 1024))
                except OSError:
                    file_size_kb = 0
            else:
                file_size_kb = 0
            self._log_archive(
                record_count=total_pending,
                file_size_kb=file_size_kb,
                status=ArchiveLog.STATUS_FAILED,
                error_message=str(exc)[:2000],
            )
            self.stdout.write(self.style.ERROR(f"Archive failed: {exc}"))

    def _collect_pending(self, cutoff, model_labels):
        pending = {}
        for label in model_labels:
            try:
                model = apps.get_model(label)
            except (LookupError, ValueError) as exc:
                self.stdout.write(self.style.WARNING(f"Skipping invalid model {label}: {exc}"))
                continue

            if not hasattr(model, "created_at"):
                self.stdout.write(self.style.WARNING(f"Skipping {label}: no created_at field"))
                continue

            queryset = model.objects.filter(created_at__lt=cutoff)
            if queryset.exists():
                pending[label] = (model, queryset)
        return pending

    async def _send_telegram(self, zip_path: Path, caption: str) -> None:
        token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
        chat_id = getattr(settings, "TELEGRAM_CHAT_ID", "")
        if not token or not chat_id:
            raise RuntimeError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in Django settings")

        from telegram import Bot

        bot = Bot(token=token)
        with zip_path.open("rb") as document:
            await bot.send_document(chat_id=chat_id, document=document, caption=caption)

    def _log_archive(self, *, record_count, file_size_kb, status, error_message):
        ArchiveLog.objects.create(
            record_count=record_count,
            file_size_kb=file_size_kb,
            status=status,
            error_message=error_message or "",
        )
        self.stdout.write(f"ArchiveLog saved ({status}).")
