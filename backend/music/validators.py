import os
from django.conf import settings
from django.core.exceptions import ValidationError

def validate_audio_file(file):
    if file.size > settings.MUSIC_MAX_AUDIO_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f"Audio file size must be under {settings.MUSIC_MAX_AUDIO_SIZE_MB}MB."
        )
    
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.MUSIC_ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError(
            "Unsupported file extension. Allowed extensions are: "
            f"{', '.join(settings.MUSIC_ALLOWED_AUDIO_EXTENSIONS)}"
        )

def validate_image_size(file):
    if file.size > settings.MUSIC_MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f"Image file size must be under {settings.MUSIC_MAX_IMAGE_SIZE_MB}MB."
        )
