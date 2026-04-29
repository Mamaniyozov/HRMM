from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_user_two_factor_fields"),
        ("authentication", "0001_revokedtoken"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailOTPChallenge",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("purpose", models.CharField(choices=[("LOGIN", "Login")], default="LOGIN", max_length=30)),
                ("code_hash", models.CharField(max_length=128)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="email_otp_challenges", to="users.user"),
                ),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]
