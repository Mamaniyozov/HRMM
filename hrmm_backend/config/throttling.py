from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Conservative rate limit for login and registration endpoints."""

    rate = "10/minute"
    scope = "login"


class OTPRateThrottle(AnonRateThrottle):
    """Strict rate limit for OTP/2FA verification endpoints."""

    rate = "5/minute"
    scope = "otp"


class UsernameIPLocaleRateThrottle(SimpleRateThrottle):
    """Throttle by username + IP combination to prevent credential stuffing."""

    scope = "login_username"

    def get_cache_key(self, request, view):
        username = request.data.get("username", "") if hasattr(request, "data") else ""
        ip = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": f"{username}:{ip}"}

    rate = "5/minute"
