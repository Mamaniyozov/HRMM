from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_convert_select_enums"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="totp_secret",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="two_factor_confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="two_factor_enabled",
            field=models.BooleanField(default=False),
        ),
    ]
