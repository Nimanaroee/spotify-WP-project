from django.db import migrations


def migrate_subscription_fees(apps, schema_editor):
    SubscriptionFee = apps.get_model("user", "SubscriptionFee")
    SubscriptionPricing = apps.get_model("management", "SubscriptionPricing")
    fees = dict(
        SubscriptionFee.objects.filter(
            subscription_tier__in=("silver", "gold")
        ).values_list("subscription_tier", "price_per_month")
    )
    if SubscriptionPricing.objects.filter(pk=1).exists():
        return

    SubscriptionPricing.objects.create(
        pk=1,
        silver_price=fees.get("silver", 0),
        gold_price=fees.get("gold", 0),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("management", "0001_initial"),
        ("user", "0005_raise_silver_fee_for_zarinpal"),
    ]

    operations = [
        migrations.RunPython(migrate_subscription_fees, migrations.RunPython.noop),
    ]
