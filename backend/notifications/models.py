from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Category(models.TextChoices):
        NEW_TICKET = "new_ticket", "New ticket"
        TICKET_REPLY = "ticket_reply", "Ticket reply"
        ARTIST_VERIFICATION_REQUEST = "artist_verification_request", "Artist verification request"
        ACCOUNT_APPROVAL = "account_approval", "Account approval"
        ACCOUNT_REJECTION = "account_rejection", "Account rejection"
        MONTHLY_PAYOUT = "monthly_payout", "Monthly payout"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    category = models.CharField(max_length=40, choices=Category.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.category} -> {self.recipient}"
