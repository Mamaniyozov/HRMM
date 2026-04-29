const DEFAULT_API_BASE =
  window.location.port === "8000" ? window.location.origin : "http://127.0.0.1:8000";

const state = {
  apiBase: DEFAULT_API_BASE,
  language: window.localStorage.getItem("hrmm_language") || "uz",
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
  notifications: [],
  adminDashboard: null,
  analyticsDashboard: null,
  leaveCalendar: [],
  reportHistory: [],
  lastCreatedReportId: "",
};

const loginForm = document.getElementById("loginForm");
const otpForm = document.getElementById("otpForm");
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
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
const userForm = document.getElementById("userForm");
const reportForm = document.getElementById("reportForm");
const workflowForm = document.getElementById("workflowForm");
const attachmentForm = document.getElementById("attachmentForm");
const attachmentToolsForm = document.getElementById("attachmentToolsForm");
const leaveForm = document.getElementById("leaveForm");
const leaveReviewForm = document.getElementById("leaveReviewForm");
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
const leavesTableBody = document.getElementById("leavesTableBody");
const auditTableBody = document.getElementById("auditTableBody");
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
const createMenuButton = document.getElementById("createMenuButton");
const createMenuDropdown = document.getElementById("createMenuDropdown");
const createMenuItems = document.querySelectorAll(".create-menu-item");
const languageMenuButton = document.getElementById("languageMenuButton");
const languageDropdown = document.getElementById("languageDropdown");
const currentLanguageLabel = document.getElementById("currentLanguageLabel");
const languageOptions = document.querySelectorAll(".language-option");
const topbarNotificationsButton = document.getElementById("topbarNotificationsButton");
const dashboardWelcomeName = document.getElementById("dashboardWelcomeName");
const unreadNotificationsValue = document.getElementById("unreadNotificationsValue");
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
const leaveSearchInput = document.getElementById("leaveSearchInput");
const departmentSearchInput = document.getElementById("departmentSearchInput");
const refreshAllButton = document.getElementById("refreshAllButton");
const navLinks = document.querySelectorAll(".nav-link");

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
const pendingLeavesValue = document.getElementById("pendingLeavesValue");
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
  uz: "O'zbek tili",
  ru: "Rus tili",
  en: "Ingliz tili",
  tr: "Turk tili",
};

const translations = {
  uz: {
    app_title: "HRMM Boshqaruv Markazi",
    guest: "Mehmon",
    refresh: "Yangilash",
    new: "Yangi",
    language: "Til",
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
    activity_history: "Faoliyat tarixi",
    activity_watch: "Userlar nima qilayotganini ko'rish",
    requests: "Arizalar",
    rating: "Baholash",
    feedback_comments: "Fikr va kommentariya",
    online: "Online",
    offline: "Offline",
    profile_details: "Profil ma'lumotlari",
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
    create_report_menu: "Yangi report",
    create_notification_menu: "Yangi bildirim",
    create_leave_menu: "Yangi ariza",
    create_feature_menu: "Yangi funksiya talabi",
    employees_section: "Xodimlar",
    sync_system: "Tizimni yangilash",
    section_window: "Bo'lim oynasi",
    close: "Yopish",
    reports_eyebrow: "Reports",
    create_report_title: "Report yaratish",
    report_number: "Report raqami",
    report_auto_placeholder: "Avtomatik yaratiladi",
    report_title: "Sarlavha",
    report_title_placeholder: "Choraklik operatsion xulosa",
    report_comment: "Izoh",
    report_comment_placeholder: "Report haqida qisqa izoh",
    report_content: "Mazmun",
    report_content_placeholder: "Batafsil report mazmuni",
    report_image: "Screenshot yoki rasm",
    report_department: "Department",
    report_department_default: "Joriy foydalanuvchi departmenti",
    no_departments_available: "Departmentlar mavjud emas",
    no_departments: "Department yo'q",
    create_report_button: "Report yaratish",
    latest_report_id: "Yangi report UUID",
    not_created_yet: "Hali yaratilmagan",
    copy_uuid: "UUID nusxalash",
    apply_uuid_to_forms: "ID ni pastdagi formlarga qo'yish",
    report_modal_title: "Yangi report",
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
    profile_details: "Данные профиля",
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
    employee_profile: "Профиль сотрудника",
    full_name: "Полное имя",
    username: "Имя пользователя",
    email: "Email",
    management_role: "Управленческая роль",
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
    profile_details: "Profile details",
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
    sidebar_home: "Ana sayfa",
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
    profile_details: "Profil bilgileri",
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
    no_departments: "Departman bulunmadi",
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

  toast.addEventListener("click", () => {
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
}

function toggleProfileMenu(forceOpen) {
  if (!profileDropdown || !profileMenuButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : profileDropdown.classList.contains("hidden");
  profileDropdown.classList.toggle("hidden", !shouldOpen);
  profileMenuButton.setAttribute("aria-expanded", String(shouldOpen));
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
  const base = {
    notification: {
      title: "Bildirishnoma berishda e'tiborga olish kerak bo'lgan jihatlar",
      items: [
        {
          title: "Bemor va xodimlar haqidagi ma'lumotlar yozib olinmasligi kerak.",
          text: "Bildirishnomalarni barcha foydalanuvchilar o'qiy oladi. Shuning uchun maxfiy yoki shaxsiy ma'lumotlarni kiritmang.",
        },
        {
          title: "Foydalanuvchi nomi va parol kiritilmasligi kerak.",
          text: "Matnga login, parol, kalit yoki boshqa maxfiy kirish ma'lumotlarini yozmang.",
        },
        {
          title: "Bildirishnoma bitta aniq maqsadga qaratilgan bo'lishi kerak.",
          text: "Har bir bildirishnoma bir vazifa yoki bir ogohlantirishga xizmat qilsin. Juda aralash matn yozmang.",
        },
        {
          title: "Matn ixcham va tushunarli bo'lishi kerak.",
          text: "Qisqa, aniq va hammaga bir xil tushuniladigan uslubdan foydalaning.",
        },
      ],
    },
    leave: {
      title: "Ariza yuborishda e'tiborga olish kerak bo'lgan jihatlar",
      items: [
        {
          title: "Sana va muddatlar to'g'ri tanlangan bo'lishi kerak.",
          text: "Boshlanish va tugash sanasi xato bo'lmasin, ariza mazmuni aynan shu davrga mos bo'lsin.",
        },
        {
          title: "Sabab rasmiy va tushunarli yozilishi kerak.",
          text: "Keraksiz hissiy iboralar o'rniga qisqa va rasmiy izoh kiriting.",
        },
        {
          title: "Maxfiy ma'lumot kiritilmasligi kerak.",
          text: "Pasport, parol, shaxsiy tibbiy tafsilotlar yoki boshqa nozik ma'lumotlarni yozmang.",
        },
        {
          title: "Takroriy ariza yuborilmasligi kerak.",
          text: "Shu davr uchun oldin ariza yuborilgan bo'lsa, yangisini emas, mavjudini tekshiring.",
        },
      ],
    },
    report: {
      title: "Hujjat yaratishda e'tiborga olish kerak bo'lgan jihatlar",
      items: [
        {
          title: "Sarlavha mazmunga mos va rasmiy bo'lishi kerak.",
          text: "Hujjat nomi qisqa, aniq va keyinchalik qidiruvda topiladigan ko'rinishda yozilsin.",
        },
        {
          title: "Mazmun tekshirilgan va izchil bo'lishi kerak.",
          text: "Hujjat ichida noto'g'ri raqamlar, chala fikrlar yoki tasdiqlanmagan ma'lumot qolmasin.",
        },
        {
          title: "Maxfiy yoki ortiqcha shaxsiy ma'lumot kiritilmasligi kerak.",
          text: "Faqat ish jarayoniga tegishli ma'lumotlarni yozing, oshkor qilinmasligi kerak bo'lgan ma'lumotlarni kiritmang.",
        },
        {
          title: "Bir xil hujjatni takror yaratmaslik kerak.",
          text: "Shu mavzuda avval hujjat bo'lsa, yangisini ochishdan oldin mavjudini tekshirib chiqing.",
        },
      ],
    },
  };

  return base[type] || base.report;
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
  if (currentLanguageLabel) {
    currentLanguageLabel.textContent = languageNames[state.language] || languageNames.uz;
  }
  if (loginCurrentLanguageLabel) {
    loginCurrentLanguageLabel.textContent = languageNames[state.language] || languageNames.uz;
  }
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
  if (loginSubmitButton) loginSubmitButton.textContent = t("login_submit");
  if (loginFootnote) loginFootnote.textContent = t("login_footnote");
  if (loginManualKeyLabel) loginManualKeyLabel.textContent = t("login_manual_key");
  if (loginQrHint) loginQrHint.textContent = t("login_qr_hint");
  if (otpCodeLabel) otpCodeLabel.textContent = t("login_code_label");
  if (otpSubmitButton) otpSubmitButton.textContent = t("login_code_submit");
  if (backToLoginButton) backToLoginButton.textContent = t("login_back");

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
  if (languageMenuButton?.querySelector("span")) {
    languageMenuButton.querySelector("span").textContent = t("language");
  }
  if (refreshAllButton) refreshAllButton.textContent = t("refresh");
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
    if (badges[0]) badges[0].childNodes[0].textContent = `${t("resolved_requests")}: `;
    if (badges[1]) badges[1].childNodes[0].textContent = `${t("approved_reports")}: `;
  }
  if (statCards?.[3]) {
    statCards[3].querySelector(".dashboard-stat-head span")?.replaceChildren(document.createTextNode(t("notifications")));
    const badges = statCards[3].querySelectorAll(".dashboard-badge");
    if (badges[0]) badges[0].childNodes[0].textContent = `${t("rejected")}: `;
    if (badges[1]) badges[1].childNodes[0].textContent = `${t("approved_request")}: `;
  }

  const historySection = homeSection?.querySelector(".dashboard-history-panel");
  if (historySection) {
    historySection.querySelector(".eyebrow")?.replaceChildren(document.createTextNode(t("activity_history")));
    historySection.querySelector("h3")?.replaceChildren(document.createTextNode(t("activity_watch")));
    historySection.querySelector('[data-activity-filter="all"]')?.replaceChildren(document.createTextNode(t("all")));
    historySection.querySelectorAll('[data-activity-filter="requests"]').forEach((node) => {
      if (node.closest(".dashboard-history-panel")) {
        node.textContent = t("requests");
      }
    });
    historySection.querySelectorAll('[data-activity-filter="reports"]').forEach((node) => {
      if (node.closest(".dashboard-history-panel")) {
        node.textContent = t("reports_short");
      }
    });
  }

  const feedbackPanel = homeSection?.querySelector(".dashboard-feedback-panel");
  if (feedbackPanel) {
    feedbackPanel.querySelector(".eyebrow")?.replaceChildren(document.createTextNode(t("rating")));
    feedbackPanel.querySelector("h3")?.replaceChildren(document.createTextNode(t("feedback_comments")));
  }

  if (meButton) {
    meButton.title = t("profile_details");
    meButton.setAttribute("aria-label", t("profile_details"));
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
}

function applyRoleBasedUi() {
  const role = state.currentUser?.role || "";
  const navVisibility = {
    homeSection: true,
    notificationsSection: true,
    reportsSection: true,
    institutionsSection: ["DIRECTOR", "DEPT_HEAD", "UNIT_HEAD"].includes(role),
  };

  navLinks.forEach((button) => {
    const isVisible = navVisibility[button.dataset.target] !== false;
    button.classList.toggle("hidden", !isVisible);
  });

  const usersSection = document.getElementById("usersSection");
  const leavesSection = document.getElementById("leavesSection");
  usersSection?.classList.toggle("hidden", role !== "DIRECTOR");
  leavesSection?.classList.toggle("hidden", role === "DIRECTOR");
  createMenuItems.forEach((button) => {
    const action = button.dataset.createAction;
    const allowed =
      action === "leave"
        ? role !== "DIRECTOR"
        : true;
    button.classList.toggle("hidden", !allowed);
  });
}

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
    </section>
  `;
  if (sectionModalTitle) {
    sectionModalTitle.textContent = t("profile_details");
  }
  sectionModal.classList.remove("hidden");
  sectionModal.setAttribute("aria-hidden", "false");
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

function openReportDetailModal(report) {
  openContentModal(
    report.report_number || t("collection_title_reports"),
    t("collection_title_reports"),
    makeDetailItems([
      [t("report_title"), report.title],
      [t("report_comment"), report.summary],
      [t("report_content"), report.content || "-"],
      [t("report_department"), report.department_name || "-"],
      [t("management_role"), report.created_by_name || "-"],
      ["Status", report.status || "-"],
      ["Level", report.current_approval_level ? `L${report.current_approval_level}` : "-"],
      ["ID", report.id || "-"],
      ["Sana", formatDate(report.created_at)],
    ])
  );
}

function openLeaveDetailModal(leave) {
  openContentModal(
    leave.requested_by_name || t("collection_title_requests"),
    t("collection_title_requests"),
    makeDetailItems([
      [t("full_name"), leave.requested_by_name || "-"],
      ["Leave type", leave.leave_type || "-"],
      ["Status", leave.status || "-"],
      ["Boshlanish", leave.start_date || "-"],
      ["Tugash", leave.end_date || "-"],
      ["Kun", leave.total_days ?? "-"],
      ["Reviewer", leave.reviewed_by_name || "-"],
      ["Sabab", leave.reason || "-"],
      ["ID", leave.id || "-"],
    ])
  );
}

function openNotificationDetailModal(item) {
  openContentModal(
    item.title || t("collection_title_notifications"),
    t("collection_title_notifications"),
    makeDetailItems([
      [t("report_title"), item.title || "-"],
      [t("report_comment"), item.message || "-"],
      ["Type", item.type || "-"],
      ["Read", item.is_read ? t("active") : t("inactive")],
      ["ID", item.id || "-"],
      ["Sana", formatDate(item.created_at)],
      ["Reference", item.reference_type || "-"],
    ])
  );
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
    button.addEventListener("click", () => {
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

function openCollectionModal(title, items, type) {
  const html = items.length
    ? `<div class="detail-list">
        ${items
          .map((item, index) => {
            const primary =
              type === "report"
                ? item.report_number || item.title
                : type === "leave"
                  ? item.requested_by_name || item.leave_type
                  : item.title || item.id || `${type} ${index + 1}`;
            const secondary =
              type === "report"
                ? item.title
                : type === "leave"
                  ? `${item.leave_type || "-"} / ${item.status || "-"}`
                  : item.message;
            const meta =
              type === "report"
                ? `${item.created_by_name || "-"} / ${item.status || "-"}`
                : type === "leave"
                  ? `${item.start_date || "-"} - ${item.end_date || "-"}`
                  : `${item.type || "-"} / ${formatDate(item.created_at)}`;
            return `
              <button type="button" class="detail-list-item entity-detail-open-btn" data-type="${type}" data-id="${item.id}">
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
    button.addEventListener("click", () => {
      const typeName = button.dataset.type;
      const id = button.dataset.id;
      if (typeName === "report") {
        const report = state.reports.find((item) => item.id === id);
        if (report) openReportDetailModal(report);
      }
      if (typeName === "leave") {
        const leave = state.leaves.find((item) => item.id === id);
        if (leave) openLeaveDetailModal(leave);
      }
      if (typeName === "notification") {
        const item = state.notifications.find((entry) => entry.id === id);
        if (item) openNotificationDetailModal(item);
      }
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
    openCollectionModal(t("collection_title_requests"), state.leaves, "leave");
  });
  statCards[1]?.querySelector('[data-activity-filter="reports"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_reports"), state.reports, "report");
  });
  statCards[1]?.querySelector('[data-activity-filter="all"]')?.addEventListener("click", () => {
    openCollectionModal(t("collection_title_reports"), state.reports, "report");
  });
  statCards[2]?.querySelectorAll(".dashboard-badge")[0]?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_resolved_requests"),
      state.leaves.filter((leave) => ["APPROVED", "REJECTED"].includes(leave.status)),
      "leave"
    );
  });
  statCards[2]?.querySelectorAll(".dashboard-badge")[1]?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_approved_reports"),
      state.reports.filter((report) => report.status === "APPROVED"),
      "report"
    );
  });
  statCards[3]?.querySelectorAll(".dashboard-badge")[0]?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_rejected_reports"),
      state.reports.filter((report) => report.status === "REJECTED"),
      "report"
    );
  });
  statCards[3]?.querySelectorAll(".dashboard-badge")[1]?.addEventListener("click", () => {
    openCollectionModal(
      t("collection_title_approved_leaves"),
      state.leaves.filter((leave) => leave.status === "APPROVED"),
      "leave"
    );
  });
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  return headers;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    const fallbackMessage =
      response.status === 404
        ? `API topilmadi. Backend server ${state.apiBase} da ishga tushganini tekshiring.`
        : `So'rov bajarilmadi (${response.status}).`;
    const message = data?.message || data?.detail || JSON.stringify(data?.data || data) || fallbackMessage;
    throw new Error(message);
  }

  return data || {};
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
      ? '<div class="feedback-item muted-item">Hozircha kommentariya yo\'q.</div>'
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
            <strong>${entry.author_name || entry.author || "Foydalanuvchi"}</strong>
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

function buildActivityItems() {
  const reportItems = state.reports.map((report) => ({
    type: "reports",
    actor: report.created_by_name || "Foydalanuvchi",
    title: `${report.report_number || "Hisobot"} ${report.created_by_name || "foydalanuvchi"} tomonidan yaratildi`,
    meta: report.title || report.status || "Hisobot",
    time: report.created_at,
  }));

  const leaveItems = state.leaves.map((leave) => ({
    type: "requests",
    actor: leave.requested_by_name || "Foydalanuvchi",
    title: `${String(leave.id || "ARIZA").slice(0, 8)} ${leave.requested_by_name || "foydalanuvchi"} arizani yaratdi`,
    meta: `${leave.leave_type || "Ariza"} / ${leave.status || "Holat yo'q"}`,
    time: leave.created_at || leave.start_date,
  }));

  const auditItems = state.auditLogs.map((log) => ({
    type: /LEAVE|REQUEST/i.test(log.action || "") ? "requests" : "reports",
    actor: log.actor_name || "Tizim",
    title: log.description || `${log.actor_name || "User"} amal bajardi`,
    meta: log.action || log.target_type || "Audit",
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
    activityHistoryList.innerHTML = '<div class="feed-item muted-item">Hali activity history mavjud emas.</div>';
    return;
  }

  activityHistoryList.innerHTML = items
    .map(
      (item) => `
        <article class="activity-item activity-item-${item.type}">
          <div class="activity-avatar">${String(item.actor || "User")
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
  if (authStateLabel) authStateLabel.textContent = "Online";
  authStateDot?.classList.remove("offline");
  authStateDot?.classList.add("online");
  if (currentUserLabel) {
    currentUserLabel.textContent = `${payload.data.user.full_name} (${payload.data.user.role})`;
  }
  loggedInAsLabel.textContent = payload.data.user.full_name || "-";
  resetPendingLogin();
  setAuthUi(true);
  applyRoleBasedUi();
}

function openVerificationStep(payload) {
  state.pendingLoginUser = payload.data.user || null;
  state.pendingVerificationMethod = payload.data.verification_method || "authenticator";
  state.pendingEmailChallengeId = payload.data.challenge_id || "";
  state.pendingChallengeToken = payload.data.challenge_token || "";
  loginCredentialsStep.classList.add("hidden");
  loginTwoFactorStep.classList.remove("hidden");
  if (otpCodeInput) otpCodeInput.focus();
  if (state.pendingVerificationMethod === "authenticator_setup") {
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
    throw new Error("Attachment ID yoki Report ID UUID formatida bo'lishi kerak.");
  }

  // If user pasted report UUID, auto-pick latest attachment from that report.
  try {
    const payload = await apiRequest(`/api/v1/reports/${inputValue}/attachments/`, {
      headers: getHeaders(false),
    });
    const attachments = payload.data || [];
    if (!attachments.length) {
      throw new Error("Bu reportda attachment topilmadi.");
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

function makeEmptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="empty-state">${text}</td></tr>`;
}

function renderDepartmentOptions() {
  if (!reportDepartmentSelect) return;
  const previousDepartmentValue = departmentSelect?.value || "";
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
      setMessage("Department ro'yxati topilmadi. Avval backendda department yaratilganini tekshiring.", "error");
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
    usersTableBody.innerHTML = makeEmptyRow(6, "IT xodimlari hali mavjud emas");
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
    reportsTableBody.innerHTML = makeEmptyRow(6, "Reportlar topilmadi");
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
              <button class="ghost-btn small-btn use-report-id-btn" data-id="${report.id}" type="button">Use report ID</button>
              <button class="ghost-btn small-btn report-detail-btn" data-id="${report.id}" type="button">${t("open_details")}</button>
            </div>
          </td>
          <td><span class="pill role">${report.status}</span></td>
          <td><span class="pill level">L${report.current_approval_level || "-"}</span></td>
          <td>${report.department_name || "-"}</td>
          <td>${report.created_by_name || "-"}</td>
          <td>${formatDate(report.created_at)}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".use-report-id-btn").forEach((button) => {
    button.addEventListener("click", () => {
      applyReportIdToAllTools(button.dataset.id);
      setMessage("Report ID workflow/attachment/history formalariga qo'yildi.", "success");
    });
  });
  document.querySelectorAll(".report-detail-btn").forEach((button) => {
    button.addEventListener("click", () => {
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
    leavesTableBody.innerHTML = makeEmptyRow(6, "Leave requests topilmadi");
    return;
  }

  leavesTableBody.innerHTML = filteredLeaves
    .map(
      (leave) => `
        <tr>
          <td>
            <div class="employee-cell">
              <strong>${leave.requested_by_name || "-"}</strong>
              <small>ID: ${leave.id}</small>
              <button class="ghost-btn small-btn use-leave-id-btn" data-id="${leave.id}" type="button">Use leave ID</button>
              <button class="ghost-btn small-btn leave-detail-btn" data-id="${leave.id}" type="button">${t("open_details")}</button>
            </div>
          </td>
          <td>${leave.leave_type}</td>
          <td>${leave.start_date} - ${leave.end_date}</td>
          <td>${leave.total_days}</td>
          <td><span class="pill status">${leave.status}</span></td>
          <td>${leave.reviewed_by_name || "-"}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".use-leave-id-btn").forEach((button) => {
    button.addEventListener("click", () => {
      applyLeaveIdToReviewTool(button.dataset.id);
      setMessage("Leave ID review formasiga qo'yildi.", "success");
    });
  });
  document.querySelectorAll(".leave-detail-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const leave = state.leaves.find((item) => item.id === button.dataset.id);
      if (leave) openLeaveDetailModal(leave);
    });
  });

  renderActivityHistory();
  updateFeedbackAvailability();
}

function renderAudit() {
  if (!state.auditLogs.length) {
    auditTableBody.innerHTML = makeEmptyRow(5, "Audit loglar topilmadi");
    renderActivityHistory();
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

  renderActivityHistory();
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
  const welcomeNameNode = document.getElementById("dashboardWelcomeName");
  if (topbarUserLabel) {
    topbarUserLabel.textContent = profile?.full_name || t("guest");
  }
  if (welcomeNameNode) {
    welcomeNameNode.textContent = profile?.full_name || t("guest");
  }
  if (profileRoleIcon) {
    const roleText = profile?.role ? getRoleLabel(profile.role) : t("role_generic");
    profileRoleIcon.title = `${t("profile_details")}: ${roleText}`;
    profileRoleIcon.setAttribute("aria-label", profileRoleIcon.title);
  }
  if (profileDeptIcon) {
    const departmentText = profile?.department_name || t("department_unassigned");
    profileDeptIcon.title = `${t("sidebar_institutions")}: ${departmentText}`;
    profileDeptIcon.setAttribute("aria-label", profileDeptIcon.title);
  }
  if (profileUnitIcon) {
    const unitText = profile?.unit_name || t("unit_unassigned");
    profileUnitIcon.title = `${t("employees_section")}: ${unitText}`;
    profileUnitIcon.setAttribute("aria-label", profileUnitIcon.title);
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
  twoFactorStatusLabel.textContent = enabled ? "Active" : "Inactive";
  twoFactorStatusLabel.className = `pill ${enabled ? "level" : "role"}`;
  if (setupTwoFactorButton) {
    setupTwoFactorButton.textContent = enabled ? "QR ni qayta yaratish" : "QR yaratish";
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
    const haystack = [item.title, item.message, item.type].join(" ").toLowerCase();
    const matchesSearch = !searchNeedle || haystack.includes(searchNeedle);
    const matchesRead =
      !readFilterValue ||
      (readFilterValue === "unread" && !item.is_read) ||
      (readFilterValue === "read" && item.is_read);
    return matchesSearch && matchesRead;
  });

  if (!filteredNotifications.length) {
    notificationsList.innerHTML = '<div class="feed-item muted-item">Notificationlar yoq</div>';
    if (unreadNotificationsValue) {
      unreadNotificationsValue.textContent = String(state.notifications.filter((item) => !item.is_read).length);
    }
    renderActivityHistory();
    return;
  }

  notificationsList.innerHTML = filteredNotifications
    .map(
      (item) => `
        <div class="feed-item ${item.is_read ? "" : "unread-item"}">
          <strong>${item.title}</strong>
          <span>${item.message}</span>
          <small>${item.type} - ${formatDate(item.created_at)}</small>
          <div class="inline-actions">
            <button class="ghost-btn small-btn mark-read-btn" data-id="${item.id}" type="button">Mark read</button>
            <button class="ghost-btn small-btn notification-detail-btn" data-id="${item.id}" type="button">${t("open_details")}</button>
          </div>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".mark-read-btn").forEach((button) => {
    button.addEventListener("click", () => markNotificationRead(button.dataset.id));
  });
  document.querySelectorAll(".notification-detail-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.notifications.find((entry) => entry.id === button.dataset.id);
      if (item) openNotificationDetailModal(item);
    });
  });

  if (unreadNotificationsValue) {
    unreadNotificationsValue.textContent = String(state.notifications.filter((item) => !item.is_read).length);
  }
  renderActivityHistory();
  updateFeedbackAvailability();
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
            <button type="button" class="feed-item feed-item-button admin-pending-detail-btn" data-report-id="${item.id}">
              <strong>${item.report_number}</strong>
              <span>${item.title}</span>
              <small>${item.status} - ${item.created_by__full_name}</small>
            </button>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Pending approvals yoq</div>';

  document.querySelectorAll(".admin-pending-detail-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const report = state.reports.find((item) => item.id === button.dataset.reportId);
      if (report) openReportDetailModal(report);
    });
  });
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
              <span>Total: ${item.total_reports}</span>
              <small>Approved: ${item.approved_reports}, Pending: ${item.pending_reports}, Rejected: ${item.rejected_reports}</small>
            </button>
          `
        )
        .join("")
    : '<div class="feed-item muted-item">Analytics data yoq</div>';

  document.querySelectorAll(".analytics-department-btn").forEach((button) => {
    button.addEventListener("click", () => openUsersByDepartmentModal(button.dataset.departmentName));
  });
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
  state.users = payload.results || [];
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
  if (resolvedLeavesValue) {
    resolvedLeavesValue.textContent = String(
      (payload.leaves?.approved_leave_requests || 0) + (payload.leaves?.rejected_leave_requests || 0)
    );
  }
  renderRecentLists(payload);
}

async function loadMe() {
  const payload = await apiRequest("/api/v1/auth/me/", { headers: getHeaders(false) });
  state.currentUser = payload.data;
  if (currentUserLabel) {
    currentUserLabel.textContent = `${payload.data.full_name} (${payload.data.role})`;
  }
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

async function getReportDetail(reportId) {
  const payload = await apiRequest(`/api/v1/reports/${reportId}/`, { headers: getHeaders(false) });
  return payload.data || null;
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
  ];

  if (role !== "DIRECTOR") {
    tasks.push(loadLeaves(), loadLeaveCalendar());
  }

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
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);

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

    if (payload.data?.requires_two_factor) {
      openVerificationStep(payload);
        setMessage(
          payload.data?.verification_method === "email"
            ? `Parol tasdiqlandi. 6 xonali kod ${payload.data.masked_email || "email"} manziliga yuborildi.`
            : payload.data?.verification_method === "authenticator_setup"
            ? "Parol tasdiqlandi. Birinchi kirish uchun QR kodni scan qiling va 6 xonali kodni kiriting."
            : "Parol tasdiqlandi. Endi 6 xonali authenticator kodni kiriting.",
          "success"
        );
      return;
    }

    finalizeAuthenticatedSession(payload);
    const departmentCount = await loadDepartments();
    await loadAllData();
    setMessage(`Frontend backend bilan ulandi. Departmentlar yuklandi: ${departmentCount} ta.`, "success");
  } catch (error) {
    state.accessToken = "";
    state.refreshToken = "";
    state.currentUser = null;
    if (authStateLabel) authStateLabel.textContent = "Offline";
    authStateDot?.classList.remove("online");
    authStateDot?.classList.add("offline");
    if (currentUserLabel) currentUserLabel.textContent = "-";
    loggedInAsLabel.textContent = "-";
    state.twoFactorSetup = null;
    resetPendingLogin();
    setAuthUi(false);
    renderProfile();
    setMessage(error.message || "Login xatoligi yuz berdi.", "error");
  }
});

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.pendingChallengeToken && !state.pendingEmailChallengeId) {
    setMessage("Tasdiqlash sessiyasi topilmadi. Loginni qayta boshlang.", "error");
    resetPendingLogin();
    return;
  }

  try {
    setMessage("6 xonali kod tekshirilmoqda...");
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
    setMessage(`Tasdiqlash yakunlandi. Tizim ochildi, departmentlar: ${departmentCount} ta.`, "success");
  } catch (error) {
    setMessage(error.message || "Tasdiqlash kodini tekshirishda xato bo'ldi.", "error");
  }
});

backToLoginButton.addEventListener("click", () => {
  resetPendingLogin();
  setMessage("Login bosqichiga qaytdingiz.", "success");
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

setupTwoFactorButton.addEventListener("click", async () => {
  try {
    setMessage("2FA uchun QR va maxfiy kalit yaratilmoqda...");
    const payload = await apiRequest("/api/v1/auth/two-factor/setup/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    state.twoFactorSetup = payload.data;
    renderTwoFactorSetup();
    setMessage("QR tayyor. Google Authenticator ilovasida skan qiling va 6 xonali kodni tasdiqlang.", "success");
  } catch (error) {
    setMessage(error.message || "2FA setup yaratishda xato bo'ldi.", "error");
  }
});

twoFactorVerifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setMessage("2FA faollashtirilmoqda...");
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
    setMessage("2FA muvaffaqiyatli yoqildi.", "success");
  } catch (error) {
    setMessage(error.message || "2FA ni yoqishda xato bo'ldi.", "error");
  }
});

twoFactorDisableForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setMessage("2FA o'chirilmoqda...");
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
    setMessage("2FA o'chirildi.", "success");
  } catch (error) {
    setMessage(error.message || "2FA ni o'chirishda xato bo'ldi.", "error");
  }
});

userForm?.addEventListener("submit", async (event) => {
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
  if (!(await requestCreationWarning("report"))) return;
  const formData = new FormData(reportForm);
  const payload = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    content: formData.get("content"),
  };
  if (formData.get("department_id")) payload.department_id = formData.get("department_id");

  try {
    setMessage("Report yaratilmoqda...");
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
    renderDepartmentOptions();
    setMessage(
      isUuid(createdReportId)
        ? `Report yaratildi. UUID: ${createdReportId}`
        : "Report yaratildi.",
      "success"
    );
  } catch (error) {
    setMessage(error.message || "Report yaratishda xato bo'ldi.", "error");
  }
});

workflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(workflowForm);
  const reportId = String(formData.get("report_id") || "").trim();
  if (!isUuid(reportId)) {
    setMessage("Report ID noto'g'ri. Bu maydonga report UUID kiriting.", "error");
    return;
  }

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
  if (!isUuid(reportId)) {
    setMessage("Attachment uchun Report ID UUID bo'lishi kerak.", "error");
    return;
  }

  try {
    const report = await getReportDetail(reportId);
    if (!report) {
      setMessage("Report topilmadi yoki sizda unga kirish huquqi yo'q.", "error");
      return;
    }
    if (!["DRAFT", "REVISION"].includes(report.status)) {
      setMessage("Attachment faqat DRAFT yoki REVISION holatidagi reportga yuklanadi.", "error");
      return;
    }
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
  const inputId = String(formData.get("attachment_id") || "").trim();
  if (!inputId || !state.accessToken) return;

  try {
    const resolved = await resolveAttachmentIdFromInput(inputId);
    if (resolved.fromReport) {
      setMessage(`Report ID bo'yicha topilgan attachment ishlatilmoqda: ${resolved.attachmentId}`, "success");
    }
    const response = await fetch(`${state.apiBase}/api/v1/reports/attachments/${resolved.attachmentId}/download/`, {
      headers: getHeaders(false),
    });
    if (!response.ok) {
      throw new Error("Attachment topilmadi. Attachment ID yoki reportga tegishli attachmentni tekshiring.");
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
  const inputId = String(formData.get("attachment_id") || "").trim();
  if (!inputId) return;

  try {
    const resolved = await resolveAttachmentIdFromInput(inputId);
    if (resolved.fromReport) {
      setMessage(`Report ID bo'yicha topilgan attachment o'chirilmoqda: ${resolved.attachmentId}`, "success");
    }
    await apiRequest(`/api/v1/reports/attachments/${resolved.attachmentId}/`, {
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
  if (!isUuid(reportId)) {
    setMessage("History uchun Report ID UUID kiriting.", "error");
    return;
  }

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
  if (!isUuid(reportId)) {
    setMessage("Delete uchun Report ID UUID kiriting.", "error");
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
    setMessage("Report o'chirildi.", "success");
  } catch (error) {
    setMessage(error.message || "Reportni o'chirishda xato bo'ldi.", "error");
  }
});

copyLatestReportIdButton.addEventListener("click", async () => {
  const reportId = state.lastCreatedReportId;
  if (!isUuid(reportId)) {
    setMessage("Avval report yarating, keyin UUID nusxalanadi.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(reportId);
    setMessage("UUID copy qilindi.", "success");
  } catch (error) {
    setMessage("UUID copy qilib bo'lmadi, qo'lda nusxalang.", "error");
  }
});

useLatestReportIdButton.addEventListener("click", () => {
  const reportId = state.lastCreatedReportId;
  if (!isUuid(reportId)) {
    setMessage("Avval report yarating, keyin UUID formlarga qo'yiladi.", "error");
    return;
  }
  applyReportIdToAllTools(reportId);
  setMessage("UUID workflow/attachment/history formalariga qo'yildi.", "success");
});

leaveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(await requestCreationWarning("leave"))) return;
  const formData = new FormData(leaveForm);

  try {
    setMessage("Leave request yaratilmoqda...");
    const payload = new FormData();
    payload.append("leave_type", formData.get("leave_type"));
    payload.append("reason", formData.get("reason"));
    payload.append("start_date", formData.get("start_date"));
    payload.append("end_date", formData.get("end_date"));
    const screenshot = formData.get("screenshot");
    if (screenshot instanceof File && screenshot.size > 0) {
      payload.append("screenshot", screenshot);
    }
    const createdLeave = await apiRequest("/api/v1/leaves/", {
      method: "POST",
      headers: getHeaders(false),
      body: payload,
    });
    await Promise.all([loadLeaves(), loadDashboard(), loadAuditLogs()]);
    leaveForm.reset();
    if (createdLeave?.data?.id) {
      applyLeaveIdToReviewTool(createdLeave.data.id);
      setMessage(`Leave request yaratildi. UUID: ${createdLeave.data.id}`, "success");
      return;
    }
    setMessage("Leave request yaratildi.", "success");
  } catch (error) {
    setMessage(error.message || "Leave request xatoligi.", "error");
  }
});

leaveReviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(leaveReviewForm);
  const leaveId = String(formData.get("leave_id") || "").trim();
  if (!isUuid(leaveId)) {
    setMessage("Leave ID noto'g'ri. Bu maydonga leave UUID kiriting.", "error");
    return;
  }

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

departmentSelect?.addEventListener("change", renderUnits);
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
meButton.addEventListener("click", () => {
  toggleProfileMenu(false);
  loadMe().then(() => openProfileDetailsModal()).catch((error) => setMessage(error.message, "error"));
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
refreshAllButton.addEventListener("click", () => {
  loadAllData()
    .then(() => setMessage("Barcha bo'limlar yangilandi.", "success"))
    .catch((error) => setMessage(error.message, "error"));
});
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
    state.twoFactorSetup = null;
    if (authStateLabel) authStateLabel.textContent = "Offline";
    authStateDot?.classList.remove("online");
    authStateDot?.classList.add("offline");
    if (currentUserLabel) currentUserLabel.textContent = "-";
    loggedInAsLabel.textContent = "-";
    resetPendingLogin();
    setAuthUi(false);
    renderProfile();
    toggleProfileMenu(false);
    closeSectionModal();
    setMessage("Logout bajarildi.", "success");
  } catch (error) {
    setMessage(error.message || "Logoutda xato bo'ldi.", "error");
  }
});

if (apiBaseIcon) {
  apiBaseIcon.title = "Gateway: Internal gateway";
  apiBaseIcon.setAttribute("aria-label", apiBaseIcon.title);
}
authStateDot?.classList.add("offline");
setAuthUi(false);
applyRoleBasedUi();
resetPendingLogin();
profileMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleProfileMenu();
});
profileDropdown?.addEventListener("click", (event) => {
  event.stopPropagation();
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
document.addEventListener("click", () => {
  toggleProfileMenu(false);
  toggleCreateMenu(false);
  toggleLanguageMenu(false);
  toggleLoginLanguageMenu(false);
});
sectionModalBackdrop?.addEventListener("click", closeSectionModal);
sectionModalClose?.addEventListener("click", closeSectionModal);
quickCreateBackdrop?.addEventListener("click", closeQuickCreate);
quickCreateClose?.addEventListener("click", closeQuickCreate);
creationWarningBackdrop?.addEventListener("click", () => closeCreationWarning(false));
creationWarningClose?.addEventListener("click", () => closeCreationWarning(false));
creationWarningConfirm?.addEventListener("click", () => closeCreationWarning(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
      toggleProfileMenu(false);
      toggleCreateMenu(false);
      toggleLanguageMenu(false);
      toggleLoginLanguageMenu(false);
      closeSectionModal();
      closeQuickCreate();
      closeCreationWarning(false);
  }
});
createMenuItems.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.createAction;
    toggleCreateMenu(false);
    if (action === "report") {
      openSectionModal("reportCreatePanel", t("report_modal_title"));
      return;
    }
    if (action === "leave") {
      openSectionModal("leavesSection", t("create_leave_menu"));
      return;
    }
    openQuickCreate(action);
  });
});
languageOptions.forEach((button) => {
  button.addEventListener("click", () => {
    state.language = button.dataset.language || "uz";
    window.localStorage.setItem("hrmm_language", state.language);
    toggleLanguageMenu(false);
    toggleLoginLanguageMenu(false);
    applyTranslations();
  });
});
loginLanguageOptions.forEach((button) => {
  button.addEventListener("click", () => {
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
  button.addEventListener("click", () => {
    state.homeActivityFilter = button.dataset.activityFilter || "all";
    renderActivityHistory();
  });
});
navLinks.forEach((button) => {
  button.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (button.dataset.target === "homeSection") {
      closeSectionModal();
      document.getElementById("homeSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    openSectionModal(button.dataset.target, button.textContent.trim());
  });
});
feedbackStars?.querySelectorAll(".star-btn").forEach((button) => {
  button.addEventListener("click", () => setFeedbackRating(button.dataset.rating));
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
    setMessage("Avval baho tanlang.", "error");
    return;
  }
  if (!comment) {
    setMessage("Kommentariya yozing.", "error");
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
    setMessage("Baholash va kommentariya backendga saqlandi.", "success");
  } catch (error) {
    setMessage(error.message || "Feedback yuborishda xato bo'ldi.", "error");
  }
});
quickCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = quickCreateType?.value || "notification";
  if (mode === "notification" && !(await requestCreationWarning("notification"))) return;
  const title = String(quickCreateTitleInput?.value || "").trim();
  const message = String(quickCreateMessageInput?.value || "").trim();
  if (!title || !message) {
    setMessage("Sarlavha va izohni to'ldiring.", "error");
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
    closeQuickCreate();
    quickCreateForm.reset();
    setMessage(mode === "feature" ? "Yangi funksiya talabi yuborildi." : "Yangi bildirim yaratildi.", "success");
  } catch (error) {
    setMessage(error.message || "Yangi yozuv yaratishda xato bo'ldi.", "error");
  }
});
globalSearchInput.addEventListener("input", () => {
  renderUsers();
  renderReports();
  renderLeaves();
  renderNotifications();
  renderAnalyticsDashboard();
});
globalStatusInput.addEventListener("input", () => {
  renderUsers();
  renderReports();
  renderLeaves();
  renderAnalyticsDashboard();
});
notificationSearchInput.addEventListener("input", renderNotifications);
notificationReadFilter.addEventListener("change", renderNotifications);
userSearchInput.addEventListener("input", renderUsers);
reportSearchInput.addEventListener("input", renderReports);
leaveSearchInput.addEventListener("input", renderLeaves);
departmentSearchInput.addEventListener("input", renderAnalyticsDashboard);
roleFilter.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
levelFilter.addEventListener("change", () => loadUsers().catch((error) => setMessage(error.message, "error")));
reportStatusFilter.addEventListener("change", () => loadReports().catch((error) => setMessage(error.message, "error")));
leaveStatusFilter.addEventListener("change", () => loadLeaves().catch((error) => setMessage(error.message, "error")));
renderFeedbackList();
setFeedbackRating(0);
applyTranslations();
bindDashboardDrilldowns();
updateFeedbackAvailability();
