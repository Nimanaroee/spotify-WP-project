from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payment", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionpaymentlog",
            name="authority",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="subscriptionpaymentlog",
            name="gateway_message",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="subscriptionpaymentlog",
            name="gateway_request",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="subscriptionpaymentlog",
            name="gateway_verify",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="subscriptionpaymentlog",
            name="ref_id",
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="subscriptionpaymentlog",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("successful", "Successful"),
                    ("failed", "Failed"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
