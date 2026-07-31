from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("management", "0002_migrate_subscription_fees"),
        ("user", "0005_raise_silver_fee_for_zarinpal"),
    ]

    operations = [
        migrations.DeleteModel(
            name="SubscriptionFee",
        ),
    ]
