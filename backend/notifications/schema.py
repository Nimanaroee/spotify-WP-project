NOTIFICATIONS_TAG = ["notifications"]

NOT_FOUND_RESPONSE = {
    "description": "No notification with that id belongs to the authenticated user.",
    "content": {"application/json": {"example": {"detail": "Not found."}}},
}
