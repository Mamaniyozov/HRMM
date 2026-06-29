"""HRMM REST API mijozi — async, auto-refresh bilan."""

from __future__ import annotations

import httpx

from config import HRMM_API_BASE_URL

# Global AsyncClient — butun bot hayoti davomida qayta ishlatiladi
_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=45.0)
    return _http_client


async def close_http_client() -> None:
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
    _http_client = None


class HRMMClient:
    def __init__(self, access_token: str | None = None, refresh_token: str | None = None):
        self.base = HRMM_API_BASE_URL
        self.access_token = access_token
        self.refresh_token = refresh_token

    def _headers(self, auth: bool = True) -> dict:
        headers = {"Accept": "application/json"}
        if auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    async def _request(self, method: str, path: str, *, auth: bool = True, **kwargs) -> dict:
        url = f"{self.base}{path}"
        client = get_http_client()
        response = await client.request(method, url, headers=self._headers(auth), **kwargs)

        # Auto-refresh on 401
        if response.status_code == 401 and auth and self.refresh_token:
            refreshed = await self._do_refresh()
            if refreshed:
                response = await client.request(method, url, headers=self._headers(auth), **kwargs)

        payload = response.json() if response.content else {}
        if response.status_code >= 400 or payload.get("success") is False:
            message = payload.get("message") or payload.get("detail") or response.text
            raise RuntimeError(str(message)[:500])
        return payload

    async def _do_refresh(self) -> bool:
        if not self.refresh_token:
            return False
        try:
            client = get_http_client()
            response = await client.post(
                f"{self.base}/api/v1/auth/refresh/",
                json={"refresh": self.refresh_token},
            )
            payload = response.json()
            if response.status_code < 400 and payload.get("access"):
                self.access_token = payload["access"]
                if payload.get("refresh"):
                    self.refresh_token = payload["refresh"]
                return True
        except Exception:
            pass
        return False

    async def login(self, username: str, password: str) -> dict:
        return await self._request(
            "POST",
            "/api/v1/auth/login/",
            auth=False,
            json={"username": username, "password": password},
        )

    async def verify_2fa(self, challenge_token: str, code: str) -> dict:
        return await self._request(
            "POST",
            "/api/v1/auth/login/verify-2fa/",
            auth=False,
            json={"challenge_token": challenge_token, "code": code},
        )

    async def verify_email_otp(self, challenge_id: str, code: str) -> dict:
        return await self._request(
            "POST",
            "/api/v1/auth/login/verify-email-otp/",
            auth=False,
            json={"challenge_id": challenge_id, "code": code},
        )

    async def me(self) -> dict:
        return await self._request("GET", "/api/v1/auth/me/")

    async def dashboard_stats(self) -> dict:
        return await self._request("GET", "/api/v1/dashboard/stats/")

    async def dashboard_admin(self) -> dict:
        return await self._request("GET", "/api/v1/dashboard/admin/")

    async def dashboard_operations(self) -> dict:
        return await self._request("GET", "/api/v1/dashboard/operations/")

    async def notifications(self, *, page_size: int = 8) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/notifications/?page=1&page_size={page_size}",
        )

    async def leaves(self, *, page_size: int = 8) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/leaves/?page=1&page_size={page_size}",
        )

    async def reports(self, *, page_size: int = 8) -> dict:
        return await self._request(
            "GET",
            f"/api/v1/reports/?page=1&page_size={page_size}",
        )
