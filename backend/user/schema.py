"""Shared drf-spectacular pieces for the API documentation."""

from drf_spectacular.utils import OpenApiExample

AUTH_TAG = ["auth"]
USERS_TAG = ["users"]

AUTH_BEARER = [{"jwtAuth": []}]
PUBLIC: list = []

ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg0ODk2MDAwLCJpYXQiOjE3ODQ4OTI0MDAsImp0aSI6IjAxMzE2MmE4YTA5YjQyYjk4ZDQ1YTZjZWE5Y2VjYjU0IiwidXNlcl9pZCI6MTJ9.7H1cO0iWl3mP6qU2nJ8rT4yXvK1sD9fG0hL5aB3cE6dF"
REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTQ5NjgwMCwiaWF0IjoxNzg0ODkyNDAwLCJqdGkiOiJhYjEyY2RmZTc2MDQ0OTk3YjY2NDViM2YyNDJmMzM1NiIsInVzZXJfaWQiOjEyfQ.2K9fR8sV5nQ1wE7zT6yU4iO3pA0sD2gH7jK4lM8nB1vC"

AUTHENTICATED_RESPONSES = {
    401: {
        "description": "Authentication credentials were not provided or are invalid.",
        "content": {
            "application/json": {
                "example": {"detail": "Authentication credentials were not provided."}
            }
        },
    },
}

LISTENER_USER = {
    "id": 12,
    "username": "sara_mohammadi",
    "email": "sara@example.com",
    "display_name": "Sara Mohammadi",
    "role": "listener",
    "birth_date": "1998-04-12",
    "gender": "female",
    "profile_picture": "http://localhost:8000/media/profile-pictures/sara.jpg",
    "subscription_tier": "basic",
    "followers_count": 3,
    "following_count": 8,
    "streamed_today": 14,
    "created_at": "2026-07-01T09:30:00Z",
    "updated_at": "2026-07-20T18:45:10Z",
}

ARTIST_USER = {
    "id": 27,
    "username": "aria_band",
    "email": "aria@example.com",
    "display_name": "Aria",
    "role": "artist",
    "birth_date": None,
    "gender": None,
    "profile_picture": None,
    "subscription_tier": "basic",
    "followers_count": 1240,
    "following_count": 12,
    "streamed_today": 0,
    "created_at": "2026-06-15T08:00:00Z",
    "updated_at": "2026-07-22T07:10:33Z",
}

SHORT_USERS = [
    {
        "display_name": "Aria",
        "username": "aria_band",
        "avatar": None,
    },
    {
        "display_name": "Nima",
        "username": "nima_rahimi",
        "avatar": "http://localhost:8000/media/profile-pictures/nima.png",
    },
]

LOGIN_EXAMPLES = [
    OpenApiExample(
        "Login request",
        summary="Log in with email and password",
        value={"email": "sara@example.com", "password": "Str0ng!Pass"},
        request_only=True,
    ),
    OpenApiExample(
        "Login response",
        summary="JWT pair plus the authenticated user",
        value={
            "refresh": REFRESH_TOKEN,
            "access": ACCESS_TOKEN,
            "user": LISTENER_USER,
        },
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Invalid credentials",
        summary="Wrong email or password",
        value={"detail": "No active account found with the given credentials"},
        response_only=True,
        status_codes=["401"],
    ),
]

TOKEN_REFRESH_EXAMPLES = [
    OpenApiExample(
        "Refresh request",
        summary="Exchange a refresh token for a new access token",
        value={"refresh": REFRESH_TOKEN},
        request_only=True,
    ),
    OpenApiExample(
        "Refresh response",
        value={"access": ACCESS_TOKEN},
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Invalid or blacklisted refresh token",
        value={"detail": "Token is invalid or expired", "code": "token_not_valid"},
        response_only=True,
        status_codes=["401"],
    ),
]

LOGOUT_EXAMPLES = [
    OpenApiExample(
        "Logout request",
        summary="Blacklist the given refresh token",
        description=(
            "The refresh token must belong to the authenticated user. "
            "On success the token is blacklisted and the response body is empty."
        ),
        value={"refresh": REFRESH_TOKEN},
        request_only=True,
    ),
    OpenApiExample(
        "Invalid refresh token",
        value={"refresh": ["Invalid or expired refresh token."]},
        response_only=True,
        status_codes=["400"],
    ),
]

REGISTER_LISTENER_EXAMPLES = [
    OpenApiExample(
        "Register listener request",
        value={
            "display_name": "Sara Mohammadi",
            "email": "sara@example.com",
            "password": "Str0ng!Pass",
            "password_confirmation": "Str0ng!Pass",
            "birth_date": "1998-04-12",
            "gender": "female",
            "privacy_policy_accepted": True,
        },
        request_only=True,
    ),
    OpenApiExample(
        "Register listener response",
        summary="The account is created and logged in immediately",
        value={
            "access": ACCESS_TOKEN,
            "refresh": REFRESH_TOKEN,
            "user": LISTENER_USER,
        },
        response_only=True,
        status_codes=["201"],
    ),
    OpenApiExample(
        "Validation errors",
        value={
            "email": ["An account with this email already exists."],
            "password_confirmation": ["Passwords do not match."],
        },
        response_only=True,
        status_codes=["400"],
    ),
]

REGISTER_ARTIST_EXAMPLES = [
    OpenApiExample(
        "Register artist request",
        description=(
            "Artists start with `verification_status = pending` and become active "
            "once an admin approves them. Until then they can still log in."
        ),
        value={
            "email": "aria@example.com",
            "password": "Str0ng!Pass",
            "password_confirmation": "Str0ng!Pass",
            "stage_name": "Aria",
            "portfolio_links": [
                "https://soundcloud.com/aria",
                "https://instagram.com/aria.music",
            ],
        },
        request_only=True,
    ),
    OpenApiExample(
        "Register artist response",
        value={
            "access": ACCESS_TOKEN,
            "refresh": REFRESH_TOKEN,
            "user": ARTIST_USER,
        },
        response_only=True,
        status_codes=["201"],
    ),
]

CURRENT_USER_EXAMPLES = [
    OpenApiExample(
        "Current user response",
        value=LISTENER_USER,
        response_only=True,
        status_codes=["200"],
    ),
]

PROFILE_READ = {
    "user_name": "sara_mohammadi",
    "display_name": "Sara Mohammadi",
    "bearth_date": "1998-04-12",
    "gender": "female",
    "num_following": 8,
    "num_follower": 3,
    "streamed_today": 14,
    "subscription": "basic",
    "profile_photo": "http://localhost:8000/media/profile-pictures/sara.jpg",
    "followings": SHORT_USERS,
    "followers": SHORT_USERS[:1],
}

PROFILE_EXAMPLES = [
    OpenApiExample(
        "Profile response",
        value=PROFILE_READ,
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Update profile request",
        summary="Any subset of the editable fields",
        value={
            "display_name": "Sara M.",
            "gender": "female",
            "bearth_date": "1998-04-12",
        },
        request_only=True,
    ),
    OpenApiExample(
        "Follow fields are read-only here",
        value={
            "followers": ["Follow relationships must use the follow API."],
        },
        response_only=True,
        status_codes=["400"],
    ),
]

ARTIST_PROFILE_READ = {
    **PROFILE_READ,
    "user_name": "aria_band",
    "display_name": "Aria",
    "bearth_date": None,
    "gender": None,
    "num_following": 12,
    "num_follower": 1240,
    "streamed_today": 0,
    "profile_photo": None,
    "role": "artist",
    "is_following": True,
    "artist_profile": {
        "stage_name": "Aria",
        "bio": "Independent pop band from Tehran.",
        "verification_status": "approved",
        "is_verified": True,
        "listener_count": 1240,
        "total_streams": 98231,
    },
    "albums": [],
    "singles": [],
}

ARTIST_PROFILE_EXAMPLES = [
    OpenApiExample(
        "Artist profile response",
        value=ARTIST_PROFILE_READ,
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Update artist profile request",
        description="`profile_photo` is sent as multipart form-data together with the other fields.",
        value={
            "stage_name": "Aria",
            "bio": "Independent pop band from Tehran.",
        },
        request_only=True,
    ),
    OpenApiExample(
        "Not an artist",
        value={"detail": "Only artists can access this profile."},
        response_only=True,
        status_codes=["403"],
    ),
]

PREFERENCES_READ = {
    "theme": "dark",
    "notification_limit": 20,
    "app_sound_enabled": True,
    "language": "en",
    "system_voice": "calm",
    "created_at": "2026-07-01T09:30:00Z",
    "updated_at": "2026-07-20T18:45:10Z",
}

PREFERENCES_EXAMPLES = [
    OpenApiExample(
        "Preferences response",
        description="Preferences are created with defaults on first access.",
        value=PREFERENCES_READ,
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Update preferences request",
        summary="Any subset of the editable fields",
        value={
            "theme": "light",
            "notification_limit": 10,
            "app_sound_enabled": False,
            "language": "fa",
            "system_voice": "bright",
        },
        request_only=True,
    ),
    OpenApiExample(
        "Invalid notification limit",
        value={"notification_limit": ["Ensure this value is less than or equal to 99."]},
        response_only=True,
        status_codes=["400"],
    ),
]

SUBSCRIPTION_EXAMPLES = [
    OpenApiExample(
        "Subscription response",
        value={"subscription_tier": "silver"},
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Change subscription request",
        description="One of: `basic`, `silver`, `gold`.",
        value={"subscription_tier": "gold"},
        request_only=True,
    ),
]

FOLLOW_STATUS_EXAMPLES = [
    OpenApiExample(
        "Following",
        value={"user": SHORT_USERS[0], "is_following": True},
        response_only=True,
        status_codes=["200", "201"],
    ),
    OpenApiExample(
        "Not following",
        value={"user": SHORT_USERS[0], "is_following": False},
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Cannot follow yourself",
        value={"username": ["A user cannot follow themselves."]},
        response_only=True,
        status_codes=["400"],
    ),
    OpenApiExample(
        "User not found",
        value={"detail": "Not found."},
        response_only=True,
        status_codes=["404"],
    ),
]

PUBLIC_PROFILE_EXAMPLES = [
    OpenApiExample(
        "Artist public profile",
        value=ARTIST_PROFILE_READ,
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "Listener public profile",
        description="`artist_profile` is null for non-artist accounts.",
        value={
            **PROFILE_READ,
            "role": "listener",
            "is_following": False,
            "artist_profile": None,
            "albums": [],
            "singles": [],
        },
        response_only=True,
        status_codes=["200"],
    ),
    OpenApiExample(
        "User not found",
        value={"detail": "Not found."},
        response_only=True,
        status_codes=["404"],
    ),
]
