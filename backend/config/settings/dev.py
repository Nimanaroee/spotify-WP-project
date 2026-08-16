from .base import *

DEBUG = env.bool('DEBUG', default=True)

DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
    )
}
