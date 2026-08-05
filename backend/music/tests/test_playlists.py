from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from user.models import User, Artist
from music.models import Track, Playlist, PlaylistTrack


class PlaylistApiTests(APITestCase):
    def setUp(self):
        self.basic_user = User.objects.create_user(
            email="basic@example.com", username="basic", password="password",
            subscription_tier=User.SubscriptionTier.BASIC
        )
        self.silver_user = User.objects.create_user(
            email="silver@example.com", username="silver", password="password",
            subscription_tier=User.SubscriptionTier.SILVER
        )
        self.artist = Artist.objects.create_user(
            email="artist@example.com", username="artist", password="password",
            stage_name="The Band", role=User.Role.ARTIST,
            verification_status=Artist.VerificationStatus.APPROVED
        )
        self.track = Track.objects.create(
            artist=self.artist, title="Song 1", audio_file="dummy.mp3"
        )
        self.track2 = Track.objects.create(
            artist=self.artist, title="Song 2", audio_file="dummy2.mp3"
        )

        self.list_url = reverse("playlist-list")

    def test_create_playlist(self):
        self.client.force_authenticate(self.basic_user)
        res = self.client.post(self.list_url, {"name": "My Favorites"})
        
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "My Favorites")
        self.assertEqual(Playlist.objects.filter(user=self.basic_user).count(), 1)

    def test_basic_tier_playlist_limit(self):
        self.client.force_authenticate(self.basic_user)
        
        # Create 6 playlists (Max limit for basic)
        for i in range(6):
            Playlist.objects.create(user=self.basic_user, name=f"List {i}")
            
        # Try to create the 7th
        res = self.client.post(self.list_url, {"name": "Overflow List"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Playlist limit reached", str(res.data))

    def test_silver_tier_bypasses_basic_limit(self):
        self.client.force_authenticate(self.silver_user)
        for i in range(6):
            Playlist.objects.create(user=self.silver_user, name=f"List {i}")
            
        res = self.client.post(self.list_url, {"name": "Overflow List"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Playlist.objects.filter(user=self.silver_user).count(), 7)

    def test_playlist_ownership_isolation(self):
        pl1 = Playlist.objects.create(user=self.basic_user, name="Basic's List")
        pl2 = Playlist.objects.create(user=self.silver_user, name="Silver's List")

        self.client.force_authenticate(self.basic_user)
        
        # User 1 should only see User 1's list
        res = self.client.get(self.list_url)
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["id"], pl1.id)

        # User 1 cannot delete User 2's list
        del_res = self.client.delete(reverse("playlist-detail", kwargs={"pk": pl2.id}))
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_track_in_playlist(self):
        pl = Playlist.objects.create(user=self.basic_user, name="Vibes")
        self.client.force_authenticate(self.basic_user)
        
        toggle_url = reverse("playlist-toggle-track", kwargs={"pk": pl.id})

        # Add Track
        res1 = self.client.post(toggle_url, {"track_id": self.track.id, "state": True})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["track_count"], 1)
        self.assertEqual(res1.data["tracks"][0]["id"], self.track.id)
        
        # Add Track 2
        self.client.post(toggle_url, {"track_id": self.track2.id, "state": True})
        
        # Ensure position ordered
        res_list = self.client.get(reverse("playlist-detail", kwargs={"pk": pl.id}))
        self.assertEqual(len(res_list.data["tracks"]), 2)
        
        # Remove Track 1
        res3 = self.client.post(toggle_url, {"track_id": self.track.id, "state": False})
        self.assertEqual(res3.data["track_count"], 1)
        self.assertEqual(res3.data["tracks"][0]["id"], self.track2.id)
        
        # Remove already removed track (Idempotent)
        res4 = self.client.post(toggle_url, {"track_id": self.track.id, "state": False})
        self.assertEqual(res4.status_code, status.HTTP_200_OK)