from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from user.models import User, Artist
from music.models import Track, StreamEvent
from django.utils import timezone
from datetime import timedelta


class CatalogAndStreamApiTests(APITestCase):
    def setUp(self):
        self.basic_user = User.objects.create_user(
            email="basic@example.com", username="basic", password="password",
            subscription_tier=User.SubscriptionTier.BASIC
        )
        self.gold_user = User.objects.create_user(
            email="gold@example.com", username="gold", password="password",
            subscription_tier=User.SubscriptionTier.GOLD
        )
        self.artist = Artist.objects.create_user(
            email="artist@example.com", username="artist", password="password",
            stage_name="The Band", role=User.Role.ARTIST,
            verification_status=Artist.VerificationStatus.APPROVED
        )
        
        # Standard track
        self.track = Track.objects.create(
            artist=self.artist, title="Song 1", audio_file="dummy.mp3",
            created_at=timezone.now() - timedelta(days=10)
        )
        # Manually force created_at for early access logic test
        Track.objects.filter(id=self.track.id).update(created_at=timezone.now() - timedelta(days=10))

        # Early Access Track
        self.early_track = Track.objects.create(
            artist=self.artist, title="New Drop", audio_file="new.mp3"
        )

    def test_record_stream_increments_counts(self):
        self.client.force_authenticate(self.basic_user)
        url = reverse("track-play", kwargs={"pk": self.track.id})
        
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.basic_user.refresh_from_db()
        self.assertEqual(self.basic_user.streamed_today, 1)
        
        self.track.refresh_from_db()
        self.assertEqual(self.track.stream_count, 1)
        self.assertEqual(self.track.listener_count, 1)

    def test_basic_user_cannot_play_early_access(self):
        self.client.force_authenticate(self.basic_user)
        url = reverse("track-play", kwargs={"pk": self.early_track.id})
        
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Early Access", str(res.data))

    def test_gold_user_can_play_early_access(self):
        self.client.force_authenticate(self.gold_user)
        url = reverse("track-play", kwargs={"pk": self.early_track.id})
        
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.early_track.refresh_from_db()
        self.assertEqual(self.early_track.stream_count, 1)

    def test_daily_limit_enforced_for_basic_user(self):
        self.basic_user.streamed_today = 60
        self.basic_user.save()
        
        self.client.force_authenticate(self.basic_user)
        url = reverse("track-play", kwargs={"pk": self.track.id})
        
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("limit reached", str(res.data))