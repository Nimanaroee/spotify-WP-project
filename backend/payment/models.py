from django.db import models

from user.models import User


class SubscriptionPaymentLog(models.Model):
    class Status(models.TextChoices):
        SUCCESSFUL = "successful", "Successful"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="subscription_payment_logs",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    duration_months = models.PositiveSmallIntegerField()
    account_type = models.CharField(
        max_length=20,
        choices=User.SubscriptionTier.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESSFUL,
    )
    subscription_applied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} - {self.account_type} - {self.amount}"
