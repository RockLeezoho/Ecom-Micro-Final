from .settings import *

# Use a fast in-memory SQLite DB for tests to avoid external DB dependencies
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
