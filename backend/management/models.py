from django.conf import settings
from django.db import models

from user.models import Artist


class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ANSWERED = "answered", "Answered"
        CLOSED = "closed", "Closed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Ticket #{self.pk} - {self.subject}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ticket_messages",
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self):
        return f"Message on ticket #{self.ticket_id}"


class MonthlyArtistAudit(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SETTLED = "settled", "Settled"

    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name="monthly_audits",
    )
    period_year = models.PositiveSmallIntegerField()
    period_month = models.PositiveSmallIntegerField()
    unique_listeners_count = models.PositiveIntegerField(default=0)
    total_streams_count = models.PositiveIntegerField(default=0)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("artist__display_name",)
        constraints = [
            models.UniqueConstraint(
                fields=("artist", "period_year", "period_month"),
                name="unique_artist_period_audit",
            )
        ]

    def __str__(self):
        return f"{self.artist} audit {self.period_year}-{self.period_month:02d}"


class SubscriptionPricing(models.Model):
    silver_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gold_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"silver={self.silver_price} gold={self.gold_price}"

    @classmethod
    def current(cls):
        pricing, _ = cls.objects.get_or_create(pk=1)
        return pricing
