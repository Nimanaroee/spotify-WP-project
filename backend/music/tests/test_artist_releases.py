from io import BytesIO
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from user.models import User, Artist
from music.models import Album, Track


def create_audio_file(name="track.mp3"):
    return SimpleUploadedFile(name, b"audio_content", content_type="audio/mpeg")


class ArtistStudioApiTests(APITestCase):
    def setUp(self):
        self.verified_artist = Artist.objects.create_user(
            email="verified@example.com",
            username="verified",
            password="password",
            stage_name="Verified Band",
            role=User.Role.ARTIST,
            verification_status=Artist.VerificationStatus.APPROVED,
        )
        self.unverified_artist = Artist.objects.create_user(
            email="unverified@example.com",
            username="unverified",
            password="password",
            stage_name="Unverified Band",
            role=User.Role.ARTIST,
            verification_status=Artist.VerificationStatus.PENDING,
        )
        self.listener = User.objects.create_user(
            email="listener@example.com",
            username="listener",
            password="password",
            role=User.Role.LISTENER,
        )
        self.list_create_url = reverse("artist-release-list")

        # Mock the heavy ML extraction during tests
        self.extractor_patcher = patch('music.services.extract_advanced_features')
        self.mock_extractor = self.extractor_patcher.start()
        self.mock_extractor.return_value = [0.1] * 58

    def tearDown(self):
        self.extractor_patcher.stop()

    def test_only_verified_artists_can_access(self):
        self.client.force_authenticate(self.listener)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.unverified_artist)
        response2 = self.client.get(self.list_create_url)
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.verified_artist)
        response3 = self.client.get(self.list_create_url)
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

    def test_publish_single_validation(self):
        self.client.force_authenticate(self.verified_artist)
        
        # Missing audio file
        res1 = self.client.post(self.list_create_url, {
            "release_type": "single",
            "title": "My Single",
            "tracks": []
        }, format="json")
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A single must contain exactly one track.", str(res1.data))

    def test_publish_album_creates_multiple_tracks(self):
        self.client.force_authenticate(self.verified_artist)
        
        payload = {
            "release_type": "album",
            "title": "My Great Album",
            "genre": "Rock",
            "release_year": 2026,
            "tracks[0][title]": "Track 1",
            "tracks[0][audio_file]": create_audio_file("1.mp3"),
            "tracks[1][title]": "Track 2",
            "tracks[1][audio_file]": create_audio_file("2.mp3"),
        }
        
        response = self.client.post(self.list_create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)
        
        album = Album.objects.get(title="My Great Album")
        self.assertEqual(album.track_count, 2)
        self.assertEqual(album.artist, self.verified_artist)
        
        # Verify the mock ran and populated the DB
        track = album.tracks.first()
        self.assertEqual(len(track.feature_vector), 58)

    def test_artist_cannot_update_or_delete_others_tracks(self):
        track = Track.objects.create(
            artist=self.unverified_artist,
            title="Unverified Track",
            audio_file=create_audio_file()
        )
        
        self.client.force_authenticate(self.verified_artist)
        update_url = reverse("artist-release-detail", kwargs={"pk": track.pk})
        
        # Scoped queryset guarantees a 404 instead of a 403.
        response = self.client.patch(update_url, {"title": "Hacked"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        del_response = self.client.delete(update_url)
        self.assertEqual(del_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_track_cleans_up_album(self):
        album = Album.objects.create(artist=self.verified_artist, title="Cleanup", track_count=1)
        track = Track.objects.create(artist=self.verified_artist, album=album, title="Trk", audio_file=create_audio_file())
        
        self.client.force_authenticate(self.verified_artist)
        del_url = reverse("artist-release-detail", kwargs={"pk": track.pk})
        
        res = self.client.delete(del_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Track.objects.count(), 0)
        # Album should be deleted as it has 0 tracks left
        self.assertEqual(Album.objects.count(), 0)