/**
 * AIDA AI Assistant — frontend mantiq.
 * Chat widget ochilishi, xabar yuborish, javob qabul qilish.
 */
import { state } from "./state.js";
import { apiRequest } from "./api.js";
import { t } from "./i18n.js";

let _sessionId = null;
let _isSending = false;
let _panelOpen = false;

function _el(id) {
  return document.getElementById(id);
}

function _getCurrentPage() {
  const hash = window.location.hash || "";
  return hash.replace("#", "") || "dashboard";
}

function _getCurrentReportId() {
  return state.lastCreatedReportId || null;
}

function _scrollToBottom() {
  const messages = _el("aidaMessages");
  if (messages) messages.scrollTop = messages.scrollHeight;
}

function _escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Markdown'ni sodda HTML'ga aylantirish (bold, list, code, paragraph).
 * Bu to'liq markdown parser emas — AIDA javoblari uchun yetarli.
 */
function _simpleMarkdownToHtml(md) {
  if (!md) return "";
  let html = _escapeHtml(md);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><ul>/g, "<ul>");
  html = html.replace(/<\/ul><\/p>/g, "</ul>");
  return html;
}

function _addMessage(role, content, isError = false) {
  const messages = _el("aidaMessages");
  if (!messages) return;
  const wrapper = document.createElement("div");
  wrapper.className = `aida-message aida-message-${role}${isError ? " aida-message-error" : ""}`;
  const bubble = document.createElement("div");
  bubble.className = "aida-message-content";
  if (role === "assistant") {
    bubble.innerHTML = _simpleMarkdownToHtml(content);
  } else {
    bubble.textContent = content;
  }
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  _scrollToBottom();
}

function _setTyping(show) {
  const typing = _el("aidaTyping");
  if (typing) typing.hidden = !show;
  if (show) _scrollToBottom();
}

function _setInputEnabled(enabled) {
  const input = _el("aidaInput");
  const sendBtn = _el("aidaSendBtn");
  if (input) input.disabled = !enabled;
  if (sendBtn) sendBtn.disabled = !enabled;
}

async function _sendMessage() {
  const input = _el("aidaInput");
  if (!input) return;
  const message = input.value.trim();
  if (!message || _isSending) return;

  _isSending = true;
  input.value = "";
  input.style.height = "auto";
  _setInputEnabled(false);
  _addMessage("user", message);
  _setTyping(true);

  try {
    const response = await apiRequest("/api/v1/aida/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: _sessionId,
        current_page: _getCurrentPage(),
        current_report_id: _getCurrentReportId(),
        voice_mode: false,
      }),
    });

    _setTyping(false);
    const data = response.data || response;
    if (data && data.error) {
      _addMessage("assistant", data.content || t("aida_error") || "Xatolik yuz berdi.", true);
    } else if (data && data.content) {
      _sessionId = data.session_id || _sessionId;
      _addMessage("assistant", data.content);
    } else {
      _addMessage("assistant", t("aida_error") || "Javob olinmadi.", true);
    }
  } catch (err) {
    _setTyping(false);
    _addMessage("assistant", err.message || t("aida_error") || "AIDA bilan aloqada xatolik.", true);
  } finally {
    _isSending = false;
    _setInputEnabled(true);
    const input2 = _el("aidaInput");
    if (input2) input2.focus();
  }
}

function _openPanel() {
  const widget = _el("aidaWidget");
  const panel = _el("aidaPanel");
  const fab = _el("aidaFab");
  if (widget) widget.hidden = false;
  if (panel) panel.hidden = false;
  if (fab) fab.style.display = "none";
  _panelOpen = true;
  const input = _el("aidaInput");
  if (input) setTimeout(() => input.focus(), 100);
}

function _closePanel() {
  const panel = _el("aidaPanel");
  const fab = _el("aidaFab");
  if (panel) panel.hidden = true;
  if (fab) fab.style.display = "flex";
  _panelOpen = false;
}

function _newSession() {
  _sessionId = null;
  const messages = _el("aidaMessages");
  if (messages) {
    messages.innerHTML = "";
    const welcome = document.createElement("div");
    welcome.className = "aida-message aida-message-assistant";
    const bubble = document.createElement("div");
    bubble.className = "aida-message-content";
    bubble.textContent = t("aida_welcome") || "Salom! Men AIDA — HRMM tizimining AI yordamchisiman.";
    welcome.appendChild(bubble);
    messages.appendChild(welcome);
  }
  const input = _el("aidaInput");
  if (input) input.focus();
}

function _autoResizeTextarea() {
  const input = _el("aidaInput");
  if (!input) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 100) + "px";
}

export function initAida() {
  const fab = _el("aidaFab");
  const closeBtn = _el("aidaCloseBtn");
  const newSessionBtn = _el("aidaNewSessionBtn");
  const sendBtn = _el("aidaSendBtn");
  const input = _el("aidaInput");

  if (fab) {
    fab.addEventListener("click", () => {
      if (_panelOpen) {
        _closePanel();
      } else {
        _openPanel();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", _closePanel);
  if (newSessionBtn) newSessionBtn.addEventListener("click", _newSession);
  if (sendBtn) sendBtn.addEventListener("click", _sendMessage);

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        _sendMessage();
      }
    });
    input.addEventListener("input", _autoResizeTextarea);
  }

  if (fab) fab.style.display = "flex";
}

export function showAidaWidget() {
  const widget = _el("aidaWidget");
  if (widget) widget.hidden = false;
}

export function hideAidaWidget() {
  const widget = _el("aidaWidget");
  if (widget) widget.hidden = true;
  _closePanel();
}
