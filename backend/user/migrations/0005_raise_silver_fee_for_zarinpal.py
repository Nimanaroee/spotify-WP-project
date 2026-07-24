from decimal import Decimal

from django.db import migrations


def raise_default_silver_fee(apps, schema_editor):
    SubscriptionFee = apps.get_model("user", "SubscriptionFee")
    SubscriptionFee.objects.filter(
        subscription_tier="silver",
        price_per_month=Decimal("9.99"),
    ).update(price_per_month=Decimal("10.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("user", "0004_subscription_fee_and_expiration"),
    ]

    operations = [
        migrations.RunPython(raise_default_silver_fee, migrations.RunPython.noop),
    ]
