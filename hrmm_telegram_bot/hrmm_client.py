"""HRMM REST API mijozi."""

from __future__ import annotations

import httpx

from config import HRMM_API_BASE_URL


class HRMMClient:
    def __init__(self, access_token: str | None = None):
        self.base = HRMM_API_BASE_URL
        self.access_token = access_token

    def _headers(self, auth: bool = True) -> dict:
        headers = {"Accept": "application/json"}
        if auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    def _request(self, method: str, path: str, *, auth: bool = True, **kwargs):
        url = f"{self.base}{path}"
        with httpx.Client(timeout=45.0) as client:
            response = client.request(method, url, headers=self._headers(auth), **kwargs)
        payload = response.json() if response.content else {}
        if response.status_code >= 400 or payload.get("success") is False:
            message = payload.get("message") or payload.get("detail") or response.text
            raise RuntimeError(str(message)[:500])
        return payload

    def login(self, username: str, password: str) -> dict:
        return self._request(
            "POST",
            "/api/v1/auth/login/",
            auth=False,
            json={"username": username, "password": password},
        )

    def verify_2fa(self, challenge_token: str, code: str) -> dict:
        return self._request(
            "POST",
            "/api/v1/auth/login/verify-2fa/",
            auth=False,
            json={"challenge_token": challenge_token, "code": code},
        )

    def verify_email_otp(self, challenge_id: str, code: str) -> dict:
        return self._request(
            "POST",
            "/api/v1/auth/login/verify-email-otp/",
            auth=False,
            json={"challenge_id": challenge_id, "code": code},
        )

    def refresh_token(self, refresh: str) -> dict:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{self.base}/api/v1/auth/refresh/",
                json={"refresh": refresh},
            )
        payload = response.json()
        if response.status_code >= 400:
            raise RuntimeError("Token yangilash muvaffaqiyatsiz")
        return payload

    def me(self) -> dict:
        return self._request("GET", "/api/v1/auth/me/")

    def dashboard_stats(self) -> dict:
        return self._request("GET", "/api/v1/dashboard/stats/")

    def dashboard_admin(self) -> dict:
        return self._request("GET", "/api/v1/dashboard/admin/")

    def dashboard_operations(self) -> dict:
        return self._request("GET", "/api/v1/dashboard/operations/")

    def notifications(self, *, page_size: int = 8) -> dict:
        return self._request(
            "GET",
            f"/api/v1/notifications/?page=1&page_size={page_size}",
        )

    def leaves(self, *, page_size: int = 8) -> dict:
        return self._request(
            "GET",
            f"/api/v1/leaves/?page=1&page_size={page_size}",
        )

    def reports(self, *, page_size: int = 8) -> dict:
        return self._request(
            "GET",
            f"/api/v1/reports/?page=1&page_size={page_size}",
        )
