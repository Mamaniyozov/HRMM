from datetime import timedelta
from io import StringIO
from unittest.mock import AsyncMock, patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.archives.models import ArchiveLog
from apps.audit.models import AuditLog
from apps.users.models import User


class RunArchiverCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username="archiver_user",
            email="archiver@example.com",
            password_hash="hash",
            full_name="Archiver User",
            role="DIRECTOR",
        )

    def test_no_records_prints_message(self):
        out = StringIO()
        call_command("run_archiver", stdout=out)
        self.assertIn("No records to archive", out.getvalue())

    @patch("apps.archives.management.commands.run_archiver.Command._send_telegram", new_callable=AsyncMock)
    def test_archives_old_audit_logs(self, mock_send):
        old_time = timezone.now() - timedelta(days=10)
        log = AuditLog.objects.create(
            actor=self.user,
            action="TEST",
            target_type="test",
            target_id="1",
            description="old",
        )
        AuditLog.objects.filter(pk=log.pk).update(created_at=old_time)

        out = StringIO()
        call_command("run_archiver", stdout=out)

        self.assertFalse(AuditLog.objects.filter(pk=log.pk).exists())
        self.assertEqual(ArchiveLog.objects.filter(status=ArchiveLog.STATUS_SUCCESS).count(), 1)
        mock_send.assert_awaited_once()
