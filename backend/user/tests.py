from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Artist, Preferences, User


class LogoutApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="logout@example.com",
            username="logout_user",
            password="password123",
            display_name="Logout User",
        )
        self.other_user = User.objects.create_user(
            email="other-logout@example.com",
            username="other_logout_user",
            password="password123",
            display_name="Other Logout User",
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.url = reverse("logout")

    def test_logout_requires_authentication(self):
        response = self.client.post(
            self.url,
            {"refresh": str(self.refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_authenticated_users_refresh_token(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            self.url,
            {"refresh": str(self.refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        refresh_response = self.client.post(
            reverse("token-refresh"),
            {"refresh": str(self.refresh)},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_missing_invalid_or_another_users_refresh_token(self):
        self.client.force_authenticate(self.user)

        missing_response = self.client.post(self.url, {}, format="json")
        invalid_response = self.client.post(
            self.url,
            {"refresh": "invalid-token"},
            format="json",
        )
        other_response = self.client.post(
            self.url,
            {"refresh": str(RefreshToken.for_user(self.other_user))},
            format="json",
        )

        self.assertEqual(missing_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(other_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_only_allows_post(self):
        self.client.force_authenticate(self.user)

        self.assertEqual(
            self.client.get(self.url).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual(
            self.client.delete(self.url).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ArtistProfileApiTests(APITestCase):
    def setUp(self):
        self.artist = Artist.objects.create_user(
            email="manage-artist@example.com",
            username="manage_artist",
            password="password123",
            display_name="Managed Artist",
            stage_name="Managed Artist",
            bio="Original biography.",
            verification_status=Artist.VerificationStatus.APPROVED,
            listener_count=40,
            total_streams=120,
        )
        self.listener = User.objects.create_user(
            email="artist-listener@example.com",
            username="artist_listener",
            password="password123",
            display_name="Artist Listener",
        )
        self.following = User.objects.create_user(
            email="artist-following@example.com",
            username="artist_following",
            password="password123",
            display_name="Artist Following",
        )
        self.listener.following.add(self.artist)
        self.artist.following.add(self.following)
        self.artist.followers_count = 1
        self.artist.following_count = 1
        self.artist.save(update_fields=("followers_count", "following_count"))
        self.url = reverse("artist-profile")

    def test_artist_profile_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_rejects_authenticated_non_artist(self):
        self.client.force_authenticate(self.listener)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_returns_authenticated_artists_full_profile(self):
        self.client.force_authenticate(self.artist)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user_name"], "manage_artist")
        self.assertEqual(response.data["role"], User.Role.ARTIST)
        self.assertEqual(response.data["num_follower"], 1)
        self.assertEqual(response.data["num_following"], 1)
        self.assertEqual(response.data["followers"][0]["username"], "artist_listener")
        self.assertEqual(response.data["followings"][0]["username"], "artist_following")
        self.assertEqual(
            response.data["artist_profile"],
            {
                "stage_name": "Managed Artist",
                "bio": "Original biography.",
                "verification_status": "approved",
                "is_verified": True,
                "listener_count": 40,
                "total_streams": 120,
            },
        )
        self.assertEqual(response.data["albums"], [])
        self.assertEqual(response.data["singles"], [])

    def test_patch_updates_only_authenticated_artists_editable_fields(self):
        self.client.force_authenticate(self.artist)
        image_bytes = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_bytes, format="PNG")
        photo = SimpleUploadedFile(
            "artist-avatar.png",
            image_bytes.getvalue(),
            content_type="image/png",
        )

        response = self.client.patch(
            self.url,
            {
                "stage_name": "Updated Stage Name",
                "bio": "Updated biography.",
                "profile_photo": photo,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artist.refresh_from_db()
        self.assertEqual(self.artist.stage_name, "Updated Stage Name")
        self.assertEqual(self.artist.display_name, "Updated Stage Name")
        self.assertEqual(self.artist.bio, "Updated biography.")
        self.assertTrue(self.artist.profile_picture.name.endswith(".png"))
        self.assertEqual(
            response.data["artist_profile"]["stage_name"],
            "Updated Stage Name",
        )

    def test_patch_without_photo_preserves_existing_profile_picture(self):
        image_bytes = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_bytes, format="PNG")
        self.artist.profile_picture = SimpleUploadedFile(
            "existing-artist-avatar.png",
            image_bytes.getvalue(),
            content_type="image/png",
        )
        self.artist.save()
        existing_picture_name = self.artist.profile_picture.name
        self.client.force_authenticate(self.artist)

        response = self.client.patch(
            self.url,
            {
                "stage_name": "Updated Without Photo",
                "bio": "The existing photo must remain.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artist.refresh_from_db()
        self.assertEqual(self.artist.profile_picture.name, existing_picture_name)
        self.assertIsNotNone(response.data["profile_photo"])

    def test_patch_rejects_explicit_profile_photo_removal(self):
        self.client.force_authenticate(self.artist)

        response = self.client.patch(
            self.url,
            {"profile_photo": None},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_photo", response.data)

    def test_patch_rejects_non_artist_and_read_only_fields(self):
        self.client.force_authenticate(self.listener)

        non_artist_response = self.client.patch(
            self.url,
            {"stage_name": "Not Allowed"},
            format="json",
        )

        self.assertEqual(non_artist_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.artist)
        read_only_response = self.client.patch(
            self.url,
            {"listener_count": 999, "verification_status": "rejected"},
            format="json",
        )

        self.assertEqual(read_only_response.status_code, status.HTTP_200_OK)
        self.artist.refresh_from_db()
        self.assertEqual(self.artist.listener_count, 40)
        self.assertEqual(
            self.artist.verification_status,
            Artist.VerificationStatus.APPROVED,
        )

    def test_artist_profile_does_not_allow_post_put_or_delete(self):
        self.client.force_authenticate(self.artist)

        self.assertEqual(
            self.client.post(self.url, {}, format="json").status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual(
            self.client.put(self.url, {}, format="json").status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual(
            self.client.delete(self.url).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class SubscriptionApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="subscription@example.com",
            username="subscription",
            password="password123",
            display_name="Subscription Owner",
            subscription_tier=User.SubscriptionTier.SILVER,
        )
        self.other_user = User.objects.create_user(
            email="other-subscription@example.com",
            username="other_subscription",
            password="password123",
            display_name="Other Subscription Owner",
            subscription_tier=User.SubscriptionTier.GOLD,
        )
        self.url = reverse("subscription")

    def test_subscription_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_returns_only_authenticated_users_subscription(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"subscription_tier": "silver"})

    def test_put_updates_only_authenticated_users_subscription(self):
        self.client.force_authenticate(self.user)

        response = self.client.put(
            self.url,
            {"subscription_tier": User.SubscriptionTier.GOLD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"subscription_tier": "gold"})
        self.user.refresh_from_db()
        self.other_user.refresh_from_db()
        self.assertEqual(self.user.subscription_tier, User.SubscriptionTier.GOLD)
        self.assertEqual(
            self.other_user.subscription_tier,
            User.SubscriptionTier.GOLD,
        )

    def test_put_rejects_missing_or_invalid_subscription_tier(self):
        self.client.force_authenticate(self.user)

        missing_response = self.client.put(self.url, {}, format="json")
        invalid_response = self.client.put(
            self.url,
            {"subscription_tier": "platinum"},
            format="json",
        )

        self.assertEqual(missing_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_tier, User.SubscriptionTier.SILVER)

    def test_subscription_endpoint_does_not_allow_post_patch_or_delete(self):
        self.client.force_authenticate(self.user)

        post_response = self.client.post(self.url, {}, format="json")
        patch_response = self.client.patch(
            self.url,
            {"subscription_tier": User.SubscriptionTier.BASIC},
            format="json",
        )
        delete_response = self.client.delete(self.url)

        self.assertEqual(post_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(patch_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class PreferencesApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="preferences@example.com",
            username="preferences",
            password="password123",
            display_name="Preferences Owner",
        )
        self.other_user = User.objects.create_user(
            email="other-preferences@example.com",
            username="other_preferences",
            password="password123",
            display_name="Other Preferences Owner",
        )
        self.other_preferences = Preferences.objects.create(
            user=self.other_user,
            theme=Preferences.Theme.LIGHT,
            notification_limit=7,
            notification_sound_enabled=False,
            language=Preferences.Language.PERSIAN,
            system_voice=Preferences.SystemVoice.CALM,
        )
        self.url = reverse("preferences")

    def test_preferences_require_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_creates_and_returns_authenticated_users_defaults(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "theme": "dark",
                "notification_limit": 20,
                "app_sound_enabled": True,
                "language": "en",
                "system_voice": "default",
                "created_at": response.data["created_at"],
                "updated_at": response.data["updated_at"],
            },
        )
        self.assertTrue(Preferences.objects.filter(user=self.user).exists())
        self.other_preferences.refresh_from_db()
        self.assertEqual(self.other_preferences.notification_limit, 7)

    def test_patch_partially_updates_only_authenticated_users_preferences(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            self.url,
            {
                "theme": "light",
                "notification_limit": 35,
                "app_sound_enabled": False,
                "language": "fa",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        preferences = Preferences.objects.get(user=self.user)
        self.assertEqual(preferences.theme, Preferences.Theme.LIGHT)
        self.assertEqual(preferences.notification_limit, 35)
        self.assertFalse(preferences.notification_sound_enabled)
        self.assertEqual(preferences.language, Preferences.Language.PERSIAN)
        self.assertEqual(preferences.system_voice, Preferences.SystemVoice.DEFAULT)
        self.other_preferences.refresh_from_db()
        self.assertEqual(self.other_preferences.notification_limit, 7)

    def test_patch_rejects_invalid_preference_values(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            self.url,
            {
                "notification_limit": 0,
                "theme": "automatic",
                "language": "de",
                "system_voice": "loud",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            set(response.data),
            {"notification_limit", "theme", "language", "system_voice"},
        )

    def test_preferences_endpoint_does_not_allow_post_or_put(self):
        self.client.force_authenticate(self.user)

        post_response = self.client.post(self.url, {}, format="json")
        put_response = self.client.put(self.url, {}, format="json")

        self.assertEqual(post_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(put_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


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

    def test_basic_subscription_cannot_change_profile_photo(self):
        self.user.subscription_tier = User.SubscriptionTier.BASIC
        self.user.save(update_fields=("subscription_tier",))
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
            {"profile_photo": photo},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_photo", response.data)
        self.user.refresh_from_db()
        self.assertFalse(self.user.profile_picture)

    def test_basic_subscription_can_still_update_other_fields(self):
        self.user.subscription_tier = User.SubscriptionTier.BASIC
        self.user.save(update_fields=("subscription_tier",))
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            self.url,
            {"display_name": "Basic Owner"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Basic Owner")

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
