# Generated manually to remove the duplicate audit.User model.
# audit.User was a stale duplicate of users.User and never used as a target
# for AuditLog.actor (which references users.User). The audit_user table can
# be dropped safely.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0003_auditlog"),
    ]

    operations = [
        migrations.DeleteModel(
            name="User",
        ),
    ]
