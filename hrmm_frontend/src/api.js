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
    const message = formatApiErrorMessage(data) || data?.detail || normalizedPayloadText || fallbackMessage;
    throw new Error(message);
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
  const normalized = String(rawText).toLowerCase();
  for (const [technical, key] of Object.entries(ERROR_MESSAGES)) {
    if (normalized.includes(technical.toLowerCase())) return t(key);
  }
  // If it's a field-level error like "field: message", return just the message part in a friendly way
  const fieldMatch = String(rawText).match(/^[^:]+:\s*(.+)$/);
  if (fieldMatch) {
    const msg = fieldMatch[1].trim();
    for (const [technical, key] of Object.entries(ERROR_MESSAGES)) {
      if (msg.toLowerCase().includes(technical.toLowerCase())) return t(key);
    }
    return msg + ". " + t("please_check_info");
  }
  return rawText + ". " + t("please_check_info");
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
        rawMessage = JSON.stringify(value);
      } else if (value) {
        rawMessage = String(value);
      }
      parts.push(getUserFriendlyError(rawMessage));
    });
    if (parts.length) return parts.join(" ");
  }
  return getUserFriendlyError(data.message || "");
}

export { API_URL, DEFAULT_API_BASE, DEFAULT_API_TIMEOUT_MS, getHeaders, apiRequest, ERROR_MESSAGES, getUserFriendlyError, formatApiErrorMessage };
