# Generated manually to add short_token to QRLoginChallenge.

from django.db import migrations, models
import secrets


def _generate_short_token():
    return secrets.token_urlsafe(16).replace("-", "").replace("_", "")[:20]


def populate_short_tokens(apps, schema_editor):
    QRLoginChallenge = apps.get_model("authentication", "QRLoginChallenge")
    db_alias = schema_editor.connection.alias
    for challenge in QRLoginChallenge.objects.using(db_alias).filter(short_token__isnull=True):
        # Ensure uniqueness in the unlikely event of a collision.
        while True:
            token = _generate_short_token()
            if not QRLoginChallenge.objects.using(db_alias).filter(short_token=token).exists():
                challenge.short_token = token
                challenge.save(using=db_alias, update_fields=["short_token"])
                break


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0004_qrloginchallenge"),
    ]

    operations = [
        migrations.AddField(
            model_name="qrloginchallenge",
            name="short_token",
            field=models.CharField(max_length=32, null=True, unique=True, db_index=True),
        ),
        migrations.RunPython(populate_short_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="qrloginchallenge",
            name="short_token",
            field=models.CharField(max_length=32, unique=True, db_index=True),
        ),
    ]
