"""AIDA chat uchun foydalanuvchi bo'yicha rate limiting (Redis-backed cache orqali)."""

from rest_framework.throttling import UserRateThrottle


class AidaChatThrottle(UserRateThrottle):
    """Foydalanuvchi uchun daqiqada cheklangan AIDA so'rovlari.

    Necha marta ruxsat berilishi `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES.aida_chat`
    orqali sozlanadi (default: 10/minute). DRF'ning standart `SimpleRateThrottle`
    Django cache orqali ishlaydi — production'da `CACHES` Redis'ga ulangan
    bo'lishi kerak (bir nechta gunicorn worker orasida to'g'ri hisoblash uchun).
    """

    scope = "aida_chat"
