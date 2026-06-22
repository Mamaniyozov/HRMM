const API_URL = "https://hrmm-production-b4ec.up.railway.app";
const DEFAULT_API_BASE = (() => {
  const configuredBase = window.__HRMM_API_BASE__ || window.localStorage.getItem("hrmm_api_base") || "";
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  const origin = window.location.origin || "";
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://127.0.0.1:8000";
  }

  // Productionda Railway backend API URL ishlatamiz
  return API_URL;
})();
const DEFAULT_API_TIMEOUT_MS = 45000;

// ===== Application log collection (admin-only, shown in Archive) =====
const APP_LOG_KEY = "hrmm_app_logs";
const APP_LOG_LIMIT = 500;
let appLogEntries = [];
try {
  appLogEntries = JSON.parse(window.localStorage.getItem(APP_LOG_KEY) || "[]");
  if (!Array.isArray(appLogEntries)) appLogEntries = [];
} catch (_e) {
  appLogEntries = [];
}

function persistAppLogs() {
  try {
    window.localStorage.setItem(APP_LOG_KEY, JSON.stringify(appLogEntries.slice(-APP_LOG_LIMIT)));
  } catch (_e) {
    /* storage full / unavailable - ignore */
  }
}

function appLog(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level: String(level || "info").toLowerCase(),
    message: typeof message === "string" ? message : safeStringify(message),
  };
  if (meta !== undefined) entry.meta = typeof meta === "string" ? meta : safeStringify(meta);
  appLogEntries.push(entry);
  if (appLogEntries.length > APP_LOG_LIMIT) {
    appLogEntries = appLogEntries.slice(-APP_LOG_LIMIT);
  }
  persistAppLogs();
  if (typeof renderSystemLogs === "function") {
    try {
      renderSystemLogs();
    } catch (_e) {
      /* table may not exist yet */
    }
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (_e) {
    return String(value);
  }
}

// Capture uncaught errors and promise rejections.
window.addEventListener("error", (event) => {
  appLog("error", event.message || "Script error", {
    source: event.filename,
    line: event.lineno,
    col: event.colno,
  });
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  appLog("error", reason?.message || "Unhandled promise rejection", reason?.stack);
});

// Mirror console.error / console.warn into the log store.
["error", "warn"].forEach((method) => {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    try {
      appLog(method === "warn" ? "warn" : "error", args.map((a) => (typeof a === "string" ? a : safeStringify(a))).join(" "));
    } catch (_e) {
      /* never let logging break the app */
    }
    original(...args);
  };
});

const state = {
  apiBase: DEFAULT_API_BASE,
  language: window.localStorage.getItem("hrmm_language") || "uz",
  themeId: window.localStorage.getItem("hrmm_theme_id") || window.localStorage.getItem("hrmm_theme") || "classic-dark",
  themeMode: window.localStorage.getItem("hrmm_theme_mode") || "single",
  increaseContrast: window.localStorage.getItem("hrmm_increase_contrast") === "true",
  bgEffect: window.localStorage.getItem("hrmm_bg_effect") || "none",
  accessToken: "",
  refreshToken: "",
  currentUser: null,
  pendingChallengeToken: "",
  pendingEmailChallengeId: "",
  pendingLoginUser: null,
  pendingVerificationMethod: "",
  twoFactorSetup: null,
  departments: [],
  units: [],
  users: [],
  reports: [],
  leaves: [],
  auditLogs: [],
  archiveLogs: [],
  notifications: [],
  adminDashboard: null,
  analyticsDashboard: null,
  leaveCalendar: [],
  reportHistory: [],
  reviewHistory: [],
  lastCreatedReportId: "",
  pendingApprovals: [],
};

const loginForm = document.getElementById("loginForm");
const otpForm = document.getElementById("otpForm");
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const bottomSectionNav = document.querySelector(".bottom-section-nav");
const loginCredentialsStep = document.getElementById("loginCredentialsStep");
const loginTwoFactorStep = document.getElementById("loginTwoFactorStep");
const backToLoginButton = document.getElementById("backToLoginButton");
const otpCodeInput = document.getElementById("otpCodeInput");
const loginStatusBox = document.getElementById("loginStatusBox");
const otpStatusBox = document.getElementById("otpStatusBox");
const otpDeliveryHint = document.getElementById("otpDeliveryHint");
const loginVerificationEyebrow = document.getElementById("loginVerificationEyebrow");
const loginVerificationTitle = document.getElementById("loginVerificationTitle");
const loginHeroEyebrow = document.getElementById("loginHeroEyebrow");
const loginHeroTitle = document.getElementById("loginHeroTitle");
const loginHeroCopy = document.getElementById("loginHeroCopy");
const loginFeatureOneTitle = document.getElementById("loginFeatureOneTitle");
const loginFeatureOneText = document.getElementById("loginFeatureOneText");
const loginFeatureTwoTitle = document.getElementById("loginFeatureTwoTitle");
const loginFeatureTwoText = document.getElementById("loginFeatureTwoText");
const loginFeatureThreeTitle = document.getElementById("loginFeatureThreeTitle");
const loginCardBadge = document.getElementById("loginCardBadge");
const loginLanguageButton = document.getElementById("loginLanguageButton");
const loginLanguageDropdown = document.getElementById("loginLanguageDropdown");
const loginCurrentLanguageLabel = document.getElementById("loginCurrentLanguageLabel");
const loginLanguageLabel = document.getElementById("loginLanguageLabel");
const loginLanguageOptions = document.querySelectorAll(".login-language-option");
const loginThemeToggleButton = document.getElementById("loginThemeToggleButton");
const loginThemeIconSun = document.getElementById("loginThemeIconSun");
const loginThemeIconMoon = document.getElementById("loginThemeIconMoon");
const loginAuthEyebrow = document.getElementById("loginAuthEyebrow");
const loginAuthTitle = document.getElementById("loginAuthTitle");
const loginUsernameLabel = document.getElementById("loginUsernameLabel");
const loginUsernameInput = document.getElementById("loginUsernameInput");
const loginPasswordLabel = document.getElementById("loginPasswordLabel");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const loginSubmitButton = document.getElementById("loginSubmitButton");
const loginFootnote = document.getElementById("loginFootnote");
const loginQrSetupPanel = document.getElementById("loginQrSetupPanel");
const loginQrImage = document.getElementById("loginQrImage");
const loginSecretLabel = document.getElementById("loginSecretLabel");
const loginManualKeyLabel = document.getElementById("loginManualKeyLabel");
const loginQrHint = document.getElementById("loginQrHint");
const otpCodeLabel = document.getElementById("otpCodeLabel");
const otpSubmitButton = document.getElementById("otpSubmitButton");
const registerStep = document.getElementById("registerStep");
const registerForm = document.getElementById("registerForm");
const registerSwitchText = document.getElementById("registerSwitchText");
const loginSwitchText = document.getElementById("loginSwitchText");
const registerAuthEyebrow = document.getElementById("registerAuthEyebrow");
const registerAuthTitle = document.getElementById("registerAuthTitle");
const registerFullNameLabel = document.getElementById("registerFullNameLabel");
const registerFullNameInput = document.getElementById("registerFullNameInput");
const registerUsernameLabel = document.getElementById("registerUsernameLabel");
const registerUsernameInput = document.getElementById("registerUsernameInput");
const registerEmailLabel = document.getElementById("registerEmailLabel");
const registerEmailInput = document.getElementById("registerEmailInput");
const registerPasswordLabel = document.getElementById("registerPasswordLabel");
const registerPasswordInput = document.getElementById("registerPasswordInput");
const registerPasswordConfirmLabel = document.getElementById("registerPasswordConfirmLabel");
const registerPasswordConfirmInput = document.getElementById("registerPasswordConfirmInput");
const registerSubmitButton = document.getElementById("registerSubmitButton");
const registerStatusBox = document.getElementById("registerStatusBox");
const showRegisterButton = document.getElementById("showRegisterButton");
const showLoginButton = document.getElementById("showLoginButton");
const userForm = document.getElementById("userForm");
const roleManagementForm = document.getElementById("roleManagementForm");
const roleManagementUserSelect = document.getElementById("roleManagementUserSelect");
const roleManagementRoleSelect = document.getElementById("roleManagementRoleSelect");
const roleManagementUserList = document.getElementById("roleManagementUserList");
const roleManagementDeptLabel = document.getElementById("roleManagementDeptLabel");
const roleManagementDeptSelect = document.getElementById("roleManagementDeptSelect");
const roleManagementUnitLabel = document.getElementById("roleManagementUnitLabel");
const roleManagementUnitSelect = document.getElementById("roleManagementUnitSelect");
const refreshUsersForRoleManagement = document.getElementById("refreshUsersForRoleManagement");
const reportForm = document.getElementById("reportForm");
const workflowForm = document.getElementById("workflowForm");
const leaveReviewForm = document.getElementById("leaveReviewForm");
const leaveCreateForm = document.getElementById("leaveCreateForm");
const attachmentForm = document.getElementById("attachmentForm");
const attachmentToolsForm = document.getElementById("attachmentToolsForm");
const passwordForm = document.getElementById("passwordForm");
const reportToolsForm = document.getElementById("reportToolsForm");
const twoFactorVerifyForm = document.getElementById("twoFactorVerifyForm");
const twoFactorDisableForm = document.getElementById("twoFactorDisableForm");

const departmentSelect = document.getElementById("departmentSelect");
const unitSelect = document.getElementById("unitSelect");
const reportDepartmentSelect = document.getElementById("reportDepartmentSelect");
const messageBox = document.getElementById("messageBox");
const usersTableBody = document.getElementById("usersTableBody");
const reportsTableBody = document.getElementById("reportsTableBody");
const auditTableBody = document.getElementById("auditTableBody");
const archiveLogsTableBody = document.getElementById("archiveLogsTableBody");
const refreshArchiveLogsButton = document.getElementById("refreshArchiveLogs");
const recentReportsList = document.getElementById("recentReportsList");
const recentLeavesList = document.getElementById("recentLeavesList");
const notificationsList = document.getElementById("notificationsList");
const adminPendingList = document.getElementById("adminPendingList");
const analyticsDepartmentsList = document.getElementById("analyticsDepartmentsList");
const reportHistoryList = document.getElementById("reportHistoryList");
const leaveCalendarList = document.getElementById("leaveCalendarList");
const topbarUserLabel = document.getElementById("topbarUserLabel");
const profileMenuButton = document.getElementById("profileMenuButton");
const profileDropdown = document.getElementById("profileDropdown");
const profileAddUserButton = document.getElementById("profileAddUserButton");
const createMenuButton = document.getElementById("createMenuButton");
const createMenuDropdown = document.getElementById("createMenuDropdown");
const createMenuItems = document.querySelectorAll(".create-menu-item");
const languageMenuButton = document.getElementById("languageMenuButton");
const languageDropdown = document.getElementById("languageDropdown");
const currentLanguageLabel = document.getElementById("currentLanguageLabel");
const languageOptions = document.querySelectorAll(".language-option");
const topbarNotificationsButton = document.getElementById("topbarNotificationsButton");
const topbarNotificationBadge = document.getElementById("topbarNotificationBadge");
const topbarPanel = document.getElementById("topbarPanel");
const topbarMobileToggle = document.getElementById("topbarMobileToggle");
const dashboardWelcomeName = document.getElementById("dashboardWelcomeName");
const unreadNotificationsValue = document.getElementById("unreadNotificationsValue");
const approvedLeavesShortcutValue = document.getElementById("approvedLeavesShortcutValue");
const notificationsShortcutValue = document.getElementById("notificationsShortcutValue");
const pendingRequestsShortcutValue = document.getElementById("pendingRequestsShortcutValue");
const reviewShortcutSection = document.getElementById("reviewShortcutSection");
const resolvedLeavesValue = document.getElementById("resolvedLeavesValue");
const activityHistoryList = document.getElementById("activityHistoryList");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackStars = document.getElementById("feedbackStars");
const feedbackRatingValue = document.getElementById("feedbackRatingValue");
const feedbackCommentInput = document.getElementById("feedbackCommentInput");
const feedbackList = document.getElementById("feedbackList");
const globalSearchInput = document.getElementById("globalSearchInput");
const globalStatusInput = document.getElementById("globalStatusInput");
const notificationSearchInput = document.getElementById("notificationSearchInput");
const notificationReadFilter = document.getElementById("notificationReadFilter");
const reportSearchInput = document.getElementById("reportSearchInput");
const userSearchInput = document.getElementById("userSearchInput");
const departmentSearchInput = document.getElementById("departmentSearchInput");
const refreshAllButton = document.getElementById("refreshAllButton");
const navLinks = document.querySelectorAll(".nav-link");
const themeModeSelect = document.getElementById("themeModeSelect");
const themeCardGrid = document.getElementById("themeCardGrid");
const backgroundEffectSelect = document.getElementById("backgroundEffectSelect");
const increaseContrastToggle = document.getElementById("increaseContrastToggle");

const roleFilter = document.getElementById("roleFilter");
const levelFilter = document.getElementById("levelFilter");
const reportStatusFilter = document.getElementById("reportStatusFilter");
const leaveSearchInput = document.getElementById("leaveSearchInput");
const leaveStatusFilter = document.getElementById("leaveStatusFilter");

const refreshUsersButton = document.getElementById("refreshUsers");
const refreshReportsButton = document.getElementById("refreshReports");
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
const copyLatestReportIdButton = document.getElementById("copyLatestReportIdButton");
const useLatestReportIdButton = document.getElementById("useLatestReportIdButton");
const setupTwoFactorButton = document.getElementById("setupTwoFactorButton");
const sectionModal = document.getElementById("sectionModal");
const sectionModalBackdrop = document.getElementById("sectionModalBackdrop");
const sectionModalClose = document.getElementById("sectionModalClose");
const sectionModalContent = document.getElementById("sectionModalContent");
const sectionModalTitle = document.getElementById("sectionModalTitle");
const quickCreateModal = document.getElementById("quickCreateModal");
const quickCreateBackdrop = document.getElementById("quickCreateBackdrop");
const quickCreateClose = document.getElementById("quickCreateClose");
const quickCreateForm = document.getElementById("quickCreateForm");
const quickCreateType = document.getElementById("quickCreateType");
const quickCreateTitle = document.getElementById("quickCreateTitle");
const quickCreateTitleInput = document.getElementById("quickCreateTitleInput");
const quickCreateMessageInput = document.getElementById("quickCreateMessageInput");
const quickCreateScreenshotInput = document.getElementById("quickCreateScreenshotInput");
const creationWarningModal = document.getElementById("creationWarningModal");
const creationWarningBackdrop = document.getElementById("creationWarningBackdrop");
const creationWarningClose = document.getElementById("creationWarningClose");
const creationWarningTitle = document.getElementById("creationWarningTitle");
const creationWarningList = document.getElementById("creationWarningList");
const creationWarningConfirm = document.getElementById("creationWarningConfirm");

const apiBaseIcon = document.getElementById("apiBaseIcon");
const authStateLabel = document.getElementById("authStateLabel");
const authStateDot = document.getElementById("authStateDot");
const currentUserLabel = document.getElementById("currentUserLabel");
const loggedInAsLabel = document.getElementById("loggedInAsLabel");
const totalReportsValue = document.getElementById("totalReportsValue");
const pendingReportsValue = document.getElementById("pendingReportsValue");
const pendingApprovalStatusValue = document.getElementById("pendingApprovalStatusValue");
const pendingLeavesValue = document.getElementById("pendingLeavesValue");
const userDepartmentSelect = document.getElementById("userDepartmentSelect");
const userUnitSelect = document.getElementById("userUnitSelect");
const unreadNotificationsBadgeCount = document.getElementById("unreadNotificationsBadgeCount");
const pendingNotificationsBadgeCount = document.getElementById("pendingNotificationsBadgeCount");
const approvedNotificationsCount = document.getElementById("approvedNotificationsCount");
const totalNotificationsCount = document.getElementById("totalNotificationsCount");
const draftReportsValue = document.getElementById("draftReportsValue");
const approvedReportsValue = document.getElementById("approvedReportsValue");
const rejectedReportsValue = document.getElementById("rejectedReportsValue");
const approvedLeavesValue = document.getElementById("approvedLeavesValue");
const profileRoleIcon = document.getElementById("profileRoleIcon");
const profileDeptIcon = document.getElementById("profileDeptIcon");
const profileUnitIcon = document.getElementById("profileUnitIcon");
const adminEmployeesValue = document.getElementById("adminEmployeesValue");
const adminOnLeaveValue = document.getElementById("adminOnLeaveValue");
const adminActiveReportsValue = document.getElementById("adminActiveReportsValue");
const analyticsTotalReportsValue = document.getElementById("analyticsTotalReportsValue");
const analyticsApprovedReportsValue = document.getElementById("analyticsApprovedReportsValue");
const analyticsArchivedReportsValue = document.getElementById("analyticsArchivedReportsValue");
const latestReportIdLabel = document.getElementById("latestReportIdLabel");
const twoFactorStatusLabel = document.getElementById("twoFactorStatusLabel");
const twoFactorSetupPanel = document.getElementById("twoFactorSetupPanel");
const twoFactorQrImage = document.getElementById("twoFactorQrImage");
const twoFactorSecretLabel = document.getElementById("twoFactorSecretLabel");
const toastTimers = new WeakMap();
let activeModalSection = null;
let activeModalPlaceholder = null;
let activeModalWasHidden = false;
let pendingCreationWarningResolver = null;
state.homeActivityFilter = "all";
state.feedbackEntries = [];

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

const languageNames = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
  tr: "Türkçe",
};

const translations = {
  uz: {
    app_title: "HRMM Boshqaruv Markazi",
    guest: "Mehmon",
    refresh: "Yangilash",
    new: "Yangi",
    language: "Til",
    login_badge: "Kirish",
    register_title: "Yangi hisob yaratish",
    full_name: "To'liq ism",
    email: "Email",
    password: "Parol",
    password_confirm: "Parolni tasdiqlash",
    username: "Username",
    register_button: "Ro'yxatdan o'tish",
    register_switch_text: "Hisobingiz yo'qmi?",
    login_switch_text: "Hisobingiz bormi?",
    no_account: "Hisobingiz yo'qmi?",
    have_account: "Hisobingiz bormi?",
    section_dashboard: "Asosiy panel",
    section_summary: "Umumiy xulosa",
    section_institutions: "Muassasalar",
    section_operations: "Boshqaruv operatsiyalari",
    section_analytics: "Muassasalar tahlili",
    section_dept_compare: "Bo'limlar taqqoslash",
    section_workflow: "Ish jarayoni",
    section_report_actions: "Hisobot harakatlari va biriktirmalar",
    section_reports_registry: "Hisobotlar reyesti",
    section_reports_list: "Hisobotlar ro'yxati",
    section_leaves: "Ta'til arizalari",
    section_create_leave: "Ta'til arizasi yaratish",
    section_leave_review: "Ta'til ko'rib chiqish",
    section_approve_leave: "Arizani tasdiqlash yoki rad etish",
    section_report_history: "Hisobot tarixi",
    section_approval_history: "Tasdiqlash tarixi",
    section_leaves_registry: "Ta'tillar reyesti",
    section_leaves_list: "Ta'til arizalari ro'yxati",
    section_audit: "Audit",
    section_audit_records: "So'nggi audit qaydlari",
    audit_action: "Harakat",
    audit_target: "Maqsad",
    audit_description: "Tavsif",
    audit_performer: "Ijrochi",
    audit_time: "Vaqt",
    audit_logs_not_found: "Audit loglar topilmadi",
    section_security: "Xavfsizlik",
    change_password: "Parolni o'zgartirish",
    current_password: "Joriy parol",
    new_password: "Yangi parol",
    update_password: "Parolni yangilash",
    google_authenticator: "Google Authenticator",
    two_factor_protection: "6 xonali 2FA himoyasi",
    status: "Holat",
    create_qr: "QR yaratish",
    manual_key: "Manual kalit",
    qr_manual_hint: "QR ishlamasa, yuqoridagi kalitni Google Authenticator ichida qo'lda kiriting.",
    six_digit_code: "6 xonali kod",
    enable_2fa: "2FA ni yoqish",
    authenticator_code: "Authenticator kodi",
    disable_2fa: "2FA ni o'chirish",
    login_badge: "Kirish",
    login_hero_eyebrow: "HRMM enterprise workspace",
    login_hero_title: "Rasmiy boshqaruv paneli, xavfsiz kirish va zamonaviy ish jarayoni",
    login_hero_copy: "Dashboard, bildirishnoma, hisobot va xodimlar modullari bitta rasmiy interfeysda jamlangan. Kirish esa sodda, xavfsiz va tezkor ishlashga moslangan.",
    login_feature_one_title: "Professional UI",
    login_feature_one_text: "Toza, rasmiy va boshqaruvga mos ekran ko'rinishi.",
    login_feature_two_title: "2 bosqichli login",
    login_feature_two_text: "Paroldan keyin 6 xonali kod bilan xavfsiz tasdiqlash.",
    login_feature_three_title: "Ichki gateway",
    login_feature_three_text: "Kirish sahifasi ichki API bilan avtomatik ulanadi.",
    login_auth_eyebrow: "Authentication",
    login_auth_title: "HRMM tizimiga kirish",
    login_username_label: "Username",
    login_username_placeholder: "Username kiriting",
    login_password_label: "Password",
    login_password_placeholder: "Parolni kiriting",
    login_submit: "Tizimga kirish",
    login_ready: "Login uchun tayyor.",
    login_footnote: "Tizimga kirgandan keyin asosiy boshqaruv paneli avtomatik ochiladi.",
    login_verification_eyebrow: "Authenticator verification",
    login_verification_title: "Google Authenticator orqali kirish",
    login_verification_hint: "Authenticator ilovasidagi 6 xonali kodni kiriting.",
    login_email_verification_eyebrow: "Email verification",
    login_email_verification_title: "Gmailga yuborilgan 6 xonali kod",
    login_email_verification_hint: "Email manziliga yuborilgan 6 xonali kodni kiriting.",
    login_qr_setup_eyebrow: "QR setup",
    login_qr_setup_title: "Birinchi kirish uchun QR kodni ulang",
    login_qr_setup_hint: "Google Authenticator ilovasida QR ni skan qiling, keyin chiqqan 6 xonali kodni kiriting.",
    login_manual_key: "Manual key",
    login_qr_hint: "Birinchi kirishda QR ni Google Authenticator bilan skan qiling. QR ishlamasa, manual key ni qo'lda kiriting.",
    login_code_label: "Verification code",
    login_code_submit: "Kodni tasdiqlash",
    login_code_ready: "Authenticator kodini kiriting.",
    login_back: "Login bosqichiga qaytish",
    sidebar_home: "Uy",
    sidebar_notifications: "Bildirishnomalar",
    sidebar_documents: "Hujjatlar",
    sidebar_leaves: "Arizalar",
    sidebar_employees: "Xodimlar",
    sidebar_institutions: "Muassasalar",
    search_global_label: "Global qidiruv",
    search_global_placeholder: "Bildirishnoma, report, xodim...",
    search_status_label: "Holat bo'yicha tezkor filter",
    search_status_placeholder: "pending, approved, active...",
    profile: "Profil",
    home_greeting: "Assalomu alaykum",
    home_overview: "Bildirishnomalar, hisobotlar va arizalar bo'yicha umumiy holat shu yerda jamlanadi.",
    new_requests: "Yangi arizalar",
    my_reports: "Mening hisobotlarim",
    approval_status: "Tasdiqlash holati",
    notifications: "Bildirishnomalar",
    current_request: "Hozir yaratilgan ariza",
    reports_short: "Hisobotlar",
    all: "Hammasi",
    resolved_requests: "Hal qilingan arizalar",
    approved_reports: "Tasdiqlangan hisobotlar",
    rejected: "Rad etilgan",
    approved_request: "Tasdiqlangan ariza",
    notifications_unread: "O'qilmagan",
    notifications_pending: "Kutilmoqda",
    notifications_approved: "Tasdiqlangan",
    notifications_total: "Jami bildirishnomalar",
    submit_report: "Yuborish",
    edit_report: "Tahrirlash",
    save_changes: "Saqlash",
    collection_title_approved_notifications: "Tasdiqlangan bildirishnomalar",
    report_submit_hint: "Rahbarlar tasdiqlashi uchun avval hisobotni yuboring.",
    password: "Parol",
    password_confirm: "Parolni tasdiqlash",
    select_department: "Bo'limni tanlang",
    user_create_password_mismatch: "Parollar mos kelmaydi",
    user_create_password_required: "Parol kamida 8 belgidan iborat bo'lishi kerak",
    user_create_department_required: "Bo'limni tanlang",
    activity_history: "Faoliyat tarixi",
    activity_watch: "Userlar nima qilayotganini ko'rish",
    requests: "Arizalar",
    rating: "Baholash",
    feedback_comments: "Fikr va kommentariya",
    online: "Online",
    offline: "Offline",
    profile_details: "Profil",
    collection_title_reports: "Hisobotlar ro'yxati",
    collection_title_requests: "Arizalar ro'yxati",
    collection_title_notifications: "Bildirishnomalar ro'yxati",
    collection_title_resolved_requests: "Hal qilingan arizalar",
    collection_title_approved_reports: "Tasdiqlangan hisobotlar",
    collection_title_rejected_reports: "Rad etilgan hisobotlar",
    collection_title_approved_leaves: "Tasdiqlangan arizalar",
    collection_title_department_users: "Bo'lim xodimlari",
    open_details: "Batafsil ko'rish",
    no_items_found: "Ma'lumot topilmadi",
    feedback_locked: "Baholash faqat tasdiqlangan yoki ko'rib chiqilgan ariza/hisobotdan keyin ochiladi.",
    reports_count: "Hisobotlar soni",
    approve: "Tasdiqlash",
    reject: "Rad etish",
    review_check: "Tekshirish va baholash",
    request_revision: "Qayta ko'rish",
    review_comment_placeholder: "Izoh (rad etish yoki qayta ko'rish uchun majburiy)",
    employee_profile: "Xodim profili",
    full_name: "To'liq ism",
    username: "Username",
    email: "Email",
    management_role: "Boshqaruv roli",
    department: "Bo'lim",
    unit: "Birlik",
    two_factor_status: "2FA holati",
    update_profile: "Profilni yangilash",
    logout: "Chiqish",
    create_report_menu: "Yangi hisobot",
    create_notification_menu: "Yangi bildirim",
    create_leave_menu: "Yangi ariza",
    create_feature_menu: "Yangi funksiya talabi",
    employees_section: "Xodimlar",
    sync_system: "Tizimni yangilash",
    theme_toggle: "Tun/kunduz rejimi",
    section_window: "Bo'lim oynasi",
    close: "Yopish",
    reports_eyebrow: "Hisobotlar",
    create_report_title: "Hisobot yaratish",
    report_number: "Hisobot raqami",
    report_auto_placeholder: "Avtomatik yaratiladi",
    report_title: "Sarlavha",
    report_title_placeholder: "Choraklik operatsion xulosa",
    report_comment: "Izoh",
    report_comment_placeholder: "Hisobot haqida qisqa izoh",
    report_content: "Mazmun",
    report_content_placeholder: "Batafsil hisobot mazmuni",
    report_image: "Screenshot yoki rasm",
    report_department: "Bo'lim",
    report_department_default: "Joriy foydalanuvchi bo'limi",
    no_departments_available: "Bo'limlar mavjud emas",
    no_departments: "Bo'lim yo'q",
    create_report_button: "Hisobot yaratish",
    latest_report_id: "Yangi hisobot UUID",
    not_created_yet: "Hali yaratilmagan",
    copy_uuid: "UUID nusxalash",
    apply_uuid_to_forms: "ID ni pastdagi formlarga qo'yish",
    report_modal_title: "Yangi hisobot",
    quick_create_eyebrow: "Yangi yaratish",
    quick_create_default_heading: "Yangi yozuv",
    form_title: "Sarlavha",
    form_title_placeholder: "Yangi yozuv sarlavhasi",
    form_note: "Izoh",
    form_note_placeholder: "Kerakli talab yoki bildirish matni",
    form_screenshot: "Screenshot yoki rasm",
    save: "Saqlash",
    quick_notification_title: "Yangi bildirim",
    quick_notification_heading: "Yangi bildirim yaratish",
    quick_notification_placeholder: "Bildirish matnini yozing",
    quick_feature_title: "Yangi funksiya talabi",
    quick_feature_heading: "Dasturga yangi qo'shimcha so'rash",
    quick_feature_placeholder: "Qaysi yangi funksiyani qo'shish kerakligini yozing",
    role_generic: "Rol",
    department_unassigned: "Bo'lim biriktirilmagan",
    unit_unassigned: "Birlik biriktirilmagan",
    gateway_internal: "Gateway: Internal gateway",
    active: "Faol",
    inactive: "Nofaol",
  },
  ru: {
    app_title: "HRMM Центр Управления",
    guest: "Гость",
    refresh: "Обновить",
    new: "Создать",
    language: "Язык",
    register_title: "Создать новый аккаунт",
    full_name: "Полное имя",
    email: "Email",
    password: "Пароль",
    password_confirm: "Подтвердите пароль",
    username: "Имя пользователя",
    register_button: "Зарегистрироваться",
    register_switch_text: "Нет аккаунта?",
    login_switch_text: "Уже есть аккаунт?",
    no_account: "Нет аккаунта?",
    have_account: "Уже есть аккаунт?",
    section_dashboard: "Главная панель",
    section_summary: "Общий обзор",
    section_institutions: "Учреждения",
    section_operations: "Управленческие операции",
    section_analytics: "Аналитика учреждений",
    section_dept_compare: "Сравнение отделов",
    section_workflow: "Рабочий процесс",
    section_report_actions: "Действия с отчетами и вложения",
    section_reports_registry: "Реестр отчетов",
    section_reports_list: "Список отчетов",
    section_leaves: "Заявки на отпуск",
    section_create_leave: "Создать заявку на отпуск",
    section_leave_review: "Рассмотрение заявок",
    section_approve_leave: "Утверждение или отклонение заявки",
    section_report_history: "История отчетов",
    section_approval_history: "История утверждений",
    section_leaves_registry: "Реестр отпусков",
    section_leaves_list: "Список заявок на отпуск",
    section_audit: "Аудит",
    section_audit_records: "Последние записи аудита",
    audit_action: "Действие",
    audit_target: "Цель",
    audit_description: "Описание",
    audit_performer: "Исполнитель",
    audit_time: "Время",
    audit_logs_not_found: "Записи аудита не найдены",
    section_security: "Безопасность",
    change_password: "Изменить пароль",
    current_password: "Текущий пароль",
    new_password: "Новый пароль",
    update_password: "Обновить пароль",
    google_authenticator: "Google Authenticator",
    two_factor_protection: "6-значная защита 2FA",
    status: "Статус",
    create_qr: "Создать QR",
    manual_key: "Ручной ключ",
    qr_manual_hint: "Если QR не работает, введите ключ вручную в Google Authenticator.",
    six_digit_code: "6-значный код",
    enable_2fa: "Включить 2FA",
    authenticator_code: "Код Authenticator",
    disable_2fa: "Отключить 2FA",
    sidebar_home: "Главная",
    sidebar_notifications: "Уведомления",
    sidebar_documents: "Документы",
    sidebar_institutions: "Учреждения",
    search_global_label: "Глобальный поиск",
    search_global_placeholder: "Уведомление, отчет, сотрудник...",
    search_status_label: "Быстрый фильтр по статусу",
    search_status_placeholder: "pending, approved, active...",
    profile: "Профиль",
    home_greeting: "Здравствуйте",
    home_overview: "Здесь собрана общая картина по уведомлениям, отчетам и заявкам.",
    new_requests: "Новые заявки",
    my_reports: "Мои отчеты",
    approval_status: "Статус согласования",
    notifications: "Уведомления",
    current_request: "Текущая заявка",
    reports_short: "Отчеты",
    all: "Все",
    resolved_requests: "Решенные заявки",
    approved_reports: "Одобренные отчеты",
    rejected: "Отклоненные",
    approved_request: "Одобренная заявка",
    activity_history: "История активности",
    activity_watch: "Посмотреть, что делают пользователи",
    requests: "Заявки",
    rating: "Оценка",
    feedback_comments: "Отзывы и комментарии",
    online: "Online",
    offline: "Offline",
    profile_details: "Профиль",
    collection_title_reports: "Список отчетов",
    collection_title_requests: "Список заявок",
    collection_title_notifications: "Список уведомлений",
    collection_title_resolved_requests: "Решенные заявки",
    collection_title_approved_reports: "Одобренные отчеты",
    collection_title_rejected_reports: "Отклоненные отчеты",
    collection_title_approved_leaves: "Одобренные заявки",
    collection_title_department_users: "Сотрудники отдела",
    open_details: "Открыть детали",
    no_items_found: "Данные не найдены",
    feedback_locked: "Оценка откроется только после подтвержденной или обработанной заявки/отчета.",
    reports_count: "Количество отчетов",
    approve: "Утвердить",
    reject: "Отклонить",
    review_check: "Проверить и оценить",
    request_revision: "На доработку",
    review_comment_placeholder: "Комментарий (обязателен при отклонении или доработке)",
    employee_profile: "Профиль сотрудника",
    full_name: "Полное имя",
    username: "Имя пользователя",
    email: "Email",
    management_role: "Управленческая ��оль",
    department: "Отдел",
    unit: "Подразделение",
    two_factor_status: "Статус 2FA",
    update_profile: "Обновить профиль",
    logout: "Выйти",
    create_report_menu: "Новый отчет",
    create_notification_menu: "Новое уведомление",
    create_leave_menu: "Новая заявка",
    create_feature_menu: "Запрос новой функции",
    employees_section: "Сотрудники",
    sync_system: "Обновить систему",
    section_window: "Окно раздела",
    close: "Закрыть",
    reports_eyebrow: "Отчеты",
    create_report_title: "Создать отчет",
    report_number: "Номер отчета",
    report_auto_placeholder: "Создается автоматически",
    report_title: "Заголовок",
    report_title_placeholder: "Квартальная операционная сводка",
    report_comment: "Комментарий",
    report_comment_placeholder: "Краткое описание отчета",
    report_content: "Содержание",
    report_content_placeholder: "Подробное содержание отчета",
    report_image: "Скриншот или изображение",
    report_department: "Отдел",
    report_department_default: "Использовать отдел текущего пользователя",
    no_departments_available: "Отделы недоступны",
    no_departments: "Отделов нет",
    create_report_button: "Создать отчет",
    latest_report_id: "UUID нового отчета",
    not_created_yet: "Еще не создан",
    copy_uuid: "Копировать UUID",
    apply_uuid_to_forms: "Подставить ID в формы ниже",
    report_modal_title: "Новый отчет",
    quick_create_eyebrow: "Быстрое создание",
    quick_create_default_heading: "Новая запись",
    form_title: "Заголовок",
    form_title_placeholder: "Заголовок новой записи",
    form_note: "Комментарий",
    form_note_placeholder: "Текст уведомления или запроса",
    form_screenshot: "Скриншот или изображение",
    save: "Сохранить",
    quick_notification_title: "Новое уведомление",
    quick_notification_heading: "Создать новое уведомление",
    quick_notification_placeholder: "Введите текст уведомления",
    quick_feature_title: "Запрос новой функции",
    quick_feature_heading: "Запросить новую функцию для системы",
    quick_feature_placeholder: "Опишите, какую функцию нужно добавить",
    role_generic: "Роль",
    department_unassigned: "Отдел не назначен",
    unit_unassigned: "Подразделение не назначено",
    sidebar_leaves: "Заявки",
    sidebar_employees: "Сотрудники",
    notifications_unread: "Непрочитанные",
    notifications_pending: "Ожидают",
    notifications_approved: "Одобрено",
    notifications_total: "Всего уведомлений",
    submit_report: "Отправить",
    edit_report: "Редактировать",
    save_changes: "Сохранить",
    collection_title_approved_notifications: "Одобренные уведомления",
    report_submit_hint: "Сначала отправьте отчёт, чтобы руководители могли его утвердить.",
    user_create_password_mismatch: "Пароли не совпадают",
    user_create_password_required: "Пароль должен содержать не менее 8 символов",
    user_create_department_required: "Выберите отдел",
    gateway_internal: "Шлюз: внутренний шлюз",
    active: "Активен",
    inactive: "Неактивен",
  },
  en: {
    app_title: "HRMM Control Center",
    guest: "Guest",
    refresh: "Refresh",
    new: "Create",
    language: "Language",
    register_title: "Create new account",
    full_name: "Full name",
    email: "Email",
    password: "Password",
    password_confirm: "Confirm password",
    username: "Username",
    register_button: "Register",
    register_switch_text: "Don't have an account?",
    login_switch_text: "Already have an account?",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    section_dashboard: "Main Panel",
    section_summary: "Overview",
    section_institutions: "Institutions",
    section_operations: "Management Operations",
    section_analytics: "Institution Analytics",
    section_dept_compare: "Department Comparison",
    section_workflow: "Workflow",
    section_report_actions: "Report Actions and Attachments",
    section_reports_registry: "Reports Registry",
    section_reports_list: "Reports List",
    section_leaves: "Leave Requests",
    section_create_leave: "Create Leave Request",
    section_leave_review: "Leave Review",
    section_approve_leave: "Approve or Reject Request",
    section_report_history: "Report History",
    section_approval_history: "Approval History",
    section_leaves_registry: "Leaves Registry",
    section_leaves_list: "Leave Requests List",
    section_audit: "Audit",
    section_audit_records: "Latest Audit Records",
    audit_action: "Action",
    audit_target: "Target",
    audit_description: "Description",
    audit_performer: "Performer",
    audit_time: "Time",
    audit_logs_not_found: "Audit logs not found",
    section_security: "Security",
    change_password: "Change Password",
    current_password: "Current Password",
    new_password: "New Password",
    update_password: "Update Password",
    google_authenticator: "Google Authenticator",
    two_factor_protection: "6-digit 2FA Protection",
    status: "Status",
    create_qr: "Create QR",
    manual_key: "Manual Key",
    qr_manual_hint: "If QR doesn't work, enter the key manually in Google Authenticator.",
    six_digit_code: "6-digit Code",
    enable_2fa: "Enable 2FA",
    authenticator_code: "Authenticator Code",
    disable_2fa: "Disable 2FA",
    sidebar_home: "Home",
    sidebar_notifications: "Notifications",
    sidebar_documents: "Documents",
    sidebar_institutions: "Institutions",
    search_global_label: "Global search",
    search_global_placeholder: "Notification, report, employee...",
    search_status_label: "Quick status filter",
    search_status_placeholder: "pending, approved, active...",
    profile: "Profile",
    home_greeting: "Welcome",
    home_overview: "This area summarizes notifications, reports, and leave requests.",
    new_requests: "New requests",
    my_reports: "My reports",
    approval_status: "Approval status",
    notifications: "Notifications",
    current_request: "Current request",
    reports_short: "Reports",
    all: "All",
    resolved_requests: "Resolved requests",
    approved_reports: "Approved reports",
    rejected: "Rejected",
    approved_request: "Approved leave",
    activity_history: "Activity history",
    activity_watch: "See what users are doing",
    requests: "Requests",
    rating: "Rating",
    feedback_comments: "Feedback and comments",
    online: "Online",
    offline: "Offline",
    profile_details: "Profile",
    collection_title_reports: "Reports list",
    collection_title_requests: "Requests list",
    collection_title_notifications: "Notifications list",
    collection_title_resolved_requests: "Resolved requests",
    collection_title_approved_reports: "Approved reports",
    collection_title_rejected_reports: "Rejected reports",
    collection_title_approved_leaves: "Approved requests",
    collection_title_department_users: "Department employees",
    open_details: "Open details",
    no_items_found: "No data found",
    feedback_locked: "Feedback is available only after an approved or processed request/report.",
    reports_count: "Reports count",
    approve: "Approve",
    reject: "Reject",
    notifications_pending: "Pending",
    notifications_approved: "Approved",
    submit_report: "Submit",
    edit_report: "Edit",
    save_changes: "Save",
    collection_title_approved_notifications: "Approved notifications",
    report_submit_hint: "Submit the report before managers can approve it.",
    review_check: "Review and rate",
    request_revision: "Request revision",
    review_comment_placeholder: "Comment (required for reject or revision)",
    employee_profile: "Employee profile",
    full_name: "Full name",
    username: "Username",
    email: "Email",
    management_role: "Management role",
    department: "Department",
    unit: "Unit",
    two_factor_status: "2FA status",
    update_profile: "Refresh profile",
    logout: "Logout",
    create_report_menu: "New report",
    create_notification_menu: "New notification",
    create_leave_menu: "New leave request",
    create_feature_menu: "New feature request",
    employees_section: "Employees",
    sync_system: "Refresh system",
    section_window: "Section window",
    close: "Close",
    reports_eyebrow: "Reports",
    create_report_title: "Create report",
    report_number: "Report number",
    report_auto_placeholder: "Generated automatically",
    report_title: "Title",
    report_title_placeholder: "Quarterly operations summary",
    report_comment: "Comment",
    report_comment_placeholder: "Short report note",
    report_content: "Content",
    report_content_placeholder: "Detailed report content",
    report_image: "Screenshot or image",
    report_department: "Department",
    report_department_default: "Use current user department",
    no_departments_available: "No departments available",
    no_departments: "No departments",
    create_report_button: "Create report",
    latest_report_id: "New report UUID",
    not_created_yet: "Not created yet",
    copy_uuid: "Copy UUID",
    apply_uuid_to_forms: "Apply ID to forms below",
    report_modal_title: "New report",
    quick_create_eyebrow: "Quick create",
    quick_create_default_heading: "New record",
    form_title: "Title",
    form_title_placeholder: "New record title",
    form_note: "Note",
    form_note_placeholder: "Required request or notification text",
    form_screenshot: "Screenshot or image",
    save: "Save",
    quick_notification_title: "New notification",
    quick_notification_heading: "Create a new notification",
    quick_notification_placeholder: "Write the notification text",
    quick_feature_title: "New feature request",
    quick_feature_heading: "Request a new system feature",
    quick_feature_placeholder: "Describe which new feature should be added",
    role_generic: "Role",
    department_unassigned: "Department not assigned",
    unit_unassigned: "Unit not assigned",
    sidebar_leaves: "Requests",
    sidebar_employees: "Employees",
    notifications_unread: "Unread",
    notifications_total: "Total notifications",
    user_create_password_mismatch: "Passwords do not match",
    user_create_password_required: "Password must be at least 8 characters",
    user_create_department_required: "Select a department",
    gateway_internal: "Gateway: Internal gateway",
    active: "Active",
    inactive: "Inactive",
  },
  tr: {
    app_title: "HRMM Kontrol Merkezi",
    guest: "Misafir",
    refresh: "Yenile",
    new: "Yeni",
    language: "Dil",
    register_title: "Yeni hesap olustur",
    full_name: "Tam ad",
    email: "Email",
    password: "Sifre",
    password_confirm: "Sifreyi onayla",
    username: "Kullanıcı adı",
    register_button: "Kaydol",
    register_switch_text: "Hesabiniz yok mu?",
    login_switch_text: "Zaten hesabiniz var mi?",
    no_account: "Hesabiniz yok mu?",
    have_account: "Zaten hesabiniz var mi?",
    section_dashboard: "Ana Panel",
    section_summary: "Genel Ozet",
    section_institutions: "Kurumlar",
    section_operations: "Yonetim Operasyonlari",
    section_analytics: "Kurum Analizi",
    section_dept_compare: "Departman Karsilastirmasi",
    section_workflow: "Is Akisi",
    section_report_actions: "Rapor Islemleri ve Ekler",
    section_reports_registry: "Rapor Kaydi",
    section_reports_list: "Rapor Listesi",
    section_leaves: "Izin Talepleri",
    section_create_leave: "Izin Talebi Olustur",
    section_leave_review: "Izin Incelemesi",
    section_approve_leave: "Talebi Onayla veya Reddet",
    section_report_history: "Rapor Gecmisi",
    section_approval_history: "Onay Gecmisi",
    section_leaves_registry: "Izin Kaydi",
    section_leaves_list: "Izin Talepleri Listesi",
    section_audit: "Denetim",
    section_audit_records: "Son Denetim Kayitlari",
    audit_action: "Islem",
    audit_target: "Hedef",
    audit_description: "Aciklama",
    audit_performer: "Yurutucu",
    audit_time: "Zaman",
    audit_logs_not_found: "Denetim kayitlari bulunamadi",
    section_security: "Guvenlik",
    change_password: "Sifre Degistir",
    current_password: "Mevcut Sifre",
    new_password: "Yeni Sifre",
    update_password: "Sifreyi Guncelle",
    google_authenticator: "Google Authenticator",
    two_factor_protection: "6 haneli 2FA Korunmasi",
    status: "Durum",
    create_qr: "QR Olustur",
    manual_key: "Manuel Anahtar",
    qr_manual_hint: "QR calismazsa, anahtari Google Authenticator'da manuel olarak girin.",
    six_digit_code: "6 haneli kod",
    enable_2fa: "2FA'yi Ac",
    authenticator_code: "Authenticator Kodu",
    disable_2fa: "2FA'yi Kapat",
    sidebar_home: "Ana Sayfa",
    sidebar_notifications: "Bildirimler",
    sidebar_documents: "Belgeler",
    sidebar_institutions: "Kurumlar",
    search_global_label: "Genel arama",
    search_global_placeholder: "Bildirim, rapor, personel...",
    search_status_label: "Duruma gore hizli filtre",
    search_status_placeholder: "pending, approved, active...",
    profile: "Profil",
    home_greeting: "Merhaba",
    home_overview: "Bildirimler, raporlar ve izin talepleri burada ozetlenir.",
    new_requests: "Yeni talepler",
    my_reports: "Raporlarim",
    approval_status: "Onay durumu",
    notifications: "Bildirimler",
    current_request: "Mevcut talep",
    reports_short: "Raporlar",
    all: "Tumü",
    resolved_requests: "Cozulen talepler",
    approved_reports: "Onaylanan raporlar",
    rejected: "Reddedilen",
    approved_request: "Onaylanan izin",
    activity_history: "Faaliyet gecmisi",
    activity_watch: "Kullanicilarin ne yaptigini gor",
    requests: "Talepler",
    rating: "Degerlendirme",
    feedback_comments: "Gorus ve yorumlar",
    online: "Online",
    offline: "Offline",
    profile_details: "Profil",
    collection_title_reports: "Rapor listesi",
    collection_title_requests: "Talep listesi",
    collection_title_notifications: "Bildirim listesi",
    collection_title_resolved_requests: "Cozulen talepler",
    collection_title_approved_reports: "Onaylanan raporlar",
    collection_title_rejected_reports: "Reddedilen raporlar",
    collection_title_approved_leaves: "Onaylanan talepler",
    collection_title_department_users: "Departman calisanlari",
    open_details: "Detayi ac",
    no_items_found: "Veri bulunamadi",
    feedback_locked: "Degerlendirme sadece onaylanan veya islenen talep/rapordan sonra acilir.",
    reports_count: "Rapor sayisi",
    approve: "Onayla",
    reject: "Reddet",
    review_check: "Incele ve degerlendir",
    request_revision: "Revizyona gonder",
    review_comment_placeholder: "Yorum (red veya revizyon icin zorunlu)",
    employee_profile: "Calisan profili",
    full_name: "Tam ad",
    username: "Kullanici adi",
    email: "Email",
    management_role: "Yonetim rolu",
    department: "Departman",
    unit: "Birim",
    two_factor_status: "2FA durumu",
    update_profile: "Profili yenile",
    logout: "Cikis",
    create_report_menu: "Yeni rapor",
    create_notification_menu: "Yeni bildirim",
    create_leave_menu: "Yeni izin talebi",
    create_feature_menu: "Yeni ozellik talebi",
    employees_section: "Calisanlar",
    sync_system: "Sistemi yenile",
    section_window: "Bolum penceresi",
    close: "Kapat",
    reports_eyebrow: "Raporlar",
    create_report_title: "Rapor olustur",
    report_number: "Rapor numarasi",
    report_auto_placeholder: "Otomatik olusturulur",
    report_title: "Baslik",
    report_title_placeholder: "Ceyreklik operasyon ozeti",
    report_comment: "Yorum",
    report_comment_placeholder: "Rapor hakkinda kisa not",
    report_content: "Icerik",
    report_content_placeholder: "Ayrintili rapor icerigi",
    report_image: "Ekran goruntusu veya resim",
    report_department: "Departman",
    report_department_default: "Mevcut kullanici departmanini kullan",
    no_departments_available: "Departman yok",
    no_departments: "Departman bulunamadi",
    create_report_button: "Rapor olustur",
    latest_report_id: "Yeni rapor UUID",
    not_created_yet: "Henuz olusturulmadi",
    copy_uuid: "UUID kopyala",
    apply_uuid_to_forms: "ID'yi asagidaki formlara yerlestir",
    report_modal_title: "Yeni rapor",
    quick_create_eyebrow: "Hizli olusturma",
    quick_create_default_heading: "Yeni kayit",
    form_title: "Baslik",
    form_title_placeholder: "Yeni kayit basligi",
    form_note: "Not",
    form_note_placeholder: "Gerekli istek veya bildirim metni",
    form_screenshot: "Ekran goruntusu veya resim",
    save: "Kaydet",
    quick_notification_title: "Yeni bildirim",
    quick_notification_heading: "Yeni bildirim olustur",
    quick_notification_placeholder: "Bildirim metnini yazin",
    quick_feature_title: "Yeni ozellik talebi",
    quick_feature_heading: "Sistem icin yeni bir ozellik isteyin",
    quick_feature_placeholder: "Eklenecek yeni ozelligi aciklayin",
    role_generic: "Rol",
    department_unassigned: "Departman atanmadi",
    unit_unassigned: "Birim atanmadi",
    sidebar_leaves: "Talepler",
    sidebar_employees: "Çalışanlar",
    notifications_unread: "Okunmamış",
    notifications_pending: "Bekliyor",
    notifications_approved: "Onaylandı",
    notifications_total: "Toplam bildirim",
    submit_report: "Gönder",
    edit_report: "Düzenle",
    save_changes: "Kaydet",
    collection_title_approved_notifications: "Onaylanan bildirimler",
    report_submit_hint: "Yöneticilerin onaylayabilmesi için önce raporu gönderin.",
    user_create_password_mismatch: "Parolalar eşleşmiyor",
    user_create_password_required: "Parola en az 8 karakter olmalıdır",
    user_create_department_required: "Departman seçin",
    gateway_internal: "Gecit: ic gecit",
    active: "Aktif",
    inactive: "Pasif",
  },
  };

const loginTranslations = {
  uz: {
    login_badge: "Kirish",
    login_hero_eyebrow: "HRMM enterprise workspace",
    login_hero_title: "Rasmiy boshqaruv paneli, xavfsiz kirish va zamonaviy ish jarayoni",
    login_hero_copy: "Dashboard, bildirishnoma, hisobot va xodimlar modullari bitta rasmiy interfeysda jamlangan. Kirish esa sodda, xavfsiz va tezkor ishlashga moslangan.",
    login_feature_one_title: "Professional UI",
    login_feature_one_text: "Toza, rasmiy va boshqaruvga mos ekran ko'rinishi.",
    login_feature_two_title: "2 bosqichli login",
    login_feature_two_text: "Paroldan keyin 6 xonali kod bilan xavfsiz tasdiqlash.",
    login_feature_three_title: "Ichki gateway",
    login_feature_three_text: "Kirish sahifasi ichki API bilan avtomatik ulanadi.",
    login_auth_eyebrow: "Authentication",
    login_auth_title: "HRMM tizimiga kirish",
    login_username_label: "Username",
    login_username_placeholder: "Username kiriting",
    login_password_label: "Password",
    login_password_placeholder: "Parolni kiriting",
    login_submit: "Tizimga kirish",
    login_ready: "Login uchun tayyor.",
    login_footnote: "Tizimga kirgandan keyin asosiy boshqaruv paneli avtomatik ochiladi.",
    login_verification_eyebrow: "Authenticator verification",
    login_verification_title: "Google Authenticator orqali kirish",
    login_verification_hint: "Authenticator ilovasidagi 6 xonali kodni kiriting.",
    login_manual_key: "Manual key",
    login_qr_hint: "Birinchi kirishda QR ni Google Authenticator bilan skan qiling. QR ishlamasa, manual key ni qo'lda kiriting.",
    login_code_label: "Verification code",
    login_code_submit: "Kodni tasdiqlash",
    login_code_ready: "Authenticator kodini kiriting.",
    login_back: "Login bosqichiga qaytish",
  },
  ru: {
    login_badge: "Вход",
    login_hero_eyebrow: "HRMM enterprise workspace",
    login_hero_title: "Официальная панель управления, безопасный вход и современный рабочий процесс",
    login_hero_copy: "Модули dashboard, уведомлений, отчетов и сотрудников собраны в одном официальном интерфейсе. Вход сделан простым, безопасным и удобным для работы.",
    login_feature_one_title: "Professional UI",
    login_feature_one_text: "Чистый и официальный интерфейс для управления.",
    login_feature_two_title: "2-этапный вход",
    login_feature_two_text: "После пароля подтверждение 6-значным кодом.",
    login_feature_three_title: "Внутренний gateway",
    login_feature_three_text: "Страница входа автоматически подключается к внутреннему API.",
    login_auth_eyebrow: "Authentication",
    login_auth_title: "Вход в систему HRMM",
    login_username_label: "Username",
    login_username_placeholder: "Введите username",
    login_password_label: "Password",
    login_password_placeholder: "Введите пароль",
    login_submit: "Войти в систему",
    login_ready: "Все готово ко входу.",
    login_footnote: "После входа основная панель управления откроется автоматически.",
    login_verification_eyebrow: "Authenticator verification",
    login_verification_title: "Вход через Google Authenticator",
    login_verification_hint: "Введите 6-значный код из приложения Authenticator.",
    login_email_verification_eyebrow: "Email verification",
    login_email_verification_title: "6-значный код, отправленный на Gmail",
    login_email_verification_hint: "Введите 6-значный код, отправленный на email.",
    login_qr_setup_eyebrow: "QR setup",
    login_qr_setup_title: "Подключите QR-код для первого входа",
    login_qr_setup_hint: "Отсканируйте QR в Google Authenticator, затем введите полученный 6-значный код.",
    login_manual_key: "Manual key",
    login_qr_hint: "При первом входе отсканируйте QR в Google Authenticator. Если QR не работает, введите manual key вручную.",
    login_code_label: "Код подтверждения",
    login_code_submit: "Подтвердить код",
    login_code_ready: "Введите код Authenticator.",
    login_back: "Вернуться ко входу",
  },
  en: {
    login_badge: "Sign in",
    login_hero_eyebrow: "HRMM enterprise workspace",
    login_hero_title: "Official management panel, secure access and a modern workflow",
    login_hero_copy: "Dashboard, notifications, reports and employee modules are gathered in one formal interface. The sign-in flow is simple, secure and built for fast daily work.",
    login_feature_one_title: "Professional UI",
    login_feature_one_text: "Clean and formal screens tailored for management work.",
    login_feature_two_title: "Two-step login",
    login_feature_two_text: "Secure confirmation with a 6-digit code after the password step.",
    login_feature_three_title: "Internal gateway",
    login_feature_three_text: "The sign-in page connects to the internal API automatically.",
    login_auth_eyebrow: "Authentication",
    login_auth_title: "Sign in to HRMM",
    login_username_label: "Username",
    login_username_placeholder: "Enter your username",
    login_password_label: "Password",
    login_password_placeholder: "Enter your password",
    login_submit: "Sign in",
    login_ready: "Ready for sign in.",
    login_footnote: "The main control panel opens automatically after sign in.",
    login_verification_eyebrow: "Authenticator verification",
    login_verification_title: "Continue with Google Authenticator",
    login_verification_hint: "Enter the 6-digit code from your Authenticator app.",
    login_email_verification_eyebrow: "Email verification",
    login_email_verification_title: "6-digit code sent to Gmail",
    login_email_verification_hint: "Enter the 6-digit code sent to your email address.",
    login_qr_setup_eyebrow: "QR setup",
    login_qr_setup_title: "Connect the QR code for first sign-in",
    login_qr_setup_hint: "Scan the QR in Google Authenticator, then enter the generated 6-digit code.",
    login_manual_key: "Manual key",
    login_qr_hint: "On your first sign-in, scan the QR with Google Authenticator. If QR does not work, enter the manual key.",
    login_code_label: "Verification code",
    login_code_submit: "Confirm code",
    login_code_ready: "Enter the Authenticator code.",
    login_back: "Back to login",
  },
  tr: {
    login_badge: "Giris",
    login_hero_eyebrow: "HRMM enterprise workspace",
    login_hero_title: "Resmi yonetim paneli, guvenli giris ve modern is akisi",
    login_hero_copy: "Dashboard, bildirimler, raporlar ve calisan modulleri tek bir resmi arayuzde toplandi. Giris akisi sade, guvenli ve hizli gunluk kullanim icin tasarlandi.",
    login_feature_one_title: "Professional UI",
    login_feature_one_text: "Yonetim icin temiz ve resmi ekranlar.",
    login_feature_two_title: "2 asamali giris",
    login_feature_two_text: "Sifreden sonra 6 haneli kod ile guvenli dogrulama.",
    login_feature_three_title: "Ic gateway",
    login_feature_three_text: "Giris sayfasi dahili API'ye otomatik baglanir.",
    login_auth_eyebrow: "Authentication",
    login_auth_title: "HRMM sistemine giris",
    login_username_label: "Username",
    login_username_placeholder: "Username girin",
    login_password_label: "Password",
    login_password_placeholder: "Parolanizi girin",
    login_submit: "Sisteme giris",
    login_ready: "Giris icin hazir.",
    login_footnote: "Giris yapildiktan sonra ana yonetim paneli otomatik acilir.",
    login_verification_eyebrow: "Authenticator verification",
    login_verification_title: "Google Authenticator ile giris",
    login_verification_hint: "Authenticator uygulamasindaki 6 haneli kodu girin.",
    login_email_verification_eyebrow: "Email verification",
    login_email_verification_title: "Gmail'e gonderilen 6 haneli kod",
    login_email_verification_hint: "Email adresine gonderilen 6 haneli kodu girin.",
    login_qr_setup_eyebrow: "QR setup",
    login_qr_setup_title: "Ilk giris icin QR kodunu baglayin",
    login_qr_setup_hint: "QR kodunu Google Authenticator ile tarayin, sonra uretilen 6 haneli kodu girin.",
    login_manual_key: "Manual key",
    login_qr_hint: "Ilk giriste QR kodunu Google Authenticator ile tarayin. QR calismazsa manual key'i elle girin.",
    login_code_label: "Dogrulama kodu",
    login_code_submit: "Kodu onayla",
    login_code_ready: "Authenticator kodunu girin.",
    login_back: "Giris adimina don",
  },
};

Object.keys(loginTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...(translations[languageCode] || {}),
    ...loginTranslations[languageCode],
  };
});

// FIXED: Add missing translation keys for new functionality
const newTranslations = {
  uz: {
    role_management: "Foydalanuvchi rollarini boshqarish",
    role_change: "Rol o'zgartirish",
    select_user: "Foydalanuvchi tanlang",
    new_role: "Yangi rol",
    department: "Bo'lim",
    unit: "Birlik",
    select_department: "Bo'lim tanlang",
    select_unit: "Birlik tanlang",
    role_change_success: "Rol muvaffaqiyatli o'zgartirildi",
    role_change_error: "Rol o'zgartirishda xato bo'ldi",
    department_required: "Bu rol uchun bo'lim tanlanishi shart",
    unit_required: "Bu rol uchun birlik tanlanishi shart",
    theme: "Mavzu",
    theme_dark: "Tun rejimi",
    theme_light: "Kunduz rejimi",
    theme_toggle: "Tun/kunduz rejimi",
    switch_to_light: "Kunduz rejimiga o'tish",
    switch_to_dark: "Tun rejimiga o'tish",
    dark_mode_enabled: "Tun rejimi yoqildi",
    light_mode_enabled: "Kunduz rejimi yoqildi",
    generic_error: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki administratorga murojaat qiling.",
    users_list: "Foydalanuvchilar ro'yxati",
    refresh_users: "Foydalanuvchilarni yangilash",
    current_role: "Hozirgi rol",
    feature_requests: "Funksiya talablari",
    all_queue: "Barcha navbat",
    no_pending_approval_items: "Kutilayotgan tasdiqlash uchun element yo'q.",
    no_pending_notifications: "Kutilayotgan bildirishnoma yo'q",
    no_notifications: "Bildirishnomalar yo'q",
    no_pending_leaves: "Kutilayotgan ariza yo'q",
    no_pending_reports: "Kutilayotgan hisobot yo'q",
    no_pending_items: "Kutilayotgan element yo'q",
    feature_request_label: "Funksiya talabi",
    label_report: "Hisobot",
    label_leave: "Ariza",
    label_notification: "Bildirishnoma",
    label_feature_request: "Funksiya talabi",
    label_request: "So'rov",
    approved_label: "Tasdiqlangan",
    rejected_label: "Rad etilgan",
    approver_label: "Tasdiqlovchi",
    unknown: "Noma'lum",
    your_leave: "Sizning arizangiz",
    your_report: "Sizning hisobotingiz",
    rating_hint: "Bahoni tanlang",
    quick_view: "Tezkor ko'rinish",
    review_shortcut_subtitle: "Tasdiqlovchilar uchun kichik oynacha",
    approved_leaves: "Tasdiqlangan arizalar",
    new_messages: "Yangi xabarlar",
    pending_requests_label: "Kutilayotgan talablar",
    pending_approvals: "Kutilayotgan tasdiqlar",
    archive: "Arxiv",
    archive_history: "Arxivlash tarixi (oxirgi 7 kun)",
    col_date: "Sana",
    records_count: "Yozuvlar soni",
    file_size_kb: "Fayl hajmi (KB)",
    archive_logs_not_loaded: "Arxiv loglari yuklanmagan",
    archive_telegram_notice: "Qolgan ma'lumotlarni Telegram botdan olasiz",
    connect_help_center: "Yordam markaziga ulanish",
    employees_list: "Xodimlar ro'yxati",
    it_employees_view: "IT xodimlar ko'rinishi",
    search_employee: "Xodim qidirish...",
    all_positions: "Barcha lavozimlar",
    all_levels: "Barcha darajalar",
    refresh_employees: "Xodimlarni yangilash",
    col_employee: "Xodim",
    col_it_position: "IT lavozimi",
    col_level: "Daraja",
    data_not_loaded: "Ma'lumot yuklanmagan",
    msg_password_updated: "Parol muvaffaqiyatli yangilandi.",
    msg_password_update_error: "Parolni yangilashda xatolik.",
    msg_2fa_enabled: "2FA muvaffaqiyatli yoqildi.",
    msg_2fa_verify_error: "2FA tekshiruvida xatolik.",
    msg_2fa_disabled: "2FA o'chirildi.",
    msg_2fa_disable_error: "2FA o'chirishda xatolik.",
    msg_comment_required_reject_revision: "Rad etish yoki qayta ko'rish uchun izoh majburiy.",
    msg_comment_required_reject: "Rad etish uchun izoh majburiy.",
    msg_comment_required_revision: "Qayta ko'rib chiqishni so'rash uchun izoh majburiy.",
    msg_reviewed_success: "Muvaffaqiyatli ko'rib chiqildi.",
    msg_review_error: "Ko'rib chiqishda xatolik.",
    msg_fill_title_summary: "Sarlavha va izohni to'ldiring.",
    msg_report_updated: "Hisobot yangilandi.",
    msg_report_submitted: "Hisobot yuborildi va tasdiqlash navbatiga tushdi.",
    msg_report_id_applied_forms: "Hisobot ID workflow/biriktirma/tarix formalariga qo'yildi.",
    msg_leave_id_applied: "Ariza ID ko'rib chiqish formasiga qo'yildi.",
    msg_approved_success: "Muvaffaqiyatli tasdiqlandi.",
    msg_approve_error: "Tasdiqlashda xatolik.",
    msg_rejected_success: "Muvaffaqiyatli rad etildi.",
    msg_reject_error: "Rad etishda xatolik.",
    msg_logging_in: "Tizimga kirilmoqda...",
    msg_session_not_found: "Tasdiqlash sessiyasi topilmadi. Loginni qayta boshlang.",
    msg_back_to_login: "Login bosqichiga qaytdingiz.",
    msg_password_updating: "Parol yangilanmoqda...",
    msg_2fa_generating: "2FA uchun QR va maxfiy kalit yaratilmoqda...",
    msg_qr_ready: "QR tayyor. Google Authenticator ilovasida skan qiling va 6 xonali kodni tasdiqlang.",
    msg_2fa_setup_error: "2FA sozlamasini yaratishda xatolik.",
    msg_2fa_activating: "2FA faollashtirilmoqda...",
    msg_2fa_enable_error: "2FA ni yoqishda xatolik.",
    msg_2fa_disabling: "2FA o'chirilmoqda...",
    msg_select_it_role_first: "Daraja berish uchun avval IT lavozimini tanlang.",
    msg_select_unit_for_unithead: "UNIT_HEAD uchun birlik tanlang.",
    msg_creating_it_user: "IT xodimi yaratilmoqda...",
    msg_it_user_created: "IT xodimi yaratildi.",
    msg_user_create_error: "Xodim yaratishda xatolik.",
    msg_role_changing: "Rol o'zgartirilmoqda...",
    msg_creating_report: "Hisobot yaratilmoqda...",
    msg_report_create_error: "Hisobot yaratishda xatolik.",
    msg_report_id_invalid: "Hisobot ID noto'g'ri. Bu maydonga hisobot UUID kiriting.",
    msg_loading_report: "Hisobot ma'lumotlari yuklanmoqda...",
    msg_report_not_found: "Hisobot topilmadi yoki sizda unga kirish huquqi yo'q.",
    msg_workflow_running: "Amal bajarilmoqda...",
    msg_workflow_success: "Amal muvaffaqiyatli bajarildi.",
    msg_workflow_error: "Amalni bajarishda xatolik.",
    msg_leave_id_invalid: "Ariza ID noto'g'ri. Bu maydonga ariza UUID kiriting.",
    msg_reviewing_leave: "Ariza ko'rib chiqilmoqda...",
    msg_leave_reviewed: "Ariza muvaffaqiyatli ko'rib chiqildi.",
    msg_leave_review_error: "Arizani ko'rib chiqishda xatolik.",
    msg_attachment_report_id_required: "Biriktirma uchun Hisobot ID UUID bo'lishi kerak.",
    msg_attachment_only_draft: "Biriktirma faqat DRAFT yoki REVISION holatidagi hisobotga yuklanadi.",
    msg_uploading_attachment: "Biriktirma yuklanmoqda...",
    msg_attachment_uploaded: "Biriktirma yuklandi.",
    msg_attachment_upload_error: "Biriktirmani yuklashda xatolik.",
    msg_attachment_downloaded: "Biriktirma yuklab olindi.",
    msg_attachment_deleted: "Biriktirma o'chirildi.",
    msg_attachment_delete_error: "Biriktirmani o'chirishda xatolik.",
    msg_history_report_id_required: "Tarix uchun Hisobot ID UUID kiriting.",
    msg_report_history_loaded: "Hisobot tarixi yuklandi.",
    msg_report_history_error: "Hisobot tarixini olishda xatolik.",
    msg_delete_report_id_required: "O'chirish uchun Hisobot ID UUID kiriting.",
    msg_report_deleted: "Hisobot o'chirildi.",
    msg_report_delete_error: "Hisobotni o'chirishda xatolik.",
    msg_create_report_first_copy: "Avval hisobot yarating, keyin UUID nusxalanadi.",
    msg_uuid_copied: "UUID nusxalandi.",
    msg_uuid_copy_failed: "UUID nusxalab bo'lmadi, qo'lda nusxalang.",
    msg_create_report_first_apply: "Avval hisobot yarating, keyin UUID formlarga qo'yiladi.",
    msg_uuid_applied_forms: "UUID workflow/biriktirma/tarix formalariga qo'yildi.",
    msg_all_notifications_read: "Barcha bildirishnomalar o'qilgan deb belgilandi.",
    msg_notifications_update_error: "Bildirishnomalarni yangilashda xatolik.",
    msg_password_changed: "Parol muvaffaqiyatli o'zgartirildi.",
    msg_password_change_error: "Parolni o'zgartirishda xatolik.",
    msg_all_sections_refreshed: "Barcha bo'limlar yangilandi.",
    msg_logout_success: "Tizimdan chiqildi.",
    msg_logout_error: "Tizimdan chiqishda xatolik.",
    msg_server_connection_active: "Serverga ulanish faol.",
    msg_fill_required_fields: "Iltimos, barcha majburiy maydonlarni to'ldiring.",
    msg_creating_leave: "Ta'til arizasi yaratilmoqda...",
    msg_leave_submitted: "Ta'til arizasi yuborildi.",
    msg_leave_create_error: "Ta'til arizasi yaratishda xatolik.",
    msg_add_user: "Xodim qo'shish",
    err_attachment_id_format: "Biriktirma ID yoki Hisobot ID UUID formatida bo'lishi kerak.",
    err_no_attachment_in_report: "Bu hisobotda biriktirma topilmadi.",
    err_attachment_not_found: "Biriktirma topilmadi. Biriktirma ID yoki hisobotga tegishli biriktirmani tekshiring.",
    err_api_connection: "Ulanishda xatolik. API serverga ulanib bo'lmadi",
    err_timeout_prefix: "So'rov",
    err_timeout_suffix: "soniyada javob bermadi. Internet yoki backend serverni tekshiring.",
    msg_departments_not_found: "Kafedra ro'yxati topilmadi. Avval backendda bo'limlar yaratilganini tekshiring.",
    msg_connected_departments: "Frontend backend bilan ulandi. Departmentlar yuklandi: {count} ta.",
    msg_action_not_allowed: "\"{action}\" harakati {status} holatidagi hisobot uchun mumkin emas. Ruxsat etilgan harakatlar: {actions}",
    msg_attachment_used_from_report: "Report ID bo'yicha topilgan attachment ishlatilmoqda: {id}",
    msg_attachment_deleting_from_report: "Report ID bo'yicha topilgan attachment o'chirilmoqda: {id}",
    msg_select_user_and_role: "Foydalanuvchi va rol tanlang",
    msg_select_rating: "Iltimos, bahoni tanlang",
    msg_rating_archived: "Baholash saqlandi va arxivga o'tkazildi",
    msg_select_rating_first: "Avval baho tanlang.",
    msg_write_comment: "Kommentariya yozing.",
    msg_feedback_saved: "Baholash va kommentariya backendga saqlandi.",
    msg_feedback_error: "Feedback yuborishda xato bo'ldi.",
    msg_registering: "Ro'yxatdan o'tish...",
    msg_registered: "Ro'yxatdan o'tdingiz! Endi kiring.",
    msg_enter_details: "Ma'lumotlarni kiriting.",
    msg_passwords_mismatch: "Parollar mos kelmadi.",
    security_settings: "Xavfsizlik sozlamalari",
    msg_login_error: "Login xatoligi yuz berdi.",
    msg_register_error: "Ro'yxatdan o'tishda xato.",
    msg_rating_save_error: "Baholash saqlashda xato",
    msg_2fa_code_sent_email: "Parol tasdiqlandi. 6 xonali kod {email} manziliga yuborildi.",
    msg_2fa_setup_scan: "Parol tasdiqlandi. Birinchi kirish uchun QR kodni scan qiling va 6 xonali kodni kiriting.",
    msg_2fa_enter_code: "Parol tasdiqlandi. Endi 6 xonali authenticator kodni kiriting.",
    download: "Yuklab olish",
    collection_edit_hint: "Tahrirlash va baholash uchun elementni bosing.",
    use_report_id: "Hisobot ID dan foydalanish",
    use_leave_id: "Ariza ID dan foydalanish",
    no_archive_logs_7days: "Oxirgi 7 kunda arxiv loglari yo'q",
    mark_as_read: "O'qilgan deb belgilash",
    no_department_data: "Bo'limlar bo'yicha ma'lumot topilmadi",
    archive_ok: "Muvaffaqiyatli",
    archive_fail: "Xatolik",
    pending_suffix: "kutilmoqda",
    no_unit: "Birlik yo'q",
    attachment: "Biriktirma",
    has_attachment: "Biriktirma bor",
    incoming_messages: "Kiruvchi xabarlar",
    search_notification: "Bildirishnoma qidirish...",
    refresh_messages: "Xabarlarni yangilash",
    mark_all_read: "Hammasini o'qilgan deb belgilash",
    refresh_dashboard: "Panelni yangilash",
    draft_reports: "Qoralama hisobotlar",
    rejected_reports: "Rad etilgan hisobotlar",
    recent_reports: "So'nggi hisobotlar",
    recent_leaves: "So'nggi arizalar",
    refresh_admin_panel: "Admin panelni yangilash",
    total_employees: "Jami xodimlar",
    on_leave: "Ta'tilda",
    active_reports: "Faol hisobotlar",
    search_institution: "Muassasa qidirish...",
    refresh_analytics: "Analitikani yangilash",
    total_reports: "Jami hisobotlar",
    login_to_load_units: "Login qiling (birliklar yuklanadi)",
    login_to_load_departments: "Login qiling (departmentlar yuklanadi)",
    select: "Tanlang",
    create_leave_title: "Yangi ta'til arizasi",
    leave_type: "Ta'til turi",
    start_date: "Boshlanish sanasi",
    end_date: "Tugash sanasi",
    reason: "Sabab",
    leave_reason_placeholder: "Ta'til sababi",
    submit_leave: "Ariza yuborish",
    workflow_overview: "Bo'limlar bo'yicha umumiy ko'rinish",
    search_department: "Bo'lim qidirish...",
    total_pending: "Jami kutilmoqda",
    loading_data: "Ma'lumot yuklanmoqda...",
    leave_distribution: "Arizalar taqsimoti",
    workflow_tools_subtitle: "UUID orqali tasdiqlash, biriktirma va tarix",
    report_id_label: "Hisobot ID",
    report_uuid_placeholder: "Hisobot UUID sini qo'ying",
    action_submit: "Yuborish (faqat DRAFT/REVISION)",
    action_approve: "Tasdiqlash (faqat PENDING)",
    action_reject: "Rad etish (faqat PENDING, izoh majburiy)",
    action_request_revision: "Qayta ko'rib chiqishni so'rash (faqat PENDING, izoh majburiy)",
    action_archive: "Arxivlash (faqat APPROVED/REJECTED)",
    comment_label: "Izoh",
    workflow_comment_placeholder: "Tasdiqlash yoki rad etish izohi",
    run_workflow_action: "Ish jarayoni harakatini ishga tushurish",
    leave_id_label: "Ariza ID",
    leave_uuid_placeholder: "Ariza UUID sini qo'ying",
    review_comment_placeholder: "Tasdiqlash yoki rad etish izohi",
    review_leave: "Arizani ko'rib chiqish",
    full_name_placeholder: "Ism familiya",
    username_placeholder: "Username",
    email_placeholder: "Email",
    password_placeholder: "Kamida 8 belgi",
    password_confirm_placeholder: "Parolni qayta kiriting",
    unit_optional: "Birlik (ixtiyoriy)",
    upload_attachment: "Biriktirma yuklash",
    attachment_report_id: "Biriktiriladigan hisobot ID",
    download_attachment: "Biriktirmani yuklash",
    delete_attachment: "Biriktirmani o'chirish",
    attachment_id: "Biriktirma ID",
    attachment_uuid_placeholder: "Biriktirma UUID",
    report_id_history: "Tarix/o'chirish uchun hisobot ID",
    load_history: "Tarixni yuklash",
    delete_report: "Hisobotni o'chirish",
    search_report: "Hisobot qidirish...",
    all_statuses: "Barcha holatlar",
    refresh_reports: "Hisobotlarni yangilash",
    reports_not_loaded: "Hisobotlar yuklanmagan",
    refresh_history: "Tarixni yangilash",
    search_leave: "Ariza qidirush...",
    refresh_leaves: "Arizalarni yangilash",
    leaves_not_loaded: "Arizalar yuklanmagan",
    feedback_eyebrow: "Baholash",
    feedback_heading: "Fikr va kommentariya",
    rating: "Baholash",
    feedback_comment: "Fikr",
    feedback_comment_placeholder: "Fikringizni yozing...",
    submit: "Yuborish",
    auxiliary_modules: "Qo'shimcha modullar",
    leave_calendar: "Ta'til taqvimi",
    approved_leaves_table: "Tasdiqlangan ta'tillar jadvali",
    recent_actions: "So'nggi harakatlar",
    activity_not_loaded: "Faoliyat tarixi yuklanmagan",
    col_days: "Kunlar soni",
    col_comment: "Izoh",
    owner: "Egasi",
    created: "Yaratilgan",
    pending_l2: "L2 kutilmoqda",
    pending_l3: "L3 kutilmoqda",
    pending_l4: "L4 kutilmoqda",
    user: "Foydalanuvchi",
    audit_report_created: "hisobot yaratdi",
    audit_report_updated: "hisobotni yangiladi",
    audit_leave_created: "talab yaratdi",
    audit_leave_approved: "talabni tasdiqladi",
    audit_notification_created: "bildirishnoma yaratdi",
    audit_action_performed: "amal bajardi",
    system: "Tizim",
    audit: "Audit",
    created_by_suffix: "tomonidan yaratildi",
    leave_created_suffix: "arizani yaratdi",
    status_no_data: "Holat yo'q",
    no_activity_history: "Hali faoliyat tarixi mavjud emas.",
    no_employees_found: "Xodimlar topilmadi",
    no_reports_found: "Hisobotlar topilmadi",
    no_leaves_found: "Arizalar topilmadi",
    no_recent_reports: "So'nggi hisobotlar yo'q",
    no_recent_leaves: "So'nggi arizalar yo'q",
    no_pending_approvals: "Kutilayotgan tasdiqlar yo'q",
    admin_approved_comment: "Admin tomonidan tasdiqlandi",
    total_reports_short: "Jami",
    approved_reports_short: "Tasdiqlangan",
    pending_reports_short: "Kutilmoqda",
    rejected_reports_short: "Rad etilgan",
    no_analytics_data: "Analitik ma'lumot yo'q",
    pending_short: "kut.",
    approved_short: "tasd.",
    no_data: "Ma'lumot yo'q",
    regenerate_qr: "QR ni qayta yaratish",
    no_comments_yet: "Hozircha kommentariya yo'q.",
    no_review_history: "Hali tasdiqlash tarixi yo'q. Ariza, hisobot yoki bildirishnomani tasdiqlaganingizdan keyin shu yerda ko'rinadi.",
    no_comment: "Izoh yo'q",
    days: "kun",
    no_approved_leaves_calendar: "Tasdiqlangan ta'til taqvimi bo'sh",
    date_label: "Sana",
    days_label: "Kun",
    reviewer: "Ko'rib chiquvchi",
    type_label: "Turi",
    read_label: "O'qilgan",
    reference_label: "Ma'lumotnoma",
    leave_pending_note: "Arizangiz tasdiqlash navbatida. Tahrirlash va baholash tasdiqlangandan keyin mavjud bo'ladi.",
    leave_status_note: "Ariza holati: {status}. Baholash uchun tasdiqlangan bo'limdan oching.",
    notification_pending_note: "So'rovingiz ko'rib chiqilmoqda. Tahrirlash va baholash faqat batafsil oynada, tasdiqlangandan keyin.",
    notification_reviewed_note: "Bu so'rov allaqachon ko'rib chiqilgan ({status}).",
    report_pending_note: "Hisobot tasdiqlash navbatida ({status}). Tahrirlash faqat qoralama yoki qayta ko'rish uchun mavjud.",
    cannot_self_approve_report: "O'z hisobotingizni tasdiqlay olmaysiz. Keyingi tasdiqlovchi kutmoqda.",
    action_request_revision_label: "Qayta ko'rish",
    action_submitted: "Yuborilgan",
    action_archived: "Arxivlangan",
    action_cancelled: "Bekor qilingan",
    unknown: "Noma'lum",
    creation_warning_notification_title: "Bildirishnoma berishda e'tiborga olish kerak bo'lgan jihatlar",
    creation_warning_notification_item1_title: "Bemor va xodimlar haqidagi ma'lumotlar yozib olinmasligi kerak.",
    creation_warning_notification_item1_text: "Bildirishnomalarni barcha foydalanuvchilar o'qiy oladi. Shuning uchun maxfiy yoki shaxsiy ma'lumotlarni kiritmang.",
    creation_warning_notification_item2_title: "Foydalanuvchi nomi va parol kiritilmasligi kerak.",
    creation_warning_notification_item2_text: "Matnga login, parol, kalit yoki boshqa maxfiy kirish ma'lumotlarini yozmang.",
    creation_warning_notification_item3_title: "Bildirishnoma bitta aniq maqsadga qaratilgan bo'lishi kerak.",
    creation_warning_notification_item3_text: "Har bir bildirishnoma bir vazifa yoki bir ogohlantirishga xizmat qilsin. Juda aralash matn yozmang.",
    creation_warning_notification_item4_title: "Matn ixcham va tushunarli bo'lishi kerak.",
    creation_warning_notification_item4_text: "Qisqa, aniq va hammaga bir xil tushuniladigan uslubdan foydalaning.",
    creation_warning_leave_title: "Ariza yuborishda e'tiborga olish kerak bo'lgan jihatlar",
    creation_warning_leave_item1_title: "Sana va muddatlar to'g'ri tanlangan bo'lishi kerak.",
    creation_warning_leave_item1_text: "Boshlanish va tugash sanasi xato bo'lmasin, ariza mazmuni aynan shu davrga mos bo'lsin.",
    creation_warning_leave_item2_title: "Sabab rasmiy va tushunarli yozilishi kerak.",
    creation_warning_leave_item2_text: "Keraksiz hissiy iboralar o'rniga qisqa va rasmiy izoh kiriting.",
    creation_warning_leave_item3_title: "Maxfiy ma'lumot kiritilmasligi kerak.",
    creation_warning_leave_item3_text: "Pasport, parol, shaxsiy tibbiy tafsilotlar yoki boshqa nozik ma'lumotlarni yozmang.",
    creation_warning_leave_item4_title: "Takroriy ariza yuborilmasligi kerak.",
    creation_warning_leave_item4_text: "Shu davr uchun oldin ariza yuborilgan bo'lsa, yangisini emas, mavjudini tekshiring.",
    creation_warning_feature_title: "Funksiya talabi yuborishda e'tiborga olish kerak bo'lgan jihatlar",
    creation_warning_feature_item1_title: "Talab aniq va oqilona bo'lishi kerak.",
    creation_warning_feature_item1_text: "Funksiya qanday ishlashi va qanday muammoni hal qilishi haqida tushuntiring.",
    creation_warning_feature_item2_title: "Maxfiy ma'lumot kiritilmasligi kerak.",
    creation_warning_feature_item2_text: "Parol, login yoki boshqa maxfiy ma'lumotlarni talab matniga yozmang.",
    creation_warning_feature_item3_title: "Takroriy talab yuborilmasligi kerak.",
    creation_warning_feature_item3_text: "Shu funksiya uchun oldin talab yuborilgan bo'lsa, yangisini emas, mavjudini qo'llab-quvvatlang.",
    creation_warning_feature_item4_title: "Matn ixcham va tushunarli bo'lishi kerak.",
    creation_warning_feature_item4_text: "Qisqa, aniq va hammaga bir xil tushuniladigan uslubdan foydalaning.",
    creation_warning_report_title: "Hujjat yaratishda e'tiborga olish kerak bo'lgan jihatlar",
    creation_warning_report_item1_title: "Sarlavha mazmunga mos va rasmiy bo'lishi kerak.",
    creation_warning_report_item1_text: "Hujjat nomi qisqa, aniq va keyinchalik qidiruvda topiladigan ko'rinishda yozilsin.",
    creation_warning_report_item2_title: "Mazmun tekshirilgan va izchil bo'lishi kerak.",
    creation_warning_report_item2_text: "Hujjat ichida noto'g'ri raqamlar, chala fikrlar yoki tasdiqlanmagan ma'lumot qolmasin.",
    creation_warning_report_item3_title: "Maxfiy yoki ortiqcha shaxsiy ma'lumot kiritilmasligi kerak.",
    creation_warning_report_item3_text: "Faqat ish jarayoniga tegishli ma'lumotlarni yozing, oshkor qilinmasligi kerak bo'lgan ma'lumotlarni kiritmang.",
    creation_warning_report_item4_title: "Bir xil hujjatni takror yaratmaslik kerak.",
    creation_warning_report_item4_text: "Shu mavzuda avval hujjat bo'lsa, yangisini ochishdan oldin mavjudini tekshirib chiqing.",
    creation_warning_confirm: "Tushunarli",
    confirm_reject_action: "Haqiqatan ham rad etmoqchimisiz?",
    label_element: "Element",
    status_pending: "Kutilmoqda",
    status_approved: "Tasdiqlangan",
    status_rejected: "Rad etilgan",
    status_draft: "Qoralama",
    status_revision: "Qayta ko'rish",
    status_pending_l2: "L2 kutmoqda",
    status_pending_l3: "L3 kutmoqda",
    status_pending_l4: "L4 kutmoqda",
    status_archived: "Arxivlangan",
    status_cancelled: "Bekor qilingan",
    profile_info_short: "Ma'lumot",
    calendar: "Taqvim",
    menu_label: "Menyu",
    connection_label: "Ulanish",
    check_connection: "Ulanishni tekshirish",
    add_user_short: "Qo'shish",
    help_center_subtitle: "Texnik qo'llab-quvvatlash",
    enterprise_panel: "Enterprise panel",
    login_status_ready: "Login uchun tayyor.",
    register_status_enter_details: "Ma'lumotlarni kiriting.",
    otp_delivery_hint: "Authenticator ilovasidagi 6 xonali kodni kiriting.",
    login_qr_alt: "Login QR kodi",
    please_check_info: "Iltimos, ma'lumotlarni tekshiring.",
    err_api_not_found: "API topilmadi. Backend server {base} da ishga tushganini tekshiring.",
    err_request_failed: "So'rov bajarilmadi ({status}).",
    err_role_dept_required: "Bu rol uchun bo'lim (department) tanlanishi shart. Iltimos, bo'limni tanlang.",
    err_unit_head_unit_required: "UNIT_HEAD roli uchun birlik (unit) tanlanishi shart. Iltimos, birlikni tanlang.",
    err_dept_head_no_unit: "DEPT_HEAD roli uchun birlik (unit) tanlanmasligi kerak. Iltimos, birlik maydonini bo'sh qoldiring.",
    err_director_no_dept_unit: "DIRECTOR roli uchun bo'lim va birlik biriktirilmaydi. Iltimos, ularni bo'sh qoldiring.",
    err_unit_not_in_dept: "Tanlangan birlik tanlangan bo'limga tegishli emas. Iltimos, mos birlikni tanlang.",
    err_job_role_dept_required: "Kasbiy rol berilganda bo'lim tanlanishi shart. Iltimos, bo'limni tanlang.",
    err_level_requires_job_role: "Daraja berish uchun avval kasbiy rol (job_role) tanlanishi kerak.",
    err_rating_range: "Baho 1 dan 5 gacha bo'lishi kerak. Iltimos, to'g'ri baho tanlang.",
    err_user_not_found: "Foydalanuvchi topilmadi. Iltimos, ID ni tekshiring.",
    err_cannot_delete_self: "O'zingizni o'chira olmaysiz. Iltimos, boshqa foydalanuvchini tanlang.",
    otp_status_enter_code: "Authenticator kodini kiriting.",
    preferences: "Afzalliklar",
    appearance_settings: "Tashqi ko'rinish sozlamalari",
    background_effect: "Animatsion fon",
    bg_none: "Yo'q",
    bg_particles: "Zarrachalar tarmog'i",
    bg_matrix: "Matritsa yomg'iri",
    bg_lineart: "Chiziqli san'at",
    bg_glass: "Shisha 3D shakllar",
    bg_retro: "Retro izometrik",
    bg_quantum: "Kvant to'lqinlari",
    bg_cosmos: "Kosmos va galaktika",
    system_logs: "Tizim loglari",
    system_logs_title: "Log fayllar yig'ish tizimi",
    download_logs: "Yuklab olish",
    clear_logs: "Tozalash",
    col_time: "Vaqt",
    col_level: "Daraja",
    col_message: "Xabar",
    no_logs: "Loglar yo'q",
    appearance_copy: "HRMM sizga qanday ko'rinishini tanlang. Mavzuni tanlang - tanlovingiz darhol qo'llaniladi va avtomatik ravishda saqlanadi.",
    theme_mode: "Mavzu rejimi",
    single_theme: "Yagona mavzu",
    sync_with_system: "Tizim bilan sinxronlash",
    increase_contrast: "Kontrastni oshirish",
    increase_contrast_copy: "Osonroq o'qish uchun matn, chegara va fon kontrastini kuchaytiradi.",
    role_devops: "DevOps",
    role_it_engineer: "IT muhandis",
    role_android_dev: "Android dasturchi",
    role_backend_dev: "Backend dasturchi",
    role_frontend_dev: "Frontend dasturchi",
    role_manager: "Menejer",
    role_director: "Direktor",
    level_junior: "Junior",
    level_middle: "Middle",
    level_senior: "Senior",
    role_specialist: "Mutaxassis",
    role_unit_head: "Birlik boshlig'i",
    role_dept_head: "Bo'lim boshlig'i",
    leave_type_annual: "Yillik ta'til",
    leave_type_sick: "Kasalik varaqasi",
    leave_type_unpaid: "Ish haqisiz ta'til",
    leave_type_maternity: "Dekret ta'tili",
    leave_type_other: "Boshqa",
    msg_2fa_setup_error: "2FA sozlashda xato yuz berdi.",
    msg_action_failed: "Amal bajarilmadi.",
    msg_read_notification_error: "Bildirishnomani o'qilgan qilishda xato yuz berdi.",
    msg_otp_verify_error: "Tasdiqlash kodini tekshirishda xato yuz berdi.",
    msg_feature_submitted: "Yangi funksiya talabi yuborildi.",
    msg_notification_created: "Yangi bildirishnoma yaratildi.",
    msg_record_create_error: "Yangi yozuv yaratishda xato yuz berdi.",
  },
  ru: {
    role_management: "Управление ролями пользователей",
    role_change: "Изменение роли",
    select_user: "Выберите пользователя",
    new_role: "Новая роль",
    department: "Отдел",
    unit: "Подразделение",
    select_department: "Выберите отдел",
    select_unit: "Выберите подразделение",
    role_change_success: "Роль успешно изменена",
    role_change_error: "Ошибка при изменении роли",
    department_required: "Для этой роли необходимо выбрать отдел",
    unit_required: "Для этой роли необходимо выбрать подразделение",
    theme: "Тема",
    theme_dark: "Ночной режим",
    theme_light: "Дневной режим",
    theme_toggle: "Переключение темы",
    switch_to_light: "Перейти в дневной режим",
    switch_to_dark: "Перейти в ночной режим",
    dark_mode_enabled: "Ночной режим включён",
    light_mode_enabled: "Дневной режим включён",
    generic_error: "Произошла ошибка. Пожалуйста, попробуйте снова или обратитесь к администратору.",
    users_list: "Список пользователей",
    refresh_users: "Обновить пользователей",
    current_role: "Текущая роль",
    feature_requests: "Запросы функций",
    all_queue: "Все в очереди",
    no_pending_approval_items: "Нет элементов, ожидающих утверждения.",
    no_pending_notifications: "Нет ожидающих уведомлений",
    no_notifications: "Нет уведомлений",
    no_pending_leaves: "Нет ожидающих заявок",
    no_pending_reports: "Нет ожидающих отчётов",
    no_pending_items: "Нет ожидающих элементов",
    feature_request_label: "Запрос функции",
    label_report: "Отчёт",
    label_leave: "Заявка",
    label_notification: "Уведомление",
    label_feature_request: "Запрос функции",
    label_request: "Запрос",
    approved_label: "Утверждено",
    rejected_label: "Отклонено",
    approver_label: "Утверждающий",
    unknown: "Неизвестно",
    your_leave: "Ваша заявка",
    your_report: "Ваш отчёт",
    rating_hint: "Выберите оценку",
    quick_view: "Быстрый просмотр",
    review_shortcut_subtitle: "Небольшое окно для согласующих",
    approved_leaves: "Одобренные заявки",
    new_messages: "Новые сообщения",
    pending_requests_label: "Ожидающие заявки",
    pending_approvals: "Ожидающие согласования",
    archive: "Архив",
    archive_history: "История архивации (последние 7 дней)",
    col_date: "Дата",
    records_count: "Кол-во записей",
    file_size_kb: "Размер файла (КБ)",
    archive_logs_not_loaded: "Журналы архива не загружены",
    archive_telegram_notice: "Остальные данные вы получите через Telegram-бот",
    connect_help_center: "Подключиться к центру помощи",
    employees_list: "Список сотрудников",
    it_employees_view: "Просмотр ИТ-сотрудников",
    search_employee: "Поиск сотрудника...",
    all_positions: "Все должности",
    all_levels: "Все уровни",
    refresh_employees: "Обновить сотрудников",
    col_employee: "Сотрудник",
    col_it_position: "ИТ-должность",
    col_level: "Уровень",
    data_not_loaded: "Данные не загружены",
    msg_password_updated: "Пароль успешно обновлён.",
    msg_password_update_error: "Ошибка при обновлении пароля.",
    msg_2fa_enabled: "2FA успешно включена.",
    msg_2fa_verify_error: "Ошибка проверки 2FA.",
    msg_2fa_disabled: "2FA отключена.",
    msg_2fa_disable_error: "Ошибка отключения 2FA.",
    msg_comment_required_reject_revision: "Для отклонения или возврата на доработку комментарий обязателен.",
    msg_comment_required_reject: "Для отклонения комментарий обязателен.",
    msg_comment_required_revision: "Для запроса доработки комментарий обязателен.",
    msg_reviewed_success: "Успешно рассмотрено.",
    msg_review_error: "Ошибка при рассмотрении.",
    msg_fill_title_summary: "Заполните заголовок и комментарий.",
    msg_report_updated: "Отчёт обновлён.",
    msg_report_submitted: "Отчёт отправлен и поставлен в очередь на утверждение.",
    msg_report_id_applied_forms: "ID отчёта подставлен в формы workflow/вложение/история.",
    msg_leave_id_applied: "ID заявки подставлен в форму рассмотрения.",
    msg_approved_success: "Успешно утверждено.",
    msg_approve_error: "Ошибка при утверждении.",
    msg_rejected_success: "Успешно отклонено.",
    msg_reject_error: "Ошибка при отклонении.",
    msg_logging_in: "Выполняется вход...",
    msg_session_not_found: "Сессия подтверждения не найдена. Начните вход заново.",
    msg_back_to_login: "Вы вернулись к шагу входа.",
    msg_password_updating: "Пароль обновляется...",
    msg_2fa_generating: "Генерируется QR и секретный ключ для 2FA...",
    msg_qr_ready: "QR готов. Отсканируйте в Google Authenticator и подтвердите 6-значный код.",
    msg_2fa_setup_error: "Ошибка при создании настройки 2FA.",
    msg_2fa_activating: "2FA активируется...",
    msg_2fa_enable_error: "Ошибка при включении 2FA.",
    msg_2fa_disabling: "2FA отключается...",
    msg_select_it_role_first: "Чтобы назначить уровень, сначала выберите ИТ-должность.",
    msg_select_unit_for_unithead: "Выберите подразделение для UNIT_HEAD.",
    msg_creating_it_user: "Создаётся ИТ-сотрудник...",
    msg_it_user_created: "ИТ-сотрудник создан.",
    msg_user_create_error: "Ошибка при создании сотрудника.",
    msg_role_changing: "Роль изменяется...",
    msg_creating_report: "Отчёт создаётся...",
    msg_report_create_error: "Ошибка при создании отчёта.",
    msg_report_id_invalid: "Неверный ID отчёта. Введите UUID отчёта в это поле.",
    msg_loading_report: "Загружаются данные отчёта...",
    msg_report_not_found: "Отчёт не найден или у вас нет доступа к нему.",
    msg_workflow_running: "Действие выполняется...",
    msg_workflow_success: "Действие успешно выполнено.",
    msg_workflow_error: "Ошибка при выполнении действия.",
    msg_leave_id_invalid: "Неверный ID заявки. Введите UUID заявки в это поле.",
    msg_reviewing_leave: "Заявка рассматривается...",
    msg_leave_reviewed: "Заявка успешно рассмотрена.",
    msg_leave_review_error: "Ошибка при рассмотрении заявки.",
    msg_attachment_report_id_required: "Для вложения ID отчёта должен быть в формате UUID.",
    msg_attachment_only_draft: "Вложение загружается только к отчёту в статусе DRAFT или REVISION.",
    msg_uploading_attachment: "Вложение загружается...",
    msg_attachment_uploaded: "Вложение загружено.",
    msg_attachment_upload_error: "Ошибка при загрузке вложения.",
    msg_attachment_downloaded: "Вложение скачано.",
    msg_attachment_deleted: "Вложение удалено.",
    msg_attachment_delete_error: "Ошибка при удалении вложения.",
    msg_history_report_id_required: "Для истории введите UUID отчёта.",
    msg_report_history_loaded: "История отчёта загружена.",
    msg_report_history_error: "Ошибка при получении истории отчёта.",
    msg_delete_report_id_required: "Для удаления введите UUID отчёта.",
    msg_report_deleted: "Отчёт удалён.",
    msg_report_delete_error: "Ошибка при удалении отчёта.",
    msg_create_report_first_copy: "Сначала создайте отчёт, затем UUID будет скопирован.",
    msg_uuid_copied: "UUID скопирован.",
    msg_uuid_copy_failed: "Не удалось скопировать UUID, скопируйте вручную.",
    msg_create_report_first_apply: "Сначала создайте отчёт, затем UUID будет подставлен в формы.",
    msg_uuid_applied_forms: "UUID подставлен в формы workflow/вложение/история.",
    msg_all_notifications_read: "Все уведомления отмечены как прочитанные.",
    msg_notifications_update_error: "Ошибка при обновлении уведомлений.",
    msg_password_changed: "Пароль успешно изменён.",
    msg_password_change_error: "Ошибка при изменении пароля.",
    msg_all_sections_refreshed: "Все разделы обновлены.",
    msg_logout_success: "Выход выполнен.",
    msg_logout_error: "Ошибка при выходе.",
    msg_server_connection_active: "Соединение с сервером активно.",
    msg_fill_required_fields: "Пожалуйста, заполните все обязательные поля.",
    msg_creating_leave: "Заявка на отпуск создаётся...",
    msg_leave_submitted: "Заявка на отпуск отправлена.",
    msg_leave_create_error: "Ошибка при создании заявки на отпуск.",
    msg_add_user: "Добавить сотрудника",
    err_attachment_id_format: "ID вложения или отчёта должен быть в формате UUID.",
    err_no_attachment_in_report: "В этом отчёте вложение не найдено.",
    err_attachment_not_found: "Вложение не найдено. Проверьте ID вложения или вложение, относящееся к отчёту.",
    err_api_connection: "Ошибка соединения. Не удалось подключиться к API-серверу",
    err_timeout_prefix: "Запрос не ответил за",
    err_timeout_suffix: "секунд. Проверьте интернет или backend-сервер.",
    msg_departments_not_found: "Список кафедр не найден. Сначала проверьте, созданы ли отделы в backend.",
    msg_connected_departments: "Frontend подключён к backend. Загружено отделов: {count}.",
    msg_action_not_allowed: "Действие \"{action}\" недоступно для отчёта в статусе {status}. Разрешённые действия: {actions}",
    msg_attachment_used_from_report: "Используется вложение, найденное по Report ID: {id}",
    msg_attachment_deleting_from_report: "Удаляется вложение, найденное по Report ID: {id}",
    msg_select_user_and_role: "Выберите пользователя и роль",
    msg_select_rating: "Пожалуйста, выберите оценку",
    msg_rating_archived: "Оценка сохранена и перемещена в архив",
    msg_select_rating_first: "Сначала выберите оценку.",
    msg_write_comment: "Напишите комментарий.",
    msg_feedback_saved: "Оценка и комментарий сохранены в backend.",
    msg_feedback_error: "Ошибка при отправке отзыва.",
    msg_registering: "Регистрация...",
    msg_registered: "Вы зарегистрированы! Теперь войдите.",
    msg_enter_details: "Введите данные.",
    msg_passwords_mismatch: "Пароли не совпали.",
    security_settings: "Настройки безопасности",
    msg_login_error: "Произошла ошибка входа.",
    msg_register_error: "Ошибка при регистрации.",
    msg_rating_save_error: "Ошибка при сохранении оценки",
    msg_2fa_code_sent_email: "Пароль подтверждён. 6-значный код отправлен на {email}.",
    msg_2fa_setup_scan: "Пароль подтверждён. Для первого входа отсканируйте QR-код и введите 6-значный код.",
    msg_2fa_enter_code: "Пароль подтверждён. Теперь введите 6-значный код authenticator.",
    download: "Скачать",
    collection_edit_hint: "Нажмите на элемент, чтобы редактировать и оценить.",
    use_report_id: "Использовать ID отчёта",
    use_leave_id: "Использовать ID заявки",
    no_archive_logs_7days: "За последние 7 дней нет журналов архива",
    mark_as_read: "Отметить как прочитанное",
    no_department_data: "Данные по отделам не найдены",
    archive_ok: "Успешно",
    archive_fail: "Ошибка",
    pending_suffix: "в ожидании",
    no_unit: "Нет подразделения",
    attachment: "Вложение",
    has_attachment: "Есть вложение",
    incoming_messages: "Входящие сообщения",
    search_notification: "Поиск уведомлений...",
    refresh_messages: "Обновить сообщения",
    mark_all_read: "Отметить все как прочитанные",
    refresh_dashboard: "Обновить панель",
    draft_reports: "Черновики отчётов",
    rejected_reports: "Отклонённые отчёты",
    recent_reports: "Последние отчёты",
    recent_leaves: "Последние заявки",
    refresh_admin_panel: "Обновить панель администратора",
    total_employees: "Всего сотрудников",
    on_leave: "В отпуске",
    active_reports: "Активные отчёты",
    search_institution: "Поиск учреждения...",
    refresh_analytics: "Обновить аналитику",
    total_reports: "Всего отчётов",
    login_to_load_units: "Войдите (подразделения загружаются)",
    login_to_load_departments: "Войдите (отделы загружаются)",
    select: "Выберите",
    create_leave_title: "Новая заявка на отпуск",
    leave_type: "Тип отпуска",
    start_date: "Дата начала",
    end_date: "Дата окончания",
    reason: "Причина",
    leave_reason_placeholder: "Причина отпуска",
    submit_leave: "Отправить заявку",
    workflow_overview: "Общий обзор по отделам",
    search_department: "Поиск отдела...",
    total_pending: "Всего в ожидании",
    loading_data: "Данные загружаются...",
    leave_distribution: "Распределение заявок",
    workflow_tools_subtitle: "Подтверждение по UUID, вложение и история",
    report_id_label: "ID отчёта",
    report_uuid_placeholder: "Введите UUID отчёта",
    action_submit: "Отправить (только DRAFT/REVISION)",
    action_approve: "Утвердить (только PENDING)",
    action_reject: "Отклонить (только PENDING, комментарий обязателен)",
    action_request_revision: "Запросить пересмотр (только PENDING, комментарий обязателен)",
    action_archive: "Архивировать (только APPROVED/REJECTED)",
    comment_label: "Комментарий",
    workflow_comment_placeholder: "Комментарий к утверждению или отклонению",
    run_workflow_action: "Выполнить действие рабочего процесса",
    leave_id_label: "ID заявки",
    leave_uuid_placeholder: "Введите UUID заявки",
    review_comment_placeholder: "Комментарий к утверждению или отклонению",
    review_leave: "Рассмотреть заявку",
    full_name_placeholder: "Имя и фамилия",
    username_placeholder: "Имя пользователя",
    email_placeholder: "Email",
    password_placeholder: "Минимум 8 символов",
    password_confirm_placeholder: "Повторите пароль",
    unit_optional: "Подразделение (необязательно)",
    upload_attachment: "Загрузить вложение",
    attachment_report_id: "ID отчёта для вложения",
    download_attachment: "Скачать вложение",
    delete_attachment: "Удалить вложение",
    attachment_id: "ID вложения",
    attachment_uuid_placeholder: "UUID вложения",
    report_id_history: "ID отчёта для истории/удаления",
    load_history: "Загрузить историю",
    delete_report: "Удалить отчёт",
    search_report: "Поиск отчёта...",
    all_statuses: "Все статусы",
    refresh_reports: "Обновить отчёты",
    reports_not_loaded: "Отчёты не загружены",
    refresh_history: "Обновить историю",
    search_leave: "Поиск заявки...",
    refresh_leaves: "Обновить заявки",
    leaves_not_loaded: "Заявки не загружены",
    feedback_eyebrow: "Оценка",
    feedback_heading: "Отзыв и комментарий",
    rating: "Оценка",
    feedback_comment: "Отзыв",
    feedback_comment_placeholder: "Напишите ваш отзыв...",
    submit: "Отправить",
    auxiliary_modules: "Дополнительные модули",
    leave_calendar: "Календарь отпусков",
    approved_leaves_table: "Таблица утверждённых отпусков",
    recent_actions: "Последние действия",
    activity_not_loaded: "История активности не загружена",
    col_days: "Количество дней",
    col_comment: "Комментарий",
    owner: "Владелец",
    created: "Создано",
    pending_l2: "Ожидание L2",
    pending_l3: "Ожидание L3",
    pending_l4: "Ожидание L4",
    user: "Пользователь",
    audit_report_created: "создал отчет",
    audit_report_updated: "обновил отчет",
    audit_leave_created: "создал заявку",
    audit_leave_approved: "утвердил заявку",
    audit_notification_created: "создал уведомление",
    audit_action_performed: "выполнил действие",
    system: "Система",
    audit: "Аудит",
    created_by_suffix: "создал(а)",
    leave_created_suffix: "создал(а) заявку",
    status_no_data: "Нет данных",
    no_activity_history: "История активности пока отсутствует.",
    no_employees_found: "Сотрудники не найдены",
    no_reports_found: "Отчеты не найдены",
    no_leaves_found: "Заявки не найдены",
    no_recent_reports: "Нет последних отчетов",
    no_recent_leaves: "Нет последних заявок",
    no_pending_approvals: "Нет ожидающих утверждений",
    admin_approved_comment: "Утверждено администратором",
    total_reports_short: "Всего",
    approved_reports_short: "Утверждено",
    pending_reports_short: "В ожидании",
    rejected_reports_short: "Отклонено",
    no_analytics_data: "Аналитические данные отсутствуют",
    pending_short: "ожид.",
    approved_short: "утв.",
    no_data: "Нет данных",
    regenerate_qr: "Пересоздать QR",
    no_comments_yet: "Пока нет комментариев.",
    no_review_history: "История утверждений пока отсутствует. Она появится после подтверждения заявки, отчета или уведомления.",
    no_comment: "Нет комментария",
    days: "дн.",
    no_approved_leaves_calendar: "Календарь утвержденных отпусков пуст",
    date_label: "Дата",
    days_label: "Дн.",
    reviewer: "Проверяющий",
    type_label: "Тип",
    read_label: "Прочитано",
    reference_label: "Ссылка",
    leave_pending_note: "Ваша заявка ожидает утверждения. Редактирование и оценка будут доступны после утверждения.",
    leave_status_note: "Статус заявки: {status}. Откройте утвержденный раздел для оценки.",
    notification_pending_note: "Ваш запрос рассматривается. Редактирование и оценка доступны только в детальном окне после утверждения.",
    notification_reviewed_note: "Этот запрос уже рассмотрен ({status}).",
    report_pending_note: "Отчет ожидает утверждения ({status}). Редактирование доступно только для черновиков или пересмотра.",
    cannot_self_approve_report: "Вы не можете утвердить свой собственный отчет. Ожидается следующий утверждающий.",
    action_request_revision_label: "Запросить пересмотр",
    action_submitted: "Отправлено",
    action_archived: "В архиве",
    action_cancelled: "Отменено",
    unknown: "Неизвестно",
    creation_warning_notification_title: "Важные моменты при отправке уведомления",
    creation_warning_notification_item1_title: "Нельзя записывать данные о пациентах и сотрудниках.",
    creation_warning_notification_item1_text: "Все пользователи могут читать уведомления. Поэтому не вводите конфиденциальную или личную информацию.",
    creation_warning_notification_item2_title: "Нельзя вводить имя пользователя и пароль.",
    creation_warning_notification_item2_text: "Не пишите в текст логин, пароль, ключ или другие конфиденциальные данные для входа.",
    creation_warning_notification_item3_title: "Уведомление должно быть направлено на одну конкретную цель.",
    creation_warning_notification_item3_text: "Каждое уведомление должно служить одной задаче или одному предупреждению. Не пишите слишком смешанный текст.",
    creation_warning_notification_item4_title: "Текст должен быть кратким и понятным.",
    creation_warning_notification_item4_text: "Используйте краткий, четкий и одинаково понятный для всех стиль.",
    creation_warning_leave_title: "Важные моменты при подаче заявки",
    creation_warning_leave_item1_title: "Даты и сроки должны быть выбраны правильно.",
    creation_warning_leave_item1_text: "Дата начала и окончания не должны быть ошибочными, содержание заявки должно соответствовать этому периоду.",
    creation_warning_leave_item2_title: "Причина должна быть официальной и понятной.",
    creation_warning_leave_item2_text: "Вместо лишних эмоциональных фраз введите краткое и официальное пояснение.",
    creation_warning_leave_item3_title: "Нельзя вводить конфиденциальную информацию.",
    creation_warning_leave_item3_text: "Не указывайте паспортные данные, пароли, личную медицинскую информацию или другие деликатные сведения.",
    creation_warning_leave_item4_title: "Не следует отправлять повторную заявку.",
    creation_warning_leave_item4_text: "Если заявка на этот период уже отправлена, не создавайте новую, а проверьте существующую.",
    creation_warning_feature_title: "Важные моменты при отправке запроса функции",
    creation_warning_feature_item1_title: "Запрос должен быть четким и разумным.",
    creation_warning_feature_item1_text: "Объясните, как функция должна работать и какую проблему она решает.",
    creation_warning_feature_item2_title: "Нельзя вводить конфиденциальную информацию.",
    creation_warning_feature_item2_text: "Не пишите пароль, логин или другие конфиденциальные данные в тексте запроса.",
    creation_warning_feature_item3_title: "Не следует отправлять повторный запрос.",
    creation_warning_feature_item3_text: "Если запрос на эту функцию уже отправлен, не создавайте новый, а поддержите существующий.",
    creation_warning_feature_item4_title: "Текст должен быть кратким и понятным.",
    creation_warning_feature_item4_text: "Используйте краткий, четкий и одинаково понятный для всех стиль.",
    creation_warning_report_title: "Важные моменты при создании документа",
    creation_warning_report_item1_title: "Заголовок должен соответствовать содержанию и быть официальным.",
    creation_warning_report_item1_text: "Название документа должно быть кратким, точным и легко находимым при поиске.",
    creation_warning_report_item2_title: "Содержание должно быть проверено и последовательным.",
    creation_warning_report_item2_text: "В документе не должно быть неверных цифр, незавершенных мыслей или неподтвержденной информации.",
    creation_warning_report_item3_title: "Нельзя вводить конфиденциальную или избыточную личную информацию.",
    creation_warning_report_item3_text: "Указывайте только информацию, относящуюся к рабочему процессу, не вводите данные, которые не должны быть раскрыты.",
    creation_warning_report_item4_title: "Не следует повторно создавать одинаковый документ.",
    creation_warning_report_item4_text: "Если по этой теме уже есть документ, перед созданием нового проверьте существующий.",
    creation_warning_confirm: "Понятно",
    confirm_reject_action: "Вы действительно хотите отклонить?",
    label_element: "Элемент",
    status_pending: "В ожидании",
    status_approved: "Утверждено",
    status_rejected: "Отклонено",
    status_draft: "Черновик",
    status_revision: "На пересмотре",
    status_pending_l2: "Ожидание L2",
    status_pending_l3: "Ожидание L3",
    status_pending_l4: "Ожидание L4",
    status_archived: "В архиве",
    status_cancelled: "Отменено",
    profile_info_short: "Информация",
    calendar: "Календарь",
    menu_label: "Меню",
    connection_label: "Подключение",
    check_connection: "Проверить подключение",
    add_user_short: "Добавить",
    help_center_subtitle: "Техническая поддержка",
    enterprise_panel: "Корпоративная панель",
    login_status_ready: "Готов к входу.",
    register_status_enter_details: "Введите данные.",
    otp_delivery_hint: "Введите 6-значный код из приложения Authenticator.",
    login_qr_alt: "QR код для входа",
    please_check_info: "Пожалуйста, проверьте данные.",
    err_api_not_found: "API не найден. Проверьте, запущен ли backend сервер {base}.",
    err_request_failed: "Запрос не выполнен ({status}).",
    err_role_dept_required: "Для этой роли необходимо выбрать отдел (department).",
    err_unit_head_unit_required: "Для роли UNIT_HEAD необходимо выбрать подразделение (unit).",
    err_dept_head_no_unit: "Для роли DEPT_HEAD подразделение (unit) выбирать не нужно. Оставьте поле пустым.",
    err_director_no_dept_unit: "Для роли DIRECTOR отдел и подразделение не назначаются. Оставьте поля пустыми.",
    err_unit_not_in_dept: "Выбранное подразделение не относится к выбранному отделу. Выберите подходящее подразделение.",
    err_job_role_dept_required: "При назначении профессиональной роли необходимо выбрать отдел.",
    err_level_requires_job_role: "Для назначения уровня сначала необходимо выбрать профессиональную роль (job_role).",
    err_rating_range: "Рейтинг должен быть от 1 до 5. Пожалуйста, выберите правильный рейтинг.",
    err_user_not_found: "Пользователь не найден. Пожалуйста, проверьте ID.",
    err_cannot_delete_self: "Вы не можете удалить себя. Пожалуйста, выберите другого пользователя.",
    otp_status_enter_code: "Введите код Authenticator.",
    preferences: "Настройки",
    appearance_settings: "Настройки внешнего вида",
    background_effect: "Анимированный фон",
    bg_none: "Нет",
    bg_particles: "Сеть частиц",
    bg_matrix: "Цифровой дождь",
    bg_lineart: "Линейное искусство",
    bg_glass: "Стеклянные 3D-формы",
    bg_retro: "Ретро изометрия",
    bg_quantum: "Квантовые волны",
    bg_cosmos: "Космос и галактика",
    system_logs: "Системные логи",
    system_logs_title: "Система сбора лог-файлов",
    download_logs: "Скачать",
    clear_logs: "Очистить",
    col_time: "Время",
    col_level: "Уровень",
    col_message: "Сообщение",
    no_logs: "Логов нет",
    appearance_copy: "Выберите, как HRMM выглядит для вас. Выберите тему — ваш выбор применяется немедленно и сохраняется автоматически.",
    theme_mode: "Режим темы",
    single_theme: "Один режим",
    sync_with_system: "Синхронизировать с системой",
    increase_contrast: "Увеличить контраст",
    increase_contrast_copy: "Увеличивает контраст текста, границ и фона для облегчения чтения.",
    role_devops: "DevOps",
    role_it_engineer: "IT-инженер",
    role_android_dev: "Android-разработчик",
    role_backend_dev: "Backend-разработчик",
    role_frontend_dev: "Frontend-разработчик",
    role_manager: "Менеджер",
    role_director: "Директор",
    level_junior: "Junior",
    level_middle: "Middle",
    level_senior: "Senior",
    role_specialist: "Специалист",
    role_unit_head: "Руководитель группы",
    role_dept_head: "Руководитель отдела",
    leave_type_annual: "Ежегодный",
    leave_type_sick: "Больничный",
    leave_type_unpaid: "Без сохранения з/п",
    leave_type_maternity: "Декретный",
    leave_type_other: "Другое",
    msg_2fa_setup_error: "Ошибка настройки 2FA.",
    msg_action_failed: "Действие не выполнено.",
    msg_read_notification_error: "Ошибка при отметке уведомления как прочитанного.",
    msg_otp_verify_error: "Ошибка при проверке кода подтверждения.",
    msg_feature_submitted: "Запрос новой функции отправлен.",
    msg_notification_created: "Новое уведомление создано.",
    msg_record_create_error: "Ошибка при создании новой записи.",
  },
  en: {
    role_management: "User Role Management",
    role_change: "Change Role",
    select_user: "Select User",
    new_role: "New Role",
    department: "Department",
    unit: "Unit",
    select_department: "Select Department",
    select_unit: "Select Unit",
    role_change_success: "Role changed successfully",
    role_change_error: "Error changing role",
    department_required: "Department is required for this role",
    unit_required: "Unit is required for this role",
    theme: "Theme",
    theme_dark: "Dark Mode",
    theme_light: "Light Mode",
    theme_toggle: "Toggle Theme",
    switch_to_light: "Switch to light mode",
    switch_to_dark: "Switch to dark mode",
    dark_mode_enabled: "Dark mode enabled",
    light_mode_enabled: "Light mode enabled",
    generic_error: "An error occurred. Please try again or contact the administrator.",
    users_list: "Users List",
    refresh_users: "Refresh Users",
    current_role: "Current Role",
    feature_requests: "Feature Requests",
    all_queue: "All Queue",
    no_pending_approval_items: "No pending items for approval.",
    no_pending_notifications: "No pending notifications",
    no_notifications: "No notifications",
    no_pending_leaves: "No pending leaves",
    no_pending_reports: "No pending reports",
    no_pending_items: "No pending items",
    feature_request_label: "Feature Request",
    label_report: "Report",
    label_leave: "Request",
    label_notification: "Notification",
    label_feature_request: "Feature Request",
    label_request: "Request",
    approved_label: "Approved",
    rejected_label: "Rejected",
    approver_label: "Approver",
    unknown: "Unknown",
    your_leave: "Your request",
    your_report: "Your report",
    rating_hint: "Select a rating",
    quick_view: "Quick view",
    review_shortcut_subtitle: "A small window for approvers",
    approved_leaves: "Approved requests",
    new_messages: "New messages",
    pending_requests_label: "Pending requests",
    pending_approvals: "Pending approvals",
    archive: "Archive",
    archive_history: "Archive history (last 7 days)",
    col_date: "Date",
    records_count: "Record count",
    file_size_kb: "File size (KB)",
    archive_logs_not_loaded: "Archive logs not loaded",
    archive_telegram_notice: "You can get the remaining data from the Telegram bot",
    connect_help_center: "Connect to help center",
    employees_list: "Employees list",
    it_employees_view: "IT employees view",
    search_employee: "Search employee...",
    all_positions: "All positions",
    all_levels: "All levels",
    refresh_employees: "Refresh employees",
    col_employee: "Employee",
    col_it_position: "IT position",
    col_level: "Level",
    data_not_loaded: "Data not loaded",
    msg_password_updated: "Password updated successfully.",
    msg_password_update_error: "Error updating password.",
    msg_2fa_enabled: "2FA enabled successfully.",
    msg_2fa_verify_error: "2FA verification error.",
    msg_2fa_disabled: "2FA disabled.",
    msg_2fa_disable_error: "Error disabling 2FA.",
    msg_comment_required_reject_revision: "A comment is required to reject or request revision.",
    msg_comment_required_reject: "A comment is required to reject.",
    msg_comment_required_revision: "A comment is required to request revision.",
    msg_reviewed_success: "Reviewed successfully.",
    msg_review_error: "Error during review.",
    msg_fill_title_summary: "Fill in the title and comment.",
    msg_report_updated: "Report updated.",
    msg_report_submitted: "Report submitted and added to the approval queue.",
    msg_report_id_applied_forms: "Report ID applied to workflow/attachment/history forms.",
    msg_leave_id_applied: "Leave ID applied to the review form.",
    msg_approved_success: "Approved successfully.",
    msg_approve_error: "Error during approval.",
    msg_rejected_success: "Rejected successfully.",
    msg_reject_error: "Error during rejection.",
    msg_logging_in: "Signing in...",
    msg_session_not_found: "Verification session not found. Please start login again.",
    msg_back_to_login: "You returned to the login step.",
    msg_password_updating: "Updating password...",
    msg_2fa_generating: "Generating QR and secret key for 2FA...",
    msg_qr_ready: "QR ready. Scan it in Google Authenticator and confirm the 6-digit code.",
    msg_2fa_setup_error: "Error creating 2FA setup.",
    msg_2fa_activating: "Activating 2FA...",
    msg_2fa_enable_error: "Error enabling 2FA.",
    msg_2fa_disabling: "Disabling 2FA...",
    msg_select_it_role_first: "To assign a level, first select an IT position.",
    msg_select_unit_for_unithead: "Select a unit for UNIT_HEAD.",
    msg_creating_it_user: "Creating IT employee...",
    msg_it_user_created: "IT employee created.",
    msg_user_create_error: "Error creating employee.",
    msg_role_changing: "Changing role...",
    msg_creating_report: "Creating report...",
    msg_report_create_error: "Error creating report.",
    msg_report_id_invalid: "Invalid report ID. Enter the report UUID in this field.",
    msg_loading_report: "Loading report data...",
    msg_report_not_found: "Report not found or you don't have access to it.",
    msg_workflow_running: "Performing action...",
    msg_workflow_success: "Action completed successfully.",
    msg_workflow_error: "Error performing action.",
    msg_leave_id_invalid: "Invalid leave ID. Enter the leave UUID in this field.",
    msg_reviewing_leave: "Reviewing leave...",
    msg_leave_reviewed: "Leave reviewed successfully.",
    msg_leave_review_error: "Error reviewing leave.",
    msg_attachment_report_id_required: "The Report ID for the attachment must be a UUID.",
    msg_attachment_only_draft: "Attachments can only be uploaded to a report in DRAFT or REVISION status.",
    msg_uploading_attachment: "Uploading attachment...",
    msg_attachment_uploaded: "Attachment uploaded.",
    msg_attachment_upload_error: "Error uploading attachment.",
    msg_attachment_downloaded: "Attachment downloaded.",
    msg_attachment_deleted: "Attachment deleted.",
    msg_attachment_delete_error: "Error deleting attachment.",
    msg_history_report_id_required: "Enter the report UUID for history.",
    msg_report_history_loaded: "Report history loaded.",
    msg_report_history_error: "Error getting report history.",
    msg_delete_report_id_required: "Enter the report UUID to delete.",
    msg_report_deleted: "Report deleted.",
    msg_report_delete_error: "Error deleting report.",
    msg_create_report_first_copy: "Create a report first, then the UUID will be copied.",
    msg_uuid_copied: "UUID copied.",
    msg_uuid_copy_failed: "Could not copy UUID, copy it manually.",
    msg_create_report_first_apply: "Create a report first, then the UUID will be applied to the forms.",
    msg_uuid_applied_forms: "UUID applied to workflow/attachment/history forms.",
    msg_all_notifications_read: "All notifications marked as read.",
    msg_notifications_update_error: "Error updating notifications.",
    msg_password_changed: "Password changed successfully.",
    msg_password_change_error: "Error changing password.",
    msg_all_sections_refreshed: "All sections refreshed.",
    msg_logout_success: "Logged out.",
    msg_logout_error: "Error during logout.",
    msg_server_connection_active: "Server connection active.",
    msg_fill_required_fields: "Please fill in all required fields.",
    msg_creating_leave: "Creating leave request...",
    msg_leave_submitted: "Leave request submitted.",
    msg_leave_create_error: "Error creating leave request.",
    msg_add_user: "Add employee",
    err_attachment_id_format: "Attachment ID or Report ID must be in UUID format.",
    err_no_attachment_in_report: "No attachment found in this report.",
    err_attachment_not_found: "Attachment not found. Check the attachment ID or the attachment belonging to the report.",
    err_api_connection: "Connection error. Could not connect to the API server",
    err_timeout_prefix: "The request did not respond within",
    err_timeout_suffix: "seconds. Check your internet or the backend server.",
    msg_departments_not_found: "Department list not found. First check that departments are created in the backend.",
    msg_connected_departments: "Frontend connected to backend. Departments loaded: {count}.",
    msg_action_not_allowed: "Action \"{action}\" is not allowed for a report in status {status}. Allowed actions: {actions}",
    msg_attachment_used_from_report: "Using attachment found by Report ID: {id}",
    msg_attachment_deleting_from_report: "Deleting attachment found by Report ID: {id}",
    msg_select_user_and_role: "Please select a user and role",
    msg_select_rating: "Please select a rating",
    msg_rating_archived: "Rating saved and moved to archive",
    msg_select_rating_first: "Select a rating first.",
    msg_write_comment: "Write a comment.",
    msg_feedback_saved: "Rating and comment saved to the backend.",
    msg_feedback_error: "Error sending feedback.",
    msg_registering: "Registering...",
    msg_registered: "You're registered! Now sign in.",
    msg_enter_details: "Enter your details.",
    msg_passwords_mismatch: "Passwords did not match.",
    security_settings: "Security settings",
    msg_login_error: "A login error occurred.",
    msg_register_error: "Error during registration.",
    msg_rating_save_error: "Error saving the rating",
    msg_2fa_code_sent_email: "Password confirmed. A 6-digit code was sent to {email}.",
    msg_2fa_setup_scan: "Password confirmed. For first sign-in, scan the QR code and enter the 6-digit code.",
    msg_2fa_enter_code: "Password confirmed. Now enter the 6-digit authenticator code.",
    download: "Download",
    collection_edit_hint: "Click an item to edit and rate it.",
    use_report_id: "Use report ID",
    use_leave_id: "Use leave ID",
    no_archive_logs_7days: "No archive logs in the last 7 days",
    mark_as_read: "Mark as read",
    no_department_data: "No data found for departments",
    archive_ok: "Success",
    archive_fail: "Error",
    pending_suffix: "pending",
    no_unit: "No unit",
    attachment: "Attachment",
    has_attachment: "Has attachment",
    incoming_messages: "Incoming messages",
    search_notification: "Search notification...",
    refresh_messages: "Refresh messages",
    mark_all_read: "Mark all as read",
    refresh_dashboard: "Refresh dashboard",
    draft_reports: "Draft reports",
    rejected_reports: "Rejected reports",
    recent_reports: "Recent reports",
    recent_leaves: "Recent requests",
    refresh_admin_panel: "Refresh admin panel",
    total_employees: "Total employees",
    on_leave: "On leave",
    active_reports: "Active reports",
    search_institution: "Search institution...",
    refresh_analytics: "Refresh analytics",
    total_reports: "Total reports",
    login_to_load_units: "Login (units loading)",
    login_to_load_departments: "Login (departments loading)",
    select: "Select",
    create_leave_title: "New leave request",
    leave_type: "Leave type",
    start_date: "Start date",
    end_date: "End date",
    reason: "Reason",
    leave_reason_placeholder: "Leave reason",
    submit_leave: "Submit request",
    workflow_overview: "Overview by department",
    search_department: "Search department...",
    total_pending: "Total pending",
    loading_data: "Loading data...",
    leave_distribution: "Leave distribution",
    workflow_tools_subtitle: "Confirm by UUID, attachment and history",
    report_id_label: "Report ID",
    report_uuid_placeholder: "Enter report UUID",
    action_submit: "Submit (DRAFT/REVISION only)",
    action_approve: "Approve (PENDING only)",
    action_reject: "Reject (PENDING only, comment required)",
    action_request_revision: "Request revision (PENDING only, comment required)",
    action_archive: "Archive (APPROVED/REJECTED only)",
    comment_label: "Comment",
    workflow_comment_placeholder: "Approval or rejection comment",
    run_workflow_action: "Run workflow action",
    leave_id_label: "Leave ID",
    leave_uuid_placeholder: "Enter leave UUID",
    review_comment_placeholder: "Approval or rejection comment",
    review_leave: "Review leave",
    full_name_placeholder: "Full name",
    username_placeholder: "Username",
    email_placeholder: "Email",
    password_placeholder: "At least 8 characters",
    password_confirm_placeholder: "Re-enter password",
    unit_optional: "Unit (optional)",
    upload_attachment: "Upload attachment",
    attachment_report_id: "Report ID for attachment",
    download_attachment: "Download attachment",
    delete_attachment: "Delete attachment",
    attachment_id: "Attachment ID",
    attachment_uuid_placeholder: "Attachment UUID",
    report_id_history: "Report ID for history/deletion",
    load_history: "Load history",
    delete_report: "Delete report",
    search_report: "Search report...",
    all_statuses: "All statuses",
    refresh_reports: "Refresh reports",
    reports_not_loaded: "Reports not loaded",
    refresh_history: "Refresh history",
    search_leave: "Search request...",
    refresh_leaves: "Refresh requests",
    leaves_not_loaded: "Requests not loaded",
    feedback_eyebrow: "Rating",
    feedback_heading: "Feedback and comment",
    rating: "Rating",
    feedback_comment: "Feedback",
    feedback_comment_placeholder: "Write your feedback...",
    submit: "Submit",
    auxiliary_modules: "Additional modules",
    leave_calendar: "Leave calendar",
    approved_leaves_table: "Approved leaves table",
    recent_actions: "Recent actions",
    activity_not_loaded: "Activity history not loaded",
    col_days: "Days count",
    col_comment: "Comment",
    owner: "Owner",
    created: "Created",
    pending_l2: "L2 pending",
    pending_l3: "L3 pending",
    pending_l4: "L4 pending",
    user: "User",
    audit_report_created: "created a report",
    audit_report_updated: "updated a report",
    audit_leave_created: "created a request",
    audit_leave_approved: "approved a request",
    audit_notification_created: "created a notification",
    audit_action_performed: "performed an action",
    system: "System",
    audit: "Audit",
    created_by_suffix: "created by",
    leave_created_suffix: "created a request",
    status_no_data: "No status",
    no_activity_history: "No activity history yet.",
    no_employees_found: "No employees found",
    no_reports_found: "No reports found",
    no_leaves_found: "No requests found",
    no_recent_reports: "No recent reports",
    no_recent_leaves: "No recent requests",
    no_pending_approvals: "No pending approvals",
    admin_approved_comment: "Approved by admin",
    total_reports_short: "Total",
    approved_reports_short: "Approved",
    pending_reports_short: "Pending",
    rejected_reports_short: "Rejected",
    no_analytics_data: "No analytics data",
    pending_short: "pend.",
    approved_short: "appr.",
    no_data: "No data",
    regenerate_qr: "Regenerate QR",
    no_comments_yet: "No comments yet.",
    no_review_history: "No review history yet. It will appear after you approve a request, report, or notification.",
    no_comment: "No comment",
    days: "days",
    no_approved_leaves_calendar: "Approved leave calendar is empty",
    date_label: "Date",
    days_label: "Days",
    reviewer: "Reviewer",
    type_label: "Type",
    read_label: "Read",
    reference_label: "Reference",
    leave_pending_note: "Your leave request is pending approval. Editing and rating will be available after approval.",
    leave_status_note: "Leave status: {status}. Open the approved section to rate.",
    notification_pending_note: "Your request is being reviewed. Editing and rating are only available in the detailed view after approval.",
    notification_reviewed_note: "This request has already been reviewed ({status}).",
    report_pending_note: "Report is pending approval ({status}). Editing is only available for drafts or revisions.",
    cannot_self_approve_report: "You cannot approve your own report. Waiting for next approver.",
    action_request_revision_label: "Request revision",
    action_submitted: "Submitted",
    action_archived: "Archived",
    action_cancelled: "Cancelled",
    unknown: "Unknown",
    creation_warning_notification_title: "Important points when sending a notification",
    creation_warning_notification_item1_title: "Patient and employee information must not be recorded.",
    creation_warning_notification_item1_text: "All users can read notifications. Therefore, do not enter confidential or personal information.",
    creation_warning_notification_item2_title: "Usernames and passwords must not be entered.",
    creation_warning_notification_item2_text: "Do not write login, password, key, or other confidential access information in the text.",
    creation_warning_notification_item3_title: "The notification must be aimed at one specific purpose.",
    creation_warning_notification_item3_text: "Each notification should serve one task or one warning. Do not write overly mixed text.",
    creation_warning_notification_item4_title: "The text must be concise and understandable.",
    creation_warning_notification_item4_text: "Use a short, clear, and equally understandable style for everyone.",
    creation_warning_leave_title: "Important points when submitting a leave request",
    creation_warning_leave_item1_title: "Dates and deadlines must be selected correctly.",
    creation_warning_leave_item1_text: "Start and end dates must not be wrong, the request content must match this period.",
    creation_warning_leave_item2_title: "The reason must be official and clear.",
    creation_warning_leave_item2_text: "Instead of unnecessary emotional phrases, enter a short and official explanation.",
    creation_warning_leave_item3_title: "Confidential information must not be entered.",
    creation_warning_leave_item3_text: "Do not write passport details, passwords, personal medical details or other sensitive information.",
    creation_warning_leave_item4_title: "Duplicate requests should not be sent.",
    creation_warning_leave_item4_text: "If a request has already been sent for this period, do not create a new one, check the existing one.",
    creation_warning_feature_title: "Important points when submitting a feature request",
    creation_warning_feature_item1_title: "The request must be clear and reasonable.",
    creation_warning_feature_item1_text: "Explain how the function should work and what problem it solves.",
    creation_warning_feature_item2_title: "Confidential information must not be entered.",
    creation_warning_feature_item2_text: "Do not write password, login or other confidential data in the request text.",
    creation_warning_feature_item3_title: "Duplicate requests should not be sent.",
    creation_warning_feature_item3_text: "If a request for this function has already been sent, do not create a new one, support the existing one.",
    creation_warning_feature_item4_title: "The text must be concise and understandable.",
    creation_warning_feature_item4_text: "Use a short, clear, and equally understandable style for everyone.",
    creation_warning_report_title: "Important points when creating a document",
    creation_warning_report_item1_title: "The title must match the content and be official.",
    creation_warning_report_item1_text: "The document name should be short, precise and easily found in search.",
    creation_warning_report_item2_title: "Content must be checked and consistent.",
    creation_warning_report_item2_text: "The document should not contain incorrect numbers, incomplete thoughts or unverified information.",
    creation_warning_report_item3_title: "Confidential or excessive personal information must not be entered.",
    creation_warning_report_item3_text: "Write only information related to the work process, do not enter information that should not be disclosed.",
    creation_warning_report_item4_title: "The same document should not be created repeatedly.",
    creation_warning_report_item4_text: "If there is already a document on this topic, check the existing one before opening a new one.",
    creation_warning_confirm: "Understood",
    confirm_reject_action: "Are you sure you want to reject?",
    label_element: "Element",
    status_pending: "Pending",
    status_approved: "Approved",
    status_rejected: "Rejected",
    status_draft: "Draft",
    status_revision: "Revision",
    status_pending_l2: "Pending L2",
    status_pending_l3: "Pending L3",
    status_pending_l4: "Pending L4",
    status_archived: "Archived",
    status_cancelled: "Cancelled",
    profile_info_short: "Info",
    calendar: "Calendar",
    menu_label: "Menu",
    connection_label: "Connection",
    check_connection: "Check connection",
    add_user_short: "Add",
    help_center_subtitle: "Technical support",
    enterprise_panel: "Enterprise panel",
    login_status_ready: "Ready to login.",
    register_status_enter_details: "Enter your details.",
    otp_delivery_hint: "Enter the 6-digit code from the Authenticator app.",
    login_qr_alt: "Login QR code",
    please_check_info: "Please check the information.",
    err_api_not_found: "API not found. Please check if the backend server is running at {base}.",
    err_request_failed: "Request failed ({status}).",
    err_role_dept_required: "Department is required for this role. Please select a department.",
    err_unit_head_unit_required: "Unit is required for UNIT_HEAD role. Please select a unit.",
    err_dept_head_no_unit: "Unit should not be selected for DEPT_HEAD role. Please leave the unit field empty.",
    err_director_no_dept_unit: "Department and unit are not assigned for DIRECTOR role. Please leave them empty.",
    err_unit_not_in_dept: "The selected unit does not belong to the selected department. Please select a matching unit.",
    err_job_role_dept_required: "Department is required when assigning a job role. Please select a department.",
    err_level_requires_job_role: "To assign a level, first select a job role.",
    err_rating_range: "Rating must be between 1 and 5. Please select a correct rating.",
    err_user_not_found: "User not found. Please check the ID.",
    err_cannot_delete_self: "You cannot delete yourself. Please select another user.",
    otp_status_enter_code: "Enter the Authenticator code.",
    preferences: "Preferences",
    appearance_settings: "Appearance settings",
    background_effect: "Animated background",
    bg_none: "None",
    bg_particles: "Particle network",
    bg_matrix: "Matrix rain",
    bg_lineart: "Minimal line art",
    bg_glass: "Glassmorphism 3D",
    bg_retro: "Retro isometric",
    bg_quantum: "Quantum waves",
    bg_cosmos: "Cosmos & galaxy",
    system_logs: "System logs",
    system_logs_title: "Log file collection system",
    download_logs: "Download",
    clear_logs: "Clear",
    col_time: "Time",
    col_level: "Level",
    col_message: "Message",
    no_logs: "No logs",
    appearance_copy: "Choose how HRMM looks to you. Select a theme - your choice is applied immediately and saved automatically.",
    theme_mode: "Theme mode",
    single_theme: "Single theme",
    sync_with_system: "Sync with system",
    increase_contrast: "Increase contrast",
    increase_contrast_copy: "Boosts text, border, and background contrast for easier reading.",
    role_devops: "DevOps",
    role_it_engineer: "IT Engineer",
    role_android_dev: "Android Developer",
    role_backend_dev: "Backend Developer",
    role_frontend_dev: "Frontend Developer",
    role_manager: "Manager",
    role_director: "Director",
    level_junior: "Junior",
    level_middle: "Middle",
    level_senior: "Senior",
    role_specialist: "Specialist",
    role_unit_head: "Unit Head",
    role_dept_head: "Department Head",
    leave_type_annual: "Annual",
    leave_type_sick: "Sick",
    leave_type_unpaid: "Unpaid",
    leave_type_maternity: "Maternity",
    leave_type_other: "Other",
    msg_2fa_setup_error: "Error setting up 2FA.",
    msg_action_failed: "Action failed.",
    msg_read_notification_error: "Error marking notification as read.",
    msg_otp_verify_error: "Error verifying verification code.",
    msg_feature_submitted: "New feature request submitted.",
    msg_notification_created: "New notification created.",
    msg_record_create_error: "Error creating new record.",
  },
  tr: {
    role_management: "Kullanici Rol Yonetimi",
    role_change: "Rol Degistir",
    select_user: "Kullanici Secin",
    new_role: "Yeni Rol",
    department: "Departman",
    unit: "Birim",
    select_department: "Departman Secin",
    select_unit: "Birim Secin",
    role_change_success: "Rol basariyla degistirildi",
    role_change_error: "Rol degistirme hatasi",
    department_required: "Bu rol icin departman secilmelidir",
    unit_required: "Bu rol icin birim secilmelidir",
    theme: "Tema",
    theme_dark: "Karanlik Mod",
    theme_light: "Aydinlik Mod",
    theme_toggle: "Tema Degistir",
    switch_to_light: "Aydinlik moduna gec",
    switch_to_dark: "Karanlik moduna gec",
    dark_mode_enabled: "Karanlik mod etkinlestirildi",
    light_mode_enabled: "Aydinlik mod etkinlestirildi",
    generic_error: "Bir hata olustu. Lutfen tekrar deneyin veya yoneticiye basvurun.",
    users_list: "Kullanici Listesi",
    refresh_users: "Kullanicilari Yenile",
    current_role: "Mevcut Rol",
    feature_requests: "Özellik Talepleri",
    all_queue: "Tüm Kuyruk",
    no_pending_approval_items: "Onay bekleyen öğe yok.",
    no_pending_notifications: "Bekleyen bildirim yok",
    no_notifications: "Bildirim yok",
    no_pending_leaves: "Bekleyen talep yok",
    no_pending_reports: "Bekleyen rapor yok",
    no_pending_items: "Bekleyen öğe yok",
    feature_request_label: "Özellik Talebi",
    label_report: "Rapor",
    label_leave: "Talep",
    label_notification: "Bildirim",
    label_feature_request: "Özellik Talebi",
    label_request: "Talep",
    approved_label: "Onaylandı",
    rejected_label: "Reddedildi",
    approver_label: "Onaylayan",
    unknown: "Bilinmiyor",
    your_leave: "Talebiniz",
    your_report: "Raporunuz",
    rating_hint: "Puan seçin",
    quick_view: "Hızlı görünüm",
    review_shortcut_subtitle: "Onaylayanlar için küçük pencere",
    approved_leaves: "Onaylanan talepler",
    new_messages: "Yeni mesajlar",
    pending_requests_label: "Bekleyen talepler",
    pending_approvals: "Bekleyen onaylar",
    archive: "Arşiv",
    archive_history: "Arşivleme geçmişi (son 7 gün)",
    col_date: "Tarih",
    records_count: "Kayıt sayısı",
    file_size_kb: "Dosya boyutu (KB)",
    archive_logs_not_loaded: "Arşiv kayıtları yüklenmedi",
    archive_telegram_notice: "Kalan verileri Telegram botundan alabilirsiniz",
    connect_help_center: "Yardım merkezine bağlan",
    employees_list: "Çalışan listesi",
    it_employees_view: "BT çalışanları görünümü",
    search_employee: "Çalışan ara...",
    all_positions: "Tüm pozisyonlar",
    all_levels: "Tüm seviyeler",
    refresh_employees: "Çalışanları yenile",
    col_employee: "Çalışan",
    col_it_position: "BT pozisyonu",
    col_level: "Seviye",
    data_not_loaded: "Veri yüklenmedi",
    msg_password_updated: "Parola başarıyla güncellendi.",
    msg_password_update_error: "Parola güncellenirken hata oluştu.",
    msg_2fa_enabled: "2FA başarıyla etkinleştirildi.",
    msg_2fa_verify_error: "2FA doğrulama hatası.",
    msg_2fa_disabled: "2FA devre dışı bırakıldı.",
    msg_2fa_disable_error: "2FA devre dışı bırakılırken hata oluştu.",
    msg_comment_required_reject_revision: "Reddetmek veya revizyon istemek için yorum zorunludur.",
    msg_comment_required_reject: "Reddetmek için yorum zorunludur.",
    msg_comment_required_revision: "Revizyon istemek için yorum zorunludur.",
    msg_reviewed_success: "Başarıyla incelendi.",
    msg_review_error: "İnceleme sırasında hata oluştu.",
    msg_fill_title_summary: "Başlık ve yorumu doldurun.",
    msg_report_updated: "Rapor güncellendi.",
    msg_report_submitted: "Rapor gönderildi ve onay kuyruğuna eklendi.",
    msg_report_id_applied_forms: "Rapor ID workflow/ek/geçmiş formlarına yerleştirildi.",
    msg_leave_id_applied: "Talep ID inceleme formuna yerleştirildi.",
    msg_approved_success: "Başarıyla onaylandı.",
    msg_approve_error: "Onaylama sırasında hata oluştu.",
    msg_rejected_success: "Başarıyla reddedildi.",
    msg_reject_error: "Reddetme sırasında hata oluştu.",
    msg_logging_in: "Giriş yapılıyor...",
    msg_session_not_found: "Doğrulama oturumu bulunamadı. Lütfen girişi yeniden başlatın.",
    msg_back_to_login: "Giriş adımına döndünüz.",
    msg_password_updating: "Parola güncelleniyor...",
    msg_2fa_generating: "2FA için QR ve gizli anahtar oluşturuluyor...",
    msg_qr_ready: "QR hazır. Google Authenticator'da tarayın ve 6 haneli kodu onaylayın.",
    msg_2fa_setup_error: "2FA kurulumu oluşturulurken hata oluştu.",
    msg_2fa_activating: "2FA etkinleştiriliyor...",
    msg_2fa_enable_error: "2FA etkinleştirilirken hata oluştu.",
    msg_2fa_disabling: "2FA devre dışı bırakılıyor...",
    msg_select_it_role_first: "Seviye atamak için önce bir BT pozisyonu seçin.",
    msg_select_unit_for_unithead: "UNIT_HEAD için bir birim seçin.",
    msg_creating_it_user: "BT çalışanı oluşturuluyor...",
    msg_it_user_created: "BT çalışanı oluşturuldu.",
    msg_user_create_error: "Çalışan oluşturulurken hata oluştu.",
    msg_role_changing: "Rol değiştiriliyor...",
    msg_creating_report: "Rapor oluşturuluyor...",
    msg_report_create_error: "Rapor oluşturulurken hata oluştu.",
    msg_report_id_invalid: "Geçersiz rapor ID. Bu alana rapor UUID girin.",
    msg_loading_report: "Rapor verileri yükleniyor...",
    msg_report_not_found: "Rapor bulunamadı veya erişim yetkiniz yok.",
    msg_workflow_running: "İşlem yürütülüyor...",
    msg_workflow_success: "İşlem başarıyla tamamlandı.",
    msg_workflow_error: "İşlem yürütülürken hata oluştu.",
    msg_leave_id_invalid: "Geçersiz talep ID. Bu alana talep UUID girin.",
    msg_reviewing_leave: "Talep inceleniyor...",
    msg_leave_reviewed: "Talep başarıyla incelendi.",
    msg_leave_review_error: "Talep incelenirken hata oluştu.",
    msg_attachment_report_id_required: "Ek için Rapor ID UUID formatında olmalıdır.",
    msg_attachment_only_draft: "Ek yalnızca DRAFT veya REVISION durumundaki rapora yüklenir.",
    msg_uploading_attachment: "Ek yükleniyor...",
    msg_attachment_uploaded: "Ek yüklendi.",
    msg_attachment_upload_error: "Ek yüklenirken hata oluştu.",
    msg_attachment_downloaded: "Ek indirildi.",
    msg_attachment_deleted: "Ek silindi.",
    msg_attachment_delete_error: "Ek silinirken hata oluştu.",
    msg_history_report_id_required: "Geçmiş için rapor UUID girin.",
    msg_report_history_loaded: "Rapor geçmişi yüklendi.",
    msg_report_history_error: "Rapor geçmişi alınırken hata oluştu.",
    msg_delete_report_id_required: "Silmek için rapor UUID girin.",
    msg_report_deleted: "Rapor silindi.",
    msg_report_delete_error: "Rapor silinirken hata oluştu.",
    msg_create_report_first_copy: "Önce rapor oluşturun, ardından UUID kopyalanır.",
    msg_uuid_copied: "UUID kopyalandı.",
    msg_uuid_copy_failed: "UUID kopyalanamadı, manuel olarak kopyalayın.",
    msg_create_report_first_apply: "Önce rapor oluşturun, ardından UUID formlara yerleştirilir.",
    msg_uuid_applied_forms: "UUID workflow/ek/geçmiş formlarına yerleştirildi.",
    msg_all_notifications_read: "Tüm bildirimler okundu olarak işaretlendi.",
    msg_notifications_update_error: "Bildirimler güncellenirken hata oluştu.",
    msg_password_changed: "Parola başarıyla değiştirildi.",
    msg_password_change_error: "Parola değiştirilirken hata oluştu.",
    msg_all_sections_refreshed: "Tüm bölümler yenilendi.",
    msg_logout_success: "Çıkış yapıldı.",
    msg_logout_error: "Çıkış sırasında hata oluştu.",
    msg_server_connection_active: "Sunucu bağlantısı aktif.",
    msg_fill_required_fields: "Lütfen tüm zorunlu alanları doldurun.",
    msg_creating_leave: "İzin talebi oluşturuluyor...",
    msg_leave_submitted: "İzin talebi gönderildi.",
    msg_leave_create_error: "İzin talebi oluşturulurken hata oluştu.",
    msg_add_user: "Çalışan ekle",
    err_attachment_id_format: "Ek ID veya Rapor ID UUID formatında olmalıdır.",
    err_no_attachment_in_report: "Bu raporda ek bulunamadı.",
    err_attachment_not_found: "Ek bulunamadı. Ek ID veya rapora ait eki kontrol edin.",
    err_api_connection: "Bağlantı hatası. API sunucusuna bağlanılamadı",
    err_timeout_prefix: "İstek şu süre içinde yanıt vermedi:",
    err_timeout_suffix: "saniye. İnternet veya backend sunucusunu kontrol edin.",
    msg_departments_not_found: "Bölüm listesi bulunamadı. Önce backend'de bölümlerin oluşturulduğunu kontrol edin.",
    msg_connected_departments: "Frontend backend'e bağlandı. Yüklenen bölümler: {count}.",
    msg_action_not_allowed: "\"{action}\" işlemi {status} durumundaki rapor için mümkün değil. İzin verilen işlemler: {actions}",
    msg_attachment_used_from_report: "Report ID ile bulunan ek kullanılıyor: {id}",
    msg_attachment_deleting_from_report: "Report ID ile bulunan ek siliniyor: {id}",
    msg_select_user_and_role: "Lütfen bir kullanici ve rol seçin",
    msg_select_rating: "Lütfen bir puan seçin",
    msg_rating_archived: "Değerlendirme kaydedildi ve arşive taşındı",
    msg_select_rating_first: "Önce bir puan seçin.",
    msg_write_comment: "Bir yorum yazın.",
    msg_feedback_saved: "Değerlendirme ve yorum backend'e kaydedildi.",
    msg_feedback_error: "Geri bildirim gönderilirken hata oluştu.",
    msg_registering: "Kaydolunuyor...",
    msg_registered: "Kaydoldunuz! Şimdi giriş yapın.",
    msg_enter_details: "Bilgilerinizi girin.",
    msg_passwords_mismatch: "Parolalar eşleşmedi.",
    security_settings: "Güvenlik ayarları",
    msg_login_error: "Giriş hatası oluştu.",
    msg_register_error: "Kayıt sırasında hata oluştu.",
    msg_rating_save_error: "Değerlendirme kaydedilirken hata oluştu",
    msg_2fa_code_sent_email: "Parola onaylandı. 6 haneli kod {email} adresine gönderildi.",
    msg_2fa_setup_scan: "Parola onaylandı. İlk giriş için QR kodunu tarayın ve 6 haneli kodu girin.",
    msg_2fa_enter_code: "Parola onaylandı. Şimdi 6 haneli authenticator kodunu girin.",
    download: "İndir",
    collection_edit_hint: "Düzenlemek ve değerlendirmek için bir öğeye tıklayın.",
    use_report_id: "Rapor ID kullan",
    use_leave_id: "Talep ID kullan",
    no_archive_logs_7days: "Son 7 günde arşiv kaydı yok",
    mark_as_read: "Okundu olarak işaretle",
    no_department_data: "Departmanlar için veri bulunamadı",
    archive_ok: "Başarılı",
    archive_fail: "Hata",
    pending_suffix: "bekliyor",
    no_unit: "Birim yok",
    attachment: "Ek",
    has_attachment: "Ek var",
    incoming_messages: "Gelen mesajlar",
    search_notification: "Bildirim ara...",
    refresh_messages: "Mesajları yenile",
    mark_all_read: "Tümünü okundu olarak işaretle",
    refresh_dashboard: "Paneli yenile",
    draft_reports: "Taslak raporlar",
    rejected_reports: "Reddedilen raporlar",
    recent_reports: "Son raporlar",
    recent_leaves: "Son talepler",
    refresh_admin_panel: "Yönetici panelini yenile",
    total_employees: "Toplam çalışan",
    on_leave: "İzinde",
    active_reports: "Aktif raporlar",
    search_institution: "Kurum ara...",
    refresh_analytics: "Analitiği yenile",
    total_reports: "Toplam rapor",
    login_to_load_units: "Giriş yapın (birimler yükleniyor)",
    login_to_load_departments: "Giriş yapın (departmanlar yükleniyor)",
    select: "Seçin",
    create_leave_title: "Yeni izin talebi",
    leave_type: "İzin türü",
    start_date: "Başlangıç tarihi",
    end_date: "Bitiş tarihi",
    reason: "Neden",
    leave_reason_placeholder: "İzin nedeni",
    submit_leave: "Talep gönder",
    workflow_overview: "Departmana göre genel görünüm",
    search_department: "Departman ara...",
    total_pending: "Toplam beklemede",
    loading_data: "Veriler yükleniyor...",
    leave_distribution: "İzin dağılımı",
    workflow_tools_subtitle: "UUID ile onaylama, ek ve geçmiş",
    report_id_label: "Rapor ID",
    report_uuid_placeholder: "Rapor UUID girin",
    action_submit: "Gönder (sadece DRAFT/REVISION)",
    action_approve: "Onayla (sadece PENDING)",
    action_reject: "Reddet (sadece PENDING, yorum zorunlu)",
    action_request_revision: "Revizyon iste (sadece PENDING, yorum zorunlu)",
    action_archive: "Arşivle (sadece APPROVED/REJECTED)",
    comment_label: "Yorum",
    workflow_comment_placeholder: "Onay veya ret yorumu",
    run_workflow_action: "İş akışı eylemini çalıştır",
    leave_id_label: "İzin ID",
    leave_uuid_placeholder: "İzin UUID girin",
    review_comment_placeholder: "Onay veya ret yorumu",
    review_leave: "İzini incele",
    full_name_placeholder: "Ad soyad",
    username_placeholder: "Kullanıcı adı",
    email_placeholder: "Email",
    password_placeholder: "En az 8 karakter",
    password_confirm_placeholder: "Parolayı tekrar girin",
    unit_optional: "Birim (isteğe bağlı)",
    upload_attachment: "Ekleme yükle",
    attachment_report_id: "Ek için rapor ID",
    download_attachment: "Ekleme indir",
    delete_attachment: "Ekleme sil",
    attachment_id: "Ek ID",
    attachment_uuid_placeholder: "Ek UUID",
    report_id_history: "Geçmiş/silme için rapor ID",
    load_history: "Geçmişi yükle",
    delete_report: "Raporu sil",
    search_report: "Rapor ara...",
    all_statuses: "Tüm durumlar",
    refresh_reports: "Raporları yenile",
    reports_not_loaded: "Raporlar yüklenmedi",
    refresh_history: "Geçmişi yenile",
    search_leave: "Talep ara...",
    refresh_leaves: "Talepleri yenile",
    leaves_not_loaded: "Talepler yüklenmedi",
    feedback_eyebrow: "Değerlendirme",
    feedback_heading: "Geri bildirim ve yorum",
    rating: "Değerlendirme",
    feedback_comment: "Geri bildirim",
    feedback_comment_placeholder: "Geri bildiriminizi yazın...",
    submit: "Gönder",
    auxiliary_modules: "Ek modüller",
    leave_calendar: "İzin takvimi",
    approved_leaves_table: "Onaylanan izinler tablosu",
    recent_actions: "Son eylemler",
    activity_not_loaded: "Etkinlik geçmişi yüklenmedi",
    col_days: "Gün sayısı",
    col_comment: "Yorum",
    owner: "Sahip",
    created: "Oluşturuldu",
    pending_l2: "L2 bekliyor",
    pending_l3: "L3 bekliyor",
    pending_l4: "L4 bekliyor",
    user: "Kullanici",
    audit_report_created: "rapor oluşturdu",
    audit_report_updated: "raporu güncelledi",
    audit_leave_created: "talep oluşturdu",
    audit_leave_approved: "talebi onayladı",
    audit_notification_created: "bildirim oluşturdu",
    audit_action_performed: "eylem gerçekleştirdi",
    system: "Sistem",
    audit: "Denetim",
    created_by_suffix: "tarafından oluşturuldu",
    leave_created_suffix: "talep oluşturdu",
    status_no_data: "Durum yok",
    no_activity_history: "Henüz etkinlik geçmişi yok.",
    no_employees_found: "Çalışan bulunamadı",
    no_reports_found: "Rapor bulunamadı",
    no_leaves_found: "Talep bulunamadı",
    no_recent_reports: "Son rapor yok",
    no_recent_leaves: "Son talep yok",
    no_pending_approvals: "Bekleyen onay yok",
    admin_approved_comment: "Yönetici tarafından onaylandı",
    total_reports_short: "Toplam",
    approved_reports_short: "Onaylanan",
    pending_reports_short: "Beklemede",
    rejected_reports_short: "Reddedilen",
    no_analytics_data: "Analitik veri yok",
    pending_short: "bekl.",
    approved_short: "onay.",
    no_data: "Veri yok",
    regenerate_qr: "QR yeniden oluştur",
    no_comments_yet: "Henüz yorum yok.",
    no_review_history: "Henüz onay geçmişi yok. Talep, rapor veya bildirimi onayladıktan sonra burada görünecek.",
    no_comment: "Yorum yok",
    days: "gün",
    no_approved_leaves_calendar: "Onaylanan izin takvimi boş",
    date_label: "Tarih",
    days_label: "Gün",
    reviewer: "İnceleyen",
    type_label: "Tür",
    read_label: "Okundu",
    reference_label: "Referans",
    leave_pending_note: "İzin talebiniz onay bekliyor. Düzenleme ve değerlendirme onaylandıktan sonra kullanılabilir.",
    leave_status_note: "İzin durumu: {status}. Değerlendirmek için onaylanmış bölümden açın.",
    notification_pending_note: "Talebiniz inceleniyor. Düzenleme ve değerlendirme sadece onaylandıktan sonra detaylı görünümde mevcut.",
    notification_reviewed_note: "Bu talep zaten incelendi ({status}).",
    report_pending_note: "Rapor onay bekliyor ({status}). Düzenleme sadece taslak veya revizyon için mevcut.",
    cannot_self_approve_report: "Kendi raporunuzu onaylayamazsınız. Sonraki onaylayıcı bekleniyor.",
    action_request_revision_label: "Revizyon iste",
    action_submitted: "Gönderildi",
    action_archived: "Arşivlendi",
    action_cancelled: "İptal edildi",
    unknown: "Bilinmiyor",
    creation_warning_notification_title: "Bildirim gönderirken dikkat edilmesi gereken noktalar",
    creation_warning_notification_item1_title: "Hasta ve çalışan bilgileri yazılmamalıdır.",
    creation_warning_notification_item1_text: "Tüm kullanıcılar bildirimleri okuyabilir. Bu nedenle gizli veya kişisel bilgileri girmeyin.",
    creation_warning_notification_item2_title: "Kullanıcı adı ve şifre girilmemelidir.",
    creation_warning_notification_item2_text: "Metne giriş, şifre, anahtar veya diğer gizli erişim bilgilerini yazmayın.",
    creation_warning_notification_item3_title: "Bildirim tek belirli bir amaca yönelik olmalıdır.",
    creation_warning_notification_item3_text: "Her bildirim bir göreve veya bir uyarıya hizmet etmelidir. Çok karışık metin yazmayın.",
    creation_warning_notification_item4_title: "Metin kısa ve anlaşılır olmalıdır.",
    creation_warning_notification_item4_text: "Kısa, net ve herkes için aynı şekilde anlaşılır bir üslup kullanın.",
    creation_warning_leave_title: "İzin talebi gönderirken dikkat edilmesi gereken noktalar",
    creation_warning_leave_item1_title: "Tarih ve süreler doğru seçilmelidir.",
    creation_warning_leave_item1_text: "Başlangıç ve bitiş tarihi yanlış olmamalı, talep içeriği tam olarak bu döneme uygun olmalıdır.",
    creation_warning_leave_item2_title: "Neden resmi ve anlaşılır yazılmalıdır.",
    creation_warning_leave_item2_text: "Gereksiz duygusal ifadeler yerine kısa ve resmi bir açıklama girin.",
    creation_warning_leave_item3_title: "Gizli bilgi girilmemelidir.",
    creation_warning_leave_item3_text: "Pasaport, şifre, kişisel tıbbi ayrıntılar veya diğer hassas bilgileri yazmayın.",
    creation_warning_leave_item4_title: "Tekrarlayan talep gönderilmemelidir.",
    creation_warning_leave_item4_text: "Bu dönem için daha önce talep gönderildiyse, yenisini değil, mevcut olanı kontrol edin.",
    creation_warning_feature_title: "Özellik talebi gönderirken dikkat edilmesi gereken noktalar",
    creation_warning_feature_item1_title: "Talep net ve mantıklı olmalıdır.",
    creation_warning_feature_item1_text: "Fonksiyonun nasıl çalışacağını ve hangi sorunu çözeceğini açıklayın.",
    creation_warning_feature_item2_title: "Gizli bilgi girilmemelidir.",
    creation_warning_feature_item2_text: "Talep metnine şifre, giriş veya diğer gizli verileri yazmayın.",
    creation_warning_feature_item3_title: "Tekrarlayan talep gönderilmemelidir.",
    creation_warning_feature_item3_text: "Bu fonksiyon için daha önce talep gönderildiyse, yenisini değil, mevcut olanı destekleyin.",
    creation_warning_feature_item4_title: "Metin kısa ve anlaşılır olmalıdır.",
    creation_warning_feature_item4_text: "Kısa, net ve herkes için aynı derecede anlaşılır bir stil kullanın.",
    creation_warning_report_title: "Belge oluştururken dikkat edilmesi gereken noktalar",
    creation_warning_report_item1_title: "Başlık içeriğe uygun ve resmi olmalıdır.",
    creation_warning_report_item1_text: "Belge adı kısa, kesin ve daha sonra aramada bulunabilir şekilde yazılmalıdır.",
    creation_warning_report_item2_title: "İçerik kontrol edilmiş ve tutarlı olmalıdır.",
    creation_warning_report_item2_text: "Belgede yanlış rakamlar, eksik düşünceler veya doğrulanmamış bilgi kalmasın.",
    creation_warning_report_item3_title: "Gizli veya aşırı kişisel bilgi girilmemelidir.",
    creation_warning_report_item3_text: "Sadece iş sürecine ilişkin bilgileri yazın, açıklanmaması gereken bilgileri girmeyin.",
    creation_warning_report_item4_title: "Aynı belge tekrar oluşturulmamalıdır.",
    creation_warning_report_item4_text: "Bu konuda daha önce belge varsa, yenisini açmadan önce mevcut olanı kontrol edin.",
    creation_warning_confirm: "Anlaşıldı",
    confirm_reject_action: "Gerçekten reddetmek istiyor musunuz?",
    label_element: "Öğe",
    status_pending: "Beklemede",
    status_approved: "Onaylanan",
    status_rejected: "Reddedilen",
    status_draft: "Taslak",
    status_revision: "Revizyon",
    status_pending_l2: "Bekleyen L2",
    status_pending_l3: "Bekleyen L3",
    status_pending_l4: "Bekleyen L4",
    status_archived: "Arşivlendi",
    status_cancelled: "İptal edildi",
    profile_info_short: "Bilgi",
    calendar: "Takvim",
    menu_label: "Menü",
    connection_label: "Bağlantı",
    check_connection: "Bağlantıyı kontrol et",
    add_user_short: "Ekle",
    help_center_subtitle: "Teknik destek",
    enterprise_panel: "Kurumsal panel",
    login_status_ready: "Giriş için hazır.",
    register_status_enter_details: "Bilgilerinizi girin.",
    otp_delivery_hint: "Authenticator uygulamasındaki 6 haneli kodu girin.",
    login_qr_alt: "Giriş QR kodu",
    please_check_info: "Lütfen bilgileri kontrol edin.",
    err_api_not_found: "API bulunamadi. Lütfen backend sunucusunun {base} adresinde calistigini kontrol edin.",
    err_request_failed: "İstek basarisiz oldu ({status}).",
    err_role_dept_required: "Bu rol için departman seçilmelidir. Lütfen bir departman seçin.",
    err_unit_head_unit_required: "UNIT_HEAD rolü için birim seçilmelidir. Lütfen bir birim seçin.",
    err_dept_head_no_unit: "DEPT_HEAD rolü için birim seçilmemelidir. Lütfen birim alanini bos birakin.",
    err_director_no_dept_unit: "DIRECTOR rolü için departman ve birim atanmaz. Lütfen bos birakin.",
    err_unit_not_in_dept: "Seçilen birim seçilen departmana ait degil. Lütfen uyumlu bir birim seçin.",
    err_job_role_dept_required: "Mesleki rol atanirken departman seçilmelidir. Lütfen bir departman seçin.",
    err_level_requires_job_role: "Seviye atamak için önce mesleki rol seçilmelidir.",
    err_rating_range: "Degerlendirme 1 ile 5 arasinda olmalidir. Lütfen dogru degerlendirme seçin.",
    err_user_not_found: "Kullanici bulunamadi. Lütfen ID'yi kontrol edin.",
    err_cannot_delete_self: "Kendinizi silemezsiniz. Lütfen baska bir kullanici seçin.",
    otp_status_enter_code: "Authenticator kodunu girin.",
    preferences: "Tercihler",
    appearance_settings: "Görünüm ayarları",
    background_effect: "Animasyonlu arka plan",
    bg_none: "Yok",
    bg_particles: "Parçacık ağı",
    bg_matrix: "Matrix yağmuru",
    bg_lineart: "Çizgi sanatı",
    bg_glass: "Cam 3D şekiller",
    bg_retro: "Retro izometrik",
    bg_quantum: "Kuantum dalgaları",
    bg_cosmos: "Kozmos ve galaksi",
    system_logs: "Sistem günlükleri",
    system_logs_title: "Günlük dosyası toplama sistemi",
    download_logs: "İndir",
    clear_logs: "Temizle",
    col_time: "Zaman",
    col_level: "Seviye",
    col_message: "Mesaj",
    no_logs: "Günlük yok",
    appearance_copy: "HRMM'nin size nasıl görüneceğini seçin. Bir tema seçin - seçiminiz hemen uygulanır ve otomatik olarak kaydedilir.",
    theme_mode: "Tema modu",
    single_theme: "Tek tema",
    sync_with_system: "Sistemle eşitle",
    increase_contrast: "Kontrastı artır",
    increase_contrast_copy: "Daha kolay okuma için metin, kenarlık ve arka plan kontrastını artırır.",
    role_devops: "DevOps",
    role_it_engineer: "BT Mühendisi",
    role_android_dev: "Android Geliştirici",
    role_backend_dev: "Backend Geliştirici",
    role_frontend_dev: "Frontend Geliştirici",
    role_manager: "Yönetici",
    role_director: "Direktör",
    level_junior: "Junior",
    level_middle: "Middle",
    level_senior: "Senior",
    role_specialist: "Uzman",
    role_unit_head: "Birim Lideri",
    role_dept_head: "Bölüm Başkanı",
    leave_type_annual: "Yıllık",
    leave_type_sick: "Hastalık",
    leave_type_unpaid: "Ücretsiz",
    leave_type_maternity: "Doğum",
    leave_type_other: "Diğer",
    msg_2fa_setup_error: "2FA ayarlanırken hata oluştu.",
    msg_action_failed: "İşlem başarısız oldu.",
    msg_read_notification_error: "Bildirim okundu olarak işaretlenirken hata oluştu.",
    msg_otp_verify_error: "Doğrulama kodu doğrulanırken hata oluştu.",
    msg_feature_submitted: "Yeni özellik talebi gönderildi.",
    msg_notification_created: "Yeni bildirim oluşturuldu.",
    msg_record_create_error: "Yeni kayıt oluşturulurken hata oluştu.",
  },
};

Object.keys(newTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...(translations[languageCode] || {}),
    ...newTranslations[languageCode],
  };
});

const localizedRoleLabels = {
  uz: { SPECIALIST: "Mutaxassis", UNIT_HEAD: "Birlik rahbari", DEPT_HEAD: "Bo'lim rahbari", DIRECTOR: "Direktor" },
  ru: { SPECIALIST: "Специалист", UNIT_HEAD: "Руководитель группы", DEPT_HEAD: "Руководитель отдела", DIRECTOR: "Директор" },
  en: roleLabelMap,
  tr: { SPECIALIST: "Uzman", UNIT_HEAD: "Birim lideri", DEPT_HEAD: "Bolum baskani", DIRECTOR: "Direktor" },
};

const localizedJobRoleLabels = {
  uz: {
    DEVOPS: "DevOps",
    IT_ENGINEER: "IT muhandis",
    ANDROID_DEV: "Android dasturchi",
    BACKEND_DEV: "Backend dasturchi",
    FRONTEND_DEV: "Frontend dasturchi",
    MANAGER: "Menejer",
    DIRECTOR: "Direktor",
  },
  ru: {
    DEVOPS: "DevOps",
    IT_ENGINEER: "ИТ инженер",
    ANDROID_DEV: "Android разработчик",
    BACKEND_DEV: "Backend разработчик",
    FRONTEND_DEV: "Frontend разработчик",
    MANAGER: "Менеджер",
    DIRECTOR: "Директор",
  },
  en: jobRoleLabelMap,
  tr: {
    DEVOPS: "DevOps",
    IT_ENGINEER: "BT muhendisi",
    ANDROID_DEV: "Android gelistirici",
    BACKEND_DEV: "Backend gelistirici",
    FRONTEND_DEV: "Frontend gelistirici",
    MANAGER: "Yonetici",
    DIRECTOR: "Direktor",
  },
};

const localizedJobLevelLabels = {
  uz: { JUNIOR: "Junior", MIDDLE: "Middle", SENIOR: "Senior" },
  ru: { JUNIOR: "Junior", MIDDLE: "Middle", SENIOR: "Senior" },
  en: jobLevelLabelMap,
  tr: { JUNIOR: "Junior", MIDDLE: "Middle", SENIOR: "Senior" },
};

function t(key) {
  return translations[state.language]?.[key] || translations.uz[key] || key;
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

function getRoleLabel(role) {
  return localizedRoleLabels[state.language]?.[role] || roleLabelMap[role] || role || "-";
}

function getJobRoleLabel(jobRole) {
  return localizedJobRoleLabels[state.language]?.[jobRole] || jobRoleLabelMap[jobRole] || jobRole || "-";
}

function getJobLevelLabel(jobLevel) {
  return localizedJobLevelLabels[state.language]?.[jobLevel] || jobLevelLabelMap[jobLevel] || jobLevel || "-";
}

function setMessage(text, type = "") {
  const normalizedType = type || "info";

  if (text && (normalizedType === "error" || normalizedType === "success")) {
    appLog(normalizedType === "error" ? "error" : "info", text);
  }

  if (!loginView.classList.contains("hidden")) {
    const activeStatusBox = loginTwoFactorStep.classList.contains("hidden") ? loginStatusBox : otpStatusBox;
    if (activeStatusBox) {
      activeStatusBox.textContent = text;
      activeStatusBox.className = `login-status-box ${normalizedType}`.trim();
    }
  }

  const toast = document.createElement("div");
  toast.className = `message-box ${normalizedType}`.trim();
  toast.textContent = text;
  messageBox.prepend(toast);

  // Limit to 2 toasts at a time
  const toasts = messageBox.querySelectorAll(".message-box");
  if (toasts.length > 2) {
    for (let i = toasts.length - 1; i >= 2; i--) {
      const existingTimer = toastTimers.get(toasts[i]);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      toasts[i].remove();
    }
  }

  const removeToast = () => {
    if (!toast.isConnected) return;
    toast.classList.add("fade-out");
    window.setTimeout(() => {
      if (toast.isConnected) {
        toast.remove();
      }
    }, 220);
  };

  const timer = window.setTimeout(removeToast, 20000);
  toastTimers.set(toast, timer);

  toast?.addEventListener("click", () => {
    const existingTimer = toastTimers.get(toast);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    removeToast();
  });
}

function normalizeApiBaseUrl(rawValue) {
  let value = String(rawValue || "").trim();
  value = value.replace(/\/+$/, "");
  value = value.replace(/\/admin$/i, "");
  value = value.replace(/\/api\/v1$/i, "");
  return value;
}

function resetPendingLogin() {
  state.pendingChallengeToken = "";
  state.pendingEmailChallengeId = "";
  state.pendingLoginUser = null;
  state.pendingVerificationMethod = "";
  loginCredentialsStep.classList.remove("hidden");
  loginTwoFactorStep.classList.add("hidden");
  if (otpForm) otpForm.reset();
  if (loginStatusBox) {
    loginStatusBox.textContent = t("login_ready");
    loginStatusBox.className = "login-status-box";
  }
  if (otpStatusBox) {
    otpStatusBox.textContent = t("login_code_ready");
    otpStatusBox.className = "login-status-box";
  }
  if (loginVerificationEyebrow) {
    loginVerificationEyebrow.textContent = t("login_verification_eyebrow");
  }
  if (loginVerificationTitle) {
    loginVerificationTitle.textContent = t("login_verification_title");
  }
  if (otpDeliveryHint) {
    otpDeliveryHint.textContent = t("login_verification_hint");
  }
  if (loginQrSetupPanel) {
    loginQrSetupPanel.classList.add("hidden");
  }
  if (loginQrImage) {
    loginQrImage.removeAttribute("src");
  }
  if (loginSecretLabel) {
    loginSecretLabel.textContent = "-";
  }
}

function setAuthUi(isAuthenticated) {
  if (loginView) {
    loginView.classList.toggle("hidden", isAuthenticated);
  }
  if (appView) {
    appView.classList.toggle("hidden", !isAuthenticated);
  }
  if (bottomSectionNav) {
    bottomSectionNav.classList.toggle("hidden", !isAuthenticated);
  }
  
  // Hide all sections except homeSection and auditSection on initial login
  if (isAuthenticated) {
    document.querySelectorAll(".app-section").forEach((sec) => {
      if (sec.id === "homeSection" || sec.id === "auditSection" || sec.id === "archiveSection") {
        sec.classList.remove("hidden");
      } else {
        sec.classList.add("hidden");
      }
    });
  }
  
  // Re-apply translations when view changes to ensure both login and main views are synced
  applyTranslations();
}

function toggleProfileMenu(forceOpen) {
  if (!profileDropdown || !profileMenuButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : profileDropdown.classList.contains("hidden");
  profileDropdown.classList.toggle("hidden", !shouldOpen);
  profileMenuButton.setAttribute("aria-expanded", String(shouldOpen));
  // Rotate chevron
  const chevron = document.getElementById("profileMenuChevron");
  if (chevron) chevron.style.transform = shouldOpen ? "rotate(180deg)" : "rotate(0deg)";
}

function toggleCreateMenu(forceOpen) {
  if (!createMenuDropdown || !createMenuButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : createMenuDropdown.classList.contains("hidden");
  createMenuDropdown.classList.toggle("hidden", !shouldOpen);
  createMenuButton.setAttribute("aria-expanded", String(shouldOpen));
}

function toggleLanguageMenu(forceOpen) {
  if (!languageDropdown || !languageMenuButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : languageDropdown.classList.contains("hidden");
  languageDropdown.classList.toggle("hidden", !shouldOpen);
  languageMenuButton.setAttribute("aria-expanded", String(shouldOpen));
}

function toggleLoginLanguageMenu(forceOpen) {
  if (!loginLanguageDropdown || !loginLanguageButton) return;
  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : loginLanguageDropdown.classList.contains("hidden");
  loginLanguageDropdown.classList.toggle("hidden", !shouldOpen);
  loginLanguageButton.setAttribute("aria-expanded", String(shouldOpen));
}

function restoreModalSection() {
  if (!activeModalSection || !activeModalPlaceholder) return;
  activeModalPlaceholder.replaceWith(activeModalSection);
  if (activeModalWasHidden) {
    activeModalSection.classList.add("hidden");
  }
  activeModalSection.classList.remove("modal-section-active");
  activeModalSection = null;
  activeModalPlaceholder = null;
  activeModalWasHidden = false;
}

function closeSectionModal() {
  if (!sectionModal) return;
  restoreModalSection();
  sectionModal.classList.add("hidden");
  sectionModal.setAttribute("aria-hidden", "true");
}

function getQuickCreateConfig(mode) {
  return {
    notification: {
      title: t("quick_notification_title"),
      heading: t("quick_notification_heading"),
      placeholder: t("quick_notification_placeholder"),
    },
    feature: {
      title: t("quick_feature_title"),
      heading: t("quick_feature_heading"),
      placeholder: t("quick_feature_placeholder"),
    },
  }[mode] || {
    title: t("quick_create_default_heading"),
    heading: t("quick_create_default_heading"),
    placeholder: t("form_note_placeholder"),
  };
}

function openQuickCreate(mode) {
  if (!quickCreateModal) return;
  const config = getQuickCreateConfig(mode);

  quickCreateType.value = mode;
  quickCreateTitle.textContent = config.heading;
  quickCreateTitleInput.value = config.title;
  quickCreateMessageInput.value = "";
  quickCreateMessageInput.placeholder = config.placeholder;
  quickCreateModal.classList.remove("hidden");
  quickCreateModal.setAttribute("aria-hidden", "false");
}

function closeQuickCreate() {
  if (!quickCreateModal) return;
  quickCreateModal.classList.add("hidden");
  quickCreateModal.setAttribute("aria-hidden", "true");
}

function getCreationWarningConfig(type) {
  const prefix = type === "notification" ? "creation_warning_notification" : type === "leave" ? "creation_warning_leave" : type === "feature" ? "creation_warning_feature" : "creation_warning_report";
  return {
    title: t(`${prefix}_title`),
    items: [
      { title: t(`${prefix}_item1_title`), text: t(`${prefix}_item1_text`) },
      { title: t(`${prefix}_item2_title`), text: t(`${prefix}_item2_text`) },
      { title: t(`${prefix}_item3_title`), text: t(`${prefix}_item3_text`) },
      { title: t(`${prefix}_item4_title`), text: t(`${prefix}_item4_text`) },
    ],
  };
}

function resolveCreationWarning(decision) {
  if (typeof pendingCreationWarningResolver === "function") {
    pendingCreationWarningResolver(Boolean(decision));
    pendingCreationWarningResolver = null;
  }
}

function closeCreationWarning(decision = false) {
  if (!creationWarningModal) return;
  creationWarningModal.classList.add("hidden");
  creationWarningModal.setAttribute("aria-hidden", "true");
  resolveCreationWarning(decision);
}

function requestCreationWarning(type) {
  if (!creationWarningModal || !creationWarningList || !creationWarningTitle) {
    return Promise.resolve(true);
  }

  const config = getCreationWarningConfig(type);
  creationWarningTitle.textContent = config.title;
  creationWarningList.innerHTML = config.items
    .map(
      (item) => `
        <article class="creation-warning-card">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `
    )
    .join("");

  creationWarningModal.classList.remove("hidden");
  creationWarningModal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    pendingCreationWarningResolver = resolve;
  });
}

function updateCurrentLanguageLabel() {
  const label = languageNames[state.language] || languageNames.uz;
  if (currentLanguageLabel) {
    currentLanguageLabel.textContent = label;
  }
  if (loginCurrentLanguageLabel) {
    loginCurrentLanguageLabel.textContent = label;
  }
  const langTitle = `${t("language")}: ${label}`;
  languageMenuButton?.setAttribute("aria-label", langTitle);
  languageMenuButton?.setAttribute("title", langTitle);
  loginLanguageButton?.setAttribute("aria-label", langTitle);
  loginLanguageButton?.setAttribute("title", langTitle);
}

function setFieldText(form, fieldName, labelText, placeholderText) {
  const field = form?.querySelector(`[name="${fieldName}"]`);
  const wrapper = field?.closest("label");
  const label = wrapper?.querySelector("span");
  if (label && labelText) {
    label.textContent = labelText;
  }
  if (field && typeof placeholderText === "string" && "placeholder" in field) {
    field.placeholder = placeholderText;
  }
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  document.title = t("app_title");
  updateCurrentLanguageLabel();

  if (loginCardBadge) loginCardBadge.textContent = t("login_badge");
  if (loginLanguageLabel) loginLanguageLabel.textContent = t("language");
  if (loginHeroEyebrow) loginHeroEyebrow.textContent = t("login_hero_eyebrow");
  if (loginHeroTitle) loginHeroTitle.textContent = t("login_hero_title");
  if (loginHeroCopy) loginHeroCopy.textContent = t("login_hero_copy");
  if (loginFeatureOneTitle) loginFeatureOneTitle.textContent = t("login_feature_one_title");
  if (loginFeatureOneText) loginFeatureOneText.textContent = t("login_feature_one_text");
  if (loginFeatureTwoTitle) loginFeatureTwoTitle.textContent = t("login_feature_two_title");
  if (loginFeatureTwoText) loginFeatureTwoText.textContent = t("login_feature_two_text");
  if (loginFeatureThreeTitle) loginFeatureThreeTitle.textContent = t("login_feature_three_title");
  const loginFeatureThreeSpan = loginFeatureThreeTitle?.nextElementSibling;
  if (loginFeatureThreeSpan) loginFeatureThreeSpan.textContent = t("login_feature_three_text");
  if (loginAuthEyebrow) loginAuthEyebrow.textContent = t("login_auth_eyebrow");
  if (loginAuthTitle) loginAuthTitle.textContent = t("login_auth_title");
  if (loginUsernameLabel) loginUsernameLabel.textContent = t("login_username_label");
  if (loginUsernameInput) loginUsernameInput.placeholder = t("login_username_placeholder");
  if (loginPasswordLabel) loginPasswordLabel.textContent = t("login_password_label");
  if (loginPasswordInput) loginPasswordInput.placeholder = t("login_password_placeholder");
  
  // Registration form translations
  if (registerAuthEyebrow) registerAuthEyebrow.textContent = t("register_title");
  if (registerAuthTitle) registerAuthTitle.textContent = t("register_title");
  if (registerFullNameLabel) registerFullNameLabel.textContent = t("full_name");
  if (registerFullNameInput) registerFullNameInput.placeholder = t("full_name");
  if (registerUsernameLabel) registerUsernameLabel.textContent = t("username");
  if (registerUsernameInput) registerUsernameInput.placeholder = t("username");
  if (registerEmailLabel) registerEmailLabel.textContent = t("email");
  if (registerEmailInput) registerEmailInput.placeholder = t("email");
  if (registerPasswordLabel) registerPasswordLabel.textContent = t("password");
  if (registerPasswordInput) registerPasswordInput.placeholder = t("password");
  if (registerPasswordConfirmLabel) registerPasswordConfirmLabel.textContent = t("password_confirm");
  if (registerPasswordConfirmInput) registerPasswordConfirmInput.placeholder = t("password_confirm");
  if (registerSubmitButton) registerSubmitButton.textContent = t("register_button");
  if (showRegisterButton) showRegisterButton.textContent = t("register_button");
  if (showLoginButton) showLoginButton.textContent = t("login_badge");
  if (loginSwitchText) loginSwitchText.textContent = t("register_switch_text");
  if (registerSwitchText) registerSwitchText.textContent = t("login_switch_text");
  if (loginSubmitButton) loginSubmitButton.textContent = t("login_submit");
  if (loginFootnote) loginFootnote.textContent = t("login_footnote");
  if (loginManualKeyLabel) loginManualKeyLabel.textContent = t("login_manual_key");
  if (loginQrHint) loginQrHint.textContent = t("login_qr_hint");
  if (otpCodeLabel) otpCodeLabel.textContent = t("login_code_label");
  if (otpSubmitButton) otpSubmitButton.textContent = t("login_code_submit");
  if (backToLoginButton) backToLoginButton.textContent = t("login_back");
  if (registerStatusBox) registerStatusBox.textContent = t("register_status_enter_details");

  const showingOtpStep = !loginTwoFactorStep?.classList.contains("hidden");
  if (showingOtpStep) {
    if (loginVerificationEyebrow && state.pendingVerificationMethod !== "authenticator_setup") {
      loginVerificationEyebrow.textContent =
        state.pendingVerificationMethod === "email"
          ? t("login_email_verification_eyebrow")
          : t("login_verification_eyebrow");
    }
    if (loginVerificationTitle && state.pendingVerificationMethod !== "authenticator_setup") {
      loginVerificationTitle.textContent =
        state.pendingVerificationMethod === "email"
          ? t("login_email_verification_title")
          : t("login_verification_title");
    }
    if (otpDeliveryHint && state.pendingVerificationMethod !== "authenticator_setup") {
      otpDeliveryHint.textContent =
        state.pendingVerificationMethod === "email"
          ? `${state.pendingLoginUser?.email || "Email"}: ${t("login_email_verification_hint")}`
          : t("login_verification_hint");
    }
  } else {
    if (loginStatusBox) loginStatusBox.textContent = t("login_ready");
    if (loginVerificationEyebrow) loginVerificationEyebrow.textContent = t("login_verification_eyebrow");
    if (loginVerificationTitle) loginVerificationTitle.textContent = t("login_verification_title");
    if (otpDeliveryHint) otpDeliveryHint.textContent = t("login_verification_hint");
    if (otpStatusBox) otpStatusBox.textContent = t("login_code_ready");
  }

  const topbarProfileLabel = profileMenuButton?.querySelector("span");
  if (topbarProfileLabel) {
    topbarProfileLabel.textContent = t("profile");
  }
  if (topbarUserLabel && !state.currentUser?.full_name) {
    topbarUserLabel.textContent = t("guest");
  }
  if (languageMenuButton?.querySelector("#languageMenuLabel")) {
    languageMenuButton.querySelector("#languageMenuLabel").textContent = t("language");
  }
  if (refreshAllButton) refreshAllButton.setAttribute("aria-label", t("refresh"));
  if (createMenuButton?.querySelector("#createMenuLabel")) {
    createMenuButton.querySelector("#createMenuLabel").textContent = t("new");
  }
  if (document.getElementById("createReportItem")) document.getElementById("createReportItem").textContent = t("create_report_menu");
  if (document.getElementById("createNotificationItem")) document.getElementById("createNotificationItem").textContent = t("create_notification_menu");
  if (document.getElementById("createLeaveItem")) document.getElementById("createLeaveItem").textContent = t("create_leave_menu");
  if (document.getElementById("createFeatureItem")) document.getElementById("createFeatureItem").textContent = t("create_feature_menu");

  const navMap = {
    homeSection: "sidebar_home",
    notificationsSection: "sidebar_notifications",
    reportsSection: "sidebar_documents",
    leavesSection: "sidebar_leaves",
    usersSection: "sidebar_employees",
    institutionsSection: "sidebar_institutions",
  };
  navLinks.forEach((button) => {
    const label = button.querySelector(".nav-link-label");
    const key = navMap[button.dataset.target];
    if (label && key) label.textContent = t(key);
  });

  const searchShells = document.querySelectorAll(".topbar-searches .search-shell");
  const globalSearchLabel = searchShells[0]?.querySelector("span");
  const statusSearchLabel = searchShells[1]?.querySelector("span");
  if (globalSearchLabel) globalSearchLabel.textContent = t("search_global_label");
  if (globalSearchInput) globalSearchInput.placeholder = t("search_global_placeholder");
  if (statusSearchLabel) statusSearchLabel.textContent = t("search_status_label");
  if (globalStatusInput) globalStatusInput.placeholder = t("search_status_placeholder");

  const homeSection = document.getElementById("homeSection");
  const homeEyebrow = homeSection?.querySelector(".dashboard-home-header .eyebrow");
  const homeHeading = homeSection?.querySelector(".dashboard-home-header h2");
  const homeHeroCopy = homeSection?.querySelector(".dashboard-home-header .hero-copy");
  if (homeEyebrow) homeEyebrow.textContent = t("sidebar_home");
  if (homeHeading) homeHeading.innerHTML = `${escapeHtml(t("home_greeting"))}, <span id="dashboardWelcomeName">${escapeHtml(state.currentUser?.full_name || t("guest"))}</span>`;
  if (homeHeroCopy) homeHeroCopy.textContent = t("home_overview");
  if (authStateLabel) {
    authStateLabel.textContent = state.currentUser ? t("online") : t("offline");
  }

  // FIXED: Role management panel translations
  const roleManagementPanel = document.getElementById("roleManagementForm")?.closest(".panel");
  if (roleManagementPanel) {
    const roleEyebrow = roleManagementPanel.querySelector(".panel-heading .eyebrow");
    const roleHeading = roleManagementPanel.querySelector(".panel-heading h3");
    const refreshBtn = roleManagementPanel.querySelector("#refreshUsersForRoleManagement");
    const userLabel = roleManagementPanel.querySelector('label[for="roleManagementUserSelect"] span');
    const roleLabel = roleManagementPanel.querySelector('label[for="roleManagementRoleSelect"] span');
    const deptLabel = roleManagementPanel.querySelector('#roleManagementDeptLabel span');
    const unitLabel = roleManagementPanel.querySelector('#roleManagementUnitLabel span');
    const submitBtn = roleManagementPanel.querySelector('button[type="submit"]');
    if (roleEyebrow) roleEyebrow.textContent = t("role_management");
    if (roleHeading) roleHeading.textContent = t("role_change");
    if (refreshBtn) refreshBtn.textContent = t("refresh_users");
    if (userLabel) userLabel.textContent = t("select_user");
    if (roleLabel) roleLabel.textContent = t("new_role");
    if (deptLabel) deptLabel.textContent = t("department");
    if (unitLabel) unitLabel.textContent = t("unit");
    if (submitBtn) submitBtn.textContent = t("role_change");
    const usersListTitle = roleManagementPanel.querySelector(".feed-card h4");
    if (usersListTitle) usersListTitle.textContent = t("users_list");
  }

  const statCards = homeSection?.querySelectorAll(".dashboard-stat-card");
  if (statCards?.[0]) {
    statCards[0].querySelector(".dashboard-stat-head span")?.replaceChildren(document.createTextNode(t("new_requests")));
    statCards[0].querySelector('[data-activity-filter="requests"]')?.replaceChildren(document.createTextNode(t("current_request")));
  }
  if (statCards?.[1]) {
    statCards[1].querySelector(".dashboard-stat-head span")?.replaceChildren(document.createTextNode(t("my_reports")));
    statCards[1].querySelector('[data-activity-filter="reports"]')?.replaceChildren(document.createTextNode(t("reports_short")));
    statCards[1].querySelector('[data-activity-filter="all"]')?.replaceChildren(document.createTextNode(t("all")));
  }
  if (statCards?.[2]) {
    statCards[2].querySelector(".dashboard-stat-head span")?.replaceChildren(document.createTextNode(t("approval_status")));
    const badges = statCards[2].querySelectorAll(".dashboard-badge");
    if (badges[0]) badges[0].childNodes[0].textContent = `${t("feature_requests")}: `;
    if (badges[1]) badges[1].childNodes[0].textContent = `${t("resolved_requests")}: `;
    if (badges[2]) badges[2].childNodes[0].textContent = `${t("approved_reports")}: `;
    statCards[2].querySelector('[data-dashboard-filter="pending-all"]')?.replaceChildren(
      document.createTextNode(t("all_queue"))
    );
  }
  if (statCards?.[3]) {
    statCards[3].querySelector(".dashboard-stat-head span")?.replaceChildren(document.createTextNode(t("notifications")));
    statCards[3].querySelector('[data-notification-filter="pending"]')?.replaceChildren(
      document.createTextNode(t("notifications_pending"))
    );
    const badges = statCards[3].querySelectorAll(".dashboard-badge");
    if (badges[0]) badges[0].childNodes[0].textContent = `${t("notifications_approved")}: `;
  }

  if (meButton) {
    meButton.title = t("profile");
    meButton.setAttribute("aria-label", t("profile"));
  }
  if (logoutButton) {
    logoutButton.title = t("logout");
    logoutButton.setAttribute("aria-label", t("logout"));
  }
  if (sectionModalTitle && !activeModalSection) {
    sectionModalTitle.textContent = t("section_window");
  }
  const sectionModalEyebrow = document.querySelector("#sectionModal .section-modal-header .eyebrow");
  if (sectionModalEyebrow) sectionModalEyebrow.textContent = t("section_window");
  if (sectionModalClose) sectionModalClose.textContent = t("close");

  const reportPanel = document.getElementById("reportCreatePanel");
  if (reportPanel) {
    const eyebrow = reportPanel.querySelector(".eyebrow");
    const heading = reportPanel.querySelector(".panel-heading h3");
    const submitButton = reportPanel.querySelector('button[type="submit"]');
    if (eyebrow) eyebrow.textContent = t("reports_eyebrow");
    if (heading) heading.textContent = t("create_report_title");
    setFieldText(reportPanel, "title", t("report_title"), t("report_title_placeholder"));
    setFieldText(reportPanel, "summary", t("report_comment"), t("report_comment_placeholder"));
    setFieldText(reportPanel, "content", t("report_content"), t("report_content_placeholder"));
    setFieldText(reportPanel, "screenshot", t("report_image"));
    setFieldText(reportPanel, "department_id", t("report_department"));
    if (submitButton) submitButton.textContent = t("create_report_button");

    const helperLabels = reportPanel.querySelectorAll(".report-id-meta span, .inline-actions .ghost-btn");
    if (helperLabels[0]) helperLabels[0].textContent = t("latest_report_id");
    if (helperLabels[1]) helperLabels[1].textContent = t("copy_uuid");
    if (helperLabels[2]) helperLabels[2].textContent = t("apply_uuid_to_forms");
    if (latestReportIdLabel && !state.lastCreatedReportId) {
      latestReportIdLabel.textContent = t("not_created_yet");
    }
  }

  const quickCreateEyebrow = document.querySelector("#quickCreateModal .section-modal-header .eyebrow");
  if (quickCreateEyebrow) quickCreateEyebrow.textContent = t("quick_create_eyebrow");
  if (quickCreateClose) {
    quickCreateClose.textContent = t("close");
    quickCreateClose.setAttribute("aria-label", t("close"));
  }
  setFieldText(quickCreateForm, "title", t("form_title"), t("form_title_placeholder"));
  setFieldText(quickCreateForm, "message", t("form_note"), t("form_note_placeholder"));
  setFieldText(quickCreateForm, "screenshot", t("form_screenshot"));
  const quickCreateSubmit = quickCreateForm?.querySelector('button[type="submit"]');
  if (quickCreateSubmit) quickCreateSubmit.textContent = t("save");

  const quickConfig = getQuickCreateConfig(quickCreateType?.value || "notification");
  if (quickCreateTitle) quickCreateTitle.textContent = quickConfig.heading;
  if (quickCreateTitleInput && !quickCreateTitleInput.value) quickCreateTitleInput.placeholder = t("form_title_placeholder");
  if (quickCreateMessageInput) quickCreateMessageInput.placeholder = quickConfig.placeholder;

  renderDepartmentOptions();
  renderUsers();
  renderProfile();

  // Translate all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Translate placeholders for elements with data-translate-placeholder attribute
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (key && "placeholder" in el) {
      el.placeholder = t(key);
    }
  });

  // Translate titles for elements with data-translate-title attribute
  document.querySelectorAll('[data-translate-title]').forEach(el => {
    const key = el.getAttribute('data-translate-title');
    if (key) {
      el.title = t(key);
    }
  });

  // Translate alt text for elements with data-translate-alt attribute
  document.querySelectorAll('[data-translate-alt]').forEach(el => {
    const key = el.getAttribute('data-translate-alt');
    if (key && "alt" in el) {
      el.alt = t(key);
    }
  });

}

function applyRoleBasedUi() {
  const role = state.currentUser?.role || "";
  const navVisibility = {
    homeSection: true,
    notificationsSection: true,
    reportsSection: true,
    appearanceSection: true,
    institutionsSection: ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role),
  };

  navLinks.forEach((button) => {
    const isVisible = navVisibility[button.dataset.target] !== false;
    button.classList.toggle("hidden", !isVisible);
  });

  const usersSection = document.getElementById("usersSection");
  usersSection?.classList.toggle("hidden", role !== "DIRECTOR");
  createMenuItems.forEach((button) => {
    const action = button.dataset.createAction;
    // All roles can see all create menu items
    const allowed = true;
    button.classList.toggle("hidden", !allowed);
  });

  // Log collection system is visible only to admins, inside the Archive section.
  const isAdminRole = ["DIRECTOR", "ADMIN"].includes(role);
  const systemLogsPanel = document.getElementById("systemLogsPanel");
  systemLogsPanel?.classList.toggle("hidden", !isAdminRole);
  if (isAdminRole) renderSystemLogs();
}

function renderSystemLogs() {
  const tbody = document.getElementById("systemLogsTableBody");
  if (!tbody) return;
  const filter = document.getElementById("systemLogsLevelFilter")?.value || "";
  const rows = appLogEntries.filter((e) => !filter || e.level === filter).slice(-300).reverse();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state">${escapeHtml(t("no_logs"))}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((e) => {
      const time = new Date(e.ts).toLocaleString();
      const level = escapeHtml(e.level || "info");
      const msg =
        escapeHtml(e.message || "") +
        (e.meta ? ` <span class="log-meta">${escapeHtml(e.meta)}</span>` : "");
      return `<tr class="log-row log-${level}"><td>${escapeHtml(time)}</td><td><span class="log-badge log-badge-${level}">${level}</span></td><td>${msg}</td></tr>`;
    })
    .join("");
}

document.getElementById("systemLogsLevelFilter")?.addEventListener("change", renderSystemLogs);
document.getElementById("clearSystemLogs")?.addEventListener("click", () => {
  appLogEntries = [];
  persistAppLogs();
  renderSystemLogs();
});
document.getElementById("downloadSystemLogs")?.addEventListener("click", () => {
  const text = appLogEntries
    .map((e) => `[${e.ts}] ${String(e.level).toUpperCase()} ${e.message}${e.meta ? " | " + e.meta : ""}`)
    .join("\n");
  const blob = new Blob([text || "(no logs)"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hrmm-logs-${new Date().toISOString().slice(0, 10)}.log`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

function openSectionModal(targetId, titleText) {
  const target = document.getElementById(targetId);
  if (!target || !sectionModal || !sectionModalContent) return;

  restoreModalSection();

  activeModalWasHidden = target.classList.contains("hidden");
  activeModalPlaceholder = document.createElement("div");
  activeModalPlaceholder.className = "hidden";
  target.before(activeModalPlaceholder);
  activeModalSection = target;
  target.classList.remove("hidden");
  target.classList.add("modal-section-active");
  sectionModalContent.replaceChildren(target);
  if (sectionModalTitle) {
    sectionModalTitle.textContent = titleText || t("section_window");
  }
  sectionModal.classList.remove("hidden");
  sectionModal.setAttribute("aria-hidden", "false");
}

function openProfileDetailsModal() {
  openUserProfileModal(state.currentUser);
}

function openUserProfileModal(profile) {
  if (!sectionModal || !sectionModalContent) return;
  restoreModalSection();

  const selectedProfile = profile || {};
  const twoFactorText = selectedProfile?.two_factor_enabled ? t("active") : t("inactive");
  sectionModalContent.innerHTML = `
    <section class="profile-details-card">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">${escapeHtml(t("profile"))}</p>
          <h3>${escapeHtml(selectedProfile.full_name || t("guest"))}</h3>
        </div>
      </div>
      <div class="profile-details-grid">
        <article class="summary-card">
          <span>${escapeHtml(t("full_name"))}</span>
          <strong>${escapeHtml(selectedProfile.full_name || "-")}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("username"))}</span>
          <strong>${escapeHtml(selectedProfile.username || "-")}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("email"))}</span>
          <strong>${escapeHtml(selectedProfile.email || "-")}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("management_role"))}</span>
          <strong>${escapeHtml(getRoleLabel(selectedProfile.role))}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("department"))}</span>
          <strong>${escapeHtml(selectedProfile.department_name || t("department_unassigned"))}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("unit"))}</span>
          <strong>${escapeHtml(selectedProfile.unit_name || t("unit_unassigned"))}</strong>
        </article>
        <article class="summary-card">
          <span>${escapeHtml(t("two_factor_status"))}</span>
          <strong>${escapeHtml(twoFactorText)}</strong>
        </article>
      </div>
      <div class="profile-actions" style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
        <button type="button" class="ghost-btn" id="openSecuritySettingsBtn" title="${t("security_settings")}">
          <span style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            ${t("security_settings")}
          </span>
        </button>
      </div>
    </section>
  `;

  setTimeout(() => {
    document.getElementById("openSecuritySettingsBtn")?.addEventListener("click", openSecuritySettingsModal);
  }, 0);

  if (sectionModalTitle) {
    sectionModalTitle.textContent = t("profile");
  }
  sectionModal.classList.remove("hidden");
  sectionModal.setAttribute("aria-hidden", "false");
}

function openSecuritySettingsModal() {
  if (!sectionModal || !sectionModalContent) return;
  restoreModalSection();

  const twoFactorEnabled = state.currentUser?.two_factor_enabled || false;
  const twoFactorStatusText = twoFactorEnabled ? t("active") : t("inactive");
  const twoFactorButtonText = twoFactorEnabled ? t("disable_2fa") : t("create_qr");

  sectionModalContent.innerHTML = `
    <section class="security-settings-card">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">${t("section_security")}</p>
          <h3>${t("security_settings")}</h3>
        </div>
      </div>

      <div class="security-section">
        <h4>${t("change_password")}</h4>
        <form id="modalPasswordForm" class="form-grid">
          <label><span>${t("current_password")}</span><input name="current_password" type="password" required /></label>
          <label><span>${t("new_password")}</span><input name="new_password" type="password" required /></label>
          <button type="submit" class="ghost-btn">${t("update_password")}</button>
        </form>
      </div>

      <div class="security-divider"></div>

      <div class="security-section">
        <h4>${t("google_authenticator")} (2FA)</h4>
        <div class="two-factor-status-row">
          <span>${t("status")}</span>
          <strong class="pill role">${twoFactorStatusText}</strong>
        </div>
        <div class="inline-actions auth-actions" style="margin-top: 12px;">
          <button id="modalSetupTwoFactorButton" type="button" class="primary-btn">${twoFactorButtonText}</button>
        </div>
        <div id="modalTwoFactorSetupPanel" class="two-factor-setup hidden">
          <img id="modalTwoFactorQrImage" class="two-factor-qr" alt="${escapeHtml(t("login_qr_alt"))}" />
          <div class="mono-list">
            <span>${t("manual_key")}: <strong id="modalTwoFactorSecretLabel">-</strong></span>
          </div>
          <p class="session-footnote">
            ${t("qr_manual_hint")}
          </p>
          <form id="modalTwoFactorVerifyForm" class="form-grid compact-form">
            <label>
              <span>${t("six_digit_code")}</span>
              <input name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required />
            </label>
            <button type="submit" class="ghost-btn">${t("enable_2fa")}</button>
          </form>
        </div>
        <form id="modalTwoFactorDisableForm" class="form-grid compact-form ${twoFactorEnabled ? "" : "hidden"}">
          <label><span>${t("current_password")}</span><input name="current_password" type="password" required /></label>
          <label>
            <span>${t("authenticator_code")}</span>
            <input name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required />
          </label>
          <button type="submit" class="ghost-btn">${t("disable_2fa")}</button>
        </form>
      </div>
    </section>
  `;

  if (sectionModalTitle) {
    sectionModalTitle.textContent = t("security_settings");
  }
  sectionModal.classList.remove("hidden");
  sectionModal.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    bindSecurityModalEvents();
  }, 0);
}

function bindSecurityModalEvents() {
  const modalPasswordForm = document.getElementById("modalPasswordForm");
  const modalSetupTwoFactorButton = document.getElementById("modalSetupTwoFactorButton");
  const modalTwoFactorVerifyForm = document.getElementById("modalTwoFactorVerifyForm");
  const modalTwoFactorDisableForm = document.getElementById("modalTwoFactorDisableForm");

  modalPasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(modalPasswordForm);
    try {
      await apiRequest("/api/v1/users/change-password/", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          current_password: formData.get("current_password"),
          new_password: formData.get("new_password"),
        }),
      });
      modalPasswordForm.reset();
      setMessage(t("msg_password_updated"), "success");
    } catch (error) {
      setMessage(error.message || t("msg_password_update_error"), "error");
    }
  });

  modalSetupTwoFactorButton?.addEventListener("click", async () => {
    if (state.currentUser?.two_factor_enabled) {
      document.getElementById("modalTwoFactorDisableForm")?.classList.remove("hidden");
      return;
    }
    try {
      const result = await apiRequest("/api/v1/users/2fa/setup/", {
        method: "POST",
        headers: getHeaders(),
      });
      state.twoFactorSetup = result;
      const qrImage = document.getElementById("modalTwoFactorQrImage");
      const secretLabel = document.getElementById("modalTwoFactorSecretLabel");
      if (qrImage && result?.qr_code) qrImage.src = result.qr_code;
      if (secretLabel && result?.secret) secretLabel.textContent = result.secret;
      document.getElementById("modalTwoFactorSetupPanel")?.classList.remove("hidden");
    } catch (error) {
      setMessage(error.message || t("msg_2fa_setup_error"), "error");
    }
  });

  modalTwoFactorVerifyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(modalTwoFactorVerifyForm);
    try {
      await apiRequest("/api/v1/users/2fa/verify/", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          code: formData.get("code"),
          secret: state.twoFactorSetup?.secret,
        }),
      });
      state.currentUser.two_factor_enabled = true;
      setMessage(t("msg_2fa_enabled"), "success");
      openSecuritySettingsModal();
    } catch (error) {
      setMessage(error.message || t("msg_2fa_verify_error"), "error");
    }
  });

  modalTwoFactorDisableForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(modalTwoFactorDisableForm);
    try {
      await apiRequest("/api/v1/users/2fa/disable/", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          current_password: formData.get("current_password"),
          code: formData.get("code"),
        }),
      });
      state.currentUser.two_factor_enabled = false;
      setMessage(t("msg_2fa_disabled"), "success");
      openSecuritySettingsModal();
    } catch (error) {
      setMessage(error.message || t("msg_2fa_disable_error"), "error");
    }
  });
}

function openContentModal(title, eyebrow, innerHtml) {
  if (!sectionModal || !sectionModalContent) return;
  restoreModalSection();
  sectionModalContent.innerHTML = `
    <section class="detail-shell">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
      </div>
      ${innerHtml}
    </section>
  `;
  if (sectionModalTitle) sectionModalTitle.textContent = title;
  sectionModal.classList.remove("hidden");
  sectionModal.setAttribute("aria-hidden", "false");
}

function makeDetailItems(entries) {
  return `
    <div class="profile-details-grid">
      ${entries
        .map(
          ([label, value]) => `
            <article class="summary-card">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value ?? "-")}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function isDeptHeadOrDirector() {
  const role = state.currentUser?.role || "";
  return role === "DEPT_HEAD" || role === "DIRECTOR";
}

const ROLE_PENDING_REPORT_STATUS = {
  UNIT_HEAD: "PENDING_L2",
  DEPT_HEAD: "PENDING_L3",
  DIRECTOR: "PENDING_L4",
};

function isManagerRole() {
  const role = state.currentUser?.role || "";
  return ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role);
}

function isAdminOrDirector() {
  const role = state.currentUser?.role || "";
  return ["DIRECTOR", "ADMIN"].includes(role);
}

function getReportOwnerId(report) {
  return report?.created_by ?? report?.created_by_id ?? "";
}

function isReportPendingStatus(status) {
  return ["PENDING_L2", "PENDING_L3", "PENDING_L4"].includes(status || "");
}

function canManagerReviewReport(report) {
  if (!report || !state.currentUser?.id) return false;
  const role = state.currentUser.role;
  if (role === "DIRECTOR") {
    return isReportPendingStatus(report.status);
  }
  if (role === "DEPT_HEAD") {
    return ["PENDING_L2", "PENDING_L3"].includes(report.status || "");
  }
  if (role === "UNIT_HEAD") {
    return report.status === "PENDING_L2";
  }
  return report.status === ROLE_PENDING_REPORT_STATUS[role];
}

function canOwnerManageReport(report) {
  if (!report || !state.currentUser?.id) return false;
  return getReportOwnerId(report) === state.currentUser.id && ["DRAFT", "REVISION"].includes(report.status);
}

function canRateReport(report) {
  if (!report || !state.currentUser?.id) return false;
  return getReportOwnerId(report) === state.currentUser.id && report.status === "APPROVED";
}

function isNotificationAlertCopy(item) {
  return (
    item.reference_type === "REVIEWER_ALERT" ||
    (item.type === "APPROVAL" && String(item.title || "").startsWith("Yangi so'rov:"))
  );
}

function shouldShowNotificationInMainList(item) {
  if (isNotificationAlertCopy(item)) return false;
  if (isResultNotificationCopy(item)) return false;

  if (!REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) {
    return !item.is_read;
  }

  if (["APPROVED", "REJECTED"].includes(item.status || "")) {
    return false;
  }

  const isOwn =
    item.submitted_by === state.currentUser?.id ||
    (!item.submitted_by && item.user_id === state.currentUser?.id);

  if (isOwn) {
    return !item.status || item.status === "PENDING";
  }

  if (isDeptHeadOrDirector()) {
    return canManagerReviewNotification(item);
  }

  return true;
}

function getApprovedReviewNotifications() {
  return state.notifications.filter((item) => {
    if (isNotificationAlertCopy(item)) return false;
    if (!REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) return false;
    if (!["APPROVED", "REJECTED"].includes(item.status || "")) return false;
    if (isDeptHeadOrDirector()) return true;
    return (
      item.submitted_by === state.currentUser?.id ||
      (!item.submitted_by && item.user_id === state.currentUser?.id)
    );
  });
}

function canManagerReviewLeave(leave) {
  if (!isDeptHeadOrDirector() || !leave) return false;
  return leave.status === "PENDING";
}

const REVIEWABLE_NOTIFICATION_TYPES = new Set(["FEATURE_REQUEST", "USER_NOTIFICATION"]);

function isResultNotificationCopy(item) {
  if (item?.status === "PENDING" && REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) {
    return false;
  }
  const title = String(item?.title || "").toLowerCase();
  const message = String(item?.message || "").toLowerCase();
  return (
    (item?.type === "INFO" && ["APPROVED", "REJECTED"].includes(item?.status || "")) ||
    title.includes("approve qilindi") ||
    title.includes("rad etildi") ||
    message.includes("approve qilindi") ||
    message.includes("rad etildi")
  );
}

function isReviewableRequestNotification(item) {
  if (!item || isNotificationAlertCopy(item) || isResultNotificationCopy(item)) return false;
  if (!REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) return false;
  return item.status === "PENDING";
}

function canManagerReviewNotification(item) {
  if (!isDeptHeadOrDirector() || !item) return false;
  if (!isReviewableRequestNotification(item)) return false;
  return true;
}

function getPendingFeatureRequests() {
  return state.notifications.filter(
    (item) => item.reference_type === "FEATURE_REQUEST" && isReviewableRequestNotification(item)
  );
}

function getManagerPendingQueue() {
  const pendingLeaves = state.leaves.filter(
    (leave) => leave.status === "PENDING" && canManagerReviewLeave(leave)
  );
  const pendingReports = state.reports.filter((report) => canManagerReviewReport(report));
  const pendingNotifications = getPendingNotificationsForDashboard();
  return [
    ...pendingLeaves.map((item) => ({ ...item, _collectionType: "leave" })),
    ...pendingReports.map((item) => ({ ...item, _collectionType: "report" })),
    ...pendingNotifications.map((item) => ({ ...item, _collectionType: "notification" })),
  ];
}

function getDashboardPendingNotifications() {
  if (isManagerRole()) {
    return getPendingNotificationsForDashboard();
  }
  return state.notifications.filter((item) => {
    if (isNotificationAlertCopy(item) || isResultNotificationCopy(item)) return false;
    if (REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) {
      const isOwn =
        item.submitted_by === state.currentUser?.id ||
        (!item.submitted_by && item.user_id === state.currentUser?.id);
      return isOwn && item.status === "PENDING";
    }
    return !item.is_read;
  });
}

function getDashboardApprovedNotifications() {
  if (isManagerRole()) {
    return getApprovedReviewNotifications();
  }
  return state.notifications.filter((item) => {
    if (isNotificationAlertCopy(item)) return false;
    if (REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) {
      const isOwn =
        item.submitted_by === state.currentUser?.id ||
        (!item.submitted_by && item.user_id === state.currentUser?.id);
      return isOwn && ["APPROVED", "REJECTED"].includes(item.status || "");
    }
    return item.is_read;
  });
}

function getCollectionTypeLabel(itemType) {
  const labels = {
    leave: t("label_leave"),
    report: t("label_report"),
    notification: t("label_notification"),
  };
  return labels[itemType] || t("label_element");
}

function translateStatus(status) {
  if (!status) return "-";
  const keyMap = {
    PENDING: "status_pending",
    APPROVED: "status_approved",
    REJECTED: "status_rejected",
    DRAFT: "status_draft",
    REVISION: "status_revision",
    PENDING_L2: "status_pending_l2",
    PENDING_L3: "status_pending_l3",
    PENDING_L4: "status_pending_l4",
    ARCHIVED: "status_archived",
    CANCELLED: "status_cancelled",
  };
  const key = keyMap[String(status).toUpperCase()];
  return key ? t(key) : status;
}

function openEntityDetailModal(typeName, id) {
  if (typeName === "report") {
    const report = state.reports.find((item) => item.id === id);
    if (report) openReportDetailModal(report);
    return;
  }
  if (typeName === "leave") {
    const leave = state.leaves.find((item) => item.id === id);
    if (leave) openLeaveDetailModal(leave);
    return;
  }
  if (typeName === "notification") {
    const item = state.notifications.find((entry) => entry.id === id);
    if (item) openNotificationDetailModal(item);
  }
}

function makeReviewActionBar(itemType, itemId, options = {}) {
  const { showApprove = true, showReject = true, showRevision = false } = options;
  if (!isDeptHeadOrDirector()) return "";
  const buttons = [];
  if (showApprove) {
    buttons.push(
      `<button type="button" class="primary-btn small-btn review-action-btn" data-item-type="${itemType}" data-item-id="${itemId}" data-action="APPROVE">${escapeHtml(t("approve"))}</button>`
    );
  }
  if (showReject) {
    buttons.push(
      `<button type="button" class="ghost-btn small-btn review-action-btn" data-item-type="${itemType}" data-item-id="${itemId}" data-action="REJECT">${escapeHtml(t("reject"))}</button>`
    );
  }
  if (showRevision) {
    buttons.push(
      `<button type="button" class="ghost-btn small-btn review-action-btn" data-item-type="${itemType}" data-item-id="${itemId}" data-action="REQUEST_REVISION">${escapeHtml(t("request_revision"))}</button>`
    );
  }
  if (!buttons.length) return "";
  return `
    <div class="review-action-panel">
      <label class="field-label" for="inlineReviewComment">${escapeHtml(t("review_comment_placeholder"))}</label>
      <textarea id="inlineReviewComment" class="text-input" rows="2" placeholder="${escapeHtml(t("review_comment_placeholder"))}"></textarea>
      <div class="inline-actions">${buttons.join("")}</div>
    </div>
  `;
}

function bindReviewActionButtons(container) {
  const root = container || sectionModalContent;
  if (!root) return;
  root.querySelectorAll(".review-action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemType = button.dataset.itemType;
      const itemId = button.dataset.itemId;
      const action = button.dataset.action;
      const commentEl = root.querySelector("#inlineReviewComment");
      const comment = commentEl?.value?.trim() || "";
      try {
        if (itemType === "report") {
          if ((action === "REJECT" || action === "REQUEST_REVISION") && !comment) {
            setMessage(t("msg_comment_required_reject_revision"), "error");
            return;
          }
          await apiRequest(`/api/v1/reports/${itemId}/actions/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, comment }),
          });
          await Promise.all([
            loadReports(),
            loadAdminDashboard(),
            loadDashboard(),
            loadAuditLogs(),
            loadOperationsDashboard(),
            loadReviewHistory(),
          ]);
        } else if (itemType === "leave") {
          if (action === "REJECT" && !comment) {
            setMessage(t("msg_comment_required_reject"), "error");
            return;
          }
          await apiRequest(`/api/v1/leaves/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: comment }),
          });
          await Promise.all([
            loadLeaves(),
            loadAdminDashboard(),
            loadDashboard(),
            loadAuditLogs(),
            loadOperationsDashboard(),
            loadReviewHistory(),
          ]);
        } else if (itemType === "notification") {
          if (action === "REJECT" && !comment) {
            setMessage(t("msg_comment_required_reject"), "error");
            return;
          }
          const reviewPayload = await apiRequest(`/api/v1/notifications/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: comment }),
          });
          const reviewed = reviewPayload?.data;
          if (reviewed?.id) {
            const index = state.notifications.findIndex((entry) => entry.id === reviewed.id);
            if (index >= 0) state.notifications[index] = reviewed;
          }
          await Promise.all([
            loadNotifications(),
            loadAdminDashboard(),
            loadDashboard(),
            loadAuditLogs(),
            loadOperationsDashboard(),
            loadReviewHistory(),
          ]);
          refreshHomeDashboard();
        }
        sectionModal?.classList.add("hidden");
        sectionModal?.setAttribute("aria-hidden", "true");
        setMessage(t("msg_reviewed_success"), "success");
      } catch (error) {
        setMessage(error.message || t("msg_review_error"), "error");
      }
    });
  });
}

function makeReportDetailActionBar(report) {
  const parts = [];

  if (canOwnerManageReport(report)) {
    parts.push(`
      <div class="review-action-panel report-owner-panel">
        <div class="inline-actions">
          <button type="button" class="primary-btn small-btn report-detail-action-btn" data-report-id="${report.id}" data-action="SUBMIT">${escapeHtml(t("submit_report"))}</button>
          <button type="button" class="ghost-btn small-btn report-detail-action-btn" data-report-id="${report.id}" data-action="EDIT">${escapeHtml(t("edit_report"))}</button>
        </div>
        <div class="report-inline-edit hidden" id="reportInlineEditPanel">
          <label class="field-label" for="inlineReportTitle">${escapeHtml(t("report_title"))}</label>
          <input id="inlineReportTitle" class="text-input" type="text" value="${escapeHtml(report.title || "")}" />
          <label class="field-label" for="inlineReportSummary">${escapeHtml(t("report_comment"))}</label>
          <textarea id="inlineReportSummary" class="text-input" rows="3">${escapeHtml(report.summary || "")}</textarea>
          <div class="inline-actions">
            <button type="button" class="primary-btn small-btn report-detail-action-btn" data-report-id="${report.id}" data-action="SAVE_EDIT">${escapeHtml(t("save_changes"))}</button>
          </div>
        </div>
      </div>
    `);
  } else if (getReportOwnerId(report) === state.currentUser?.id && !isAdminOrDirector()) {
    if (report.status === "DRAFT") {
      parts.push(`<div class="feed-item muted-item">${escapeHtml(t("report_submit_hint"))}</div>`);
    } else if (isReportPendingStatus(report.status)) {
      parts.push(
        `<div class="feed-item muted-item">${t("report_pending_note").replace("{status}", escapeHtml(translateStatus(report.status)))}</div>`
      );
    }
  }

  if (canManagerReviewReport(report)) {
    parts.push(makeReviewActionBar("report", report.id, { showRevision: true }));
  } else if (isManagerRole() && !isAdminOrDirector() && isReportPendingStatus(report.status) && getReportOwnerId(report) === state.currentUser?.id) {
    parts.push(
      `<div class="feed-item muted-item">${t("cannot_self_approve_report")}</div>`
    );
  }

  if (canRateReport(report)) {
    parts.push(`
      <div class="review-action-panel">
        <button type="button" class="primary-btn small-btn report-detail-action-btn" data-report-id="${report.id}" data-action="RATE">${escapeHtml(t("review_check"))}</button>
      </div>
    `);
  }

  return parts.join("");
}

function bindReportDetailActionButtons(report) {
  const root = sectionModalContent;
  if (!root) return;

  root.querySelectorAll(".report-detail-action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const reportId = button.dataset.reportId;
      const action = button.dataset.action;
      const currentReport = state.reports.find((item) => item.id === reportId) || report;

      try {
        if (action === "EDIT") {
          root.querySelector("#reportInlineEditPanel")?.classList.remove("hidden");
          return;
        }

        if (action === "SAVE_EDIT") {
          const title = root.querySelector("#inlineReportTitle")?.value?.trim() || "";
          const summary = root.querySelector("#inlineReportSummary")?.value?.trim() || "";
          if (!title || !summary) {
            setMessage(t("msg_fill_title_summary"), "error");
            return;
          }
          await apiRequest(`/api/v1/reports/${reportId}/`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ title, summary }),
          });
          await loadReports();
          const updated = state.reports.find((item) => item.id === reportId);
          if (updated) openReportDetailModal(updated);
          setMessage(t("msg_report_updated"), "success");
          return;
        }

        if (action === "SUBMIT") {
          await apiRequest(`/api/v1/reports/${reportId}/actions/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action: "SUBMIT", comment: "" }),
          });
          await Promise.all([
            loadReports(),
            loadAdminDashboard(),
            loadDashboard(),
            loadAuditLogs(),
            loadOperationsDashboard(),
            loadReviewHistory(),
          ]);
          refreshHomeDashboard();
          const updated = state.reports.find((item) => item.id === reportId);
          sectionModal?.classList.add("hidden");
          sectionModal?.setAttribute("aria-hidden", "true");
          setMessage(t("msg_report_submitted"), "success");
          if (updated) {
            setTimeout(() => openReportDetailModal(updated), 300);
          }
          return;
        }

        if (action === "RATE") {
          openRatingModal(currentReport, "report", {
            id: state.currentUser?.id,
            name: state.currentUser?.full_name || state.currentUser?.username,
          });
        }
      } catch (error) {
        setMessage(error.message || t("msg_action_failed"), "error");
      }
    });
  });
}

function openReportDetailModal(report) {
  const actionBar = makeReportDetailActionBar(report);
  openContentModal(
    report.report_number || t("collection_title_reports"),
    t("collection_title_reports"),
    makeDetailItems([
      [t("report_title"), report.title],
      [t("report_comment"), report.summary],
      [t("report_content"), report.content || "-"],
      [t("report_department"), report.department_name || "-"],
      [t("management_role"), report.created_by_name || "-"],
      [t("status"), report.status || "-"],
      [t("level"), report.current_approval_level ? `L${report.current_approval_level}` : "-"],
      ["ID", report.id || "-"],
      [t("date_label"), formatDate(report.created_at)],
    ]) + actionBar
  );
  bindReviewActionButtons();
  bindReportDetailActionButtons(report);
}

function openLeaveDetailModal(leave) {
  const reviewBar = canManagerReviewLeave(leave) ? makeReviewActionBar("leave", leave.id) : "";
  const ownerNote =
    leave.requested_by === state.currentUser?.id && leave.status === "PENDING"
      ? `<div class="feed-item muted-item">${t("leave_pending_note")}</div>`
      : leave.requested_by === state.currentUser?.id && ["APPROVED", "REJECTED"].includes(leave.status || "")
        ? `<div class="feed-item muted-item">${t("leave_status_note").replace("{status}", escapeHtml(translateStatus(leave.status)))}</div>`
        : "";
  openContentModal(
    leave.requested_by_name || t("collection_title_requests"),
    t("collection_title_requests"),
    makeDetailItems([
      [t("full_name"), leave.requested_by_name || "-"],
      [t("leave_type"), leave.leave_type || "-"],
      [t("status"), leave.status || "-"],
      [t("start_date"), leave.start_date || "-"],
      [t("end_date"), leave.end_date || "-"],
      [t("days_label"), leave.total_days ?? "-"],
      [t("reviewer"), leave.reviewed_by_name || "-"],
      [t("reason"), leave.reason || "-"],
      ["ID", leave.leave_number || leave.id || "-"],
    ]) + ownerNote + reviewBar
  );
  bindReviewActionButtons();
}

function openNotificationDetailModal(item) {
  const hasAttachment = item.attachment_url || item.screenshot_url || item.file_url;
  const attachmentUrl = item.attachment_url || item.screenshot_url || item.file_url;
  let attachmentHtml = "";

  if (hasAttachment) {
    attachmentHtml = `
      <div class="attachment-preview">
        <img src="${attachmentUrl}" alt="${t("attachment")}" style="max-width:100%;max-height:200px;margin-top:10px;border-radius:4px;" />
        <div class="inline-actions">
          <button class="ghost-btn small-btn" onclick="window.open('${attachmentUrl}', '_blank')">${t("download")}</button>
        </div>
      </div>
    `;
  }

  const reviewBar = canManagerReviewNotification(item) ? makeReviewActionBar("notification", item.id) : "";
  const isOwnRequest =
    item.submitted_by === state.currentUser?.id ||
    (!item.submitted_by && item.user_id === state.currentUser?.id);
  const ownerNote =
    isOwnRequest && item.status === "PENDING"
      ? `<div class="feed-item muted-item">${t("notification_pending_note")}</div>`
      : "";
  const statusNote =
    !reviewBar && ["APPROVED", "REJECTED"].includes(item.status || "")
      ? `<div class="feed-item muted-item">${t("notification_reviewed_note").replace("{status}", escapeHtml(translateStatus(item.status)))}</div>`
      : "";

  openContentModal(
    item.title || t("collection_title_notifications"),
    t("collection_title_notifications"),
    makeDetailItems([
      [t("report_title"), item.title || "-"],
      [t("report_comment"), item.message || "-"],
      [t("type_label"), item.type || "-"],
      [t("status"), item.status || "-"],
      [t("full_name"), item.submitted_by_name || "-"],
      [t("read_label"), item.is_read ? t("active") : t("inactive")],
      ["ID", item.notification_number || item.id || "-"],
      [t("date_label"), formatDate(item.created_at)],
      [t("reference_label"), item.reference_type || "-"],
    ]) + attachmentHtml + ownerNote + statusNote + reviewBar
  );
  bindReviewActionButtons();
}

function openUsersByDepartmentModal(departmentName) {
  const users = state.users.filter((user) => {
    const department = state.departments.find((item) => item.id === user.department_id);
    return department?.name === departmentName;
  });
  openContentModal(
    `${departmentName} - ${t("collection_title_department_users")}`,
    t("collection_title_department_users"),
    users.length
      ? `<div class="detail-list">
          ${users
            .map(
              (user) => `
                <button type="button" class="detail-list-item user-profile-open-btn" data-user-id="${user.id}">
                  <strong>${escapeHtml(user.full_name || user.username)}</strong>
                  <span>${escapeHtml(getRoleLabel(user.role))}</span>
                  <small>${escapeHtml(getJobRoleLabel(user.job_role))}</small>
                </button>
              `
            )
            .join("")}
        </div>`
      : `<div class="feed-item muted-item">${escapeHtml(t("no_items_found"))}</div>`
  );

  document.querySelectorAll(".user-profile-open-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      const user = state.users.find((item) => item.id === button.dataset.userId);
      if (user) {
        const department = state.departments.find((item) => item.id === user.department_id);
        openUserProfileModal({
          ...user,
          department_name: department?.name || "-",
          unit_name: state.units.find((unit) => unit.id === user.unit_id)?.name || "-",
        });
      }
    });
  });
}

function resolveCollectionItemType(item, fallbackType) {
  return item._collectionType || item.item_type || fallbackType;
}

function openCollectionModal(title, items, type) {
  const hint = `<p class="collection-hint">${t("collection_edit_hint")}</p>`;
  const html = items.length
    ? `${hint}<div class="detail-list">
        ${items
          .map((item, index) => {
            const itemType = resolveCollectionItemType(item, type);
            const primary =
              itemType === "report"
                ? item.report_number || item.title
                : itemType === "leave"
                  ? item.requested_by_name || item.leave_type
                  : item.title || item.id || `${itemType} ${index + 1}`;
            const secondary =
              itemType === "report"
                ? item.title
                : itemType === "leave"
                  ? `${item.leave_type || "-"} / ${translateStatus(item.status) || "-"}`
                  : item.message;
            const meta =
              itemType === "report"
                ? `${item.created_by_name || item.created_by__full_name || "-"} / ${translateStatus(item.status) || "-"}`
                : itemType === "leave"
                  ? `${item.start_date || "-"} - ${item.end_date || "-"}`
                  : `${item.submitted_by_name || "-"} / ${translateStatus(item.status) || item.type || "-"} / ${formatDate(item.created_at)}`;
            return `
              <button type="button" class="detail-list-item entity-detail-open-btn" data-type="${itemType}" data-id="${item.id}">
                <span class="item-type-pill">${escapeHtml(getCollectionTypeLabel(itemType))}</span>
                <strong>${escapeHtml(primary || "-")}</strong>
                <span>${escapeHtml(secondary || "-")}</span>
                <small>${escapeHtml(meta || "-")}</small>
              </button>
            `;
          })
          .join("")}
      </div>`
    : `<div class="feed-item muted-item">${escapeHtml(t("no_items_found"))}</div>`;
  openContentModal(title, title, html);

  document.querySelectorAll(".entity-detail-open-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      openEntityDetailModal(button.dataset.type, button.dataset.id);
    });
  });
}

function hasFeedbackPermission() {
  const processedLeaves = state.leaves.some((leave) => ["APPROVED", "REJECTED"].includes(leave.status));
  const processedReports = state.reports.some((report) => ["APPROVED", "REJECTED", "ARCHIVED"].includes(report.status));
  const reviewedNotifications = state.notifications.some((item) => item.is_read);
  return processedLeaves || processedReports || reviewedNotifications;
}

function updateFeedbackAvailability() {
  const allowed = hasFeedbackPermission();
  const controls = feedbackForm?.querySelectorAll("button, textarea, input");
  controls?.forEach((control) => {
    if (control.type !== "hidden") {
      control.disabled = !allowed;
    }
  });
  if (!allowed && feedbackList && !feedbackList.querySelector(".feedback-lock-note")) {
    feedbackList.insertAdjacentHTML(
      "afterbegin",
      `<div class="feedback-item muted-item feedback-lock-note">${escapeHtml(t("feedback_locked"))}</div>`
    );
  }
  if (allowed) {
    feedbackList?.querySelector(".feedback-lock-note")?.remove();
  }
}

function bindDashboardDrilldowns() {
  const statCards = document.querySelectorAll("#homeSection .dashboard-stat-card");
  statCards[0]?.querySelector('[data-activity-filter="requests"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_requests"), getVisibleLeavesForDashboard(), "leave");
  });
  statCards[1]?.querySelector('[data-activity-filter="reports"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_reports"), getVisibleReportsForDashboard(), "report");
  });
  statCards[1]?.querySelector('[data-activity-filter="all"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_reports"), getVisibleReportsForDashboard(), "report");
  });
  statCards[2]?.querySelector('[data-dashboard-filter="resolved-leaves"]')?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_resolved_requests"),
      state.leaves.filter((leave) => ["APPROVED", "REJECTED"].includes(leave.status)),
      "leave"
    );
  });
  statCards[2]?.querySelector('[data-dashboard-filter="approved-reports"]')?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_approved_reports"),
      state.reports.filter((report) => report.status === "APPROVED"),
      "report"
    );
  });
  statCards[2]?.querySelector('[data-dashboard-filter="pending-features"]')?.addEventListener("click", () => {
    openCollectionModal(t("feature_requests"), getPendingFeatureRequests(), "notification");
  });
  statCards[2]?.querySelector('[data-dashboard-filter="pending-all"]')?.addEventListener("click", () => {
    openManagerPendingApprovalsModal();
  });
  statCards[2]?.querySelector(".dashboard-stat-head")?.addEventListener("click", () => {
    openManagerPendingApprovalsModal();
  });
  statCards[2]?.querySelector("strong")?.addEventListener("click", () => {
    openManagerPendingApprovalsModal();
  });

  const notificationsCard = statCards[3];
  notificationsCard?.querySelector('[data-notification-filter="pending"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_notifications"), getDashboardPendingNotifications(), "notification");
  });
  notificationsCard?.querySelector('[data-notification-filter="approved"]')?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_approved_notifications"),
      getDashboardApprovedNotifications(),
      "notification"
    );
  });
  notificationsCard?.querySelector("strong")?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_notifications"), getDashboardPendingNotifications(), "notification");
  });
  notificationsCard?.querySelector(".dashboard-stat-head")?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_notifications"), getDashboardPendingNotifications(), "notification");
  });
}

function getVisibleLeavesForDashboard() {
  const role = state.currentUser?.role || "";
  if (["DIRECTOR", "DEPT_HEAD"].includes(role)) {
    return state.leaves;
  }
  return state.leaves.filter((leave) => leave.requested_by === state.currentUser?.id);
}

function getVisibleReportsForDashboard() {
  const role = state.currentUser?.role || "";
  if (["DIRECTOR", "DEPT_HEAD"].includes(role)) {
    return state.reports;
  }
  return state.reports.filter((report) => report.created_by === state.currentUser?.id);
}

function openManagerPendingApprovalsModal() {
  const role = state.currentUser?.role || "";
  if (!["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role)) {
    return;
  }
  const combined = getManagerPendingQueue();
  if (!combined.length) {
    setMessage(t("no_pending_approval_items"), "warning");
    return;
  }
  openCollectionModal(t("approval_status"), combined, "mixed");
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

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadFeedbackEntries() {
  if (!state.accessToken) {
    state.feedbackEntries = [];
    renderFeedbackList();
    return;
  }
  try {
    const payload = await apiRequest("/api/v1/users/feedback/", { headers: getHeaders(false) });
    state.feedbackEntries = payload.data || [];
  } catch (_error) {
    state.feedbackEntries = [];
  }
  renderFeedbackList();
}

function setFeedbackRating(rating) {
  const numericRating = Number(rating || 0);
  if (feedbackRatingValue) feedbackRatingValue.value = String(numericRating);
  feedbackStars?.querySelectorAll(".star-btn").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.rating) <= numericRating);
  });
}

function renderFeedbackList() {
  if (!feedbackList) return;
  if (!state.feedbackEntries.length) {
    feedbackList.innerHTML = hasFeedbackPermission()
      ? `<div class="feedback-item muted-item">${t("no_comments_yet")}</div>`
      : `<div class="feedback-item muted-item feedback-lock-note">${escapeHtml(t("feedback_locked"))}</div>`;
    return;
  }

  feedbackList.innerHTML = state.feedbackEntries
    .slice()
    .reverse()
    .map(
      (entry) => `
        <article class="feedback-item">
          <div class="feedback-item-head">
            <strong>${entry.author_name || entry.author || t("user")}</strong>
            <span>${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}</span>
          </div>
          <p>${entry.comment}</p>
          <small>${formatDate(entry.created_at)}</small>
        </article>
      `
    )
    .join("");
  updateFeedbackAvailability();
}

function renderActivityFilters() {
  document.querySelectorAll("[data-activity-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.activityFilter === state.homeActivityFilter);
  });
}

function translateAuditDescription(description) {
  if (!description) return description;
  const replacements = {
    uz: {},
    ru: {
      "tizimga kirdi": "вошел в систему",
      "hisobot yaratdi": "создал отчет",
      "ariza yaratdi": "создал заявку",
      "tasdiqladi": "утвердил",
      "rad etdi": "отклонил",
      "parolni o'zgartirdi": "изменил пароль",
      "chiqdi": "вышел",
      "authenticator orqali": "через authenticator",
    },
    en: {
      "tizimga kirdi": "logged in",
      "hisobot yaratdi": "created a report",
      "ariza yaratdi": "created a request",
      "tasdiqladi": "approved",
      "rad etdi": "rejected",
      "parolni o'zgartirdi": "changed password",
      "chiqdi": "logged out",
      "authenticator orqali": "via authenticator",
    },
    tr: {
      "tizimga kirdi": "giriş yaptı",
      "hisobot yaratdi": "rapor oluşturdu",
      "ariza yaratdi": "talep oluşturdu",
      "tasdiqladi": "onayladı",
      "rad etdi": "reddetti",
      "parolni o'zgartirdi": "parola değiştirdi",
      "chiqdi": "çıktı",
      "authenticator orqali": "authenticator ile",
    },
  };
  const map = replacements[state.language] || {};
  let result = description;
  for (const [pattern, replacement] of Object.entries(map)) {
    result = result.split(pattern).join(replacement);
  }
  return result;
}

function formatAuditActivityTitle(log) {
  const actor = log.actor_name || t("user");
  const action = String(log.action || "").toUpperCase();
  const targetId = String(log.target_id || "").trim();
  const shortTargetId = targetId ? targetId.slice(0, 8) : "";
  const description = String(log.description || "").trim();

  if (description) return translateAuditDescription(description);
  if (action.includes("REPORT_CREATE")) return `${actor} ${shortTargetId} ${t("audit_report_created")}`.trim();
  if (action.includes("REPORT_UPDATE")) return `${actor} ${shortTargetId} ${t("audit_report_updated")}`.trim();
  if (action.includes("LEAVE") && action.includes("CREATE")) return `${actor} ${shortTargetId} ${t("audit_leave_created")}`.trim();
  if (action.includes("LEAVE") && action.includes("APPROVE")) return `${actor} ${shortTargetId} ${t("audit_leave_approved")}`.trim();
  if (action.includes("NOTIFICATION_CREATE")) return `${actor} ${t("audit_notification_created")}`;
  if (action) return `${actor} ${action.replace(/_/g, " ").toLowerCase()}`.trim();

  return `${actor} ${t("audit_action_performed")}`;
}

function buildActivityItems() {
  const reportItems = state.reports.map((report) => ({
    type: "reports",
    actor: report.created_by_name || t("user"),
    title: `${report.report_number || t("report")} ${report.created_by_name || t("user")} ${t("created_by_suffix")}`,
    meta: report.title || report.status || t("report"),
    time: report.created_at,
  }));

  const leaveItems = state.leaves.map((leave) => ({
    type: "requests",
    actor: leave.requested_by_name || t("user"),
    title: `#${leave.leave_number || leave.id?.slice(0, 8)} ${leave.requested_by_name || t("user")} ${t("leave_created_suffix")}`,
    meta: `${leave.leave_type || t("leave")} / ${translateStatus(leave.status) || t("status_no_data")}`,
    time: leave.created_at || leave.start_date,
  }));

  const auditItems = state.auditLogs.map((log) => ({
    type: /LEAVE|REQUEST/i.test(log.action || "") ? "requests" : "reports",
    actor: log.actor_name || t("system"),
    title: formatAuditActivityTitle(log),
    meta: log.action || log.target_type || t("audit"),
    time: log.created_at,
  }));

  return [...auditItems, ...reportItems, ...leaveItems]
    .filter((item) => state.homeActivityFilter === "all" || item.type === state.homeActivityFilter)
    .sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0))
    .slice(0, 18);
}

function renderActivityHistory() {
  if (!activityHistoryList) return;
  renderActivityFilters();
  const items = buildActivityItems();

  if (!items.length) {
    activityHistoryList.innerHTML = `<div class="feed-item muted-item">${t("no_activity_history")}</div>`;
    return;
  }

  activityHistoryList.innerHTML = items
    .map(
      (item) => `
        <article class="activity-item activity-item-${item.type}">
          <div class="activity-avatar">${String(item.actor || t("user"))
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((chunk) => chunk[0]?.toUpperCase() || "")
            .join("")}</div>
          <div class="activity-copy">
            <strong>${item.title}</strong>
            <span>${item.meta}</span>
          </div>
          <small>${formatDate(item.time)}</small>
        </article>
      `
    )
    .join("");
}

function getCombinedSearchNeedle() {
  return normalizeSearchValue(globalSearchInput?.value);
}

function getCombinedStatusNeedle() {
  return normalizeSearchValue(globalStatusInput?.value);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function applyReportIdToAllTools(reportId) {
  if (!isUuid(reportId)) return;
  const reportIdInputs = document.querySelectorAll(
    '#workflowForm input[name="report_id"], #attachmentForm input[name="report_id"], #reportToolsForm input[name="report_id"]'
  );
  reportIdInputs.forEach((input) => {
    input.value = reportId;
  });
}

function applyLeaveIdToReviewTool(leaveId) {
  if (!isUuid(leaveId)) return;
  const leaveIdInput = document.querySelector('#leaveReviewForm input[name="leave_id"]');
  if (leaveIdInput) leaveIdInput.value = leaveId;
}

function finalizeAuthenticatedSession(payload) {
  state.accessToken = payload.data.access;
  state.refreshToken = payload.data.refresh;
  state.currentUser = payload.data.user;
  if (authStateLabel) authStateLabel.textContent = t("online");
  authStateDot?.classList.remove("offline");
  authStateDot?.classList.add("online");
  if (currentUserLabel) {
    currentUserLabel.textContent = `${payload.data.user.full_name} (${payload.data.user.role})`;
  }
  loggedInAsLabel.textContent = payload.data.user.full_name || "-";

  // Update profile avatar with user initials
  const profileButtonAvatar = document.getElementById("profileButtonAvatar");
  const profileAvatarInitials = document.getElementById("profileAvatarInitials");
  const topbarUserLabel = document.getElementById("topbarUserLabel");

  if (payload.data.user.full_name) {
    const initials = payload.data.user.full_name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    if (profileButtonAvatar) profileButtonAvatar.textContent = initials;
    if (profileAvatarInitials) profileAvatarInitials.textContent = initials;
  }

  if (topbarUserLabel) {
    topbarUserLabel.textContent = payload.data.user.full_name || payload.data.user.username || t("guest");
  }

  resetPendingLogin();
  setAuthUi(true);
  applyRoleBasedUi();

  // Sync language with user preference
  if (payload.data.user.language && payload.data.user.language !== state.language) {
    state.language = payload.data.user.language;
    window.localStorage.setItem("hrmm_language", state.language);
    applyTranslations();
  }

  // Show welcome toast notification
  showWelcomeToast(payload.data.user.full_name || payload.data.user.username);
}

function showWelcomeToast(userName) {
  // Create welcome toast
  const toast = document.createElement("div");
  toast.className = "welcome-toast";
  toast.innerHTML = `
    <div class="welcome-toast-content">
      <span class="welcome-toast-icon">👋</span>
      <div class="welcome-toast-text">
        <strong>${escapeHtml(t("home_greeting"))}, ${escapeHtml(userName)}!</strong>
        <span>${escapeHtml(t("home_overview"))}</span>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function openVerificationStep(payload) {
  state.pendingLoginUser = payload.data.user || null;
  const hasQrSetupPayload = Boolean(payload.data?.qr_code_url || payload.data?.otpauth_url || payload.data?.secret);
  state.pendingVerificationMethod =
    payload.data.verification_method || (hasQrSetupPayload ? "authenticator_setup" : "authenticator");
  state.pendingEmailChallengeId = payload.data.challenge_id || "";
  state.pendingChallengeToken = payload.data.challenge_token || "";
  loginCredentialsStep.classList.add("hidden");
  loginTwoFactorStep.classList.remove("hidden");
  if (otpCodeInput) otpCodeInput.focus();
  if (state.pendingVerificationMethod === "authenticator_setup" || hasQrSetupPayload) {
    if (loginVerificationEyebrow) {
      loginVerificationEyebrow.textContent = t("login_qr_setup_eyebrow");
    }
    if (loginVerificationTitle) {
      loginVerificationTitle.textContent = t("login_qr_setup_title");
    }
    if (otpDeliveryHint) {
      otpDeliveryHint.textContent = t("login_qr_setup_hint");
    }
    if (loginQrImage) {
      loginQrImage.src = payload.data.qr_code_url || "";
      loginQrImage.alt = payload.data.otpauth_url || "Login QR code";
    }
    if (loginSecretLabel) {
      loginSecretLabel.textContent = payload.data.secret || "-";
    }
    if (loginQrSetupPanel) {
      loginQrSetupPanel.classList.remove("hidden");
    }
  } else {
    if (loginVerificationEyebrow) {
      loginVerificationEyebrow.textContent =
        state.pendingVerificationMethod === "email"
          ? t("login_email_verification_eyebrow")
          : t("login_verification_eyebrow");
    }
    if (loginVerificationTitle) {
      loginVerificationTitle.textContent =
        state.pendingVerificationMethod === "email"
          ? t("login_email_verification_title")
          : t("login_verification_title");
    }
    if (otpDeliveryHint) {
      otpDeliveryHint.textContent =
        state.pendingVerificationMethod === "email"
          ? `${payload.data.masked_email || "Email"}: ${t("login_email_verification_hint")}`
          : t("login_verification_hint");
    }
    if (loginQrSetupPanel) {
      loginQrSetupPanel.classList.add("hidden");
    }
  }
}

async function resolveAttachmentIdFromInput(rawValue) {
  const inputValue = String(rawValue || "").trim();
  if (!isUuid(inputValue)) {
    throw new Error(t("err_attachment_id_format"));
  }

  // If user pasted report UUID, auto-pick latest attachment from that report.
  try {
    const payload = await apiRequest(`/api/v1/reports/${inputValue}/attachments/`, {
      headers: getHeaders(false),
    });
    const attachments = payload.data || [];
    if (!attachments.length) {
      throw new Error(t("err_no_attachment_in_report"));
    }
    const latestAttachment = attachments
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    return {
      attachmentId: latestAttachment.id,
      fromReport: true,
      reportId: inputValue,
    };
  } catch (error) {
    return {
      attachmentId: inputValue,
      fromReport: false,
    };
  }
}

function makeEmptyRow(colspan, text, withIcon = false) {
  if (!withIcon) {
    return `<tr><td colspan="${colspan}" class="empty-state">${text}</td></tr>`;
  }
  return `<tr><td colspan="${colspan}" class="empty-state-cell">
    <div class="empty-state-content">
      <span class="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M9 15h6M9 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m9 17 2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span>${text}</span>
    </div>
  </td></tr>`;
}

function renderUserDepartmentOptions() {
  if (!userDepartmentSelect) return;
  const previousValue = userDepartmentSelect.value;
  userDepartmentSelect.innerHTML = `<option value="">${escapeHtml(t("select_department"))}</option>`;
  state.departments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = `${department.name} (${department.code})`;
    userDepartmentSelect.appendChild(option);
  });
  if (previousValue && state.departments.some((department) => department.id === previousValue)) {
    userDepartmentSelect.value = previousValue;
  }
  renderUserUnits();
}

function renderUserUnits() {
  if (!userUnitSelect || !userDepartmentSelect) return;
  userUnitSelect.innerHTML = `<option value="">${escapeHtml(t("unit"))} (${t("all")})</option>`;
  const selectedDepartmentId = userDepartmentSelect.value;
  if (!selectedDepartmentId) return;
  state.units
    .filter((unit) => unit.department_id === selectedDepartmentId)
    .forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = `${unit.name} (${unit.code})`;
      userUnitSelect.appendChild(option);
    });
}

function syncUserFormByRole() {
  if (!userForm) return;
  const role = userForm.querySelector('[name="role"]')?.value || "SPECIALIST";
  if (userDepartmentSelect) {
    userDepartmentSelect.required = role !== "DIRECTOR";
  }
  if (userUnitSelect) {
    userUnitSelect.required = role === "UNIT_HEAD";
    userUnitSelect.disabled = role === "DEPT_HEAD" || role === "DIRECTOR";
  }
}

function renderDepartmentOptions() {
  if (!reportDepartmentSelect) return;
  const previousDepartmentValue = departmentSelect?.value || "";
  renderUserDepartmentOptions();
  const itDepartments = state.departments.filter((department) => {
    const code = String(department.code || "").trim().toUpperCase();
    const name = String(department.name || "").trim().toUpperCase();
    return code === "IT" || name.includes("IT");
  });
  const userDepartments = itDepartments.length ? itDepartments : state.departments;

  if (departmentSelect) {
    departmentSelect.innerHTML = "";
  }
  reportDepartmentSelect.innerHTML = `<option value="">${t("report_department_default")}</option>`;

  if (!userDepartments.length) {
    if (departmentSelect) {
      departmentSelect.innerHTML = `<option value="">${t("no_departments_available")}</option>`;
    }
    reportDepartmentSelect.innerHTML = `<option value="">${t("no_departments")}</option>`;
    if (state.accessToken || state.currentUser) {
      setMessage(t("msg_departments_not_found"), "warning");
    }
    return;
  }

  if (departmentSelect) {
    userDepartments.forEach((department) => {
      const option = document.createElement("option");
      option.value = department.id;
      option.textContent = `${department.name} (${department.code})`;
      departmentSelect.appendChild(option);
    });
  }

  state.departments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = `${department.name} (${department.code})`;
    reportDepartmentSelect.appendChild(option);
  });

  if (departmentSelect) {
    const selectedDepartmentStillExists = userDepartments.some(
      (department) => department.id === previousDepartmentValue
    );
    departmentSelect.value = selectedDepartmentStillExists
      ? previousDepartmentValue
      : userDepartments[0].id;
  }
}

function renderUnits() {
  if (!unitSelect || !departmentSelect) return;
  unitSelect.innerHTML = `<option value="">${t("no_unit")}</option>`;
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
  const searchNeedle = normalizeSearchValue(userSearchInput?.value || getCombinedSearchNeedle());
  const statusNeedle = getCombinedStatusNeedle();
  const filteredUsers = state.users.filter((user) => {
    const haystack = [
      user.full_name,
      user.email,
      user.username,
      getJobRoleLabel(user.job_role),
      getJobLevelLabel(user.job_level),
    ]
      .join(" ")
      .toLowerCase();
    const statusText = `${user.is_active ? "active" : "inactive"} ${user.role || ""}`.toLowerCase();
    return (!searchNeedle || haystack.includes(searchNeedle)) && (!statusNeedle || statusText.includes(statusNeedle));
  });

  if (!filteredUsers.length) {
    usersTableBody.innerHTML = makeEmptyRow(6, t("no_employees_found"));
    return;
  }

  usersTableBody.innerHTML = filteredUsers
    .map((user) => {
      const department = state.departments.find((item) => item.id === user.department_id) || {};
      return `
        <tr>
          <td><div class="employee-cell"><strong>${user.full_name}</strong><span>${user.email}</span></div></td>
          <td><span class="pill role">${getRoleLabel(user.role)}</span></td>
          <td><span class="pill role">${getJobRoleLabel(user.job_role)}</span></td>
          <td><span class="pill level">${getJobLevelLabel(user.job_level)}</span></td>
          <td>${department.name || "-"}</td>
          <td><span class="pill status">${user.is_active ? t("active") : t("inactive")}</span></td>
        </tr>
      `;
    })
    .join("");

  renderActivityHistory();
}

function renderReports() {
  const searchNeedle = normalizeSearchValue(reportSearchInput?.value || getCombinedSearchNeedle());
  const statusNeedle = normalizeSearchValue(reportStatusFilter?.value || getCombinedStatusNeedle());
  const filteredReports = state.reports.filter((report) => {
    const haystack = [
      report.report_number,
      report.title,
      report.department_name,
      report.created_by_name,
      report.status,
    ]
      .join(" ")
      .toLowerCase();
    return (!searchNeedle || haystack.includes(searchNeedle)) && (!statusNeedle || haystack.includes(statusNeedle));
  });

  if (!filteredReports.length) {
    reportsTableBody.innerHTML = makeEmptyRow(6, t("no_reports_found"), true);
    return;
  }

  reportsTableBody.innerHTML = filteredReports
    .map(
      (report) => `
        <tr>
          <td>
            <div class="employee-cell">
              <strong>${report.report_number}</strong>
              <span>${report.title}</span>
              <small>ID: ${report.id}</small>
              <button class="ghost-btn small-btn use-report-id-btn" data-id="${report.id}" type="button">${t("use_report_id")}</button>
              <button class="ghost-btn small-btn report-detail-btn" data-id="${report.id}" type="button">${t("open_details")}</button>
            </div>
          </td>
          <td><span class="pill role">${translateStatus(report.status)}</span></td>
          <td><span class="pill level">L${report.current_approval_level || "-"}</span></td>
          <td>${report.department_name || "-"}</td>
          <td>${report.created_by_name || "-"}</td>
          <td>${formatDate(report.created_at)}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".use-report-id-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      applyReportIdToAllTools(button.dataset.id);
      setMessage(t("msg_report_id_applied_forms"), "success");
    });
  });
  document.querySelectorAll(".report-detail-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      const report = state.reports.find((item) => item.id === button.dataset.id);
      if (report) openReportDetailModal(report);
    });
  });

  renderActivityHistory();
  updateFeedbackAvailability();
}

function renderLeaves() {
  const searchNeedle = normalizeSearchValue(leaveSearchInput?.value || getCombinedSearchNeedle());
  const statusNeedle = normalizeSearchValue(leaveStatusFilter?.value || getCombinedStatusNeedle());
  const filteredLeaves = state.leaves.filter((leave) => {
    const haystack = [
      leave.requested_by_name,
      leave.leave_type,
      leave.status,
      leave.reviewed_by_name,
      leave.start_date,
      leave.end_date,
    ]
      .join(" ")
      .toLowerCase();
    return (!searchNeedle || haystack.includes(searchNeedle)) && (!statusNeedle || haystack.includes(statusNeedle));
  });

  if (!filteredLeaves.length) {
    leavesTableBody.innerHTML = makeEmptyRow(6, t("no_leaves_found"));
    return;
  }

  leavesTableBody.innerHTML = filteredLeaves
    .map(
      (leave) => `
        <tr>
          <td>
            <div class="employee-cell">
              <strong>${leave.requested_by_name || "-"}</strong>
              <small>ID: #${leave.leave_number || leave.id?.slice(0, 8)}</small>
              <button class="ghost-btn small-btn use-leave-id-btn" data-id="${leave.id}" type="button">${t("use_leave_id")}</button>
              <button class="ghost-btn small-btn leave-detail-btn" data-id="${leave.id}" type="button">${t("open_details")}</button>
            </div>
          </td>
          <td>${leave.leave_type}</td>
          <td>${leave.start_date} - ${leave.end_date}</td>
          <td>${leave.total_days}</td>
          <td><span class="pill status">${translateStatus(leave.status)}</span></td>
          <td>${leave.reviewed_by_name || "-"}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".use-leave-id-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      applyLeaveIdToReviewTool(button.dataset.id);
      setMessage(t("msg_leave_id_applied"), "success");
    });
  });
  document.querySelectorAll(".leave-detail-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      const leave = state.leaves.find((item) => item.id === button.dataset.id);
      if (leave) openLeaveDetailModal(leave);
    });
  });

  renderActivityHistory();
  updateFeedbackAvailability();
}

function renderAudit() {
  if (!state.auditLogs.length) {
    auditTableBody.innerHTML = makeEmptyRow(5, t("audit_logs_not_found"));
    renderActivityHistory();
    return;
  }

  auditTableBody.innerHTML = state.auditLogs
    .map(
      (log) => `
        <tr>
          <td>${log.action}</td>
          <td>${log.target_type}</td>
          <td>${formatAuditActivityTitle(log)}</td>
          <td>${log.actor_name || "-"}</td>
          <td>${formatDate(log.created_at)}</td>
        </tr>
      `
    )
    .join("");

  renderActivityHistory();
}

function renderArchiveLogs() {
  if (!archiveLogsTableBody) return;

  if (!state.archiveLogs.length) {
    archiveLogsTableBody.innerHTML =
      `<tr><td colspan="4" class="empty-state">${t("no_archive_logs_7days")}</td></tr>`;
    return;
  }

  archiveLogsTableBody.innerHTML = state.archiveLogs
    .map((log) => {
      const isSuccess = log.status === "success";
      const badgeClass = isSuccess ? "archive-badge archive-badge--success" : "archive-badge archive-badge--failed";
      const badgeLabel = isSuccess ? t("archive_ok") : t("archive_fail");
      return `
        <tr>
          <td>${formatDate(log.archived_at)}</td>
          <td>${log.record_count ?? 0}</td>
          <td>${log.file_size_kb ?? 0}</td>
          <td><span class="${badgeClass}">${badgeLabel}</span></td>
        </tr>
      `;
    })
    .join("");
}

async function loadArchiveLogs() {
  try {
    const payload = await apiRequest("/api/archive-logs/?page_size=50", {
      headers: getHeaders(false),
    });
    state.archiveLogs = payload.results || [];
  } catch (error) {
    state.archiveLogs = [];
    console.warn("Archive logs:", error.message);
  }
  renderArchiveLogs();
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
              <small>${translateStatus(item.status)} - ${item.created_by__full_name}</small>
            </div>
          `
        )
        .join("")
    : `<div class="feed-item muted-item">${t("no_recent_reports")}</div>`;

  recentLeavesList.innerHTML = recentLeaves.length
    ? recentLeaves
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.requested_by__full_name}</strong>
              <span>${item.leave_type}</span>
              <small>${translateStatus(item.status)} - ${item.start_date} / ${item.end_date}</small>
            </div>
          `
        )
        .join("")
    : `<div class="feed-item muted-item">${t("no_recent_leaves")}</div>`;
}

function renderProfile() {
  const profile = state.currentUser;
  const welcomeNameNode = document.getElementById("dashboardWelcomeName");
  if (topbarUserLabel) {
    topbarUserLabel.textContent = profile?.full_name || t("guest");
  }
  if (welcomeNameNode) {
    welcomeNameNode.textContent = profile?.full_name || t("guest");
  }
  if (profileRoleIcon) {
    const roleText = profile?.role ? getRoleLabel(profile.role) : t("role_generic");
    profileRoleIcon.title = `${t("profile")}: ${roleText}`;
    profileRoleIcon.setAttribute("aria-label", profileRoleIcon.title);
    profileRoleIcon.textContent = "";
  }
  if (profileDeptIcon) {
    const departmentText = profile?.department_name || t("department_unassigned");
    profileDeptIcon.title = `${t("sidebar_institutions")}: ${departmentText}`;
    profileDeptIcon.setAttribute("aria-label", profileDeptIcon.title);
    profileDeptIcon.textContent = "";
  }
  if (profileUnitIcon) {
    const unitText = profile?.unit_name || t("unit_unassigned");
    profileUnitIcon.title = `${t("employees_section")}: ${unitText}`;
    profileUnitIcon.setAttribute("aria-label", profileUnitIcon.title);
    profileUnitIcon.textContent = "";
  }
  // Avatar initials va ism yangilash
  try {
    const initials = (profile?.full_name || '??').split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join('');
    const avatarEl = document.getElementById('profileAvatarInitials');
    const nameEl = document.getElementById('profileFullName');
    const roleEl = document.getElementById('profileRoleBadge');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = profile?.full_name || '—';
    if (roleEl) roleEl.textContent = getRoleLabel(profile?.role) || '—';
  } catch (e) {
    // defensive: ignore if elements not present
  }
  if (apiBaseIcon) {
    apiBaseIcon.title = t("sync_system");
    apiBaseIcon.setAttribute("aria-label", apiBaseIcon.title);
  }
  applyRoleBasedUi();
  renderTwoFactorState();
}

function renderTwoFactorState() {
  const enabled = Boolean(state.currentUser?.two_factor_enabled);
  twoFactorStatusLabel.textContent = enabled ? t("active") : t("inactive");
  twoFactorStatusLabel.className = `pill ${enabled ? "level" : "role"}`;
  if (setupTwoFactorButton) {
    setupTwoFactorButton.textContent = enabled ? t("regenerate_qr") : t("create_qr");
  }
  if (twoFactorDisableForm) {
    twoFactorDisableForm.classList.toggle("hidden", !enabled);
    if (!enabled) twoFactorDisableForm.reset();
  }
  if (!state.twoFactorSetup && twoFactorSetupPanel) {
    twoFactorSetupPanel.classList.add("hidden");
  }
}

function renderTwoFactorSetup() {
  if (!state.twoFactorSetup) {
    twoFactorSetupPanel.classList.add("hidden");
    return;
  }

  twoFactorSecretLabel.textContent = state.twoFactorSetup.secret || "-";
  twoFactorQrImage.src = state.twoFactorSetup.qr_code_url || "";
  twoFactorQrImage.alt = state.twoFactorSetup.otpauth_url || "2FA QR code";
  twoFactorSetupPanel.classList.remove("hidden");
}

function renderNotifications() {
  const searchNeedle = normalizeSearchValue(notificationSearchInput?.value || getCombinedSearchNeedle());
  const readFilterValue = notificationReadFilter?.value || "";
  const filteredNotifications = state.notifications.filter((item) => {
    if (!shouldShowNotificationInMainList(item)) return false;
    const haystack = [item.title, item.message, item.type, item.status].join(" ").toLowerCase();
    const matchesSearch = !searchNeedle || haystack.includes(searchNeedle);
    const matchesRead =
      !readFilterValue ||
      (readFilterValue === "unread" && !item.is_read) ||
      (readFilterValue === "read" && item.is_read);
    return matchesSearch && matchesRead;
  });

  if (!filteredNotifications.length) {
    notificationsList.innerHTML = `<div class="feed-item muted-item">${escapeHtml(
      isDeptHeadOrDirector() ? t("no_pending_notifications") : t("no_notifications")
    )}</div>`;
    renderNotificationDashboardCard();
    renderActivityHistory();
    return;
  }

  notificationsList.innerHTML = filteredNotifications
    .map(
      (item) => {
        const hasAttachment = item.attachment_url || item.screenshot_url || item.file_url;
        const attachmentIcon = hasAttachment ? `<span class="attachment-indicator" title="${t("has_attachment")}">📎</span>` : "";
        const thumbnail = hasAttachment && isImageUrl(item.attachment_url || item.screenshot_url || item.file_url)
          ? `<img src="${item.attachment_url || item.screenshot_url || item.file_url}" class="notification-thumbnail" alt="${t("attachment")}" loading="lazy" />`
          : "";
        return `
        <div class="feed-item ${item.is_read ? "" : "unread-item"} ${hasAttachment ? "has-attachment" : ""}">
          ${thumbnail}
          <div class="feed-item">
          <div>
            <strong>#${item.notification_number || item.id?.slice(0, 8)} ${item.title}</strong>
            <span>${escapeHtml(item.message)}</span>
            <small>${item.type} / ${translateStatus(item.status) || "-"} / ${item.submitted_by_name || "-"} - ${formatDate(item.created_at)}</small>
          </div>
          <div class="inline-actions">
            <button class="ghost-btn small-btn mark-read-btn" data-id="${item.id}" type="button">${t("mark_as_read")}</button>
            <button class="primary-btn small-btn notification-detail-btn" data-id="${item.id}" type="button">${t("open_details")}</button>
          </div>
        </div>
      `;
      }
    )
    .join("");

  document.querySelectorAll(".mark-read-btn").forEach((button) => {
    button?.addEventListener("click", () => markNotificationRead(button.dataset.id));
  });
  document.querySelectorAll(".notification-detail-btn").forEach((button) => {
    button?.addEventListener("click", () => {
      const item = state.notifications.find((entry) => entry.id === button.dataset.id);
      if (item) openNotificationDetailModal(item);
    });
  });

  renderNotificationDashboardCard();
  renderActivityHistory();
  updateFeedbackAvailability();
}

function renderAdminDashboard() {
  const data = state.adminDashboard;
  adminEmployeesValue.textContent = String(data?.employees?.total_employees || 0);
  adminOnLeaveValue.textContent = String(data?.employees?.employees_on_leave || 0);
  adminActiveReportsValue.textContent = String(data?.employees?.active_reports || 0);

  const pending = data?.pending_approvals || [];
  // Store pending approvals in state for dashboard cards
  state.pendingApprovals = pending;

  adminPendingList.innerHTML = pending.length
    ? pending
        .map(
          (item) => `
            <div class="feed-item">
              <div class="feed-item-content">
                <strong>#${item.leave_number || item.report_number || item.id?.slice(0, 8)}</strong>
                <span>${item.title || item.reason || t("unknown")}</span>
                <small>${translateStatus(item.status)} - ${item.created_by__full_name || item.employee_name || '-'}</small>
              </div>
              <div class="feed-item-actions">
                <button type="button" class="ghost-btn small-btn admin-approve-btn" data-id="${item.id}" data-type="${item.item_type || 'report'}" data-action="APPROVE">${t("approve")}</button>
                <button type="button" class="ghost-btn small-btn admin-reject-btn" data-id="${item.id}" data-type="${item.item_type || 'report'}" data-action="REJECT">${t("reject")}</button>
              </div>
            </div>
          `
        )
        .join("")
    : `<div class="feed-item muted-item">${t("no_pending_approvals")}</div>`;

  document.querySelectorAll(".admin-approve-btn").forEach((button) => {
    button?.addEventListener("click", async () => {
      const itemId = button.dataset.id;
      const itemType = button.dataset.type;
      const action = button.dataset.action;
      
      try {
        if (itemType === 'leave') {
          await apiRequest(`/api/v1/leaves/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: t("admin_approved_comment") }),
          });
        } else if (itemType === 'notification') {
          await apiRequest(`/api/v1/notifications/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: t("admin_approved_comment") }),
          });
        } else {
          await apiRequest(`/api/v1/reports/${itemId}/actions/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, comment: t("admin_approved_comment") }),
          });
        }
        await Promise.all([
          loadReports(),
          loadLeaves(),
          loadNotifications(),
          loadAdminDashboard(),
          loadDashboard(),
          loadAuditLogs(),
          loadOperationsDashboard(),
          loadReviewHistory(),
        ]);
        refreshHomeDashboard();
        setMessage(t("msg_approved_success"), "success");
      } catch (error) {
        setMessage(error.message || t("msg_approve_error"), "error");
      }
    });
  });

  document.querySelectorAll(".admin-reject-btn").forEach((button) => {
    button?.addEventListener("click", async () => {
      const itemId = button.dataset.id;
      const itemType = button.dataset.type;
      const action = button.dataset.action;
      
      try {
        if (itemType === 'leave') {
          await apiRequest(`/api/v1/leaves/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: "Admin tomonidan rad etildi" }),
          });
        } else if (itemType === 'notification') {
          await apiRequest(`/api/v1/notifications/${itemId}/review/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, review_comment: "Admin tomonidan rad etildi" }),
          });
        } else {
          await apiRequest(`/api/v1/reports/${itemId}/actions/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action, comment: "Admin tomonidan rad etildi" }),
          });
        }
        await Promise.all([
          loadReports(),
          loadLeaves(),
          loadNotifications(),
          loadAdminDashboard(),
          loadDashboard(),
          loadAuditLogs(),
          loadOperationsDashboard(),
          loadReviewHistory(),
        ]);
        refreshHomeDashboard();
        setMessage(t("msg_rejected_success"), "success");
      } catch (error) {
        setMessage(error.message || t("msg_reject_error"), "error");
      }
    });
  });

  // Render pending items in dashboard cards
  renderPendingItemsInDashboard();
}

function renderPendingItemsInDashboard() {
  const role = state.currentUser?.role || "";
  const isManager = ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role);
  const userId = state.currentUser?.id;

  // For managers: use pending approvals from admin dashboard
  // For regular users: use their own leaves and reports
  let pendingLeaves = [];
  let pendingReports = [];

  if (isManager) {
    pendingLeaves = state.leaves.filter(
      (leave) => leave.status === "PENDING" && (leave.requested_by === userId || canManagerReviewLeave(leave))
    );
    pendingReports = state.reports.filter(
      (report) =>
        getReportOwnerId(report) === userId &&
        ["DRAFT", "REVISION", "PENDING_L2", "PENDING_L3", "PENDING_L4"].includes(report.status)
    );
  } else {
    pendingLeaves = state.leaves.filter(
      (leave) => leave.requested_by === userId && leave.status === "PENDING"
    );
    pendingReports = state.reports.filter(
      (report) =>
        report.created_by === userId &&
        ["DRAFT", "PENDING_L2", "PENDING_L3", "PENDING_L4", "REVISION"].includes(report.status)
    );
  }

  // Render pending leaves in "Yangi arizalar" card
  const pendingLeavesList = document.getElementById('pendingLeavesList');
  if (pendingLeavesList) {
    pendingLeavesList.innerHTML = pendingLeaves.length
      ? pendingLeaves.slice(0, 3).map(item => `
          <button type="button" class="dashboard-pending-item" data-id="${item.id}" data-type="leave">
            <span class="pending-title">${escapeHtml(item.reason || t("label_leave"))}</span>
            <span class="pending-meta">${translateStatus(item.status)} - ${isManager ? (item.requested_by_name || item.employee_name || "-") : t("your_leave")}</span>
          </button>
        `).join('')
      : `<div class="dashboard-pending-empty">${t("no_pending_leaves")}</div>`;

    // Add click handlers
    pendingLeavesList.querySelectorAll('.dashboard-pending-item').forEach(btn => {
      btn?.addEventListener('click', () => {
        const leave = state.leaves.find(l => l.id === btn.dataset.id);
        if (leave) openLeaveDetailModal(leave);
      });
    });
  }

  // Render pending reports in "Mening hisobotlarim" card
  const pendingReportsList = document.getElementById('pendingReportsDashboardList');
  if (pendingReportsList) {
    pendingReportsList.innerHTML = pendingReports.length
      ? pendingReports.slice(0, 3).map(item => `
          <button type="button" class="dashboard-pending-item" data-id="${item.id}" data-type="report">
            <span class="pending-title">${escapeHtml(item.title || item.report_number || t("label_report"))}</span>
            <span class="pending-meta">${translateStatus(item.status)} - ${isManager ? (item.created_by__full_name || '-') : t("your_report")}</span>
          </button>
        `).join('')
      : `<div class="dashboard-pending-empty">${t("no_pending_reports")}</div>`;

    // Add click handlers
    pendingReportsList.querySelectorAll('.dashboard-pending-item').forEach(btn => {
      btn?.addEventListener('click', () => {
        const report = state.reports.find(r => r.id === btn.dataset.id);
        if (report) openReportDetailModal(report);
      });
    });
  }

  if (pendingLeavesValue) {
    pendingLeavesValue.textContent = String(pendingLeaves.length);
  }
  const pendingNotifications = isManager ? getPendingNotificationsForDashboard() : [];
  const managerQueue = isManager ? getManagerPendingQueue() : [];

  if (pendingApprovalStatusValue) {
    pendingApprovalStatusValue.textContent = String(
      isManager ? managerQueue.length : pendingLeaves.length + pendingReports.length
    );
  }
  if (pendingReportsValue) {
    pendingReportsValue.textContent = String(pendingReports.length);
  }

  const pendingFeaturesValue = document.getElementById("pendingFeaturesValue");
  if (pendingFeaturesValue) {
    pendingFeaturesValue.textContent = String(getPendingFeatureRequests().length);
  }
  const homeApprovedReportsValue = document.getElementById("homeApprovedReportsValue");
  if (homeApprovedReportsValue) {
    homeApprovedReportsValue.textContent = String(
      state.reports.filter((report) => report.status === "APPROVED").length
    );
  }

  const pendingApprovalList = document.getElementById("pendingApprovalList");
  if (pendingApprovalList) {
    const queueItems = isManager ? managerQueue : [...pendingLeaves, ...pendingReports];
    pendingApprovalList.innerHTML = queueItems.length
      ? queueItems
          .slice(0, 3)
          .map((item) => {
            const itemType = item._collectionType || (item.report_number ? "report" : "leave");
            const title =
              itemType === "report"
                ? item.title || item.report_number
                : itemType === "notification"
                  ? item.title || t("label_notification")
                  : item.reason || t("label_leave");
            const meta =
              itemType === "notification"
                ? `${item.reference_type || "NOTIF"} / ${translateStatus(item.status) || t("pending")}`
                : `${translateStatus(item.status) || "-"} - ${item.requested_by_name || item.created_by__full_name || item.submitted_by_name || "-"}`;
            return `
              <button type="button" class="dashboard-pending-item" data-id="${item.id}" data-type="${itemType}">
                <span class="pending-title">${escapeHtml(title || "-")}</span>
                <span class="pending-meta">${escapeHtml(meta)}</span>
              </button>
            `;
          })
          .join("")
      : `<div class="dashboard-pending-empty">${t("no_pending_items")}</div>`;

    pendingApprovalList.querySelectorAll(".dashboard-pending-item").forEach((btn) => {
      btn?.addEventListener("click", () => openEntityDetailModal(btn.dataset.type, btn.dataset.id));
    });
  }

  renderNotificationDashboardCard();
  renderReviewShortcutPanel();
}

function renderNotificationDashboardCard() {
  const unread = state.notifications.filter((item) => !item.is_read && shouldShowNotificationInMainList(item)).length;
  const pendingItems = getDashboardPendingNotifications();
  const pendingReview = pendingItems.length;
  const approvedReview = getDashboardApprovedNotifications().length;
  if (unreadNotificationsValue) {
    unreadNotificationsValue.textContent = String(pendingReview);
  }
  if (pendingNotificationsBadgeCount) {
    pendingNotificationsBadgeCount.textContent = String(pendingReview);
  }
  if (unreadNotificationsBadgeCount) {
    unreadNotificationsBadgeCount.textContent = String(unread);
  }
  if (topbarNotificationBadge) {
    topbarNotificationBadge.textContent = unread > 99 ? "99+" : String(unread);
    topbarNotificationBadge.classList.toggle("hidden", unread === 0);
  }
  if (approvedNotificationsCount) {
    approvedNotificationsCount.textContent = String(approvedReview);
  }
  if (totalNotificationsCount) {
    totalNotificationsCount.textContent = String(state.notifications.length);
  }

  const pendingNotificationsDashboardList = document.getElementById("pendingNotificationsDashboardList");
  if (pendingNotificationsDashboardList) {
    pendingNotificationsDashboardList.innerHTML = pendingItems.length
      ? pendingItems
          .slice(0, 3)
          .map((item) => {
            const label =
              item.reference_type === "FEATURE_REQUEST" ? t("feature_request_label") : item.title || t("label_notification");
            return `
              <button type="button" class="dashboard-pending-item" data-id="${item.id}" data-type="notification">
                <span class="pending-title">${escapeHtml(label)}</span>
                <span class="pending-meta">${escapeHtml(translateStatus(item.status || t("pending")))} - ${escapeHtml(item.submitted_by_name || "-")}</span>
              </button>
            `;
          })
          .join("")
      : `<div class="dashboard-pending-empty">${t("no_pending_notifications")}</div>`;

    pendingNotificationsDashboardList.querySelectorAll(".dashboard-pending-item").forEach((btn) => {
      btn?.addEventListener("click", () => openEntityDetailModal("notification", btn.dataset.id));
    });
  }
}

function getPendingNotificationsForDashboard() {
  return state.notifications.filter((item) => canManagerReviewNotification(item));
}

function refreshHomeDashboard() {
  renderNotificationDashboardCard();
  renderPendingItemsInDashboard();
  renderReviewShortcutPanel();
}

function renderReviewShortcutPanel() {
  const role = state.currentUser?.role || "";
  const isManager = ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role);
  if (!reviewShortcutSection) return;

  reviewShortcutSection.classList.toggle("hidden", !isManager);
  if (!isManager) return;

  const approvedLeaves = state.leaves.length
    ? state.leaves.filter((leave) => leave.status === "APPROVED").length
    : Number(approvedLeavesValue?.textContent || 0);
  const notificationsCount = state.notifications.filter((item) => !item.is_read).length;
  const pendingLeavesCount = state.leaves.filter((leave) => leave.status === "PENDING").length;
  const pendingReportsCount = state.reports.filter((report) =>
    ["PENDING_L2", "PENDING_L3", "PENDING_L4"].includes(report.status)
  ).length;
  const pendingNotificationsCount = state.notifications.filter((item) => canManagerReviewNotification(item)).length;
  const pendingRequests = pendingLeavesCount + pendingReportsCount + pendingNotificationsCount;

  if (approvedLeavesShortcutValue) approvedLeavesShortcutValue.textContent = String(approvedLeaves);
  if (notificationsShortcutValue) notificationsShortcutValue.textContent = String(notificationsCount);
  if (pendingRequestsShortcutValue) pendingRequestsShortcutValue.textContent = String(pendingRequests);
}

function buildOperationsMetricCell(metric) {
  const total = metric?.total || 0;
  const pending = metric?.pending || 0;
  const approved = metric?.approved || 0;
  return `
    <div class="operations-metric-cell">
      <span class="operations-metric-total">${total}</span>
      <span class="status-pill status-pill--pending">${pending} ${t("pending_short")}</span>
      <span class="status-pill status-pill--approved">${approved} ${t("approved_short")}</span>
    </div>
  `;
}

function renderOperationsDistribution(container, departments, metricKey, pendingKey = "pending") {
  if (!container) return;
  const rows = departments
    .map((row) => ({
      department_name: row.department_name,
      count: row[metricKey]?.[pendingKey] || 0,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!rows.length) {
    container.innerHTML = `<div class="operations-dist-row muted-item">${t("no_data")}</div>`;
    return;
  }
  container.innerHTML = rows
    .map((row) => {
      const pct = total ? Math.round((row.count / total) * 100) : 0;
      return `
        <div class="operations-dist-row">
          <span>${escapeHtml(row.department_name)}</span>
          <strong>${row.count} <small>(${pct}%)</small></strong>
        </div>
      `;
    })
    .join("");
}

function getUserDepartmentId(userId) {
  if (!userId) return null;
  const user = state.users.find((entry) => entry.id === userId);
  return user?.department_id || null;
}

function buildOperationsFromState() {
  const departments = state.departments || [];
  const departmentRows = departments.map((department) => {
    const deptId = department.id;
    const deptLeaves = state.leaves.filter((item) => getUserDepartmentId(item.requested_by) === deptId);
    const deptReports = state.reports.filter((item) => item.department_id === deptId);
    const deptNotifications = state.notifications.filter((item) => {
      if (isNotificationAlertCopy(item)) return false;
      if (!REVIEWABLE_NOTIFICATION_TYPES.has(item.reference_type)) return false;
      const ownerDept = getUserDepartmentId(item.submitted_by || item.user_id);
      return ownerDept === deptId;
    });
    const deptFeatures = deptNotifications.filter((item) => item.reference_type === "FEATURE_REQUEST");
    const countByStatus = (items, pendingStatuses, approvedStatuses) => ({
      total: items.length,
      pending: items.filter((item) => pendingStatuses.includes(item.status || "")).length,
      approved: items.filter((item) => approvedStatuses.includes(item.status || "")).length,
    });
    return {
      department_id: deptId,
      department_name: department.name,
      department_code: department.code,
      leaves: countByStatus(deptLeaves, ["PENDING"], ["APPROVED"]),
      reports: countByStatus(deptReports, ["PENDING_L2", "PENDING_L3", "PENDING_L4"], ["APPROVED"]),
      notifications: countByStatus(deptNotifications, ["PENDING"], ["APPROVED", "REJECTED"]),
      feature_requests: countByStatus(deptFeatures, ["PENDING"], ["APPROVED", "REJECTED"]),
    };
  });

  const sumMetrics = (key) =>
    departmentRows.reduce(
      (acc, row) => {
        const metric = row[key];
        acc.total += metric.total;
        acc.pending += metric.pending;
        acc.approved += metric.approved;
        return acc;
      },
      { total: 0, pending: 0, approved: 0 }
    );

  return { overall: {
    leaves: sumMetrics("leaves"),
    reports: sumMetrics("reports"),
    notifications: sumMetrics("notifications"),
    feature_requests: sumMetrics("feature_requests"),
  }, departments: departmentRows };
}

function renderOperationsDashboard() {
  const data = state.operationsDashboard || buildOperationsFromState();
  const searchNeedle = normalizeSearchValue(document.getElementById("operationsDepartmentSearch")?.value || "");
  const overall = data.overall || {};
  const departments = (data.departments || []).filter((row) => {
    const haystack = [row.department_name, row.department_code].join(" ").toLowerCase();
    return !searchNeedle || haystack.includes(searchNeedle);
  });

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };

  setText("opsLeavesTotal", overall.leaves?.total || 0);
  setText("opsLeavesPending", overall.leaves?.pending || 0);
  setText("opsLeavesApproved", overall.leaves?.approved || 0);
  setText("opsNotificationsTotal", overall.notifications?.total || 0);
  setText("opsNotificationsPending", overall.notifications?.pending || 0);
  setText("opsNotificationsApproved", overall.notifications?.approved || 0);
  setText("opsFeaturesTotal", overall.feature_requests?.total || 0);
  setText("opsFeaturesPending", overall.feature_requests?.pending || 0);
  setText("opsFeaturesApproved", overall.feature_requests?.approved || 0);
  setText("opsReportsTotal", overall.reports?.total || 0);
  setText("opsReportsPending", overall.reports?.pending || 0);
  setText("opsReportsApproved", overall.reports?.approved || 0);

  const tableBody = document.getElementById("operationsDepartmentsTableBody");
  if (tableBody) {
    tableBody.innerHTML = departments.length
      ? departments
          .map((row) => {
            const pendingTotal =
              (row.leaves?.pending || 0) +
              (row.notifications?.pending || 0) +
              (row.feature_requests?.pending || 0) +
              (row.reports?.pending || 0);
            return `
              <tr>
                <td><span class="dept-name">${escapeHtml(row.department_name)}</span><br><small>${escapeHtml(row.department_code || "-")}</small></td>
                <td>${buildOperationsMetricCell(row.leaves)}</td>
                <td>${buildOperationsMetricCell(row.notifications)}</td>
                <td>${buildOperationsMetricCell(row.feature_requests)}</td>
                <td>${buildOperationsMetricCell(row.reports)}</td>
                <td><span class="status-pill status-pill--pending">${pendingTotal} ${t("pending_suffix")}</span></td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="6" class="empty-state">${t("no_department_data")}</td></tr>`;
  }

  renderOperationsDistribution(
    document.getElementById("operationsLeavesDistribution"),
    departments,
    "leaves"
  );
  renderOperationsDistribution(
    document.getElementById("operationsNotificationsDistribution"),
    departments,
    "notifications"
  );
  renderOperationsDistribution(
    document.getElementById("operationsFeaturesDistribution"),
    departments,
    "feature_requests"
  );
  renderOperationsDistribution(
    document.getElementById("operationsReportsDistribution"),
    departments,
    "reports"
  );
}

async function loadOperationsDashboard() {
  try {
    state.operationsDashboard = await apiRequest("/api/v1/dashboard/operations/", {
      headers: getHeaders(false),
    });
  } catch (error) {
    state.operationsDashboard = buildOperationsFromState();
    console.warn("Operations dashboard API failed, using local state:", error);
  }
  renderOperationsDashboard();
}

function renderAnalyticsDashboard() {
  const data = state.analyticsDashboard;
  analyticsTotalReportsValue.textContent = String(data?.overall?.total_reports || 0);
  analyticsApprovedReportsValue.textContent = String(data?.overall?.approved_reports || 0);
  analyticsArchivedReportsValue.textContent = String(data?.overall?.archived_reports || 0);

  const searchNeedle = normalizeSearchValue(departmentSearchInput?.value || getCombinedSearchNeedle());
  const statusNeedle = getCombinedStatusNeedle();
  const departments = (data?.department_comparison || []).filter((item) => {
    const haystack = [
      item.department_name,
      item.total_reports,
      item.approved_reports,
      item.pending_reports,
      item.rejected_reports,
    ]
      .join(" ")
      .toLowerCase();
    const statusText = `approved ${item.approved_reports} pending ${item.pending_reports} rejected ${item.rejected_reports}`.toLowerCase();
    return (!searchNeedle || haystack.includes(searchNeedle)) && (!statusNeedle || statusText.includes(statusNeedle));
  });
  analyticsDepartmentsList.innerHTML = departments.length
    ? departments
        .map(
          (item) => `
            <button type="button" class="feed-item feed-item-button analytics-department-btn" data-department-name="${escapeHtml(item.department_name)}">
              <strong>${item.department_name}</strong>
              <span>${t("total_reports_short")}: ${item.total_reports}</span>
              <small>${t("approved_reports_short")}: ${item.approved_reports}, ${t("pending_reports_short")}: ${item.pending_reports}, ${t("rejected_reports_short")}: ${item.rejected_reports}</small>
            </button>
          `
        )
        .join("")
    : `<div class="feed-item muted-item">${t("no_analytics_data")}</div>`;

  document.querySelectorAll(".analytics-department-btn").forEach((button) => {
    button?.addEventListener("click", () => openUsersByDepartmentModal(button.dataset.departmentName));
  });
}

function getReviewHistoryTypeLabel(itemType) {
  const labels = {
    report: t("label_report"),
    leave: t("label_leave"),
    notification: t("label_notification"),
    feature_request: t("label_feature_request"),
  };
  return labels[itemType] || t("label_request");
}

function getReviewHistoryActionLabel(action) {
  const labels = {
    APPROVE: t("approved_label"),
    REJECT: t("rejected_label"),
    REQUEST_REVISION: t("action_request_revision_label"),
    SUBMIT: t("action_submitted"),
    ARCHIVE: t("action_archived"),
    CANCEL: t("action_cancelled"),
  };
  return labels[action] || action || "-";
}

function buildReviewHistoryFromState() {
  const userId = state.currentUser?.id;
  if (!userId) return [];

  const entries = [];

  state.reports.forEach((report) => {
    (report.approval_history || []).forEach((item) => {
      if (item.approver_id === userId) {
        entries.push({
          item_type: "report",
          item_id: report.id,
          reference: report.report_number,
          title: report.title,
          action: item.action,
          previous_status: item.previous_status,
          new_status: item.new_status,
          comment: item.comment,
          subject_name: report.created_by_name || "-",
          created_at: item.created_at,
        });
      }
    });
  });

  state.leaves.forEach((leave) => {
    if (leave.reviewed_by === userId && leave.status !== "PENDING") {
      entries.push({
        item_type: "leave",
        item_id: leave.id,
        reference: leave.leave_number,
        title: leave.reason || leave.leave_type,
        action: leave.status === "APPROVED" ? "APPROVE" : leave.status,
        previous_status: "PENDING",
        new_status: leave.status,
        comment: leave.review_comment,
        subject_name: leave.requested_by_name || "-",
        created_at: leave.updated_at || leave.created_at,
      });
    }
  });

  state.notifications.forEach((item) => {
    if (
      item.reviewed_by === userId &&
      ["APPROVED", "REJECTED"].includes(item.status || "")
    ) {
      entries.push({
        item_type: item.reference_type === "FEATURE_REQUEST" ? "feature_request" : "notification",
        item_id: item.id,
        reference: item.notification_number,
        title: item.title,
        action: item.status === "APPROVED" ? "APPROVE" : "REJECT",
        previous_status: "PENDING",
        new_status: item.status,
        comment: item.review_comment,
        subject_name: item.submitted_by_name || "-",
        created_at: item.read_at || item.created_at,
      });
    }
  });

  return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function renderReviewHistory() {
  if (!reportHistoryList) return;

  const items = state.reviewHistory.length ? state.reviewHistory : state.reportHistory;
  const isLegacyReportOnly = !state.reviewHistory.length && state.reportHistory.length;

  if (!items.length) {
    reportHistoryList.innerHTML =
      `<div class="feed-item muted-item">${t("no_review_history")}</div>`;
    return;
  }

  reportHistoryList.innerHTML = items
    .map((item) => {
      if (isLegacyReportOnly) {
        return `
          <div class="feed-item">
            <strong>${escapeHtml(item.action)}</strong>
            <span>${escapeHtml(item.comment || t("no_comment"))}</span>
            <small>${escapeHtml(item.previous_status)} → ${escapeHtml(item.new_status)} — ${escapeHtml(item.approver_name || "-")} · ${formatDate(item.created_at)}</small>
          </div>
        `;
      }

      const typeLabel = getReviewHistoryTypeLabel(item.item_type);
      const actionLabel = getReviewHistoryActionLabel(item.action);
      const statusClass =
        item.new_status === "APPROVED" || item.action === "APPROVE"
          ? "status-pill--approved"
          : item.new_status === "REJECTED" || item.action === "REJECT"
            ? "status-pill--pending"
            : "status-pill--pending";

      return `
        <button type="button" class="feed-item review-history-item" data-history-type="${escapeHtml(item.item_type)}" data-history-id="${escapeHtml(item.item_id)}">
          <span class="item-type-pill">${escapeHtml(typeLabel)}</span>
          <strong>${escapeHtml(item.reference || "")} — ${escapeHtml(item.title || "-")}</strong>
          <span>${escapeHtml(actionLabel)} · ${escapeHtml(item.subject_name || "-")}</span>
          <span class="status-pill ${statusClass}">${escapeHtml(item.previous_status || "")} → ${escapeHtml(item.new_status || "")}</span>
          ${item.comment ? `<span class="review-history-comment">${escapeHtml(item.comment)}</span>` : ""}
          <small>${formatDate(item.created_at)}</small>
        </button>
      `;
    })
    .join("");

  reportHistoryList.querySelectorAll(".review-history-item").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.historyType;
      const id = button.dataset.historyId;
      openEntityDetailModal(
        type === "feature_request" ? "notification" : type === "leave" ? "leave" : type === "report" ? "report" : "notification",
        id
      );
    });
  });
}

function renderReportHistory() {
  renderReviewHistory();
}

async function loadReviewHistory() {
  try {
    const payload = await apiRequest("/api/v1/dashboard/review-history/", {
      headers: getHeaders(false),
    });
    state.reviewHistory = payload.results || [];
  } catch (error) {
    state.reviewHistory = buildReviewHistoryFromState();
    if (!state.reviewHistory.length) {
      console.warn("Review history:", error.message);
    }
  }
  renderReviewHistory();
}

function renderLeaveCalendar() {
  leaveCalendarList.innerHTML = state.leaveCalendar.length
    ? state.leaveCalendar
        .map(
          (item) => `
            <div class="feed-item">
              <strong>${item.requested_by__full_name}</strong>
              <span>${item.leave_type} - ${item.total_days} ${t("days")}</span>
              <small>${item.start_date} / ${item.end_date} - ${item.requested_by__department_id__name || "-"}</small>
            </div>
          `
        )
        .join("")
    : `<div class="feed-item muted-item">${t("no_approved_leaves_calendar")}</div>`;
}

async function loadDepartments() {
  const payload = await apiRequest("/api/v1/departments/", { headers: getHeaders(true) });
  state.departments = payload.results || [];
  renderDepartmentOptions();
  return state.departments.length;
}

async function loadUnits() {
  const payload = await apiRequest("/api/v1/units/", { headers: getHeaders(true) });
  state.units = payload.results || [];
  renderUnits();
}

async function loadUsers() {
  const params = new URLSearchParams();
  if (roleFilter.value) params.set("job_role", roleFilter.value);
  if (levelFilter.value) params.set("job_level", levelFilter.value);

  const query = params.toString() ? `?${params.toString()}` : "";
  const payload = await apiRequest(`/api/v1/users/${query}`, { headers: getHeaders(true) });
  state.users = payload.results || [];
  renderUsers();
}

async function loadUsersForRoleManagement() {
  try {
    const payload = await apiRequest("/api/v1/users/", { headers: getHeaders(true) });
    const users = payload.results || [];
    
    // Populate user select dropdown
    roleManagementUserSelect.innerHTML = `<option value="">${t("select_user")}...</option>`;
    users.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.full_name} (${user.username}) - ${getRoleLabel(user.role)}`;
      roleManagementUserSelect.appendChild(option);
    });

    // Render user list
    roleManagementUserList.innerHTML = users.length
      ? users
          .map(
            (user) => `
              <div class="feed-item">
                <div class="feed-item-content">
                  <strong>${escapeHtml(user.full_name)}</strong>
                  <span>@${escapeHtml(user.username)}</span>
                  <small>${t("current_role")}: ${getRoleLabel(user.role)}</small>
                </div>
              </div>
            `
          )
          .join("")
      : `<div class="feed-item muted-item">${t("no_items_found")}</div>`;
  } catch (error) {
    console.error("Foydalanuvchilarni yuklashda xato:", error);
    setMessage(t("generic_error"), "error");
  }
}

// FIXED: Populate department/unit dropdowns for role management form
function populateRoleManagementDepartments() {
  if (!roleManagementDeptSelect) return;
  roleManagementDeptSelect.innerHTML = `<option value="">${t("select_department")}...</option>`;
  if (!state.departments.length) {
    roleManagementDeptSelect.innerHTML = `<option value="">${t("no_departments")}</option>`;
    return;
  }
  state.departments.forEach((dept) => {
    const option = document.createElement("option");
    option.value = dept.id;
    option.textContent = `${dept.name} (${dept.code})`;
    roleManagementDeptSelect.appendChild(option);
  });
}

function populateRoleManagementUnits() {
  if (!roleManagementUnitSelect) return;
  roleManagementUnitSelect.innerHTML = `<option value="">${t("select_unit")}...</option>`;
  const selectedDeptId = roleManagementDeptSelect?.value;
  if (!selectedDeptId) {
    const allUnits = state.units || [];
    allUnits.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = `${unit.name} (${unit.code || "N/A"})`;
      roleManagementUnitSelect.appendChild(option);
    });
    return;
  }
  const filteredUnits = (state.units || []).filter((unit) => {
    const unitDeptId = typeof unit.department_id === "object" ? unit.department_id?.id : unit.department_id;
    return String(unitDeptId) === String(selectedDeptId);
  });
  if (!filteredUnits.length) {
    roleManagementUnitSelect.innerHTML = `<option value="">${t("select_unit")}</option>`;
    return;
  }
  filteredUnits.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit.id;
    option.textContent = `${unit.name} (${unit.code || "N/A"})`;
    roleManagementUnitSelect.appendChild(option);
  });
}

// FIXED: Show/hide department/unit selectors based on selected role
function syncRoleManagementForm() {
  const selectedRole = roleManagementRoleSelect?.value || "";
  const needsDepartment = ["UNIT_HEAD", "DEPT_HEAD"].includes(selectedRole);
  const needsUnit = selectedRole === "UNIT_HEAD";

  roleManagementDeptLabel?.classList.toggle("hidden", !needsDepartment);
  roleManagementUnitLabel?.classList.toggle("hidden", !needsUnit);

  if (needsDepartment && roleManagementDeptSelect?.options.length <= 1) {
    populateRoleManagementDepartments();
  }
  if (needsUnit && roleManagementUnitSelect?.options.length <= 1) {
    populateRoleManagementUnits();
  }

  // Make fields required when visible
  if (roleManagementDeptSelect) roleManagementDeptSelect.required = needsDepartment;
  if (roleManagementUnitSelect) roleManagementUnitSelect.required = needsUnit;
}

async function fetchAllPaginatedResults(path, params = new URLSearchParams()) {
  params.set("page_size", "100");
  let page = 1;
  let totalPages = 1;
  const results = [];
  do {
    params.set("page", String(page));
    const query = params.toString();
    const payload = await apiRequest(`${path}?${query}`, { headers: getHeaders(true) });
    results.push(...(payload.results || []));
    totalPages = payload.total_pages || 1;
    page += 1;
  } while (page <= totalPages);
  return results;
}

function shouldLoadFullLists() {
  const role = state.currentUser?.role || "";
  return ["DIRECTOR", "DEPT_HEAD"].includes(role);
}

async function loadReports() {
  const params = new URLSearchParams();
  if (reportStatusFilter?.value) params.set("status", reportStatusFilter.value);

  state.reports = shouldLoadFullLists()
    ? await fetchAllPaginatedResults("/api/v1/reports/", params)
    : (await apiRequest(`/api/v1/reports/${params.toString() ? `?${params.toString()}` : ""}`, { headers: getHeaders(true) })).results || [];
  renderReports();
  if (["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(state.currentUser?.role || "")) {
    renderPendingItemsInDashboard();
    renderReviewShortcutPanel();
  } else {
    renderPendingItemsInDashboard();
  }
}

async function loadLeaves() {
  const params = new URLSearchParams();
  if (leaveStatusFilter?.value) params.set("status", leaveStatusFilter.value);

  state.leaves = shouldLoadFullLists()
    ? await fetchAllPaginatedResults("/api/v1/leaves/", params)
    : (await apiRequest(`/api/v1/leaves/${params.toString() ? `?${params.toString()}` : ""}`, { headers: getHeaders(true) })).results || [];
  renderLeaves();
  if (["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(state.currentUser?.role || "")) {
    renderPendingItemsInDashboard();
    renderReviewShortcutPanel();
  } else {
    renderPendingItemsInDashboard();
  }
}

async function loadAuditLogs() {
  const payload = await apiRequest("/api/v1/audit/", { headers: getHeaders(true) });
  state.auditLogs = payload.results || [];
  renderAudit();
}

async function loadDashboard() {
  const payload = await apiRequest("/api/v1/dashboard/stats/", { headers: getHeaders(true) });
  state.dashboardStats = payload;
  if (totalReportsValue) {
    totalReportsValue.textContent = String(payload.reports?.total_reports || 0);
  }
  if (draftReportsValue) {
    draftReportsValue.textContent = String(payload.reports?.draft_reports || 0);
  }
  const homeApprovedReports = document.querySelector(
    "#homeSection [data-dashboard-filter='approved-reports'] strong"
  );
  if (homeApprovedReports) {
    homeApprovedReports.textContent = String(
      state.reports.filter((report) => report.status === "APPROVED").length ||
        payload.reports?.approved_reports ||
        0
    );
  }
  if (approvedReportsValue && approvedReportsValue.closest("#dashboardSection")) {
    approvedReportsValue.textContent = String(payload.reports?.approved_reports || 0);
  }
  if (rejectedReportsValue) {
    rejectedReportsValue.textContent = String(payload.reports?.rejected_reports || 0);
  }
  if (approvedLeavesValue) {
    approvedLeavesValue.textContent = String(payload.leaves?.approved_leave_requests || 0);
  }
  if (resolvedLeavesValue) {
    resolvedLeavesValue.textContent = String(
      (payload.leaves?.approved_leave_requests || 0) + (payload.leaves?.rejected_leave_requests || 0)
    );
  }
  renderRecentLists(payload);
  refreshHomeDashboard();
}

async function loadMe() {
  const payload = await apiRequest("/api/v1/auth/me/", { headers: getHeaders(true) });
  state.currentUser = payload.data;
  if (currentUserLabel) {
    currentUserLabel.textContent = `${payload.data.full_name} (${payload.data.role})`;
  }
  renderProfile();
}

async function loadNotifications() {
  const payload = shouldLoadFullLists()
    ? { results: await fetchAllPaginatedResults("/api/v1/notifications/", new URLSearchParams()) }
    : await apiRequest("/api/v1/notifications/", { headers: getHeaders(false) });
  state.notifications = payload.results || [];
  renderNotifications();
  renderNotificationDashboardCard();
  renderReviewShortcutPanel();
}

async function loadAdminDashboard() {
  try {
    state.adminDashboard = await apiRequest("/api/v1/dashboard/admin/", { headers: getHeaders(true) });
  } catch (error) {
    state.adminDashboard = null;
  }
  renderAdminDashboard();
  refreshHomeDashboard();
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
  const payload = await apiRequest(`/api/v1/reports/${reportId}/history/`, { headers: getHeaders(true) });
  state.reportHistory = payload.data || [];
  renderReportHistory();
}

async function getReportDetail(reportId) {
  const payload = await apiRequest(`/api/v1/reports/${reportId}/`, { headers: getHeaders(false) });
  return payload.data || null;
}

async function markNotificationRead(notificationId) {
  try {
    await apiRequest(`/api/v1/notifications/${notificationId}/read/`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    await loadNotifications();
  } catch (error) {
    setMessage(error.message || t("msg_read_notification_error"), "error");
  }
}

async function loadAllData() {
  const role = state.currentUser?.role || "";
  const tasks = [
    loadDepartments(),
    loadUnits(),
    loadReports(),
    loadDashboard(),
    loadMe(),
    loadNotifications(),
    loadFeedbackEntries(),
    loadAuditLogs(),
    loadArchiveLogs(),
    loadOperationsDashboard(),
    loadReviewHistory(),
  ];

  tasks.push(loadLeaves(), loadLeaveCalendar());

  if (["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role)) {
    tasks.push(loadAdminDashboard(), loadAnalyticsDashboard());
  }

  if (role === "DIRECTOR") {
    tasks.push(loadUsers());
  }

  const results = await Promise.allSettled(tasks);

  const rejected = results.filter((item) => item.status === "rejected");
  if (rejected.length) {
    console.warn("Some dashboard requests failed:", rejected);
  }

  refreshHomeDashboard();
}

// ===== Automatic refresh (replaces manual refresh buttons) =====
const AUTO_REFRESH_INTERVAL_MS = 30000;
let autoRefreshTimer = null;
let autoRefreshInFlight = false;

function isAutoRefreshBlocked() {
  // Don't disrupt the user while they are typing or interacting with a modal.
  const active = document.activeElement;
  if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return true;
  if (document.querySelector("#sectionModal:not(.hidden), #quickCreateModal:not(.hidden), #ratingModal:not(.hidden)")) {
    return true;
  }
  return false;
}

async function autoRefreshTick() {
  if (autoRefreshInFlight) return;
  if (!state.currentUser) return;
  if (document.visibilityState !== "visible") return;
  if (isAutoRefreshBlocked()) return;
  autoRefreshInFlight = true;
  try {
    await loadAllData();
    if ((state.currentUser?.role || "") === "DIRECTOR") {
      await loadUsersForRoleManagement().catch(() => {});
    }
  } catch (error) {
    console.warn("Auto-refresh failed:", error);
  } finally {
    autoRefreshInFlight = false;
  }
}

function startAutoRefresh() {
  if (autoRefreshTimer) return;
  autoRefreshTimer = window.setInterval(autoRefreshTick, AUTO_REFRESH_INTERVAL_MS);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") autoRefreshTick();
});

startAutoRefresh();

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);

    try {
      setMessage(t("msg_logging_in"));
      const payload = await apiRequest("/api/v1/auth/login/", {
        method: "POST",
        headers: getHeaders(),
        timeoutMs: 15000,
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      console.log("Login payload:", payload);

      if (payload.data?.requires_two_factor) {
        openVerificationStep(payload);
          setMessage(
            payload.data?.verification_method === "email"
              ? t("msg_2fa_code_sent_email").replace("{email}", payload.data.masked_email || "email")
              : payload.data?.verification_method === "authenticator_setup"
              ? t("msg_2fa_setup_scan")
              : t("msg_2fa_enter_code"),
            "success"
          );
        return;
      }

      finalizeAuthenticatedSession(payload);
      const departmentCount = await loadDepartments();
      await loadAllData();
      setMessage(t("msg_connected_departments").replace("{count}", departmentCount), "success");
    } catch (error) {
      state.accessToken = "";
      state.refreshToken = "";
      state.currentUser = null;
      if (authStateLabel) authStateLabel.textContent = t("offline");
      authStateDot?.classList.remove("online");
      authStateDot?.classList.add("offline");
      if (currentUserLabel) currentUserLabel.textContent = "-";
      loggedInAsLabel.textContent = "-";
      state.twoFactorSetup = null;
      resetPendingLogin();
      setAuthUi(false);
      renderProfile();
      setMessage(error.message || t("msg_login_error"), "error");
    }
  });
} else {
  console.error("loginForm elementi topilmadi!");
}

if (otpForm) {
  otpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.pendingChallengeToken && !state.pendingEmailChallengeId) {
      setMessage(t("msg_session_not_found"), "error");
      resetPendingLogin();
      return;
    }

    try {
      const payload = await apiRequest(
        state.pendingVerificationMethod === "email"
          ? "/api/v1/auth/login/verify-email-otp/"
          : "/api/v1/auth/login/verify-2fa/",
        {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          challenge_id: state.pendingEmailChallengeId,
          challenge_token: state.pendingChallengeToken,
          code: new FormData(otpForm).get("code"),
        }),
        }
      );
      finalizeAuthenticatedSession(payload);
      const departmentCount = await loadDepartments();
      await loadAllData();
    } catch (error) {
      setMessage(error.message || t("msg_otp_verify_error"), "error");
    }
  });
} else {
  console.error("otpForm elementi topilmadi!");
}

if (backToLoginButton) {
  backToLoginButton.addEventListener("click", () => {
    resetPendingLogin();
    setMessage(t("msg_back_to_login"), "success");
  });
}

// Registration form switching
if (showRegisterButton) {
  showRegisterButton.addEventListener("click", () => {
    loginCredentialsStep?.classList.add("hidden");
    registerStep?.classList.remove("hidden");
  });
}

if (showLoginButton) {
  showLoginButton.addEventListener("click", () => {
    registerStep?.classList.add("hidden");
    loginCredentialsStep?.classList.remove("hidden");
  });
}

// Registration form submission
registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fullName = registerFullNameInput?.value.trim();
  const username = registerUsernameInput?.value.trim();
  const email = registerEmailInput?.value.trim();
  const password = registerPasswordInput?.value;
  const passwordConfirm = registerPasswordConfirmInput?.value;

  if (!fullName || !username || !email || !password || !passwordConfirm) {
    registerStatusBox.textContent = t("msg_fill_required_fields");
    registerStatusBox.className = "login-status-box error";
    return;
  }

  if (password !== passwordConfirm) {
    registerStatusBox.textContent = t("msg_passwords_mismatch");
    registerStatusBox.className = "login-status-box error";
    return;
  }

  try {
    registerStatusBox.textContent = t("msg_registering");
    registerStatusBox.className = "login-status-box";

    await apiRequest("/api/v1/auth/register/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        full_name: fullName,
        username: username,
        email: email,
        password: password,
      }),
    });

    registerStatusBox.textContent = t("msg_registered");
    registerStatusBox.className = "login-status-box success";

    // Clear form and switch back to login
    setTimeout(() => {
      registerForm.reset();
      registerStep?.classList.add("hidden");
      loginCredentialsStep?.classList.remove("hidden");
      registerStatusBox.textContent = t("msg_enter_details");
      registerStatusBox.className = "login-status-box";
    }, 2000);
  } catch (error) {
    registerStatusBox.textContent = error.message || t("msg_register_error");
    registerStatusBox.className = "login-status-box error";
  }
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(passwordForm);

  try {
    setMessage(t("msg_password_updating"));
    await apiRequest("/api/v1/auth/password/", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        current_password: formData.get("current_password"),
        new_password: formData.get("new_password"),
      }),
    });
    passwordForm.reset();
    setMessage(t("msg_password_updated"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_password_update_error"), "error");
  }
});

setupTwoFactorButton?.addEventListener("click", async () => {
  try {
    setMessage(t("msg_2fa_generating"));
    const payload = await apiRequest("/api/v1/auth/two-factor/setup/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    state.twoFactorSetup = payload.data;
    renderTwoFactorSetup();
    setMessage(t("msg_qr_ready"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_2fa_setup_error"), "error");
  }
});

twoFactorVerifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setMessage(t("msg_2fa_activating"));
    await apiRequest("/api/v1/auth/two-factor/verify/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        code: new FormData(twoFactorVerifyForm).get("code"),
      }),
    });
    twoFactorVerifyForm.reset();
    state.twoFactorSetup = null;
    renderTwoFactorSetup();
    await loadMe();
    setMessage(t("msg_2fa_enabled"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_2fa_enable_error"), "error");
  }
});

twoFactorDisableForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setMessage(t("msg_2fa_disabling"));
    const formData = new FormData(twoFactorDisableForm);
    await apiRequest("/api/v1/auth/two-factor/disable/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        current_password: formData.get("current_password"),
        code: formData.get("code"),
      }),
    });
    twoFactorDisableForm.reset();
    state.twoFactorSetup = null;
    renderTwoFactorSetup();
    await loadMe();
    setMessage(t("msg_2fa_disabled"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_2fa_disable_error"), "error");
  }
});

userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(userForm);
  const password = String(formData.get("password") || "").trim();
  const passwordConfirm = String(formData.get("password_confirm") || "").trim();
  const role = String(formData.get("role") || "SPECIALIST");

  if (password.length < 8) {
    setMessage(t("user_create_password_required"), "error");
    return;
  }
  if (password !== passwordConfirm) {
    setMessage(t("user_create_password_mismatch"), "error");
    return;
  }
  if (role !== "DIRECTOR" && !formData.get("department_id")) {
    setMessage(t("user_create_department_required"), "error");
    return;
  }

  const payload = {
    username: String(formData.get("username") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    full_name: String(formData.get("full_name") || "").trim(),
    role,
    password,
  };

  const jobRole = String(formData.get("job_role") || "").trim();
  const jobLevel = String(formData.get("job_level") || "").trim();
  if (jobLevel && !jobRole) {
    setMessage(t("msg_select_it_role_first"), "error");
    return;
  }
  if (jobRole) payload.job_role = jobRole;
  if (jobLevel) payload.job_level = jobLevel;
  if (role !== "DIRECTOR" && formData.get("department_id")) {
    payload.department_id = formData.get("department_id");
  }
  if (role === "UNIT_HEAD") {
    if (!formData.get("unit_id")) {
      setMessage(t("msg_select_unit_for_unithead"), "error");
      return;
    }
    payload.unit_id = formData.get("unit_id");
  }

  try {
    setMessage(t("msg_creating_it_user"));
    await apiRequest("/api/v1/users/create/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    await Promise.all([loadUsers(), loadAuditLogs()]);
    userForm.reset();
    renderDepartmentOptions();
    renderUserDepartmentOptions();
    syncUserFormByRole();
    closeSectionModal();
    setMessage(t("msg_it_user_created"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_user_create_error"), "error");
  }
});

userForm?.querySelector('[name="role"]')?.addEventListener("change", syncUserFormByRole);
userDepartmentSelect?.addEventListener("change", renderUserUnits);

roleManagementForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(roleManagementForm);
  const userId = formData.get("user_id");
  const newRole = formData.get("role");

  if (!userId || !newRole) {
    setMessage(t("msg_select_user_and_role"), "error");
    return;
  }

  // FIXED: Build payload with role-conditional unit/department fields
  const payload = { role: newRole };
  if (newRole === "UNIT_HEAD") {
    const deptId = formData.get("department_id");
    const unitId = formData.get("unit_id");
    if (!deptId) {
      setMessage(t("department_required"), "error");
      return;
    }
    if (!unitId) {
      setMessage(t("unit_required"), "error");
      return;
    }
    payload.department_id = deptId;
    payload.unit_id = unitId;
  } else if (newRole === "DEPT_HEAD") {
    const deptId = formData.get("department_id");
    if (!deptId) {
      setMessage(t("department_required"), "error");
      return;
    }
    payload.department_id = deptId;
    payload.unit_id = null; // Explicitly clear unit
  } else if (newRole === "DIRECTOR") {
    payload.department_id = null;
    payload.unit_id = null;
  }

  try {
    setMessage(t("msg_role_changing"));
    await apiRequest(`/api/v1/users/${userId}/update/`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    await Promise.all([loadUsersForRoleManagement(), loadAuditLogs()]);
    roleManagementForm.reset();
    syncRoleManagementForm(); // Reset visibility after form reset
    setMessage(t("role_change_success"), "success");
  } catch (error) {
    console.error("Rol o'zgartirish xatosi:", error);
    setMessage(error.message || t("role_change_error"), "error");
  }
});

// FIXED: Sync form visibility on role change and department change
roleManagementRoleSelect?.addEventListener("change", syncRoleManagementForm);
roleManagementDeptSelect?.addEventListener("change", populateRoleManagementUnits);

refreshUsersForRoleManagement?.addEventListener("click", async () => {
  await loadUsersForRoleManagement();
  setMessage(t("refresh"), "success");
});

reportForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(await requestCreationWarning("report"))) return;
  const formData = new FormData(reportForm);
  const payload = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    content: formData.get("content"),
  };
  if (formData.get("department_id")) payload.department_id = formData.get("department_id");

  try {
    setMessage(t("msg_creating_report"));
    const createdReport = await apiRequest("/api/v1/reports/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const createdReportId = createdReport?.id;
    if (isUuid(createdReportId)) {
      state.lastCreatedReportId = createdReportId;
      latestReportIdLabel.textContent = createdReportId;
      applyReportIdToAllTools(createdReportId);
    }
    const screenshot = formData.get("screenshot");
    if (createdReportId && screenshot instanceof File && screenshot.size > 0) {
      const attachmentData = new FormData();
      attachmentData.append("file", screenshot);
      await apiRequest(`/api/v1/reports/${createdReportId}/attachments/`, {
        method: "POST",
        headers: getHeaders(false),
        body: attachmentData,
      });
    }
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    reportForm.reset();
  } catch (error) {
    setMessage(error.message || t("msg_report_create_error"), "error");
  }
});

workflowForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(workflowForm);
  const reportId = String(formData.get("report_id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const comment = String(formData.get("comment") || "").trim();

  if (!isUuid(reportId)) {
    setMessage(t("msg_report_id_invalid"), "error");
    return;
  }

  try {
    setMessage(t("msg_loading_report"));
    const report = await getReportDetail(reportId);

    if (!report) {
      setMessage(t("msg_report_not_found"), "error");
      return;
    }

    const validActions = getValidActionsForStatus(report.status);
    if (!validActions.includes(action)) {
      setMessage(t("msg_action_not_allowed").replace("{action}", action).replace("{status}", report.status).replace("{actions}", validActions.join(", ")), "error");
      return;
    }

    if (action === "REJECT" && !comment) {
      setMessage(t("msg_comment_required_reject"), "error");
      return;
    }

    if (action === "REJECT") {
      if (!confirm(t("confirm_reject_action"))) return;
    }

    if (action === "REQUEST_REVISION" && !comment) {
      setMessage(t("msg_comment_required_revision"), "error");
      return;
    }

    setMessage(t("msg_workflow_running"));
    await apiRequest(`/api/v1/reports/${reportId}/actions/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: action,
        comment: comment,
      }),
    });
    workflowForm.reset();
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    setMessage(t("msg_workflow_success"), "success");

    // Show rating modal if action was APPROVE and report is now APPROVED
    if (action === "APPROVE") {
      const updatedReport = state.reports.find(r => r.id === reportId);
      if (updatedReport && updatedReport.status === "APPROVED") {
        // Get approver info
        const approverInfo = {
          id: state.currentUser?.id,
          name: state.currentUser?.full_name || state.currentUser?.username
        };
        // Show rating modal for the report owner
        openRatingModal(updatedReport, "report", approverInfo);
      }
    }
  } catch (error) {
    setMessage(error.message || t("msg_workflow_error"), "error");
  }
});

leaveReviewForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leaveReviewForm);
  const leaveId = String(formData.get("leave_id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const reviewComment = String(formData.get("review_comment") || "").trim();

  if (!isUuid(leaveId)) {
    setMessage(t("msg_leave_id_invalid"), "error");
    return;
  }

  if (action === "REJECT") {
    if (!confirm(t("confirm_reject_action"))) return;
  }

  try {
    setMessage(t("msg_reviewing_leave"));
    const payload = await apiRequest(`/api/v1/leaves/${leaveId}/review/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: action,
        review_comment: reviewComment,
      }),
    });
    leaveReviewForm.reset();
    await Promise.all([loadLeaves(), loadDashboard(), loadAuditLogs()]);
    setMessage(t("msg_leave_reviewed"), "success");
  } catch (error) {
    console.error("Leave review xatosi:", error);
    setMessage(error.message || t("msg_leave_review_error"), "error");
  }
});

function getValidActionsForStatus(status) {
  const actionMap = {
    "DRAFT": ["SUBMIT"],
    "REVISION": ["SUBMIT"],
    "PENDING_L2": ["APPROVE", "REJECT", "REQUEST_REVISION"],
    "PENDING_L3": ["APPROVE", "REJECT", "REQUEST_REVISION"],
    "PENDING_L4": ["APPROVE", "REJECT", "REQUEST_REVISION"],
    "APPROVED": ["ARCHIVE"],
    "REJECTED": ["ARCHIVE"],
  };
  return actionMap[status] || [];
}

attachmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(attachmentForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!isUuid(reportId)) {
    setMessage(t("msg_attachment_report_id_required"), "error");
    return;
  }

  try {
    const report = await getReportDetail(reportId);
    if (!report) {
      setMessage(t("msg_report_not_found"), "error");
      return;
    }
    if (!["DRAFT", "REVISION"].includes(report.status)) {
      setMessage(t("msg_attachment_only_draft"), "error");
      return;
    }
    setMessage(t("msg_uploading_attachment"));
    await apiRequest(`/api/v1/reports/${reportId}/attachments/`, {
      method: "POST",
      headers: getHeaders(false),
      body: formData,
    });
    await Promise.all([loadReports(), loadAuditLogs()]);
    attachmentForm.reset();
    setMessage(t("msg_attachment_uploaded"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_attachment_upload_error"), "error");
  }
});

downloadAttachmentButton?.addEventListener("click", async () => {
  const formData = new FormData(attachmentToolsForm);
  const inputId = String(formData.get("attachment_id") || "").trim();
  if (!inputId || !state.accessToken) return;

  try {
    const resolved = await resolveAttachmentIdFromInput(inputId);
    if (resolved.fromReport) {
      setMessage(t("msg_attachment_used_from_report").replace("{id}", resolved.attachmentId), "success");
    }
    const response = await fetch(`${state.apiBase}/api/v1/reports/attachments/${resolved.attachmentId}/download/`, {
      headers: getHeaders(false),
    });
    if (!response.ok) {
      throw new Error(t("err_attachment_not_found"));
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
    setMessage(t("msg_attachment_downloaded"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_attachment_upload_error"), "error");
  }
});

deleteAttachmentButton?.addEventListener("click", async () => {
  const formData = new FormData(attachmentToolsForm);
  const inputId = String(formData.get("attachment_id") || "").trim();
  if (!inputId) return;

  try {
    const resolved = await resolveAttachmentIdFromInput(inputId);
    if (resolved.fromReport) {
      setMessage(t("msg_attachment_deleting_from_report").replace("{id}", resolved.attachmentId), "success");
    }
    await apiRequest(`/api/v1/reports/attachments/${resolved.attachmentId}/`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await Promise.all([loadReports(), loadAuditLogs()]);
    setMessage(t("msg_attachment_deleted"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_attachment_delete_error"), "error");
  }
});

loadHistoryButton?.addEventListener("click", async () => {
  const formData = new FormData(reportToolsForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!isUuid(reportId)) {
    setMessage(t("msg_history_report_id_required"), "error");
    return;
  }

  try {
    await loadReportHistory(reportId);
    setMessage(t("msg_report_history_loaded"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_report_history_error"), "error");
  }
});

deleteReportButton?.addEventListener("click", async () => {
  const formData = new FormData(reportToolsForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!isUuid(reportId)) {
    setMessage(t("msg_delete_report_id_required"), "error");
    return;
  }

  try {
    await apiRequest(`/api/v1/reports/${reportId}/`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await Promise.all([loadReports(), loadDashboard(), loadAuditLogs()]);
    state.reportHistory = [];
    renderReportHistory();
    setMessage(t("msg_report_deleted"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_report_delete_error"), "error");
  }
});

copyLatestReportIdButton?.addEventListener("click", async () => {
  const reportId = state.lastCreatedReportId;
  if (!isUuid(reportId)) {
    setMessage(t("msg_create_report_first_copy"), "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(reportId);
    setMessage(t("msg_uuid_copied"), "success");
  } catch (error) {
    setMessage(t("msg_uuid_copy_failed"), "error");
  }
});

useLatestReportIdButton?.addEventListener("click", () => {
  const reportId = state.lastCreatedReportId;
  if (!isUuid(reportId)) {
    setMessage(t("msg_create_report_first_apply"), "error");
    return;
  }
  applyReportIdToAllTools(reportId);
  setMessage(t("msg_uuid_applied_forms"), "success");
});

departmentSelect?.addEventListener("change", renderUnits);
refreshUsersButton?.addEventListener("click", () => loadUsers().catch((error) => setMessage(error.message, "error")));
refreshReportsButton?.addEventListener("click", () => loadReports().catch((error) => setMessage(error.message, "error")));
refreshAuditButton?.addEventListener("click", () => loadAuditLogs().catch((error) => setMessage(error.message, "error")));
refreshArchiveLogsButton?.addEventListener("click", () =>
  loadArchiveLogs().catch((error) => setMessage(error.message, "error"))
); 
refreshDashboardButton?.addEventListener("click", () => loadDashboard().catch((error) => setMessage(error.message, "error")));
refreshNotificationsButton?.addEventListener("click", () => loadNotifications().catch((error) => setMessage(error.message, "error")));
readAllNotificationsButton?.addEventListener("click", async () => {
  try {
    await apiRequest("/api/v1/notifications/read-all/", {
      method: "PUT",
      headers: getHeaders(false),
    });
    await loadNotifications();
    setMessage(t("msg_all_notifications_read"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_notifications_update_error"), "error");
  }
});
refreshAdminDashboardButton?.addEventListener("click", () => loadAdminDashboard().catch((error) => setMessage(error.message, "error")));
refreshAnalyticsDashboardButton?.addEventListener("click", () => loadAnalyticsDashboard().catch((error) => setMessage(error.message, "error")));
refreshLeaveCalendarButton?.addEventListener("click", () => loadLeaveCalendar().catch((error) => setMessage(error.message, "error")));
meButton?.addEventListener("click", () => {
  toggleProfileMenu(false);
  // Open password change modal
  if (sectionModal && sectionModalContent && sectionModalTitle) {
    restoreModalSection();
    sectionModalContent.innerHTML = `
      <section class="security-settings-card">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">${t("section_security")}</p>
            <h3>${t("change_password")}</h3>
          </div>
        </div>
        <form id="modalPasswordForm" class="form-grid">
          <label><span>${t("current_password")}</span><input name="current_password" type="password" required /></label>
          <label><span>${t("new_password")}</span><input name="new_password" type="password" required /></label>
          <button type="submit" class="ghost-btn">${t("update_password")}</button>
        </form>
      </section>
    `;
    sectionModalTitle.textContent = t("change_password");
    sectionModal.classList.remove("hidden");
    sectionModal.setAttribute("aria-hidden", "false");
    setTimeout(() => {
      document.getElementById("modalPasswordForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(document.getElementById("modalPasswordForm"));
        try {
          await apiRequest("/api/v1/auth/change-password/", {
            method: "POST",
            headers: getHeaders(false),
            body: JSON.stringify(Object.fromEntries(formData)),
          });
          setMessage(t("msg_password_changed"), "success");
          sectionModal.classList.add("hidden");
        } catch (error) {
          setMessage(error.message || t("msg_password_change_error"), "error");
        }
      });
    }, 0);
  }
});
profileRoleIcon?.addEventListener("click", () => {
  loadMe().then(() => openProfileDetailsModal()).catch((error) => setMessage(error.message, "error"));
});
profileDeptIcon?.addEventListener("click", () => {
  openSectionModal("institutionsSection", t("sidebar_institutions"));
});
profileUnitIcon?.addEventListener("click", () => {
  openSectionModal("usersSection", t("employees_section"));
});
apiBaseIcon?.addEventListener("click", () => {
  refreshAllButton?.click();
});
refreshAllButton?.addEventListener("click", () => {
  loadAllData()
    .then(() => setMessage(t("msg_all_sections_refreshed"), "success"))
    .catch((error) => setMessage(error.message, "error"));
});
logoutButton?.addEventListener("click", async () => {
  try {
    await apiRequest("/api/v1/auth/logout/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ refresh: state.refreshToken }),
    });
    state.accessToken = "";
    state.refreshToken = "";
    state.currentUser = null;
    state.twoFactorSetup = null;
    if (authStateLabel) authStateLabel.textContent = t("offline");
    authStateDot?.classList.remove("online");
    authStateDot?.classList.add("offline");
    if (currentUserLabel) currentUserLabel.textContent = "-";
    loggedInAsLabel.textContent = "-";
    resetPendingLogin();
    setAuthUi(false);
    renderProfile();
    toggleProfileMenu(false);
    closeSectionModal();
    setMessage(t("msg_logout_success"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_logout_error"), "error");
  }
});

if (apiBaseIcon) {
  apiBaseIcon.title = t("gateway_internal");
  apiBaseIcon.setAttribute("aria-label", apiBaseIcon.title);
}
authStateDot?.classList.add("offline");
setAuthUi(false);
applyRoleBasedUi();
resetPendingLogin();

// Auxiliary Drawer functionality (must be defined before profile icons use them)
const openAuxMenuButton = document.getElementById("openAuxMenuButton");
const auxiliaryDrawer = document.getElementById("auxiliaryDrawer");
const auxiliaryDrawerBackdrop = document.getElementById("auxiliaryDrawerBackdrop");
const closeAuxiliaryDrawer = document.getElementById("closeAuxiliaryDrawer");
const auxTabs = document.querySelectorAll(".aux-tab");
const auxPanels = document.querySelectorAll(".aux-panel");

function openAuxiliaryDrawer() {
  auxiliaryDrawer?.classList.remove("hidden");
  auxiliaryDrawerBackdrop?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAuxiliaryDrawerFunc() {
  auxiliaryDrawer?.classList.add("hidden");
  auxiliaryDrawerBackdrop?.classList.add("hidden");
  document.body.style.overflow = "";
}

profileMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleProfileMenu();
});
profileDropdown?.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Profil info toggle
const profileToggleRow = document.getElementById('profileToggleRow');
const profileInfoPanel = document.getElementById('profileInfoPanel');
const profileChevron = document.getElementById('profileChevron');
const profileInfoToggle = document.getElementById('profileInfoToggle');

profileToggleRow?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = profileInfoPanel && profileInfoPanel.style.display === 'flex';
  if (profileInfoPanel) profileInfoPanel.style.display = isOpen ? 'none' : 'flex';
  if (profileChevron) profileChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
});

profileInfoToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  // Open full profile modal (load current user first)
  toggleProfileMenu(false);
  loadMe()
    .then(() => {
      openUserProfileModal(state.currentUser);
    })
    .catch((error) => setMessage(error.message, 'error'));
});

// Profile quick icons functionality
const profileCalendarIcon = document.getElementById("profileCalendarIcon");
const profileMenuIcon = document.getElementById("profileMenuIcon");
const profileSignalIcon = document.getElementById("profileSignalIcon");

profileCalendarIcon?.addEventListener("click", () => {
  toggleProfileMenu(false);
  openAuxiliaryDrawer();
  // Switch to calendar tab
  auxTabs.forEach((t) => t.classList.remove("active"));
  document.querySelector('[data-aux-tab="calendar"]')?.classList.add("active");
  auxPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== "auxCalendarPanel");
  });
});

profileMenuIcon?.addEventListener("click", () => {
  toggleProfileMenu(false);
  openAuxiliaryDrawer();
});

profileSignalIcon?.addEventListener("click", () => {
  toggleProfileMenu(false);
  // Show connection status toast
  setMessage(t("msg_server_connection_active"), "success");
});

// Auxiliary drawer event listeners
openAuxMenuButton?.addEventListener("click", openAuxiliaryDrawer);
closeAuxiliaryDrawer?.addEventListener("click", closeAuxiliaryDrawerFunc);
auxiliaryDrawerBackdrop?.addEventListener("click", closeAuxiliaryDrawerFunc);

auxTabs?.forEach((tab) => {
  tab?.addEventListener("click", () => {
    auxTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.auxTab;
    auxPanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== `aux${target.charAt(0).toUpperCase() + target.slice(1)}Panel`);
    });
  });
});

createMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleCreateMenu();
});
createMenuDropdown?.addEventListener("click", (event) => {
  event.stopPropagation();
});
languageMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLanguageMenu();
});
languageDropdown?.addEventListener("click", (event) => {
  event.stopPropagation();
});
loginLanguageButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLoginLanguageMenu();
});
loginLanguageDropdown?.addEventListener("click", (event) => {
  event.stopPropagation();
});
document?.addEventListener("click", () => {
  toggleProfileMenu(false);
  toggleCreateMenu(false);
  toggleLanguageMenu(false);
  toggleLoginLanguageMenu(false);
  toggleTopbarMobileMenu(false);
});
sectionModalBackdrop?.addEventListener("click", closeSectionModal);
sectionModalClose?.addEventListener("click", closeSectionModal);
quickCreateBackdrop?.addEventListener("click", closeQuickCreate);
quickCreateClose?.addEventListener("click", closeQuickCreate);
creationWarningBackdrop?.addEventListener("click", () => closeCreationWarning(false));
creationWarningClose?.addEventListener("click", () => closeCreationWarning(false));
creationWarningConfirm?.addEventListener("click", () => closeCreationWarning(true));
document?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
      toggleProfileMenu(false);
      toggleCreateMenu(false);
      toggleLanguageMenu(false);
      toggleLoginLanguageMenu(false);
      toggleTopbarMobileMenu(false);
      closeSectionModal();
      closeQuickCreate();
      closeCreationWarning(false);
  }
});
createMenuItems.forEach((button) => {
  button?.addEventListener("click", () => {
    const action = button.dataset.createAction;
    toggleCreateMenu(false);
    if (action === "report") {
      openSectionModal("reportCreatePanel", t("report_modal_title"));
      return;
    }
    if (action === "leave") {
      openSectionModal("leaveCreatePanel", t("create_leave_menu"));
      return;
    }
    openQuickCreate(action);
  });
});

leaveCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(await requestCreationWarning("leave"))) return;
  const formData = new FormData(leaveCreateForm);
  const leaveType = String(formData.get("leave_type") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const startDate = String(formData.get("start_date") || "").trim();
  const endDate = String(formData.get("end_date") || "").trim();

  if (!leaveType || !reason || !startDate || !endDate) {
    setMessage(t("msg_fill_required_fields"), "error");
    return;
  }

  try {
    setMessage(t("msg_creating_leave"));
    const payload = new FormData();
    payload.append("leave_type", leaveType);
    payload.append("reason", reason);
    payload.append("start_date", startDate);
    payload.append("end_date", endDate);

    const screenshot = formData.get("screenshot");
    if (screenshot instanceof File && screenshot.size > 0) {
      payload.append("screenshot", screenshot);
    }

    await apiRequest("/api/v1/leaves/", {
      method: "POST",
      headers: getHeaders(false),
      body: payload,
    });

    await Promise.all([loadLeaves(), loadDashboard(), loadAuditLogs()]);
    leaveCreateForm.reset();
    closeSectionModal();
    setMessage(t("msg_leave_submitted"), "success");
  } catch (error) {
    console.error("Leave create xatosi:", error);
    setMessage(error.message || t("msg_leave_create_error"), "error");
  }
});

profileAddUserButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  renderDepartmentOptions();
  renderUserDepartmentOptions();
  syncUserFormByRole();
  openSectionModal("userForm", t("msg_add_user"));
  toggleProfileMenu(false);
});

languageOptions.forEach((button) => {
  button?.addEventListener("click", async () => {
    state.language = button.dataset.language || "uz";
    window.localStorage.setItem("hrmm_language", state.language);
    toggleLanguageMenu(false);
    toggleLoginLanguageMenu(false);
    applyTranslations();
    // FIXED: Re-render dynamic content so translations apply to lists/tables
    renderUsers();
    renderReports();
    renderNotifications();
    renderAuditLogs();
    renderArchiveLogs();
    renderDashboard();
    renderFeedbackList();
    renderRecentReports();
    renderRecentLeaves();
    renderOperationsDashboard();
    renderAdminDashboard();
    renderUsersForRoleManagement();
    renderActivityHistory();
    renderReviewHistory();
    renderLeaveCalendar();
    loadUsersForRoleManagement().catch(() => {});
    
    // Update user language preference on backend
    try {
      await apiRequest("/api/v1/auth/me/", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ language: state.language }),
      });
    } catch (error) {
      console.error("Language preference update failed:", error);
    }
  });
});
loginLanguageOptions.forEach((button) => {
  button?.addEventListener("click", () => {
    state.language = button.dataset.language || "uz";
    window.localStorage.setItem("hrmm_language", state.language);
    toggleLanguageMenu(false);
    toggleLoginLanguageMenu(false);
    applyTranslations();
  });
});
topbarNotificationsButton?.addEventListener("click", () => {
  openSectionModal("notificationsSection", t("sidebar_notifications"));
});
document.querySelectorAll("[data-activity-filter]").forEach((button) => {
  button?.addEventListener("click", () => {
    state.homeActivityFilter = button.dataset.activityFilter || "all";
    renderActivityHistory();
  });
});
navLinks.forEach((button) => {
  button?.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (button.dataset.target === "homeSection") {
      closeSectionModal();
      document.querySelectorAll(".app-section").forEach((sec) => sec.classList.add("hidden"));
      const homeSection = document.getElementById("homeSection");
      const auditSection = document.getElementById("auditSection");
      if (homeSection) {
        homeSection.classList.remove("hidden");
      }
      if (auditSection) {
        auditSection.classList.remove("hidden");
      }
      homeSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    openSectionModal(button.dataset.target, button.textContent.trim());
  });
});

// Bottom Section Navigation event listeners
document.querySelectorAll(".bottom-section-nav .section-nav-btn").forEach((button) => {
  button?.addEventListener("click", () => {
    // Remove active from all nav buttons
    document.querySelectorAll(".bottom-section-nav .section-nav-btn").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    
    const targetId = button.dataset.target;
    if (targetId) {
      const section = document.getElementById(targetId);
      if (section) {
        // Hide all sections first
        document.querySelectorAll(".app-section").forEach((sec) => {
          if (!sec.classList.contains("hidden")) {
            sec.classList.add("hidden");
          }
        });
        // Show target section
        section.classList.remove("hidden");
        // Scroll to section
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        if (targetId === "reportHistorySection") {
          loadReviewHistory().catch((error) => setMessage(error.message, "error"));
        }
      }
    }
  });
});

document.getElementById("refreshReviewHistory")?.addEventListener("click", () => {
  loadReviewHistory().catch((error) => setMessage(error.message, "error"));
});

// Rating Modal functionality
const ratingModal = document.getElementById("ratingModal");
const ratingOverlay = document.getElementById("ratingOverlay");
const ratingClose = document.getElementById("ratingClose");
const ratingForm = document.getElementById("ratingForm");
const ratingStars = document.getElementById("ratingStars");
const ratingValue = document.getElementById("ratingValue");
const ratingHint = document.getElementById("ratingHint");
const submitRatingBtn = document.getElementById("submitRatingBtn");
const skipRatingBtn = document.getElementById("skipRatingBtn");

let pendingRatingItem = null;

function openRatingModal(item, itemType, approverInfo) {
  pendingRatingItem = { item, itemType };
  document.getElementById("ratingItemId").value = item.id;
  document.getElementById("ratingItemType").value = itemType;
  document.getElementById("ratingApproverId").value = approverInfo?.id || "";

  const itemName = itemType === "leave" ? item.reason : (item.title || item.report_number);
  document.getElementById("ratingItemInfo").textContent = `${itemType === "leave" ? t("label_leave") : t("label_report")}: ${itemName}`;
  document.getElementById("ratingApproverInfo").textContent = `${t("approver_label")}: ${approverInfo?.name || t("unknown")}`;

  ratingValue.value = "0";
  setRatingStars(0);
  ratingHint.textContent = t("rating_hint");
  submitRatingBtn.disabled = true;
  ratingForm.reset();

  ratingModal?.classList.remove("hidden");
}

function closeRatingModal() {
  ratingModal?.classList.add("hidden");
  pendingRatingItem = null;
}

function setRatingStars(rating) {
  const stars = ratingStars?.querySelectorAll(".star-btn-large");
  stars?.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("selected");
      star.textContent = "★";
    } else {
      star.classList.remove("selected");
      star.textContent = "☆";
    }
  });
}

ratingStars?.addEventListener("click", (event) => {
  const button = event.target.closest(".star-btn-large");
  if (!button) return;
  const rating = parseInt(button.dataset.rating, 10);
  ratingValue.value = rating;
  setRatingStars(rating);
  ratingHint.textContent = `${rating} yulduz`;
  submitRatingBtn.disabled = false;
});

ratingClose?.addEventListener("click", closeRatingModal);
ratingOverlay?.addEventListener("click", closeRatingModal);
skipRatingBtn?.addEventListener("click", closeRatingModal);

ratingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ratingValue.value || ratingValue.value === "0") {
    setMessage(t("msg_select_rating"), "error");
    return;
  }

  const formData = new FormData(ratingForm);
  const rating = parseInt(formData.get("rating"), 10);
  const comment = formData.get("comment") || "";
  const itemId = formData.get("item_id");
  const itemType = formData.get("item_type");

  try {
    // Submit rating to backend
    await apiRequest("/api/v1/ratings/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        item_id: itemId,
        item_type: itemType,
        rating: rating,
        comment: comment,
        approver_id: formData.get("approver_id"),
      }),
    });

    // Auto-archive the item
    await archiveItem(itemId, itemType);

    setMessage(t("msg_rating_archived"), "success");
    closeRatingModal();

    // Refresh lists
    await Promise.all([
      itemType === "leave" ? loadLeaves() : loadReports(),
      loadDashboard(),
      loadAuditLogs(),
    ]);
  } catch (error) {
    setMessage(error.message || t("msg_rating_save_error"), "error");
  }
});

async function archiveItem(itemId, itemType) {
  try {
    const endpoint = itemType === "leave"
      ? `/api/v1/leaves/${itemId}/archive/`
      : `/api/v1/reports/${itemId}/archive/`;

    await apiRequest(endpoint, {
      method: "POST",
      headers: getHeaders(),
    });
  } catch (error) {
    console.error("Arxivlash xatosi:", error);
  }
}

// Function to check if item needs rating after approval
function needsRatingAfterApproval(item, itemType, approverRole) {
  // Check if approver is DEPT_HEAD, UNIT_HEAD, or DIRECTOR
  const isManagerApproval = ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(approverRole);
  // Check if final status is APPROVED
  const isFinalApproval = item.status === "APPROVED";

  return isManagerApproval && isFinalApproval;
}

// CSS for rating stars
const ratingStyles = `
.rating-stars-large {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.star-btn-large {
  width: 44px;
  height: 44px;
  font-size: 28px;
  color: #94a3b8;
  background: var(--bg-deep);
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star-btn-large:hover,
.star-btn-large.selected {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  transform: scale(1.05);
}

.rating-info-box {
  background: var(--bg-deep);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.rating-item-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  margin-bottom: 4px;
}

.rating-approver-name {
  font-size: 13px;
  color: var(--muted);
}

.rating-hint {
  font-size: 13px;
  color: var(--muted);
  margin-top: 8px;
  font-style: italic;
}

.char-count {
  font-size: 12px;
  color: var(--muted);
  text-align: right;
  display: block;
  margin-top: 4px;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = ratingStyles;
document.head.appendChild(styleSheet);
feedbackStars?.querySelectorAll(".star-btn").forEach((button) => {
  button?.addEventListener("click", () => setFeedbackRating(button.dataset.rating));
});
feedbackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasFeedbackPermission()) {
    setMessage(t("feedback_locked"), "error");
    return;
  }
  const rating = Number(feedbackRatingValue?.value || 0);
  const comment = String(feedbackCommentInput?.value || "").trim();
  if (!rating) {
    setMessage(t("msg_select_rating_first"), "error");
    return;
  }
  if (!comment) {
    setMessage(t("msg_write_comment"), "error");
    return;
  }
  try {
    await apiRequest("/api/v1/users/feedback/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
    await loadFeedbackEntries();
    feedbackForm.reset();
    setFeedbackRating(0);
    setMessage(t("msg_feedback_saved"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_feedback_error"), "error");
  }
});
quickCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = quickCreateType?.value || "notification";
  if (mode === "notification" && !(await requestCreationWarning("notification"))) return;
  if (mode === "feature" && !(await requestCreationWarning("feature"))) return;
  const title = String(quickCreateTitleInput?.value || "").trim();
  const message = String(quickCreateMessageInput?.value || "").trim();
  if (!title || !message) {
    setMessage(t("msg_fill_title_summary"), "error");
    return;
  }
  try {
    const payload = new FormData();
    payload.append("title", title);
    payload.append("message", message);
    payload.append("type", "INFO");
    payload.append("reference_type", mode === "feature" ? "FEATURE_REQUEST" : "USER_NOTIFICATION");
    payload.append("reference_id", state.currentUser?.id || "");
    const screenshot = quickCreateScreenshotInput?.files?.[0];
    if (screenshot) {
      payload.append("screenshot", screenshot);
    }
    await apiRequest("/api/v1/notifications/", {
      method: "POST",
      headers: getHeaders(false),
      body: payload,
    });
    await loadNotifications();
    if (isManagerRole()) {
      await Promise.all([loadAdminDashboard(), loadOperationsDashboard()]);
    }
    refreshHomeDashboard();
    closeQuickCreate();
    quickCreateForm.reset();
    setMessage(mode === "feature" ? t("msg_feature_submitted") : t("msg_notification_created"), "success");
  } catch (error) {
    setMessage(error.message || t("msg_record_create_error"), "error");
  }
});
globalSearchInput?.addEventListener("input", () => {
  renderUsers();
  renderReports();
  renderLeaves();
  renderNotifications();
  renderAnalyticsDashboard();
});
globalStatusInput?.addEventListener("input", () => {
  renderUsers();
  renderReports();
  renderLeaves();
  renderAnalyticsDashboard();
});
notificationSearchInput?.addEventListener("input", renderNotifications);
notificationReadFilter?.addEventListener("change", renderNotifications);
userSearchInput?.addEventListener("input", renderUsers);
reportSearchInput?.addEventListener("input", renderReports);
leaveSearchInput?.addEventListener("input", renderLeaves);
departmentSearchInput?.addEventListener("input", renderAnalyticsDashboard);
document.getElementById("operationsDepartmentSearch")?.addEventListener("input", renderOperationsDashboard);
document.getElementById("refreshOperationsDashboard")?.addEventListener("click", () => {
  loadOperationsDashboard().catch((error) => setMessage(error.message, "error"));
});
roleFilter?.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
levelFilter?.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
reportStatusFilter?.addEventListener("change", () => loadReports().catch((error) => setMessage(error.message, "error")));
leaveStatusFilter?.addEventListener("change", () => loadLeaves().catch((error) => setMessage(error.message, "error")));
renderFeedbackList();
setFeedbackRating(0);
applyTranslations();
bindDashboardDrilldowns();
updateFeedbackAvailability();

const THEME_OPTIONS = Array.isArray(window.HRMM_THEME_OPTIONS) ? window.HRMM_THEME_OPTIONS : [];
const THEME_BY_ID = new Map(THEME_OPTIONS.map((theme) => [theme.id, theme]));
const DEFAULT_THEME_ID = THEME_BY_ID.has("classic-dark") ? "classic-dark" : THEME_OPTIONS[0]?.id || "classic-light";
let themeMediaQuery = null;

function normalizeThemeId(themeId) {
  if (themeId === "dark") return "classic-dark";
  if (themeId === "light") return "classic-light";
  return THEME_BY_ID.has(themeId) ? themeId : DEFAULT_THEME_ID;
}

function getSystemThemeId() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "classic-dark" : "classic-light";
}

function getActiveThemeId() {
  if (state.themeMode === "system") {
    return getSystemThemeId();
  }
  return normalizeThemeId(state.themeId);
}

function toCssVariableName(tokenName) {
  return `--${tokenName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  if (![3, 6].includes(normalized.length)) return null;
  const value = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  const intValue = Number.parseInt(value, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function colorWithAlpha(color, alpha) {
  const rgb = hexToRgb(color);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : color;
}

function getThemeTokens(theme) {
  return {
    ...theme.tokens,
    ...(state.increaseContrast ? theme.contrastTokens || {} : {}),
  };
}

function setRootThemeVariables(tokens) {
  const root = document.documentElement;
  const aliases = {
    background: ["bg"],
    backgroundDeep: ["bg-deep"],
    backgroundElevated: ["bg-elevated"],
    surface: ["panel", "panel-strong"],
    surfaceElevated: [],
    border: ["line", "border-subtle"],
    borderStrong: ["border-strong"],
    textPrimary: ["text"],
    textSecondary: [],
    textMuted: ["muted"],
    radiusSm: ["radius-sm"],
    radiusMd: ["radius-md"],
    radiusLg: ["radius-lg"],
    radiusXl: ["radius-xl"],
    iconBtnSize: ["icon-btn-size"],
  };

  Object.entries(tokens).forEach(([tokenName, value]) => {
    root.style.setProperty(toCssVariableName(tokenName), value);
    (aliases[tokenName] || []).forEach((alias) => root.style.setProperty(`--${alias}`, value));
  });

  root.style.setProperty("--accent-bg", colorWithAlpha(tokens.accent, 0.14));
  root.style.setProperty("--accent-soft", tokens.accentSoft || colorWithAlpha(tokens.accent, 0.2));
  root.style.setProperty("--success-bg", colorWithAlpha(tokens.success, 0.16));
  root.style.setProperty("--success-soft", colorWithAlpha(tokens.success, 0.1));
  root.style.setProperty("--warning-bg", colorWithAlpha(tokens.warning, 0.18));
  root.style.setProperty("--warning-soft", colorWithAlpha(tokens.warning, 0.11));
  root.style.setProperty("--danger-bg", colorWithAlpha(tokens.danger, 0.16));
  root.style.setProperty("--danger-soft", colorWithAlpha(tokens.danger, 0.1));
  root.style.setProperty("--overlay", tokens.mode === "light" ? "rgba(15, 23, 42, 0.42)" : "rgba(0, 0, 0, 0.68)");
  root.style.setProperty("--shadow-sm", "0 1px 2px rgba(15, 23, 42, 0.08)");
  root.style.setProperty("--shadow", "0 8px 24px rgba(15, 23, 42, 0.12)");
  root.style.setProperty("--shadow-md", "0 12px 32px rgba(15, 23, 42, 0.16)");
  root.style.setProperty("--shadow-lg", "0 18px 48px rgba(15, 23, 42, 0.2)");
  root.style.setProperty("--modal-shadow", "0 24px 70px rgba(15, 23, 42, 0.28)");
  root.style.setProperty("--primary", tokens.accent);
  root.style.setProperty("--purple", tokens.accent);
  root.style.setProperty("--coral", tokens.danger);
}

function applyTheme(themeId = getActiveThemeId()) {
  const normalizedId = normalizeThemeId(themeId);
  const theme = THEME_BY_ID.get(normalizedId) || THEME_BY_ID.get(DEFAULT_THEME_ID);
  if (!theme) return;

  const tokens = getThemeTokens(theme);
  tokens.mode = theme.mode;
  setRootThemeVariables(tokens);

  document.documentElement.setAttribute("data-theme", theme.id);
  document.documentElement.setAttribute("data-theme-mode", theme.mode);
  document.documentElement.classList.toggle("theme-contrast", state.increaseContrast);
  document.documentElement.classList.toggle("dark", theme.mode === "dark");
  document.body?.setAttribute("data-theme", theme.id);
  document.body?.setAttribute("data-theme-mode", theme.mode);
  document.body?.classList.toggle("theme-contrast", state.increaseContrast);
  document.body?.classList.toggle("dark", theme.mode === "dark");

  updateThemeButtons(theme);
  renderThemeCards();
  forceThemeRepaint();
}

function forceThemeRepaint() {
  document.documentElement.style.setProperty("--theme-repaint", String(Date.now()));
  ["renderDashboard", "renderRecentReports", "renderRecentLeaves", "renderNotifications", "renderReports", "renderLeaves", "renderUsers"]
    .forEach((name) => {
      try {
        const renderFn = typeof window !== "undefined" ? window[name] : undefined;
        if (typeof renderFn === "function") renderFn();
      } catch (error) {
        console.warn("Theme repaint skipped for one renderer:", name, error);
      }
    });
}

function renderThemePreview(theme) {
  const tokens = getThemeTokens(theme);
  return `
    <svg class="theme-preview-svg" viewBox="0 0 320 160" role="img" aria-label="${escapeHtml(theme.name)} preview">
      <rect width="320" height="160" rx="14" fill="${tokens.background}"/>
      <rect x="16" y="16" width="288" height="28" rx="8" fill="${tokens.surfaceElevated}"/>
      <circle cx="34" cy="30" r="5" fill="${tokens.danger}"/>
      <circle cx="50" cy="30" r="5" fill="${tokens.warning}"/>
      <circle cx="66" cy="30" r="5" fill="${tokens.success}"/>
      <rect x="16" y="58" width="58" height="86" rx="10" fill="${tokens.surface}" stroke="${tokens.border}"/>
      <rect x="88" y="58" width="216" height="86" rx="10" fill="${tokens.surface}" stroke="${tokens.border}"/>
      <rect x="101" y="73" width="74" height="8" rx="4" fill="${tokens.textPrimary}"/>
      <rect x="101" y="91" width="162" height="7" rx="3.5" fill="${tokens.textMuted}"/>
      <rect x="101" y="109" width="124" height="7" rx="3.5" fill="${tokens.textMuted}"/>
      <rect x="16" y="58" width="6" height="86" rx="3" fill="${tokens.accent}"/>
      <rect x="32" y="75" width="26" height="8" rx="4" fill="${tokens.accent}"/>
      <rect x="32" y="96" width="30" height="6" rx="3" fill="${tokens.textMuted}"/>
      <rect x="32" y="114" width="22" height="6" rx="3" fill="${tokens.textMuted}"/>
      <circle cx="276" cy="113" r="14" fill="${tokens.accent}"/>
    </svg>
  `;
}

function renderThemeCards() {
  if (!themeCardGrid || !THEME_OPTIONS.length) return;
  const activeThemeId = getActiveThemeId();
  themeCardGrid.innerHTML = THEME_OPTIONS.map((theme) => {
    const selected = theme.id === activeThemeId;
    return `
      <button type="button" class="theme-card${selected ? " selected" : ""}" data-theme-card="${theme.id}" role="radio" aria-checked="${selected}">
        <span class="theme-card-preview">
          ${renderThemePreview(theme)}
          ${theme.badge ? `<span class="theme-card-badge">${escapeHtml(theme.badge)}</span>` : ""}
        </span>
        <span class="theme-card-body">
          <span class="theme-radio" aria-hidden="true"></span>
          <span class="theme-card-text">
            <strong>${escapeHtml(theme.name)}</strong>
            <span>${escapeHtml(theme.description)}</span>
          </span>
        </span>
      </button>
    `;
  }).join("");
}

function persistAppearanceSettings() {
  window.localStorage.setItem("hrmm_theme_id", normalizeThemeId(state.themeId));
  window.localStorage.setItem("hrmm_theme_mode", state.themeMode);
  window.localStorage.setItem("hrmm_increase_contrast", String(state.increaseContrast));
  window.localStorage.removeItem("hrmm_theme");
}

function updateThemeButtons(theme) {
  const title = `Appearance settings: ${theme.name}`;
  [document.getElementById("themeToggleButton"), loginThemeToggleButton].forEach((button) => {
    button?.classList.toggle("is-dark", theme.mode === "dark");
    button?.setAttribute("aria-label", title);
    button?.setAttribute("title", title);
  });
}

function bindSystemThemeSync() {
  if (!window.matchMedia) return;
  themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const syncHandler = () => {
    if (state.themeMode === "system") {
      applyTheme(getSystemThemeId());
    }
  };
  themeMediaQuery.addEventListener?.("change", syncHandler);
  themeMediaQuery.addListener?.(syncHandler);
}

// ===== Animated background effects =====
const BG_EFFECTS = ["none", "particles", "matrix", "cosmos", "lineart", "glass", "retro", "quantum"];
const bgEffectCanvas = document.getElementById("bgEffectCanvas");
let bgEffectRaf = null;
let bgEffectResizeHandler = null;
const bgEffectMouse = { x: -9999, y: -9999 };

function normalizeBgEffect(value) {
  return BG_EFFECTS.includes(value) ? value : "none";
}

function persistBgEffect() {
  window.localStorage.setItem("hrmm_bg_effect", normalizeBgEffect(state.bgEffect));
}

function stopBgEffect() {
  if (bgEffectRaf) {
    cancelAnimationFrame(bgEffectRaf);
    bgEffectRaf = null;
  }
  if (bgEffectResizeHandler) {
    window.removeEventListener("resize", bgEffectResizeHandler);
    bgEffectResizeHandler = null;
  }
}

function setupBgCanvas(onResize) {
  const canvas = bgEffectCanvas;
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (typeof onResize === "function") onResize();
  };
  resize();
  bgEffectResizeHandler = resize;
  window.addEventListener("resize", resize);
  return ctx;
}

function startParticlesEffect() {
  const canvas = bgEffectCanvas;
  const ctx = setupBgCanvas();
  let points = [];
  const seed = () => {
    const count = Math.max(40, Math.min(120, Math.floor((canvas.width * canvas.height) / 16000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
  };
  seed();
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#070a1c");
    bg.addColorStop(1, "#0d0a24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = bgEffectMouse.x - p.x;
      const dy = bgEffectMouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 160) {
        p.x += dx * 0.012;
        p.y += dy * 0.012;
      }
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 130) {
          ctx.strokeStyle = `rgba(86, 180, 255, ${(1 - d / 130) * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of points) {
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    bgEffectRaf = requestAnimationFrame(draw);
  };
  bgEffectResizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    seed();
  };
  window.addEventListener("resize", bgEffectResizeHandler);
  draw();
}

function startMatrixEffect() {
  const canvas = bgEffectCanvas;
  const fontSize = 16;
  let drops = [];
  const ctx = setupBgCanvas(() => {
    const columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * -50);
  });
  const columns = Math.floor(canvas.width / fontSize);
  drops = Array.from({ length: columns }, () => Math.random() * -50);
  const chars = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF<>/\\{}[]=+*";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const draw = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#15ff6a";
    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function startCosmosEffect() {
  const canvas = bgEffectCanvas;
  let stars = [];
  const seed = () => {
    const count = Math.max(120, Math.min(320, Math.floor((canvas.width * canvas.height) / 8000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.02 + 0.004,
    }));
  };
  const ctx = setupBgCanvas(seed);
  seed();
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, "#05030f");
    base.addColorStop(0.5, "#0a0820");
    base.addColorStop(1, "#03020a");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const nebulae = [
      ["rgba(123, 80, 220, 0.22)", w * 0.34, h * 0.4, Math.max(w, h) * 0.42],
      ["rgba(220, 80, 160, 0.16)", w * 0.72, h * 0.62, Math.max(w, h) * 0.36],
      ["rgba(60, 120, 230, 0.15)", w * 0.55, h * 0.28, Math.max(w, h) * 0.3],
    ];
    for (const [color, x, y, rad] of nebulae) {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, color);
      rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    for (const s of stars) {
      s.tw += s.sp;
      const alpha = 0.45 + Math.sin(s.tw) * 0.45;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function startLineArtEffect() {
  const canvas = bgEffectCanvas;
  const ctx = setupBgCanvas();
  let t = 0;
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    const dark = document.body.classList.contains("dark");
    ctx.fillStyle = dark ? "#0a0a12" : "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const count = 20;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.strokeStyle = dark
        ? `rgba(80, 170, 255, ${0.10 + 0.05 * Math.sin(i + t * 0.01)})`
        : `rgba(120, 122, 135, ${0.18 + 0.06 * Math.sin(i)})`;
      ctx.lineWidth = dark ? 1.2 : 1;
      const amp = 30 + i * 5;
      const yBase = (h / count) * i + h * 0.02;
      for (let x = 0; x <= w; x += 8) {
        const y =
          yBase +
          Math.sin(x * 0.006 + t * 0.02 + i * 0.5) * amp * 0.45 +
          Math.sin(x * 0.0018 + t * 0.012) * 22;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    t += 1;
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function startGlassEffect() {
  const canvas = bgEffectCanvas;
  let shapes = [];
  const seed = () => {
    shapes = Array.from({ length: 7 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 60 + Math.random() * 130,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      hue: Math.random() * 360,
    }));
  };
  const ctx = setupBgCanvas(seed);
  seed();
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#e9e4ff");
    g.addColorStop(0.5, "#e2fff5");
    g.addColorStop(1, "#ffe7f1");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (const s of shapes) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -s.r) s.x = w + s.r;
      if (s.x > w + s.r) s.x = -s.r;
      if (s.y < -s.r) s.y = h + s.r;
      if (s.y > h + s.r) s.y = -s.r;
      const rg = ctx.createRadialGradient(s.x - s.r * 0.3, s.y - s.r * 0.3, s.r * 0.1, s.x, s.y, s.r);
      rg.addColorStop(0, `hsla(${s.hue}, 80%, 85%, 0.55)`);
      rg.addColorStop(1, `hsla(${s.hue}, 70%, 72%, 0.10)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(s.x - s.r * 0.32, s.y - s.r * 0.32, s.r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function startRetroEffect() {
  const canvas = bgEffectCanvas;
  let scene = null;
  let grain = null;
  const buildScene = () => {
    const w = canvas.width;
    const h = canvas.height;
    scene = document.createElement("canvas");
    scene.width = w;
    scene.height = h;
    const sctx = scene.getContext("2d");
    sctx.fillStyle = "#2c2a28";
    sctx.fillRect(0, 0, w, h);
    const tile = 90;
    const isoW = tile;
    const isoH = tile * 0.5;
    const tops = ["#c08457", "#d9c2a3", "#8a9a5b"];
    const drawCube = (x, y, hgt, top) => {
      const hw = isoW * 0.5;
      const hh = isoH * 0.5;
      sctx.fillStyle = top;
      sctx.beginPath();
      sctx.moveTo(x, y - hgt);
      sctx.lineTo(x + hw, y - hh - hgt);
      sctx.lineTo(x, y - isoH - hgt);
      sctx.lineTo(x - hw, y - hh - hgt);
      sctx.closePath();
      sctx.fill();
      sctx.fillStyle = "rgba(0,0,0,0.28)";
      sctx.beginPath();
      sctx.moveTo(x - hw, y - hh - hgt);
      sctx.lineTo(x, y - hgt);
      sctx.lineTo(x, y);
      sctx.lineTo(x - hw, y - hh);
      sctx.closePath();
      sctx.fill();
      sctx.fillStyle = "rgba(0,0,0,0.12)";
      sctx.beginPath();
      sctx.moveTo(x + hw, y - hh - hgt);
      sctx.lineTo(x, y - hgt);
      sctx.lineTo(x, y);
      sctx.lineTo(x + hw, y - hh);
      sctx.closePath();
      sctx.fill();
    };
    for (let row = -2; row < h / isoH + 2; row++) {
      for (let col = -2; col < w / isoW + 2; col++) {
        const x = (col - row) * isoW * 0.5 + w * 0.5;
        const y = (col + row) * isoH * 0.5;
        const top = tops[((row + col) % 3 + 3) % 3];
        const hgt = 18 + (((row * 7 + col * 13) % 3) + 3) % 3 * 16;
        drawCube(x, y, hgt, top);
      }
    }
    grain = document.createElement("canvas");
    grain.width = 140;
    grain.height = 140;
    const gctx = grain.getContext("2d");
    const img = gctx.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + Math.random() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 60;
    }
    gctx.putImageData(img, 0, 0);
  };
  const ctx = setupBgCanvas(buildScene);
  buildScene();
  const pattern = () => ctx.createPattern(grain, "repeat");
  const draw = () => {
    ctx.drawImage(scene, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(Math.random() * 140, Math.random() * 140);
    ctx.fillStyle = pattern();
    ctx.fillRect(-140, -140, canvas.width + 280, canvas.height + 280);
    ctx.restore();
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function startQuantumEffect() {
  const canvas = bgEffectCanvas;
  const ctx = setupBgCanvas();
  let t = 0;
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#05030d";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    const cy = h / 2;
    const lines = 24;
    for (let i = 0; i < lines; i++) {
      ctx.beginPath();
      const hue = 250 - i * 4;
      ctx.strokeStyle = `hsla(${hue}, 90%, 62%, 0.32)`;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${hue}, 90%, 62%, 0.55)`;
      for (let x = 0; x <= w; x += 6) {
        const norm = (x / w) * Math.PI * 2;
        const envelope = Math.sin((x / w) * Math.PI) * (h * 0.2);
        const y =
          cy +
          Math.sin(norm * 2 + t * 0.02 + i * 0.3) * envelope * (1 - (i / lines) * 0.3) +
          (i - lines / 2) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    t += 1;
    bgEffectRaf = requestAnimationFrame(draw);
  };
  draw();
}

function applyBgEffect(effect) {
  const value = normalizeBgEffect(effect);
  state.bgEffect = value;
  stopBgEffect();
  document.body.classList.remove(
    "bg-effect-particles",
    "bg-effect-matrix",
    "bg-effect-cosmos",
    "bg-effect-lineart",
    "bg-effect-glass",
    "bg-effect-retro",
    "bg-effect-quantum"
  );
  document.body.classList.toggle("bg-effect-active", value !== "none");
  if (value === "none") return;
  document.body.classList.add(`bg-effect-${value}`);
  if (!bgEffectCanvas) return;
  if (document.visibilityState !== "visible") return;
  const starters = {
    particles: startParticlesEffect,
    matrix: startMatrixEffect,
    cosmos: startCosmosEffect,
    lineart: startLineArtEffect,
    glass: startGlassEffect,
    retro: startRetroEffect,
    quantum: startQuantumEffect,
  };
  starters[value]?.();
}

window.addEventListener("mousemove", (event) => {
  bgEffectMouse.x = event.clientX;
  bgEffectMouse.y = event.clientY;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    stopBgEffect();
  } else if (state.bgEffect && state.bgEffect !== "none") {
    applyBgEffect(state.bgEffect);
  }
});

function initAppearanceSettings() {
  state.themeId = normalizeThemeId(state.themeId);
  state.themeMode = state.themeMode === "system" ? "system" : "single";
  if (themeModeSelect) themeModeSelect.value = state.themeMode;
  if (increaseContrastToggle) increaseContrastToggle.checked = state.increaseContrast;

  renderThemeCards();
  applyTheme(getActiveThemeId());
  bindSystemThemeSync();

  state.bgEffect = normalizeBgEffect(state.bgEffect);
  if (backgroundEffectSelect) backgroundEffectSelect.value = state.bgEffect;
  applyBgEffect(state.bgEffect);
  backgroundEffectSelect?.addEventListener("change", () => {
    state.bgEffect = normalizeBgEffect(backgroundEffectSelect.value);
    persistBgEffect();
    applyBgEffect(state.bgEffect);
  });

  themeModeSelect?.addEventListener("change", () => {
    state.themeMode = themeModeSelect.value === "system" ? "system" : "single";
    persistAppearanceSettings();
    applyTheme(getActiveThemeId());
  });

  increaseContrastToggle?.addEventListener("change", () => {
    state.increaseContrast = Boolean(increaseContrastToggle.checked);
    persistAppearanceSettings();
    applyTheme(getActiveThemeId());
  });

  themeCardGrid?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-theme-card]");
    if (!card) return;
    state.themeId = normalizeThemeId(card.dataset.themeCard);
    state.themeMode = "single";
    if (themeModeSelect) themeModeSelect.value = state.themeMode;
    persistAppearanceSettings();
    applyTheme(state.themeId);
  });

  [document.getElementById("themeToggleButton"), loginThemeToggleButton].forEach((button) => {
    button?.addEventListener("click", () => {
      if (appView && !appView.classList.contains("hidden")) {
        openSectionModal("appearanceSection", t("appearance_settings"));
      } else {
        const currentIndex = Math.max(0, THEME_OPTIONS.findIndex((theme) => theme.id === getActiveThemeId()));
        state.themeId = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length]?.id || DEFAULT_THEME_ID;
        state.themeMode = "single";
        persistAppearanceSettings();
        applyTheme(state.themeId);
      }
    });
  });
}

function toggleTopbarMobileMenu(forceOpen) {
  if (!topbarPanel || !topbarMobileToggle) return;
  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : !topbarPanel.classList.contains("menu-open");
  topbarPanel.classList.toggle("menu-open", shouldOpen);
  topbarMobileToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function initTheme() {
  initAppearanceSettings();
}

topbarMobileToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleTopbarMobileMenu();
});

if (document.readyState === "loading") {
  document?.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}

// Role-based UI update to include new sidebar items
function applyRoleBasedUi() {
  const role = state.currentUser?.role || "";
  const navVisibility = {
    homeSection: true,
    notificationsSection: true,
    reportsSection: true,
    leavesSection: role !== "DIRECTOR",
    usersSection: ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role),
    institutionsSection: ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role),
    appearanceSection: true,
  };

  navLinks.forEach((button) => {
    const isVisible = navVisibility[button.dataset.target] !== false;
    button.classList.toggle("hidden", !isVisible);
  });

  const usersSection = document.getElementById("usersSection");
  const leavesSection = document.getElementById("leavesSection");
  const roleManagementPanel = roleManagementForm?.closest(".panel");
  
  usersSection?.classList.toggle("hidden", !["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role));
  leavesSection?.classList.toggle("hidden", role === "DIRECTOR");
  roleManagementPanel?.classList.toggle("hidden", role !== "DIRECTOR");
  profileAddUserButton?.classList.toggle("hidden", !["DIRECTOR", "DEPT_HEAD"].includes(role));
  
  createMenuItems.forEach((button) => {
    const action = button.dataset.createAction;
    // All roles can see all create menu items
    const allowed = true;
    button.classList.toggle("hidden", !allowed);
  });

  // Log collection system is visible only to admins, inside the Archive section.
  const isAdminRole = ["DIRECTOR", "ADMIN"].includes(role);
  const systemLogsPanel = document.getElementById("systemLogsPanel");
  systemLogsPanel?.classList.toggle("hidden", !isAdminRole);
  if (isAdminRole && typeof renderSystemLogs === "function") renderSystemLogs();
}

// Workflow form action select handler for comment hint
const workflowActionSelect = document.getElementById("workflowActionSelect");
const workflowComment = document.getElementById("workflowComment");
const commentHint = document.getElementById("commentHint");

function updateCommentHint() {
  if (!commentHint) return;
  const action = workflowActionSelect?.value;
  if (action === "REJECT" || action === "REQUEST_REVISION") {
    commentHint.textContent = "(majburiy)";
    workflowComment?.setAttribute("required", "true");
    workflowComment?.setAttribute("placeholder", "Rad etish sababini yoki qayta ko'rib chiqish talablarini yozing...");
  } else if (action === "APPROVE") {
    commentHint.textContent = "(ixtiyoriy, tavsiya etiladi)";
    workflowComment?.removeAttribute("required");
    workflowComment?.setAttribute("placeholder", "Tasdiqlash izohi (ixtiyoriy)...");
  } else {
    commentHint.textContent = "(ixtiyoriy)";
    workflowComment?.removeAttribute("required");
    workflowComment?.setAttribute("placeholder", "Tasdiqlash yoki rad etish izohi...");
  }
}

workflowActionSelect?.addEventListener("change", updateCommentHint);
updateCommentHint();
