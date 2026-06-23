"""drf-spectacular OpenAPI extensions for HRMM custom authentication.

Registers ``HRMMJWTAuthentication`` so the generated Swagger/OpenAPI schema
includes a working "Authorize" button (Bearer token) instead of the
``drf_spectacular.W001`` "could not resolve authenticator" warnings.
"""
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class HRMMJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.authentication.auth.HRMMJWTAuthentication"
    name = "jwtAuth"  # shown in the Swagger UI Authorize dialog

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "JWT access token. `Authorization: Bearer <token>` "
                "header orqali yuboring. Token /api/v1/auth/login/ "
                "endpoint'idan olinadi."
            ),
        }
