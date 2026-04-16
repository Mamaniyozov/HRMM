const state = {
  apiBase: "http://127.0.0.1:8000",
  accessToken: "",
  refreshToken: "",
  currentUser: null,
  departments: [],
  units: [],
  users: [],
  reports: [],
  leaves: [],
  auditLogs: [],
  notifications: [],
  adminDashboard: null,
  analyticsDashboard: null,
  leaveCalendar: [],
  reportHistory: [],
};

const loginForm = document.getElementById("loginForm");
const userForm = document.getElementById("userForm");
const reportForm = document.getElementById("reportForm");
const workflowForm = document.getElementById("workflowForm");
const attachmentForm = document.getElementById("attachmentForm");
const attachmentToolsForm = document.getElementById("attachmentToolsForm");
const leaveForm = document.getElementById("leaveForm");
const leaveReviewForm = document.getElementById("leaveReviewForm");
const passwordForm = document.getElementById("passwordForm");
const reportToolsForm = document.getElementById("reportToolsForm");

const departmentSelect = document.getElementById("departmentSelect");
const unitSelect = document.getElementById("unitSelect");
const reportDepartmentSelect = document.getElementById("reportDepartmentSelect");
const messageBox = document.getElementById("messageBox");
const usersTableBody = document.getElementById("usersTableBody");
const reportsTableBody = document.getElementById("reportsTableBody");
const leavesTableBody = document.getElementById("leavesTableBody");
const auditTableBody = document.getElementById("auditTableBody");
const recentReportsList = document.getElementById("recentReportsList");
const recentLeavesList = document.getElementById("recentLeavesList");
const notificationsList = document.getElementById("notificationsList");
const adminPendingList = document.getElementById("adminPendingList");
const analyticsDepartmentsList = document.getElementById("analyticsDepartmentsList");
const reportHistoryList = document.getElementById("reportHistoryList");
const leaveCalendarList = document.getElementById("leaveCalendarList");

const roleFilter = document.getElementById("roleFilter");
const levelFilter = document.getElementById("levelFilter");
const reportStatusFilter = document.getElementById("reportStatusFilter");
const leaveStatusFilter = document.getElementById("leaveStatusFilter");

const refreshUsersButton = document.getElementById("refreshUsers");
const refreshReportsButton = document.getElementById("refreshReports");
const refreshLeavesButton = document.getElementById("refreshLeaves");
const refreshAuditButton = document.getElementById("refreshAudit");
const refreshDashboardButton = document.getElementById("refreshDashboard");
const refreshNotificationsButton = document.getElementById("refreshNotifications");
const readAllNotificationsButton = document.getElementById("readAllNotifications");
const refreshAdminDashboardButton = document.getElementById("refreshAdminDashboard");
const refreshAnalyticsDashboardButton = document.getElementById("refreshAnalyticsDashboard");
const refreshLeaveCalendarButton = document.getElementById("refreshLeaveCalendar");
const meButton = document.getElementById("meButton");
const logoutButton = document.getElementById("logoutButton");
const downloadAttachmentButton = document.getElementById("downloadAttachmentButton");
const deleteAttachmentButton = document.getElementById("deleteAttachmentButton");
const loadHistoryButton = document.getElementById("loadHistoryButton");
const deleteReportButton = document.getElementById("deleteReportButton");

const apiBaseLabel = document.getElementById("apiBaseLabel");
const authStateLabel = document.getElementById("authStateLabel");
const currentUserLabel = document.getElementById("currentUserLabel");
const totalReportsValue = document.getElementById("totalReportsValue");
const pendingReportsValue = document.getElementById("pendingReportsValue");
const pendingLeavesValue = document.getElementById("pendingLeavesValue");
const draftReportsValue = document.getElementById("draftReportsValue");
const approvedReportsValue = document.getElementById("approvedReportsValue");
const rejectedReportsValue = document.getElementById("rejectedReportsValue");
const approvedLeavesValue = document.getElementById("approvedLeavesValue");
const profileNameLabel = document.getElementById("profileNameLabel");
const profileRoleLabel = document.getElementById("profileRoleLabel");
const profileDeptLabel = document.getElementById("profileDeptLabel");
const profileUnitLabel = document.getElementById("profileUnitLabel");
const adminEmployeesValue = document.getElementById("adminEmployeesValue");
const adminOnLeaveValue = document.getElementById("adminOnLeaveValue");
const adminActiveReportsValue = document.getElementById("adminActiveReportsValue");
const analyticsTotalReportsValue = document.getElementById("analyticsTotalReportsValue");
const analyticsApprovedReportsValue = document.getElementById("analyticsApprovedReportsValue");
const analyticsArchivedReportsValue = document.getElementById("analyticsArchivedReportsValue");

const roleLabelMap = {
  SPECIALIST: "Specialist",
  UNIT_HEAD: "Unit Head",
  DEPT_HEAD: "Department Head",
  DIRECTOR: "Director",
};

const jobRoleLabelMap = {
  DEVOPS: "DevOps",
  IT_ENGINEER: "IT Engineer",
  ANDROID_DEV: "Android Developer",
  BACKEND_DEV: "Backend Developer",
  FRONTEND_DEV: "Frontend Developer",
  MANAGER: "Manager",
  DIRECTOR: "Director",
};

const jobLevelLabelMap = {
  JUNIOR: "Junior",
  MIDDLE: "Middle",
  SENIOR: "Senior",
};

function setMessage(text, type = "") {
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`.trim();
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  return headers;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message = data?.message || data?.detail || JSON.stringify(data?.data || data);
    throw new Error(message);
  }

  return data;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function makeEmptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="empty-state">${text}</td></tr>`;
}

function renderDepartmentOptions() {
  const previousDepartmentValue = departmentSelect.value;
  const itDepartments = state.departments.filter((department) => {
    const code = String(department.code || "").trim().toUpperCase();
    const name = String(department.name || "").trim().toUpperCase();
    return code === "IT" || name.includes("IT");
  });
  const userDepartments = itDepartments.length ? itDepartments : state.departments;

  departmentSelect.innerHTML = "";
  reportDepartmentSelect.innerHTML = '<option value="">Use current user department</option>';

  if (!userDepartments.length) {
    departmentSelect.innerHTML = '<option value="">No departments available</option>';
    reportDepartmentSelect.innerHTML = '<option value="">No departments</option>';
    setMessage("Department ro'yxati topilmadi. Avval backendda department yaratilganini tekshiring.", "error");
    return;
  }

  userDepartments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = `${department.name} (${department.code})`;
    departmentSelect.appendChild(option);
  });

  state.departments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = `${department.name} (${department.code})`;
    reportDepartmentSelect.appendChild(option);
  });

  const selectedDepartmentStillExists = userDepartments.some(
    (department) => department.id === previousDepartmentValue
  );
  departmentSelect.value = selectedDepartmentStillExists
    ? previousDepartmentValue
    : userDepartments[0].id;
}

function renderUnits() {
  unitSelect.innerHTML = '<option value="">No unit</option>';
  const selectedDepartmentId = departmentSelect.value;

  state.units
    .filter((unit) => unit.department_id === selectedDepartmentId)
    .forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = `${unit.name} (${unit.code})`;
      unitSelect.appendChild(option);
    });
}

function renderUsers() {
  if (!state.users.length) {
    usersTableBody.innerHTML = makeEmptyRow(6, "IT xodimlari hali mavjud emas");
    return;
  }

  usersTableBody.innerHTML = state.users
    .map((user) => {
      const department = state.departments.find((item) => item.id === user.department_id) || {};
      return `
        <tr>
          <td><div class="employee-cell"><strong>${user.full_name}</strong><span>${user.email}</span></div></td>
          <td><span class="pill role">${roleLabelMap[user.role] || user.role || "-"}</span></td>
          <td><span class="pill role">${jobRoleLabelMap[user.job_role] || "-"}</span></td>
          <td><span class="pill level">${jobLevelLabelMap[user.job_level] || "-"}</span></td>
          <td>${department.name || "-"}</td>
          <td><span class="pill status">${user.is_active ? "Active" : "Inactive"}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderReports() {
  if (!state.reports.length) {
    reportsTableBody.innerHTML = makeEmptyRow(6, "Reportlar topilmadi");
    return;
  }

  reportsTableBody.innerHTML = state.reports
    .map(
      (report) => `
        <tr>
          <td><div class="employee-cell"><strong>${report.report_number}</strong><span>${report.title}</span></div></td>
          <td><span class="pill role">${report.status}</span></td>
          <td><span class="pill level">L${report.current_approval_level || "-"}</span></td>
          <td>${report.department_name || "-"}</td>
          <td>${report.created_by_name || "-"}</td>
          <td>${formatDate(report.created_at)}</td>
        </tr>
      `
    )
    .join("");
}

function renderLeaves() {
  if (!state.leaves.length) {
    leavesTableBody.innerHTML = makeEmptyRow(6, "Leave requests topilmadi");
    return;
  }

  leavesTableBody.innerHTML = state.leaves
    .map(
      (leave) => `
        <tr>
          <td>${leave.requested_by_name || "-"}</td>
          <td>${leave.leave_type}</td>
          <td>${leave.start_date} - ${leave.end_date}</td>
          <td>${leave.total_days}</td>
          <td><span class="pill status">${leave.status}</span></td>
          <td>${leave.reviewed_by_name || "-"}</td>
        </tr>
      `
    )
    .join("");
}

function renderAudit() {
  if (!state.auditLogs.length) {
    auditTableBody.innerHTML = makeEmptyRow(5, "Audit loglar topilmadi");
    return;
  }

  auditTableBody.innerHTML = state.auditLogs
    .map(
      (log) => `
        <tr>
          <td>${log.action}</td>
          <td>${log.target_type}</td>
          <td>${log.description || "-"}</td>
          <td>${log.actor_name || "-"}</td>
          <td>${formatDate(log.created_at)}</td>
        </tr>
      `
    )
    .join("");
}

function renderRecentLists(payload) {
  const recentReports = payload.recent_reports || [];
  const recentLeaves = payload.recent_leaves || [];

  recentReportsList.innerHTML = recentReports.length
    ? recentReports
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.report_number}</strong>
              <span>${item.title}</span>
              <small>${item.status} - ${item.created_by__full_name}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Recent reports yoq</div>';

  recentLeavesList.innerHTML = recentLeaves.length
    ? recentLeaves
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.requested_by__full_name}</strong>
              <span>${item.leave_type}</span>
              <small>${item.status} - ${item.start_date} / ${item.end_date}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Recent leave requests yoq</div>';
}

function renderProfile() {
  const profile = state.currentUser;
  profileNameLabel.textContent = profile?.full_name || "-";
  profileRoleLabel.textContent = profile?.role || "-";
  profileDeptLabel.textContent = profile?.department_name || "-";
  profileUnitLabel.textContent = profile?.unit_name || "-";
}

function renderNotifications() {
  if (!state.notifications.length) {
    notificationsList.innerHTML = '<div class="feed-item muted-item">Notificationlar yoq</div>';
    return;
  }

  notificationsList.innerHTML = state.notifications
    .map(
      (item) => `
        <div class="feed-item ${item.is_read ? "" : "unread-item"}">
          <strong>${item.title}</strong>
          <span>${item.message}</span>
          <small>${item.type} - ${formatDate(item.created_at)}</small>
          <button class="ghost-btn small-btn mark-read-btn" data-id="${item.id}" type="button">Mark read</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".mark-read-btn").forEach((button) => {
    button.addEventListener("click", () => markNotificationRead(button.dataset.id));
  });
}

function renderAdminDashboard() {
  const data = state.adminDashboard;
  adminEmployeesValue.textContent = String(data?.employees?.total_employees || 0);
  adminOnLeaveValue.textContent = String(data?.employees?.employees_on_leave || 0);
  adminActiveReportsValue.textContent = String(data?.employees?.active_reports || 0);

  const pending = data?.pending_approvals || [];
  adminPendingList.innerHTML = pending.length
    ? pending
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.report_number}</strong>
              <span>${item.title}</span>
              <small>${item.status} - ${item.created_by__full_name}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Pending approvals yoq</div>';
}

function renderAnalyticsDashboard() {
  const data = state.analyticsDashboard;
  analyticsTotalReportsValue.textContent = String(data?.overall?.total_reports || 0);
  analyticsApprovedReportsValue.textContent = String(data?.overall?.approved_reports || 0);
  analyticsArchivedReportsValue.textContent = String(data?.overall?.archived_reports || 0);

  const departments = data?.department_comparison || [];
  analyticsDepartmentsList.innerHTML = departments.length
    ? departments
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.department_name}</strong>
              <span>Total: ${item.total_reports}</span>
              <small>Approved: ${item.approved_reports}, Pending: ${item.pending_reports}, Rejected: ${item.rejected_reports}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Analytics data yoq</div>';
}

function renderReportHistory() {
  reportHistoryList.innerHTML = state.reportHistory.length
    ? state.reportHistory
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.action}</strong>
              <span>${item.comment || "No comment"}</span>
              <small>${item.previous_status} -> ${item.new_status} by ${item.approver_name} at ${formatDate(item.created_at)}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">History ma\'lumotlari yoq</div>';
}

function renderLeaveCalendar() {
  leaveCalendarList.innerHTML = state.leaveCalendar.length
    ? state.leaveCalendar
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.requested_by__full_name}</strong>
              <span>${item.leave_type} - ${item.total_days} kun</span>
              <small>${item.start_date} / ${item.end_date} - ${item.requested_by__department_id__name || "-"}</small>
            </div>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Approved leave calendar bo\'sh</div>';
}

async function loadDepartments() {
  const payload = await apiRequest("/api/v1/departments/", { headers: getHeaders(false) });
  state.departments = payload.results || [];
  renderDepartmentOptions();
  renderUnits();
  return state.departments.length;
}

async function loadUnits() {
  const payload = await apiRequest("/api/v1/units/", { headers: getHeaders(false) });
  state.units = payload.results || [];
  renderUnits();
}

async function loadUsers() {
  const params = new URLSearchParams();
  if (roleFilter.value) params.set("job_role", roleFilter.value);
  if (levelFilter.value) params.set("job_level", levelFilter.value);

  const query = params.toString() ? `?${params.toString()}` : "";
  const payload = await apiRequest(`/api/v1/users/${query}`, { headers: getHeaders(false) });
  state.users = (payload.results || []).filter((user) => user.job_role);
  renderUsers();
}

async function loadReports() {
  const params = new URLSearchParams();
  if (reportStatusFilter.value) params.set("status", reportStatusFilter.value);

  const query = params.toString() ? `?${params.toString()}` : "";
  const payload = await apiRequest(`/api/v1/reports/${query}`, { headers: getHeaders(false) });
  state.reports = payload.results || [];
  renderReports();
}

async function loadLeaves() {
  const params = new URLSearchParams();
  if (leaveStatusFilter.value) params.set("status", leaveStatusFilter.value);

  const query = params.toString() ? `?${params.toString()}` : "";
  const payload = await apiRequest(`/api/v1/leaves/${query}`, { headers: getHeaders(false) });
  state.leaves = payload.results || [];
  renderLeaves();
}

async function loadAuditLogs() {
  const payload = await apiRequest("/api/v1/audit/", { headers: getHeaders(false) });
  state.auditLogs = payload.results || [];
  renderAudit();
}

async function loadDashboard() {
  const payload = await apiRequest("/api/v1/dashboard/stats/", { headers: getHeaders(false) });
  totalReportsValue.textContent = String(payload.reports?.total_reports || 0);
  pendingReportsValue.textContent = String(payload.reports?.pending_reports || 0);
  pendingLeavesValue.textContent = String(payload.leaves?.pending_leave_requests || 0);
  draftReportsValue.textContent = String(payload.reports?.draft_reports || 0);
  approvedReportsValue.textContent = String(payload.reports?.approved_reports || 0);
  rejectedReportsValue.textContent = String(payload.reports?.rejected_reports || 0);
  approvedLeavesValue.textContent = String(payload.leaves?.approved_leave_requests || 0);
  renderRecentLists(payload);
}

async function loadMe() {
  const payload = await apiRequest("/api/v1/auth/me/", { headers: getHeaders(false) });
  state.currentUser = payload.data;
  currentUserLabel.textContent = `${payload.data.full_name} (${payload.data.role})`;
  renderProfile();
}

async function loadNotifications() {
  const payload = await apiRequest("/api/v1/notifications/", { headers: getHeaders(false) });
  state.notifications = payload.results || [];
  renderNotifications();
}

async function loadAdminDashboard() {
  try {
    state.adminDashboard = await apiRequest("/api/v1/dashboard/admin/", { headers: getHeaders(false) });
  } catch (error) {
    state.adminDashboard = null;
  }
  renderAdminDashboard();
}

async function loadAnalyticsDashboard() {
  try {
    state.analyticsDashboard = await apiRequest("/api/v1/dashboard/analytics/", { headers: getHeaders(false) });
  } catch (error) {
    state.analyticsDashboard = null;
  }
  renderAnalyticsDashboard();
}

async function loadLeaveCalendar() {
  const payload = await apiRequest("/api/v1/leaves/calendar/", { headers: getHeaders(false) });
  state.leaveCalendar = payload.data || [];
  renderLeaveCalendar();
}

async function loadReportHistory(reportId) {
  const payload = await apiRequest(`/api/v1/reports/${reportId}/history/`, { headers: getHeaders(false) });
  state.reportHistory = payload.data || [];
  renderReportHistory();
}

async function markNotificationRead(notificationId) {
  try {
    await apiRequest(`/api/v1/notifications/${notificationId}/read/`, {
      method: "PUT",
      headers: getHeaders(false),
    });
    await loadNotifications();
  } catch (error) {
    setMessage(error.message || "Notificationni o'qilgan qilishda xato bo'ldi.", "error");
  }
}

async function loadAllData() {
  const results = await Promise.allSettled([
    loadDepartments(),
    loadUnits(),
    loadUsers(),
    loadReports(),
    loadLeaves(),
    loadAuditLogs(),
    loadDashboard(),
    loadMe(),
    loadNotifications(),
    loadAdminDashboard(),
    loadAnalyticsDashboard(),
    loadLeaveCalendar(),
  ]);

  const rejected = results.filter((item) => item.status === "rejected");
  if (rejected.length) {
    console.warn("Some dashboard requests failed:", rejected);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  state.apiBase = String(formData.get("apiBase") || "").trim().replace(/\/$/, "");
  apiBaseLabel.textContent = state.apiBase;

  try {
    setMessage("Login bajarilmoqda...");
    const payload = await apiRequest("/api/v1/auth/login/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    state.accessToken = payload.data.access;
    state.refreshToken = payload.data.refresh;
    state.currentUser = payload.data.user;
    authStateLabel.textContent = "Connected";
    currentUserLabel.textContent = `${payload.data.user.full_name} (${payload.data.user.role})`;

    const departmentCount = await loadDepartments();
    await loadAllData();
    setMessage(`Frontend backend bilan ulandi. Departmentlar yuklandi: ${departmentCount} ta.`, "success");
  } catch (error) {
    state.accessToken = "";
    state.refreshToken = "";
    state.currentUser = null;
    authStateLabel.textContent = "Disconnected";
    currentUserLabel.textContent = "-";
    renderProfile();
    setMessage(error.message || "Login xatoligi yuz berdi.", "error");
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(passwordForm);

  try {
    setMessage("Parol yangilanmoqda...");
    await apiRequest("/api/v1/auth/password/", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        current_password: formData.get("current_password"),
        new_password: formData.get("new_password"),
      }),
    });
    passwordForm.reset();
    setMessage("Parol muvaffaqiyatli yangilandi.", "success");
  } catch (error) {
    setMessage(error.message || "Parol yangilashda xato bo'ldi.", "error");
  }
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(userForm);
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    job_role: formData.get("job_role"),
    job_level: formData.get("job_level"),
    password: formData.get("password"),
    department_id: formData.get("department_id"),
  };

  if (formData.get("unit_id")) payload.unit_id = formData.get("unit_id");

  try {
    setMessage("IT xodimi yaratilmoqda...");
    await apiRequest("/api/v1/users/create/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    await Promise.all([loadUsers(), loadAuditLogs()]);
    userForm.reset();
    renderDepartmentOptions();
    renderUnits();
    setMessage("IT xodimi yaratildi.", "success");
  } catch (error) {
    setMessage(error.message || "Xodim yaratishda xato bo'ldi.", "error");
  }
});

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(reportForm);
  const payload = {
    report_number: formData.get("report_number"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    content: formData.get("content"),
  };
  if (formData.get("department_id")) payload.department_id = formData.get("department_id");

  try {
    setMessage("Report yaratilmoqda...");
    await apiRequest("/api/v1/reports/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    reportForm.reset();
    renderDepartmentOptions();
    setMessage("Report yaratildi.", "success");
  } catch (error) {
    setMessage(error.message || "Report yaratishda xato bo'ldi.", "error");
  }
});

workflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(workflowForm);
  const reportId = String(formData.get("report_id") || "").trim();

  try {
    setMessage("Workflow action bajarilmoqda...");
    await apiRequest(`/api/v1/reports/${reportId}/actions/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: formData.get("action"),
        comment: formData.get("comment"),
      }),
    });
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    setMessage("Workflow action bajarildi.", "success");
  } catch (error) {
    setMessage(error.message || "Workflow action xatoligi.", "error");
  }
});

attachmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(attachmentForm);
  const reportId = String(formData.get("report_id") || "").trim();

  try {
    setMessage("Attachment yuklanmoqda...");
    await apiRequest(`/api/v1/reports/${reportId}/attachments/`, {
      method: "POST",
      headers: getHeaders(false),
      body: formData,
    });
    await Promise.all([loadReports(), loadAuditLogs()]);
    attachmentForm.reset();
    setMessage("Attachment yuklandi.", "success");
  } catch (error) {
    setMessage(error.message || "Attachment yuklashda xato bo'ldi.", "error");
  }
});

downloadAttachmentButton.addEventListener("click", async () => {
  const formData = new FormData(attachmentToolsForm);
  const attachmentId = String(formData.get("attachment_id") || "").trim();
  if (!attachmentId || !state.accessToken) return;

  try {
    const response = await fetch(`${state.apiBase}/api/v1/reports/attachments/${attachmentId}/download/`, {
      headers: getHeaders(false),
    });
    if (!response.ok) {
      throw new Error("Attachment yuklab olinmadi.");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : "attachment";
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    setMessage("Attachment yuklab olindi.", "success");
  } catch (error) {
    setMessage(error.message || "Attachment yuklashda xato bo'ldi.", "error");
  }
});

deleteAttachmentButton.addEventListener("click", async () => {
  const formData = new FormData(attachmentToolsForm);
  const attachmentId = String(formData.get("attachment_id") || "").trim();
  if (!attachmentId) return;

  try {
    await apiRequest(`/api/v1/reports/attachments/${attachmentId}/`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await Promise.all([loadReports(), loadAuditLogs()]);
    setMessage("Attachment o'chirildi.", "success");
  } catch (error) {
    setMessage(error.message || "Attachmentni o'chirishda xato bo'ldi.", "error");
  }
});

loadHistoryButton.addEventListener("click", async () => {
  const formData = new FormData(reportToolsForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!reportId) return;

  try {
    await loadReportHistory(reportId);
    setMessage("Report history yuklandi.", "success");
  } catch (error) {
    setMessage(error.message || "Report history olishda xato bo'ldi.", "error");
  }
});

deleteReportButton.addEventListener("click", async () => {
  const formData = new FormData(reportToolsForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!reportId) return;

  try {
    await apiRequest(`/api/v1/reports/${reportId}/`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    state.reportHistory = [];
    renderReportHistory();
    setMessage("Report o'chirildi.", "success");
  } catch (error) {
    setMessage(error.message || "Reportni o'chirishda xato bo'ldi.", "error");
  }
});

leaveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leaveForm);

  try {
    setMessage("Leave request yaratilmoqda...");
    await apiRequest("/api/v1/leaves/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        leave_type: formData.get("leave_type"),
        reason: formData.get("reason"),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
      }),
    });
    await Promise.all([loadLeaves(), loadDashboard(), loadAuditLogs()]);
    leaveForm.reset();
    setMessage("Leave request yaratildi.", "success");
  } catch (error) {
    setMessage(error.message || "Leave request xatoligi.", "error");
  }
});

leaveReviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leaveReviewForm);
  const leaveId = String(formData.get("leave_id") || "").trim();

  try {
    setMessage("Leave action bajarilmoqda...");
    await apiRequest(`/api/v1/leaves/${leaveId}/review/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: formData.get("action"),
        review_comment: formData.get("review_comment"),
      }),
    });
    await Promise.all([loadLeaves(), loadDashboard(), loadAuditLogs()]);
    setMessage("Leave action bajarildi.", "success");
  } catch (error) {
    setMessage(error.message || "Leave review xatoligi.", "error");
  }
});

departmentSelect.addEventListener("change", renderUnits);
refreshUsersButton.addEventListener("click", () => loadUsers().catch((error) => setMessage(error.message, "error")));
refreshReportsButton.addEventListener("click", () => loadReports().catch((error) => setMessage(error.message, "error")));
refreshLeavesButton.addEventListener("click", () => loadLeaves().catch((error) => setMessage(error.message, "error")));
refreshAuditButton.addEventListener("click", () => loadAuditLogs().catch((error) => setMessage(error.message, "error")));
refreshDashboardButton.addEventListener("click", () => loadDashboard().catch((error) => setMessage(error.message, "error")));
refreshNotificationsButton.addEventListener("click", () => loadNotifications().catch((error) => setMessage(error.message, "error")));
readAllNotificationsButton.addEventListener("click", async () => {
  try {
    await apiRequest("/api/v1/notifications/read-all/", {
      method: "PUT",
      headers: getHeaders(false),
    });
    await loadNotifications();
    setMessage("Barcha notificationlar o'qilgan deb belgilandi.", "success");
  } catch (error) {
    setMessage(error.message || "Notificationlarni yangilashda xato bo'ldi.", "error");
  }
});
refreshAdminDashboardButton.addEventListener("click", () => loadAdminDashboard().catch((error) => setMessage(error.message, "error")));
refreshAnalyticsDashboardButton.addEventListener("click", () => loadAnalyticsDashboard().catch((error) => setMessage(error.message, "error")));
refreshLeaveCalendarButton.addEventListener("click", () => loadLeaveCalendar().catch((error) => setMessage(error.message, "error")));
meButton.addEventListener("click", () => loadMe().then(() => setMessage("Profil yangilandi.", "success")).catch((error) => setMessage(error.message, "error")));
logoutButton.addEventListener("click", async () => {
  try {
    await apiRequest("/api/v1/auth/logout/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ refresh: state.refreshToken }),
    });
    state.accessToken = "";
    state.refreshToken = "";
    state.currentUser = null;
    authStateLabel.textContent = "Disconnected";
    currentUserLabel.textContent = "-";
    renderProfile();
    setMessage("Logout bajarildi.", "success");
  } catch (error) {
    setMessage(error.message || "Logoutda xato bo'ldi.", "error");
  }
});
roleFilter.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
levelFilter.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
reportStatusFilter.addEventListener("change", () => loadReports().catch((error) => setMessage(error.message, "error")));
leaveStatusFilter.addEventListener("change", () => loadLeaves().catch((error) => setMessage(error.message, "error")));
