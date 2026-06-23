function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (_e) {
    return String(value);
  }
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isImageUrl(url) {
  if (!url) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
  const lowerUrl = String(url).toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}
function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

export { safeStringify, escapeHtml, isImageUrl, formatDate, normalizeSearchValue, isUuid };
