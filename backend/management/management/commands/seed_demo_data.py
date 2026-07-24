from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from management.models import (
    MonthlyArtistAudit,
    SubscriptionPricing,
    SupportTicket,
    TicketMessage,
)
from notifications.services import notify_staff, notify_user
from user.models import Artist, User

PASSWORD = "password123"


class Command(BaseCommand):
    help = "Seed demo data for the management/support/admin backend."

    @transaction.atomic
    def handle(self, *args, **options):
        listener = self._get_or_create_user(
            email="listener@example.com",
            username="demo_listener",
            display_name="Layla Listener",
            role=User.Role.LISTENER,
            subscription_tier=User.SubscriptionTier.BASIC,
        )
        silver_listener = self._get_or_create_user(
            email="silver@example.com",
            username="demo_silver",
            display_name="Sam Silver",
            role=User.Role.LISTENER,
            subscription_tier=User.SubscriptionTier.SILVER,
        )
        gold_listener = self._get_or_create_user(
            email="gold@example.com",
            username="demo_gold",
            display_name="Gina Gold",
            role=User.Role.LISTENER,
            subscription_tier=User.SubscriptionTier.GOLD,
        )
        support = self._get_or_create_user(
            email="support@example.com",
            username="demo_support",
            display_name="Sara Support",
            role=User.Role.SUPPORT,
        )
        admin = self._get_or_create_user(
            email="admin@example.com",
            username="demo_admin",
            display_name="Amir Admin",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        approved_artist = self._get_or_create_artist(
            email="artist.approved@example.com",
            username="demo_artist_approved",
            stage_name="Aria Nova",
            verification_status=Artist.VerificationStatus.APPROVED,
            is_active=True,
            listener_count=15230,
            total_streams=482110,
        )
        pending_artist = self._get_or_create_artist(
            email="artist.pending@example.com",
            username="demo_artist_pending",
            stage_name="Neon Echoes",
            verification_status=Artist.VerificationStatus.PENDING,
            is_active=False,
            portfolio_links=[
                "https://soundcloud.com/neon-echoes",
                "https://instagram.com/neon.echoes",
            ],
        )
        rejected_artist = self._get_or_create_artist(
            email="artist.rejected@example.com",
            username="demo_artist_rejected",
            stage_name="Static Wolf",
            verification_status=Artist.VerificationStatus.REJECTED,
            is_active=False,
            rejection_reason="Portfolio links did not contain verifiable original music.",
        )

        pricing, _ = SubscriptionPricing.objects.get_or_create(
            pk=1,
            defaults={"silver_price": 9.99, "gold_price": 19.99},
        )

        self._seed_tickets(listener, support)
        self._seed_audits(approved_artist)
        self._seed_notifications(support, admin, pending_artist, approved_artist)

        self.stdout.write(self.style.SUCCESS("Seed data created/verified:"))
        for user in (
            listener,
            silver_listener,
            gold_listener,
            support,
            admin,
            approved_artist,
            pending_artist,
            rejected_artist,
        ):
            self.stdout.write(f"  {user.email} / {PASSWORD}  (role={user.role})")

    def _get_or_create_user(self, *, email, username, display_name, role, **extra):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "display_name": display_name,
                "role": role,
                **extra,
            },
        )
        if created:
            user.set_password(PASSWORD)
            user.save()
        return user

    def _get_or_create_artist(self, *, email, username, stage_name, **extra):
        artist = Artist.objects.filter(email=email).first()
        if artist is None:
            artist = Artist(
                email=email,
                username=username,
                stage_name=stage_name,
                display_name=stage_name,
                role=User.Role.ARTIST,
                **extra,
            )
            artist.set_password(PASSWORD)
            artist.save()
        return artist

    def _seed_tickets(self, listener, support):
        if SupportTicket.objects.exists():
            return

        open_ticket = SupportTicket.objects.create(
            user=listener,
            subject="Can't play downloaded songs offline",
            status=SupportTicket.Status.OPEN,
        )
        TicketMessage.objects.create(
            ticket=open_ticket,
            sender=listener,
            message="My downloaded playlist won't play without internet, is this expected?",
        )

        answered_ticket = SupportTicket.objects.create(
            user=listener,
            subject="Billing question about Silver plan",
            status=SupportTicket.Status.ANSWERED,
        )
        TicketMessage.objects.create(
            ticket=answered_ticket,
            sender=listener,
            message="I was charged twice this month, can you check?",
        )
        TicketMessage.objects.create(
            ticket=answered_ticket,
            sender=support,
            message="Looking into it now, could you share the transaction dates?",
        )

        closed_ticket = SupportTicket.objects.create(
            user=listener,
            subject="Feature request: sleep timer",
            status=SupportTicket.Status.CLOSED,
        )
        TicketMessage.objects.create(
            ticket=closed_ticket,
            sender=listener,
            message="Would love a sleep timer that pauses playback after N minutes.",
        )
        TicketMessage.objects.create(
            ticket=closed_ticket,
            sender=support,
            message="Thanks for the suggestion, passed it along to the product team!",
        )

    def _seed_audits(self, artist):
        today = date.today()
        MonthlyArtistAudit.objects.get_or_create(
            artist=artist,
            period_year=today.year,
            period_month=today.month,
            defaults={
                "unique_listeners_count": 4213,
                "total_streams_count": 18932,
                "payout_amount": 214.50,
                "payment_status": MonthlyArtistAudit.PaymentStatus.PENDING,
            },
        )

        last_month = today.month - 1 or 12
        last_month_year = today.year if today.month > 1 else today.year - 1
        MonthlyArtistAudit.objects.get_or_create(
            artist=artist,
            period_year=last_month_year,
            period_month=last_month,
            defaults={
                "unique_listeners_count": 3890,
                "total_streams_count": 16110,
                "payout_amount": 189.20,
                "payment_status": MonthlyArtistAudit.PaymentStatus.SETTLED,
            },
        )

    def _seed_notifications(self, support, admin, pending_artist, approved_artist):
        from notifications.models import Notification

        if Notification.objects.exists():
            return

        notify_staff(
            category="artist_verification_request",
            title=f"New artist verification request: {pending_artist.stage_name}",
            link=f"/admin/verification/{pending_artist.pk}",
        )
        notify_user(
            approved_artist,
            category="monthly_payout",
            title="Monthly payout settled",
            message="Amount: 189.20",
        )
        self.stdout.write(f"  seeded notifications for staff ({support.email}, {admin.email})")
