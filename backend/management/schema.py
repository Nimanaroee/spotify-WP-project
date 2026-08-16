from drf_spectacular.utils import OpenApiResponse


SUPPORT_TAG = ["support"]
VERIFICATION_TAG = ["verification"]
AUDITING_TAG = ["auditing"]
SUBSCRIPTION_ADMIN_TAG = ["subscription-admin"]

FORBIDDEN_RESPONSE = OpenApiResponse(
    description="The authenticated user does not have the required role."
)

NOT_FOUND_RESPONSE = OpenApiResponse(description="No object matches the given id.")
