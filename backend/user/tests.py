from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Artist, User


class ProfileApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            password="password123",
            display_name="Profile Owner",
            birth_date="2000-01-01",
            gender=User.Gender.MALE,
            subscription_tier=User.SubscriptionTier.SILVER,
            streamed_today=7,
        )
        self.follower = User.objects.create_user(
            email="follower@example.com",
            username="follower",
            password="password123",
            display_name="Follower",
        )
        self.following = User.objects.create_user(
            email="following@example.com",
            username="following",
            password="password123",
            display_name="Following",
        )
        self.follower.following.add(self.user)
        self.user.following.add(self.following)
        self.user.followers_count = 1
        self.user.following_count = 1
        self.user.save(update_fields=("followers_count", "following_count"))
        self.url = reverse("profile")

    def test_profile_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_returns_only_authenticated_users_profile(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user_name"], "owner")
        self.assertEqual(response.data["bearth_date"], "2000-01-01")
        self.assertEqual(response.data["num_follower"], 1)
        self.assertEqual(response.data["num_following"], 1)
        self.assertEqual(response.data["streamed_today"], 7)
        self.assertEqual(response.data["subscription"], "silver")
        self.assertEqual(
            response.data["followers"][0],
            {
                "display_name": "Follower",
                "username": "follower",
                "avatar": None,
            },
        )
        self.assertEqual(response.data["followings"][0]["username"], "following")
        self.assertNotIn("email", response.data)

    def test_patch_partially_updates_editable_profile_fields(self):
        self.client.force_authenticate(self.user)
        image_bytes = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_bytes, format="PNG")
        photo = SimpleUploadedFile(
            "avatar.png",
            image_bytes.getvalue(),
            content_type="image/png",
        )

        response = self.client.patch(
            self.url,
            {
                "display_name": "Updated Owner",
                "gender": User.Gender.FEMALE,
                "bearth_date": "1999-02-03",
                "profile_photo": photo,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Updated Owner")
        self.assertEqual(self.user.gender, User.Gender.FEMALE)
        self.assertEqual(str(self.user.birth_date), "1999-02-03")
        self.assertTrue(self.user.profile_picture.name.endswith(".png"))

    def test_patch_rejects_follow_relationship_fields(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            self.url,
            {
                "followers": [],
                "followings": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(self.user.following.filter(pk=self.following.pk).exists())
        self.assertTrue(self.user.followers.filter(pk=self.follower.pk).exists())

    def test_patch_cannot_edit_another_users_profile(self):
        self.client.force_authenticate(self.follower)

        response = self.client.patch(
            self.url,
            {"display_name": "Follower Updated"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.follower.refresh_from_db()
        self.assertEqual(self.user.display_name, "Profile Owner")
        self.assertEqual(self.follower.display_name, "Follower Updated")


class FollowApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            password="password123",
            display_name="Profile Owner",
        )
        self.target = User.objects.create_user(
            email="target@example.com",
            username="target",
            password="password123",
            display_name="Target User",
        )
        self.url = reverse("follow", kwargs={"username": self.target.username})

    def test_follow_api_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_returns_follow_status(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_following"])
        self.assertEqual(
            response.data["user"],
            {
                "display_name": "Target User",
                "username": "target",
                "avatar": None,
            },
        )

    def test_post_follows_one_username(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_following"])
        self.assertTrue(self.user.following.filter(pk=self.target.pk).exists())
        self.user.refresh_from_db()
        self.target.refresh_from_db()
        self.assertEqual(self.user.following_count, 1)
        self.assertEqual(self.target.followers_count, 1)

    def test_post_is_idempotent_for_existing_relationship(self):
        self.user.following.add(self.target)
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.user.following.filter(pk=self.target.pk).count(), 1)

    def test_delete_unfollows_one_username(self):
        self.user.following.add(self.target)
        self.user.following_count = 1
        self.target.followers_count = 1
        self.user.save(update_fields=("following_count",))
        self.target.save(update_fields=("followers_count",))
        self.client.force_authenticate(self.user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_following"])
        self.assertEqual(response.data["user"]["username"], "target")
        self.assertFalse(self.user.following.filter(pk=self.target.pk).exists())
        self.user.refresh_from_db()
        self.target.refresh_from_db()
        self.assertEqual(self.user.following_count, 0)
        self.assertEqual(self.target.followers_count, 0)

    def test_post_rejects_self_follow(self):
        self.client.force_authenticate(self.user)
        url = reverse("follow", kwargs={"username": self.user.username})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PublicProfileApiTests(APITestCase):
    def setUp(self):
        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            username="viewer",
            password="password123",
            display_name="Viewer",
        )
        self.profile_user = User.objects.create_user(
            email="profile@example.com",
            username="profile_user",
            password="password123",
            display_name="Profile User",
            birth_date="1998-04-05",
            gender=User.Gender.FEMALE,
            subscription_tier=User.SubscriptionTier.GOLD,
            streamed_today=12,
        )
        self.follower = User.objects.create_user(
            email="public-follower@example.com",
            username="public_follower",
            password="password123",
            display_name="Public Follower",
        )
        self.follower.following.add(self.profile_user)
        self.viewer.following.add(self.profile_user)
        self.profile_user.followers_count = 2
        self.profile_user.save(update_fields=("followers_count",))
        self.url = reverse(
            "public-profile",
            kwargs={"user_name": self.profile_user.username},
        )

    def test_public_profile_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_returns_profile_page_data_for_username(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user_name"], "profile_user")
        self.assertEqual(response.data["display_name"], "Profile User")
        self.assertEqual(response.data["bearth_date"], "1998-04-05")
        self.assertEqual(response.data["gender"], User.Gender.FEMALE)
        self.assertEqual(response.data["subscription"], "gold")
        self.assertEqual(response.data["streamed_today"], 12)
        self.assertEqual(response.data["num_follower"], 2)
        self.assertTrue(response.data["is_following"])
        self.assertEqual(response.data["role"], User.Role.LISTENER)
        self.assertIsNone(response.data["artist_profile"])
        self.assertEqual(response.data["albums"], [])
        self.assertEqual(response.data["singles"], [])
        self.assertEqual(
            {user["username"] for user in response.data["followers"]},
            {"public_follower", "viewer"},
        )
        self.assertNotIn("email", response.data)

    def test_get_returns_artist_profile_extensions(self):
        artist = Artist.objects.create_user(
            email="artist-profile@example.com",
            username="profile_artist",
            password="password123",
            display_name="Profile Artist",
            stage_name="Stage Profile",
            bio="Artist biography.",
            verification_status=Artist.VerificationStatus.APPROVED,
            listener_count=24,
            total_streams=500,
        )
        url = reverse(
            "public-profile",
            kwargs={"user_name": artist.username},
        )
        self.client.force_authenticate(self.viewer)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], User.Role.ARTIST)
        self.assertEqual(
            response.data["artist_profile"],
            {
                "stage_name": "Stage Profile",
                "bio": "Artist biography.",
                "verification_status": "approved",
                "is_verified": True,
                "listener_count": 24,
                "total_streams": 500,
            },
        )

    def test_unknown_username_returns_not_found(self):
        self.client.force_authenticate(self.viewer)
        url = reverse(
            "public-profile",
            kwargs={"user_name": "missing-user"},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_profile_is_read_only(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.patch(
            self.url,
            {"display_name": "Not Allowed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
