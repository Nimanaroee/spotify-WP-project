SUPPORT_TAG = ["support"]
VERIFICATION_TAG = ["verification"]
AUDITING_TAG = ["auditing"]
SUBSCRIPTION_ADMIN_TAG = ["subscription-admin"]

FORBIDDEN_RESPONSE = {
    "description": "The authenticated user does not have the required role.",
    "content": {
        "application/json": {
            "example": {"detail": "You do not have permission to perform this action."}
        }
    },
}

NOT_FOUND_RESPONSE = {
    "description": "No object matches the given id.",
    "content": {"application/json": {"example": {"detail": "Not found."}}},
}
