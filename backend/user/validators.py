from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_MB = 5

def validate_image_size(file):
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"Image file size must be under {MAX_IMAGE_SIZE_MB}MB.")