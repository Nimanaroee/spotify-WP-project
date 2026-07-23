from importlib import reload
from pathlib import Path

from django.conf import settings
from django.test import Client, TestCase, override_settings
from django.urls import clear_url_caches, reverse


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


class ApiDocumentationTests(TestCase):
    def test_openapi_schema_documents_every_registered_api_route(self):
        response = self.client.get(reverse("schema"), {"format": "json"})

        self.assertEqual(response.status_code, 200)
        schema = response.json()
        self.assertEqual(schema["openapi"].split(".")[0], "3")
        self.assertEqual(
            set(schema["paths"]),
            {
                "/api/v1/auth/login/",
                "/api/v1/auth/logout/",
                "/api/v1/auth/me/",
                "/api/v1/auth/refresh/",
                "/api/v1/auth/register/artist/",
                "/api/v1/auth/register/listener/",
                "/api/v1/payment/",
                "/api/v1/subscription/",
                "/api/v1/users/follows/{username}/",
                "/api/v1/users/preferences/",
                "/api/v1/users/profile/artist/",
                "/api/v1/users/profile/listener/",
                "/api/v1/users/profiles/{user_name}/",
                "/api/v1/users/subscription/",
            },
        )

    def test_documentation_interfaces_are_publicly_available(self):
        for url_name in ("swagger-ui", "redoc"):
            with self.subTest(url_name=url_name):
                response = self.client.get(reverse(url_name))

                self.assertEqual(response.status_code, 200)
