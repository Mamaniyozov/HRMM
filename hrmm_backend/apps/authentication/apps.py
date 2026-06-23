from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.authentication"

    def ready(self):
        # Register drf-spectacular OpenAPI extension for HRMMJWTAuthentication.
        # Importing here ensures the scheme is registered before schema generation.
        from . import schema  # noqa: F401
