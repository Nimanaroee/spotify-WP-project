from importlib import reload
from pathlib import Path

from django.conf import settings
from django.test import Client, TestCase, override_settings
from django.urls import clear_url_caches


class MediaUrlTests(TestCase):
    @override_settings(DEBUG=True, ALLOWED_HOSTS=["testserver"])
    def test_uploaded_profile_picture_is_served_in_development(self):
        from config import urls

        reload(urls)
        clear_url_caches()
        profile_picture = Path(settings.MEDIA_ROOT) / "profile-pictures" / "test-avatar.png"
        profile_picture.parent.mkdir(parents=True, exist_ok=True)
        profile_picture.write_bytes(b"profile-picture")
        self.addCleanup(profile_picture.unlink, missing_ok=True)

        response = Client().get("/media/profile-pictures/test-avatar.png")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(b"".join(response.streaming_content), b"profile-picture")
