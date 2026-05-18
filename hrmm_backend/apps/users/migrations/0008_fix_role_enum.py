# Generated migration to fix PostgreSQL enum status_enum issue with role field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_user_language_user_two_factor_secret_and_more'),
    ]

    operations = [
        # First, alter the column to remove the enum constraint
        migrations.RunSQL(
            sql="""
            ALTER TABLE users_user ALTER COLUMN role TYPE varchar(20) USING role::text;
            DROP TYPE IF EXISTS status_enum;
            """,
            reverse_sql="SELECT 1",  # No reverse needed
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('SPECIALIST', 'Specialist'),
                    ('UNIT_HEAD', 'Unit Head'),
                    ('DEPT_HEAD', 'Department Head'),
                    ('DIRECTOR', 'Director'),
                ],
                default='SPECIALIST',
                max_length=20,
            ),
        ),
    ]
