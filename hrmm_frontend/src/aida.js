/**
 * AIDA AI Assistant — frontend mantiq.
 * Chat widget ochilishi, xabar yuborish, javob qabul qilish, suhbatlar
 * tarixi va ovozli kiritish (Web Speech API).
 */
import { state } from "./state.js";
import { apiRequest, getHeaders } from "./api.js";
import { t } from "./i18n.js";
import { formatDate } from "./utils.js";

let _conversationId = null;
let _isSending = false;
let _panelOpen = false;
let _historyOpen = false;
let _recognition = null;
let _isRecording = false;
let _recognitionLang = "uz-UZ";

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

function _addErrorMessage(text, onRetry) {
  const messages = _el("aidaMessages");
  if (!messages) return;
  const wrapper = document.createElement("div");
  wrapper.className = "aida-message aida-message-assistant aida-message-error";
  const bubble = document.createElement("div");
  bubble.className = "aida-message-content aida-error-content";

  const row = document.createElement("div");
  row.className = "aida-error-row";
  const icon = document.createElement("span");
  icon.className = "aida-error-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>';
  const msgEl = document.createElement("span");
  msgEl.className = "aida-error-text";
  msgEl.textContent = text;
  row.appendChild(icon);
  row.appendChild(msgEl);
  bubble.appendChild(row);

  if (onRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "aida-retry-btn";
    retryBtn.textContent = t("aida_retry") || "Qayta urinish";
    retryBtn.addEventListener("click", () => {
      wrapper.remove();
      onRetry();
    });
    bubble.appendChild(retryBtn);
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

function _executeAidaFunctionCalls(functionCalls) {
  if (!Array.isArray(functionCalls) || !functionCalls.length) return;
  functionCalls.forEach((call) => {
    const name = call.name;
    const args = call.arguments || {};
    if (name === "navigate_to" && typeof window.executeAidaNavigation === "function") {
      window.executeAidaNavigation(args.page, args.entity_id);
    }
  });
}

async function _sendMessage(retryMessage) {
  const input = _el("aidaInput");
  const isRetry = typeof retryMessage === "string";
  const message = isRetry ? retryMessage : input ? input.value.trim() : "";
  if (!message || _isSending) return;

  if (_isRecording) _stopRecording();

  _isSending = true;
  if (!isRetry && input) {
    input.value = "";
    input.style.height = "auto";
    _addMessage("user", message);
  }
  _setInputEnabled(false);
  _setTyping(true);

  try {
    const response = await apiRequest("/api/v1/aida/chat/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        conversation_id: _conversationId,
        current_page: _getCurrentPage(),
        current_report_id: _getCurrentReportId(),
        voice_mode: false,
      }),
    });

    _setTyping(false);
    const data = response.data || response;
    if (data && data.error) {
      _addErrorMessage(data.content || t("aida_error") || "Xatolik yuz berdi.", () => _sendMessage(message));
    } else if (data && data.content) {
      _conversationId = data.conversation_id || _conversationId;
      _addMessage("assistant", data.content);
      _executeAidaFunctionCalls(data.function_calls);
    } else {
      _addErrorMessage(t("aida_error") || "Javob olinmadi.", () => _sendMessage(message));
    }
  } catch (err) {
    _setTyping(false);
    _addErrorMessage(err.message || t("aida_error") || "AIDA bilan aloqada xatolik.", () => _sendMessage(message));
  } finally {
    _isSending = false;
    _setInputEnabled(true);
    const input2 = _el("aidaInput");
    if (input2) input2.focus();
  }
}

function _onOutsideClick(e) {
  const widget = _el("aidaWidget");
  if (widget && !widget.contains(e.target)) _closePanel();
}

function _onEscapeKey(e) {
  if (e.key === "Escape") {
    if (_historyOpen) _closeHistoryPanel();
    else _closePanel();
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
  document.addEventListener("mousedown", _onOutsideClick, true);
  document.addEventListener("keydown", _onEscapeKey);
}

function _closePanel() {
  const panel = _el("aidaPanel");
  const fab = _el("aidaFab");
  if (_isRecording) _stopRecording();
  _closeHistoryPanel();
  if (panel) panel.hidden = true;
  if (fab) fab.style.display = "flex";
  _panelOpen = false;
  document.removeEventListener("mousedown", _onOutsideClick, true);
  document.removeEventListener("keydown", _onEscapeKey);
}

function _renderWelcomeMessage() {
  const messages = _el("aidaMessages");
  if (!messages) return;
  messages.innerHTML = "";
  const welcome = document.createElement("div");
  welcome.className = "aida-message aida-message-assistant";
  const bubble = document.createElement("div");
  bubble.className = "aida-message-content";
  bubble.textContent = t("aida_welcome") || "Salom! Men AIDA — HRMM tizimining AI yordamchisiman.";
  welcome.appendChild(bubble);
  messages.appendChild(welcome);
}

function _newSession() {
  _conversationId = null;
  _renderWelcomeMessage();
  _closeHistoryPanel();
  const input = _el("aidaInput");
  if (input) input.focus();
}

function _autoResizeTextarea() {
  const input = _el("aidaInput");
  if (!input) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 100) + "px";
}

// ===== Suhbatlar tarixi =====

function _openHistoryPanel() {
  const historyPanel = _el("aidaHistoryPanel");
  if (!historyPanel) return;
  historyPanel.hidden = false;
  _historyOpen = true;
  _loadHistoryList();
}

function _closeHistoryPanel() {
  const historyPanel = _el("aidaHistoryPanel");
  if (historyPanel) historyPanel.hidden = true;
  _historyOpen = false;
}

function _toggleHistoryPanel() {
  if (_historyOpen) _closeHistoryPanel();
  else _openHistoryPanel();
}

async function _loadHistoryList() {
  const list = _el("aidaHistoryList");
  if (!list) return;
  list.innerHTML = `<div class="aida-history-loading">${t("loading") || "..."}</div>`;

  try {
    const response = await apiRequest("/api/v1/aida/conversations/?page_size=20", {
      method: "GET",
      headers: getHeaders(),
    });
    const data = response.data || response;
    const results = data.results || [];
    list.innerHTML = "";

    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "aida-history-empty";
      empty.textContent = t("aida_history_empty") || "Hozircha suhbatlar yo'q.";
      list.appendChild(empty);
      return;
    }

    results.forEach((conversation) => {
      list.appendChild(_buildHistoryItem(conversation));
    });
  } catch (err) {
    list.innerHTML = "";
    const errorEl = document.createElement("div");
    errorEl.className = "aida-history-empty";
    errorEl.textContent = t("aida_history_load_error") || "Suhbatlar tarixini yuklab bo'lmadi.";
    list.appendChild(errorEl);
  }
}

function _buildHistoryItem(conversation) {
  const item = document.createElement("div");
  item.className = "aida-history-item";
  item.dataset.conversationId = conversation.id;

  const info = document.createElement("button");
  info.type = "button";
  info.className = "aida-history-item-info";
  info.addEventListener("click", () => _selectConversation(conversation.id));

  const title = document.createElement("div");
  title.className = "aida-history-item-title";
  title.textContent = conversation.title || t("aida_new_chat") || "Suhbat";

  const date = document.createElement("div");
  date.className = "aida-history-item-date";
  date.textContent = formatDate(conversation.updated_at);

  info.appendChild(title);
  info.appendChild(date);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "aida-history-delete-btn";
  deleteBtn.title = t("aida_history_delete") || "Suhbatni o'chirish";
  deleteBtn.setAttribute("aria-label", t("aida_history_delete") || "Suhbatni o'chirish");
  deleteBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>';
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    _deleteConversation(conversation.id, item);
  });

  item.appendChild(info);
  item.appendChild(deleteBtn);
  return item;
}

async function _deleteConversation(conversationId, itemEl) {
  const confirmed = window.confirm(t("aida_history_delete_confirm") || "Bu suhbatni o'chirmoqchimisiz?");
  if (!confirmed) return;

  try {
    await apiRequest(`/api/v1/aida/conversations/${conversationId}/`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (itemEl) itemEl.remove();
    if (_conversationId === conversationId) _newSession();
  } catch (err) {
    window.alert(err.message || t("aida_error") || "Xatolik yuz berdi.");
  }
}

async function _selectConversation(conversationId) {
  try {
    const response = await apiRequest(`/api/v1/aida/conversations/${conversationId}/`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = response.data || response;
    const messages = data.messages || [];

    const container = _el("aidaMessages");
    if (container) container.innerHTML = "";
    messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .forEach((msg) => _addMessage(msg.role, msg.content));

    _conversationId = conversationId;
    _closeHistoryPanel();
    _scrollToBottom();
  } catch (err) {
    window.alert(err.message || t("aida_history_load_error") || "Suhbatni yuklab bo'lmadi.");
  }
}

// ===== Ovozli kiritish (Web Speech API) =====

function _getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function _setupSpeechRecognition() {
  const micBtn = _el("aidaMicBtn");
  if (!micBtn) return;

  const RecognitionCtor = _getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    micBtn.disabled = true;
    micBtn.title = t("aida_mic_unsupported") || "Brauzeringiz ovozli kiritishni qo'llamaydi";
    micBtn.setAttribute("aria-label", micBtn.title);
    return;
  }

  micBtn.title = t("aida_mic_start") || "Ovozli kiritish";
  micBtn.addEventListener("click", () => {
    if (_isRecording) _stopRecording();
    else _startRecording();
  });
}

function _startRecording() {
  const RecognitionCtor = _getSpeechRecognitionCtor();
  if (!RecognitionCtor) return;

  const input = _el("aidaInput");
  const micBtn = _el("aidaMicBtn");
  const baseValue = input ? input.value : "";

  _recognition = new RecognitionCtor();
  _recognition.lang = _recognitionLang;
  _recognition.interimResults = true;
  _recognition.continuous = false;
  _recognition.maxAlternatives = 1;

  _recognition.onstart = () => {
    _isRecording = true;
    if (micBtn) {
      micBtn.classList.add("recording");
      micBtn.title = t("aida_mic_stop") || "Yozib olishni to'xtatish";
    }
  };

  _recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }
    if (input) {
      input.value = `${baseValue}${final}${interim}`.trim();
      _autoResizeTextarea();
    }
  };

  _recognition.onerror = (event) => {
    if (event.error === "language-not-supported" && _recognitionLang === "uz-UZ") {
      _recognitionLang = "ru-RU";
      _stopRecording();
      _startRecording();
      return;
    }
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      _addErrorMessage(t("aida_mic_denied") || "Mikrofonga ruxsat berilmadi.");
    } else if (event.error !== "no-speech" && event.error !== "aborted") {
      _addErrorMessage(t("aida_mic_error") || "Ovozni aniqlashda xatolik yuz berdi.");
    }
    _stopRecording();
  };

  _recognition.onend = () => {
    _isRecording = false;
    if (micBtn) {
      micBtn.classList.remove("recording");
      micBtn.title = t("aida_mic_start") || "Ovozli kiritish";
    }
    if (input) input.focus();
  };

  try {
    _recognition.start();
  } catch (_e) {
    _isRecording = false;
  }
}

function _stopRecording() {
  if (_recognition) {
    try {
      _recognition.stop();
    } catch (_e) {
      // yopilayotgan recognition uchun xatolikni e'tiborsiz qoldiramiz
    }
  }
  _isRecording = false;
  const micBtn = _el("aidaMicBtn");
  if (micBtn) {
    micBtn.classList.remove("recording");
    micBtn.title = t("aida_mic_start") || "Ovozli kiritish";
  }
}

export function initAida() {
  const fab = _el("aidaFab");
  const closeBtn = _el("aidaCloseBtn");
  const newSessionBtn = _el("aidaNewSessionBtn");
  const historyBtn = _el("aidaHistoryBtn");
  const historyCloseBtn = _el("aidaHistoryCloseBtn");
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
  if (historyBtn) historyBtn.addEventListener("click", _toggleHistoryPanel);
  if (historyCloseBtn) historyCloseBtn.addEventListener("click", _closeHistoryPanel);
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

  _setupSpeechRecognition();

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
