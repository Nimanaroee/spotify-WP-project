from drf_spectacular.utils import OpenApiResponse


NOTIFICATIONS_TAG = ["notifications"]

NOT_FOUND_RESPONSE = OpenApiResponse(
    description="No notification with that id belongs to the authenticated user."
)
