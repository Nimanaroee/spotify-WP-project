from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("user", "0002_follow_user_streamed_today"),
    ]

    operations = [
        migrations.CreateModel(
            name="Preferences",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "theme",
                    models.CharField(
                        choices=[("light", "Light"), ("dark", "Dark")],
                        default="dark",
                        max_length=10,
                    ),
                ),
                (
                    "notification_limit",
                    models.PositiveSmallIntegerField(default=20),
                ),
                (
                    "notification_sound_enabled",
                    models.BooleanField(default=True),
                ),
                (
                    "language",
                    models.CharField(
                        choices=[("en", "English"), ("fa", "Persian")],
                        default="en",
                        max_length=5,
                    ),
                ),
                (
                    "system_voice",
                    models.CharField(
                        choices=[
                            ("default", "Default"),
                            ("calm", "Calm"),
                            ("bright", "Bright"),
                        ],
                        default="default",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="preferences",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
