from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Conservative rate limit for login and registration endpoints."""

    rate = "10/minute"
    scope = "login"


class OTPRateThrottle(AnonRateThrottle):
    """Strict rate limit for OTP/2FA verification endpoints."""

    rate = "5/minute"
    scope = "otp"
