from decimal import Decimal

from django.db import migrations, models


def create_default_subscription_fees(apps, schema_editor):
    SubscriptionFee = apps.get_model("user", "SubscriptionFee")
    SubscriptionFee.objects.bulk_create(
        [
            SubscriptionFee(subscription_tier="basic", price_per_month=Decimal("0.00")),
            SubscriptionFee(subscription_tier="silver", price_per_month=Decimal("9.99")),
            SubscriptionFee(subscription_tier="gold", price_per_month=Decimal("19.99")),
        ],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("user", "0003_preferences"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="subscription_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="SubscriptionFee",
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
                    "subscription_tier",
                    models.CharField(
                        choices=[
                            ("basic", "Basic"),
                            ("silver", "Silver"),
                            ("gold", "Gold"),
                        ],
                        max_length=20,
                        unique=True,
                    ),
                ),
                ("price_per_month", models.DecimalField(decimal_places=2, max_digits=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("subscription_tier",)},
        ),
        migrations.RunPython(create_default_subscription_fees, migrations.RunPython.noop),
    ]
