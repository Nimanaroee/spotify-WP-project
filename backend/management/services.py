from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

from notifications.services import notify_staff, notify_user
from user.models import Artist

from .models import MonthlyArtistAudit, SubscriptionPricing, SupportTicket, TicketMessage

User = get_user_model()


@transaction.atomic
def create_ticket(user, subject, message):
    ticket = SupportTicket.objects.create(user=user, subject=subject)
    TicketMessage.objects.create(ticket=ticket, sender=user, message=message)
    notify_staff(
        category="new_ticket",
        title=f"New support ticket: {subject}",
        message=message,
        link=f"/admin/tickets/{ticket.pk}",
    )
    return ticket


@transaction.atomic
def reply_to_ticket(ticket, sender, message):
    if ticket.status == SupportTicket.Status.CLOSED:
        raise ValidationError("Cannot reply to a closed ticket.")

    TicketMessage.objects.create(ticket=ticket, sender=sender, message=message)
    ticket.status = SupportTicket.Status.ANSWERED
    ticket.save(update_fields=("status", "updated_at"))

    if sender.pk != ticket.user_id:
        notify_user(
            ticket.user,
            category="ticket_reply",
            title=f"New reply on ticket: {ticket.subject}",
            message=message,
            link=f"/tickets/{ticket.pk}",
        )
    return ticket


def close_ticket(ticket):
    ticket.status = SupportTicket.Status.CLOSED
    ticket.save(update_fields=("status", "updated_at"))
    return ticket


@transaction.atomic
def approve_verification(artist):
    if artist.verification_status != Artist.VerificationStatus.PENDING:
        raise ValidationError("This request has already been processed.")

    artist.verification_status = Artist.VerificationStatus.APPROVED
    artist.is_active = True
    artist.save()

    notify_user(
        artist,
        category="account_approval",
        title="Your artist account has been approved",
        link="/artist/studio",
    )
    return artist


@transaction.atomic
def reject_verification(artist, reason):
    if not reason:
        raise ValidationError({"reason": "A rejection reason is required."})
    if artist.verification_status != Artist.VerificationStatus.PENDING:
        raise ValidationError("This request has already been processed.")

    artist.verification_status = Artist.VerificationStatus.REJECTED
    artist.rejection_reason = reason
    artist.save()

    notify_user(
        artist,
        category="account_rejection",
        title="Your artist verification was rejected",
        message=reason,
    )
    return artist


@transaction.atomic
def settle_audit(audit):
    if audit.payment_status == MonthlyArtistAudit.PaymentStatus.SETTLED:
        raise ValidationError("This audit has already been settled.")

    audit.payment_status = MonthlyArtistAudit.PaymentStatus.SETTLED
    audit.save(update_fields=("payment_status", "updated_at"))

    notify_user(
        audit.artist,
        category="monthly_payout",
        title=f"Payout settled for {audit.period_year}-{audit.period_month:02d}",
        message=f"Amount: {audit.payout_amount}",
    )
    return audit


def get_revenue_report(year, month):
    pricing = SubscriptionPricing.current()
    tier_prices = {
        User.SubscriptionTier.BASIC: 0,
        User.SubscriptionTier.SILVER: pricing.silver_price,
        User.SubscriptionTier.GOLD: pricing.gold_price,
    }

    counts = {tier: 0 for tier in tier_prices}
    for row in User.objects.filter(
        role__in=(User.Role.LISTENER, User.Role.ARTIST)
    ).values("subscription_tier"):
        tier = row["subscription_tier"]
        counts[tier] = counts.get(tier, 0) + 1

    total_users = sum(counts.values())
    total_revenue = sum(counts[tier] * tier_prices[tier] for tier in tier_prices)

    distribution = [
        {
            "tier": tier,
            "user_count": counts[tier],
            "percentage": (counts[tier] / total_users * 100) if total_users else 0,
        }
        for tier in tier_prices
    ]

    return {
        "period_year": year,
        "period_month": month,
        "total_subscription_revenue": total_revenue,
        "subscription_distribution": distribution,
    }
