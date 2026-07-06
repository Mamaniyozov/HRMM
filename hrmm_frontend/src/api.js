import { state } from "./state.js";
import { t } from "./i18n.js";

// Backend API base used in production. The frontend and backend are deployed
// on separate domains, so we must point API calls at the backend URL.
const API_URL = "https://hrmm-production-b4ec.up.railway.app";

const DEFAULT_API_BASE = (() => {
  // 1) Explicit override (injected by backend or set by admin in localStorage)
  const configuredBase = window.__HRMM_API_BASE__ || window.localStorage.getItem("hrmm_api_base") || "";
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  const origin = window.location.origin || "";
  // 2) Local development — backend runs on a separate port.
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://127.0.0.1:8000";
  }

  // 3) Production — frontend and backend are on different origins.
  return API_URL;
})();
const DEFAULT_API_TIMEOUT_MS = 45000;

// ===== Token refresh interceptor (prevents parallel 401 race condition) =====
let _refreshPromise = null;
let _onAuthFailure = null;

function setAuthFailureHandler(handler) {
  _onAuthFailure = handler;
}

async function refreshAccessToken() {
  if (!state.refreshToken) {
    throw new Error("No refresh token available");
  }
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const response = await fetch(`${state.apiBase}/api/v1/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: state.refreshToken }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.data?.access) {
        throw new Error("Token refresh failed");
      }
      state.accessToken = data.data.access;
      if (data.data.refresh) {
        state.refreshToken = data.data.refresh;
      }
      return state.accessToken;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  return headers;
}

async function apiRequest(path, options = {}) {
  let response;
  const { timeoutMs = DEFAULT_API_TIMEOUT_MS, ...fetchOptions } = options;
  let timeoutId = null;

  if (timeoutMs > 0 && !fetchOptions.signal) {
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    response = await fetch(`${state.apiBase}${path}`, fetchOptions);
  } catch (networkError) {
    if (networkError?.name === "AbortError") {
      throw new Error(`${t("err_timeout_prefix")} ${Math.round(timeoutMs / 1000)} ${t("err_timeout_suffix")}`);
    }
    throw new Error(`${t("err_api_connection")}: ${state.apiBase}`);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
  const data = await response.json().catch(() => null);

  // ===== 401 interceptor: refresh token once, then retry the original request =====
  if (response.status === 401 && state.refreshToken && !options._isRetry) {
    try {
      await refreshAccessToken();
      const retryHeaders = { ...fetchOptions.headers };
      if (state.accessToken) retryHeaders.Authorization = `Bearer ${state.accessToken}`;
      return apiRequest(path, { ...options, headers: retryHeaders, _isRetry: true });
    } catch (refreshError) {
      if (typeof _onAuthFailure === "function") {
        _onAuthFailure();
      }
      const err = new Error(t("session_expired") || "Session expired. Please log in again.");
      err.status = 401;
      err.responseStatus = 401;
      err.responseBody = JSON.stringify(data);
      throw err;
    }
  }

  if (!response.ok || data?.success === false) {
    const fallbackMessage =
      response.status === 404
        ? t("err_api_not_found").replace("{base}", state.apiBase)
        : t("err_request_failed").replace("{status}", response.status);

    let payloadText = "";
    if (typeof data?.data === "string") payloadText = data.data;
    else if (typeof data === "string") payloadText = data;
    else if (data?.data && typeof data.data === "object") payloadText = JSON.stringify(data.data);
    else if (data && typeof data === "object") payloadText = JSON.stringify(data);

    const normalizedPayloadText = payloadText && payloadText !== "null" ? payloadText : "";
    let detailText = "";
    if (data?.detail) {
      detailText = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
    const message = formatApiErrorMessage(data) || detailText || normalizedPayloadText || fallbackMessage;
    const err = new Error(message);
    err.status = response.status;
    err.responseStatus = response.status;
    try {
      err.responseBody = typeof data === "string" ? data : JSON.stringify(data);
    } catch (_e) {
      err.responseBody = String(data);
    }
    throw err;
  }

  return data || {};
}

// FIXED: Centralized user-friendly error message mapping (keys map to translation keys)
const ERROR_MESSAGES = {
  "Bu rol uchun department majburiy": "err_role_dept_required",
  "UNIT_HEAD uchun unit majburiy": "err_unit_head_unit_required",
  "DEPT_HEAD uchun unit kiritilmaydi": "err_dept_head_no_unit",
  "DIRECTOR uchun department va unit biriktirilmaydi": "err_director_no_dept_unit",
  "Tanlangan unit shu departmentga tegishli emas": "err_unit_not_in_dept",
  "Kasbiy rol berilganda department majburiy": "err_job_role_dept_required",
  "Daraja berish uchun avval job_role tanlang": "err_level_requires_job_role",
  "Baho 1 dan 5 gacha bo'lishi kerak": "err_rating_range",
  "User not found": "err_user_not_found",
  "O'zingizni delete qila olmaysiz": "err_cannot_delete_self",
};

function getUserFriendlyError(rawText) {
  if (!rawText) return t("generic_error");
  // Convert non-string inputs to string safely — avoid [object Object]
  let text = rawText;
  if (typeof rawText === "object") {
    try {
      if (rawText?.detail) text = String(rawText.detail);
      else if (rawText?.message) text = String(rawText.message);
      else if (Array.isArray(rawText?.messages) && rawText.messages[0]?.message) text = String(rawText.messages[0].message);
      else text = JSON.stringify(rawText);
    } catch (_e) {
      text = String(rawText);
    }
  }
  text = String(text);
  const normalized = text.toLowerCase();
  for (const [technical, key] of Object.entries(ERROR_MESSAGES)) {
    if (normalized.includes(technical.toLowerCase())) return t(key);
  }
  // If it's a field-level error like "field: message", return just the message part
  const fieldMatch = text.match(/^[^:]+:\s*(.+)$/);
  if (fieldMatch) {
    const msg = fieldMatch[1].trim();
    for (const [technical, key] of Object.entries(ERROR_MESSAGES)) {
      if (msg.toLowerCase().includes(technical.toLowerCase())) return t(key);
    }
    return msg;
  }
  return text;
}

function formatApiErrorMessage(data) {
  if (!data) return "";
  if (data.errors && typeof data.errors === "object") {
    const parts = [];
    Object.entries(data.errors).forEach(([field, value]) => {
      let rawMessage = "";
      if (Array.isArray(value)) {
        rawMessage = value.join("; ");
      } else if (value && typeof value === "object") {
        rawMessage = value;
      } else if (value) {
        rawMessage = String(value);
      }
      parts.push(getUserFriendlyError(rawMessage));
    });
    if (parts.length) return parts.join(" ") + ". " + t("please_check_info");
  }
  // Handle Django JWT-style errors where data.detail is an object or string
  if (data.detail) {
    const detailMsg = getUserFriendlyError(data.detail);
    if (detailMsg && detailMsg !== t("generic_error")) return detailMsg;
  }
  return getUserFriendlyError(data.message || "");
}

export { API_URL, DEFAULT_API_BASE, DEFAULT_API_TIMEOUT_MS, getHeaders, apiRequest, setAuthFailureHandler, refreshAccessToken, ERROR_MESSAGES, getUserFriendlyError, formatApiErrorMessage };
