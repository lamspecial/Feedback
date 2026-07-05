import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// إعدادات ومفاتيح مشروع فايربيس المحدثة بالكامل
const firebaseConfig = {
  apiKey: "AIzaSyA7PiCjQYB33DJ_rp9LYmA7QXCUiTBwFNU",
  authDomain: "feedback-52bdd.firebaseapp.com",
  projectId: "feedback-52bdd",
  storageBucket: "feedback-52bdd.firebasestorage.app",
  messagingSenderId: "1076566895921",
  appId: "1:1076566895921:web:6cdd919ba9c09291301410"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// مكتبة الرموز الرسومية للنظام SVG
const ICONS = {
  sun: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  moon: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  mic: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>`,
  stop: `<svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  detail: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  call: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`,
  trash: `<svg class="icon-svg text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  steering: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 15v7M8 10l-6-3M16 10l6-3"/></svg>`,
  paste: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
};

// قاموس الترجمة الكامل لتعريب وتغريب النظام بالكامل دون اختزال
const LANG_DICT = {
  en: {
    selectBranchHeader: "Select Branch",
    createNewBranchBtn: "Create New Branch",
    backBtn: "‹ Back",
    statTotalLbl: "Total Customers",
    statCalledLbl: "Called",
    statAnsweredLbl: "Answered",
    cancelBtn: "Cancel",
    addNewCustomerHeader: "Add New Customer",
    customerNameLabel: "Customer Name",
    customerPhoneLabel: "Phone Number",
    saveCustomerBtn: "Save Customer Info",
    closeBtn: "Close",
    customerDetailsHeader: "Customer Details",
    deleteBtn: "Delete",
    positiveFeedbackLabel: "Positive points mentioned by customer",
    improvementFeedbackLabel: "Improvement points indicated by customer",
    tagsLabel: "Customer Tags & Labels",
    recordAudioSummaryLabel: "Record Audio Summary",
    callNowBtn: "Call Now",
    saveChangesBtn: "Save Changes",
    endCallSysBtn: "End Call in System",
    customerAnsweredQuestion: "Did the customer answer the call?",
    yesAnsweredBtn: "Yes, Answered",
    noAnsweredBtn: "No, Didn't Answer",
    uselessCallBtn: "Useless Call",
    uselessCallLbl: "Useless Call",
    cancelReturnBtn: "Cancel & Return",
    successfulCallHeader: "Successful Call Summary",
    tagAutoAppliedText: "✓ 'Done' tag automatically applied",
    adjustTagsLabel: "Modify Additional Tags",
    saveFinishBtn: "Save & Finish Task",
    reportsAnalyticsHeader: "Reports & Analytics",
    tagDistributionTitle: "Current Branch Tag Metrics",
    branchComparisonTitle: "Cross-Branch Comparative Grid",
    settingsHeader: "General Settings",
    languageSelectLabel: "System Language",
    drivingModeLabel: "Enable Driving Mode (Large Layout)",
    manageCurrentBranchTitle: "Current Branch Actions",
    renameBranchBtn: "Rename Branch",
    deleteBranchBtn: "Delete Branch",
    addSystemTagLabel: "Add System Global Tag",
    addBtn: "Add",
    navBranches: "Branches",
    navCustomers: "Customers",
    navAnalytics: "Analytics",
    navSettings: "Settings",
    
    // نصوص ديناميكية داخل جافاسكريبت
    noBranches: "No branches listed yet.",
    openRecords: "Open Records ›",
    promptNewBranch: "Enter new branch name:",
    toastBranchSuccess: "Branch created successfully",
    toastBranchFailed: "Failed to create branch",
    toastLoadBranchErr: "Unable to load branches",
    toastSyncCustErr: "Unable to sync customer data",
    noCustomers: "No customers added in this branch.",
    statusAnswered: "Answered & Completed",
    statusNoAnswer: "No answer from customer",
    statusNew: "New / Recently added",
    detailsRecordsBtn: "Details & Records",
    callBtnText: "Call",
    toastPhoneRequired: "Please enter phone number via pad first",
    toastDuplicatePhone: "Phone number already exists in a branch!",
    toastCustSaved: "Customer record saved successfully",
    toastFirebaseErr: "Firebase operation failed",
    noCustomTags: "No custom tags available.",
    confirmDeleteTag: "Are you sure you want to delete tag \"{name}\"?",
    toastTagAdded: "Tag added to the system",
    noActiveTags: "No active tags.",
    confirmDeleteCust: "Delete this customer permanently from database?",
    toastDataUpdated: "Data updated successfully",
    toastSaveFailed: "Failed to save updates",
    readyToCall: "Ready for call",
    callingState: "Making call...",
    stopRecordLabel: "Stop Audio Recording",
    toastMicError: "Could not access microphone",
    toastStorageFull: "Alert: Browser storage full! Saved audio temporarily.",
    analyzingReports: "Extracting reports and analyzing double entries...",
    noStatsAvailable: "No data available for tag analysis.",
    insufficientData: "Insufficient data for comparison grid.",
    fieldBranchColHeader: "Branch",
    loadReportsErr: "Could not load data tables",
    branchSelectRequired: "Please select a branch first!",
    promptRenameBranch: "Enter new name for this branch:",
    toastBranchRenamed: "Branch renamed successfully",
    confirmDeleteBranch: "Warning! Deleting this branch will erase all of its internal customer records permanently. Proceed?",
    
    tagType_positive: "Positive",
    tagType_negative: "Negative",
    tagType_competitor: "Competitors",

    // تبويبات صفحة التحليلات الجديدة
    analyticsOverviewTab: "Overview",
    analyticsCallsTab: "All Calls",
    analyticsPendingTab: "Pending Tasks",
    allBranchesOption: "All Branches",
    allTagsOption: "All Tags",
    noCallsFound: "No calls found matching this filter.",
    noPendingTasks: "No pending tasks. All customers have been reached.",
    lastCallLabel: "Last call",

    // نافذة استيراد الأرقام دفعة واحدة
    bulkImportBtn: "Bulk Import Numbers",
    bulkImportTitle: "Bulk Import Customers",
    bulkImportHint: "Paste names and phone numbers, one per line: name, then its phone number on the next line, repeated for each customer.",
    bulkImportConfirmBtn: "Import",
    bulkImportNoValid: "No valid name/phone pairs were detected.",
    bulkImportPreviewText: "{count} valid entries detected",
    bulkImportResultText: "{added} customers added",
    bulkImportDuplicateText: " · {dup} duplicates skipped",
    navAllCalls: "All Calls",
    addNewBranchLabel: "Branch Management",
    filterByBranchLabel: "Branch:",
    filterByTagLabel: "Filter by Tags:",
    viewPendingBtn: "View",
    pendingTasksTitle: "Pending Tasks",
    kpiTotalCustomers: "Total Customers",
    kpiTotalCalled: "Called",
    kpiTotalAnswered: "Answered",
    kpiPending: "Pending",
    responseRateTitle: "Response Rate",
    answeredLegend: "Answered",
    noAnswerLegend: "No Answer",
    notCalledLegend: "Not Called",
    allBranchesChip: "All"
  },
  ar: {
    selectBranchHeader: "اختر الفرع",
    createNewBranchBtn: "إنشاء فرع جديد",
    backBtn: "‹ العودة",
    statTotalLbl: "إجمالي العملاء",
    statCalledLbl: "تم الاتصال",
    statAnsweredLbl: "ردوا",
    cancelBtn: "إلغاء",
    addNewCustomerHeader: "إضافة عميل جديد",
    customerNameLabel: "اسم العميل",
    customerPhoneLabel: "رقم الجوال",
    saveCustomerBtn: "حفظ معلومات العميل",
    closeBtn: "إغلاق",
    customerDetailsHeader: "تفاصيل العميل",
    deleteBtn: "حذف",
    positiveFeedbackLabel: "النقاط الإيجابية التي ذكرها العميل",
    improvementFeedbackLabel: "نقاط التحسين التي أشار إليها العميل",
    tagsLabel: "أوسمة وتصنيفات العميل",
    recordAudioSummaryLabel: "تسجيل ملخص الملاحظات",
    callNowBtn: "إجراء اتصال الآن",
    saveChangesBtn: "حفظ التغييرات",
    endCallSysBtn: "إنهاء الاتصال بالنظام",
    customerAnsweredQuestion: "هل رد العميل على الاتصال؟",
    yesAnsweredBtn: "نعم، أجاب",
    noAnsweredBtn: "لا، لم يرد",
    uselessCallBtn: "مكالمة غير مفيدة",
    uselessCallLbl: "مكالمة غير مفيدة",
    cancelReturnBtn: "إلغاء والعودة للقائمة",
    successfulCallHeader: "نتائج المكالمة الناجحة",
    tagAutoAppliedText: "✓ تم تطبيق وسم 'تم' تلقائياً",
    adjustTagsLabel: "تعديل الأوسمة الإضافية",
    saveFinishBtn: "حفظ وإنهاء المهمة",
    reportsAnalyticsHeader: "التقارير والتحليلات",
    tagDistributionTitle: "إحصائيات الأوسمة للفرع الحالي",
    branchComparisonTitle: "المقارنة الشاملة بين الفروع",
    settingsHeader: "الإعدادات العامة",
    languageSelectLabel: "لغة النظام",
    drivingModeLabel: "تفعيل وضع القيادة (واجهة عريضة)",
    manageCurrentBranchTitle: "إجراءات الفرع الحالي",
    renameBranchBtn: "تعديل اسم الفرع",
    deleteBranchBtn: "حذف الفرع نهائياً",
    addSystemTagLabel: "إضافة وسم عام جديد للنظام",
    addBtn: "إضافة",
    navBranches: "الفروع",
    navCustomers: "العملاء",
    navAnalytics: "التحليلات",
    navSettings: "الإعدادات",
    
    noBranches: "لا توجد فروع مدرجة بعد.",
    openRecords: "فتح السجلات ›",
    promptNewBranch: "أدخل اسم الفرع الجديد:",
    toastBranchSuccess: "تم إنشاء الفرع بنجاح",
    toastBranchFailed: "فشل إنشاء الفرع",
    toastLoadBranchErr: "تعذر تحميل الفروع",
    toastSyncCustErr: "تعذر مزامنة بيانات العملاء",
    noCustomers: "لا يوجد عملاء مضافين في هذا الفرع.",
    statusAnswered: "تم الرد والإنجاز",
    statusNoAnswer: "لم يرد على الاتصال",
    statusNew: "عميل جديد / مضاف حديثاً",
    detailsRecordsBtn: "تفاصيل وسجلات",
    callBtnText: "اتصال",
    toastPhoneRequired: "الرجاء إدخال رقم الجوال أولاً عبر اللوحة",
    toastDuplicatePhone: "رقم الجوال موجود مسبقاً في أحد الفروع!",
    toastCustSaved: "تم حفظ سجل العميل بنجاح",
    toastFirebaseErr: "فشل حفظ العميل في فايربيس",
    noCustomTags: "لا توجد أوسمة عامة مخصصة.",
    confirmDeleteTag: "هل أنت متأكد من حذف وسم \"{name}\"؟",
    toastTagAdded: "تم إضافة الوسم للنظام",
    noActiveTags: "لا توجد أوسمة مفعلة.",
    confirmDeleteCust: "هل تود حذف سجل العميل هذا نهائياً من قاعدة البيانات؟",
    toastDataUpdated: "تم تحديث البيانات",
    toastSaveFailed: "فشل حفظ التعديلات",
    readyToCall: "جاهز للاتصال",
    callingState: "جارٍ إجراء الاتصال...",
    stopRecordLabel: "إيقاف التسجيل الصوتي",
    toastMicError: "تعذر صلاحية الوصول للميكروفون الخاص بك",
    toastStorageFull: "تنبيه: مساحة تخزين المتصفح ممتلئة، تم عرض الصوت حالياً دون حفظ دائم",
    analyzingReports: "جارٍ استخراج التقارير وتحليل الخانات المزدوجة...",
    noStatsAvailable: "لا توجد إحصائيات متوفرة لفرز الأوسمة.",
    insufficientData: "لا توجد بيانات فروع كافية للمقارنة بين الفروع.",
    fieldBranchColHeader: "الفرع",
    loadReportsErr: "تعذر تحميل جداول التقارير",
    branchSelectRequired: "الرجاء اختيار فرع أولاً!",
    promptRenameBranch: "أدخل الاسم الجديد للفرع:",
    toastBranchRenamed: "تم تعديل اسم الفرع بنجاح",
    confirmDeleteBranch: "تحذير! حذف هذا الفرع سيؤدي لحذف كافة سجلات العملاء التابعين له نهائياً. هل أنت متأكد؟",

    tagType_positive: "إيجابية",
    tagType_negative: "سلبية",
    tagType_competitor: "منافسين",

    // تبويبات صفحة التحليلات الجديدة
    analyticsOverviewTab: "نظرة عامة",
    analyticsCallsTab: "كل المكالمات",
    analyticsPendingTab: "مهام معلقة",
    allBranchesOption: "كل الفروع",
    allTagsOption: "كل الأوسمة",
    noCallsFound: "لا توجد مكالمات مطابقة لهذا الفلتر.",
    noPendingTasks: "لا توجد مهام معلقة، تم التواصل مع جميع العملاء.",
    lastCallLabel: "آخر اتصال",

    // نافذة استيراد الأرقام دفعة واحدة
    bulkImportBtn: "استيراد أرقام دفعة واحدة",
    bulkImportTitle: "استيراد عملاء دفعة واحدة",
    bulkImportHint: "الصق الأسماء وأرقام الجوال، سطر لكل عنصر: اسم العميل ثم رقم جواله في السطر التالي، وهكذا لكل عميل.",
    bulkImportConfirmBtn: "استيراد",
    bulkImportNoValid: "لم يتم رصد أي أزواج اسم/رقم صالحة.",
    bulkImportPreviewText: "تم رصد {count} إدخال صالح",
    bulkImportResultText: "تمت إضافة {added} عميل",
    bulkImportDuplicateText: " · تم تخطي {dup} مكرر",
    navAllCalls: "كل المكالمات",
    addNewBranchLabel: "إدارة الفروع",
    filterByBranchLabel: "الفرع:",
    filterByTagLabel: "تصفية بالأوسمة:",
    viewPendingBtn: "عرض",
    pendingTasksTitle: "مهام معلقة",
    kpiTotalCustomers: "إجمالي العملاء",
    kpiTotalCalled: "تم الاتصال",
    kpiTotalAnswered: "ردوا",
    kpiPending: "معلقة",
    responseRateTitle: "نسبة الاستجابة",
    answeredLegend: "أجابوا",
    noAnswerLegend: "لم يردوا",
    notCalledLegend: "لم يُتصل بهم",
    allBranchesChip: "الكل"
  }
};

// كائن الحالة العام للتطبيق
const state = {
  branches: [], currentBranchId: null, currentBranchName: "", customers: [], tags: [], selectedCustomerId: null,
  detailSelectedTags: new Set(), afterAnswerSelectedTags: new Set(),
  mediaRecorder: null, audioChunks: [], recordTarget: null, recordTimerInterval: null,
  recordSeconds: 0, pendingAudioBlob: null, unsubCustomers: null, unsubBranches: null, unsubTags: null,
  lang: localStorage.getItem("app-lang") || "en",
  drivingMode: localStorage.getItem("app-driving-mode") === "true",
  callStartTime: null
};

function $(id) { return document.getElementById(id); }

// معالج الشاشات مع دمج وإدارة شريط التنقل السفلي الموحد
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  
  // تحديث إضاءة شريط التنقل بناءً على الشاشة المفتوحة
  const mainTabs = ["screen-branch", "screen-customers", "screen-reports", "screen-settings"];
  if (mainTabs.includes(id)) {
    $("mainBottomNav").style.display = "flex";
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.dataset.target === id) item.classList.add("active");
      else item.classList.remove("active");
    });
  } else {
    // إخفاء شريط التنقل في الشاشات العريضة التفاعلية
    $("mainBottomNav").style.display = "none";
  }
  
  if (id === "screen-reports") {
    renderReports();
    populateAnalyticsFilters();
    document.querySelectorAll(".analytics-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".analytics-pane").forEach(p => p.classList.remove("active"));
    $("analyticsTabs")?.querySelector('[data-tab="overview"]')?.classList.add("active");
    $("analyticsPane-overview")?.classList.add("active");
  }
  if (id === "screen-allcalls") {
    populateAllCallsFilters();
    renderAllCallsList();
  }
  if (id === "screen-branch") {
    renderBranchPendingBanner();
  }
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

function normalizePhone(p) { return (p || "").replace(/[^\d+]/g, ""); }

// تطبيق المظهر وإدارته
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("app-theme", theme);
  const themeIcon = $("themeIcon");
  if (themeIcon) {
    themeIcon.outerHTML = `<svg class="icon-svg" id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${theme === "dark" ? ICONS.sun.match(/<svg.*?>(.*?)<\/svg>/)[1] : ICONS.moon.match(/<svg.*?>(.*?)<\/svg>/)[1]}</svg>`;
  }
}

function initTheme() { applyTheme(localStorage.getItem("app-theme") || "dark"); }

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

$("btnThemeToggle")?.addEventListener("click", toggleTheme);
$("btnThemeToggleSettings")?.addEventListener("click", toggleTheme);

// معالجة اللغات والترجمات اللحظية للواجهات
function applyLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("app-lang", lang);
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  $("selectLanguage").value = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (LANG_DICT[lang] && LANG_DICT[lang][key]) {
      el.textContent = LANG_DICT[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-options]").forEach(el => {
      const type = el.value;
      if (LANG_DICT[lang]["tagType_" + type]) el.textContent = LANG_DICT[lang]["tagType_" + type];
  });

  renderBranches();
  renderCustomers();
  if ($("screen-reports").classList.contains("active")) {
    renderReports();
    populateAnalyticsFilters();
    if ($("analyticsPane-calls")?.classList.contains("active")) renderCallsList();
    if ($("analyticsPane-pending")?.classList.contains("active")) renderPendingTasks();
  }
  renderSettingsTags();
}

$("selectLanguage").addEventListener("change", (e) => {
  applyLanguage(e.target.value);
});

// معالجة وضع القيادة العريض للمكالمات السريعة
function applyDrivingMode(active) {
  state.drivingMode = active;
  localStorage.setItem("app-driving-mode", active);
  $("chkDrivingMode").checked = active;
  if (active) {
    document.body.classList.add("driving-mode");
  } else {
    document.body.classList.remove("driving-mode");
  }
}

$("chkDrivingMode").addEventListener("change", (e) => {
  applyDrivingMode(e.target.checked);
});
document.querySelectorAll(".btn-driving-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    applyDrivingMode(!state.drivingMode);
  });
});


// ربط أحداث شريط التنقل السفلي الموحد
document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    if (target === "screen-customers" && !state.currentBranchId) {
      showToast(LANG_DICT[state.lang].branchSelectRequired);
      return;
    }
    showScreen(target);
  });
});

// تشغيل النظام
initTheme();
applyLanguage(state.lang);
applyDrivingMode(state.drivingMode);
showScreen("screen-branch");
listenBranches();
listenTags();

function listenBranches() {
  state.unsubBranches = onSnapshot(collection(db, "branches"), snap => {
    state.branches = [];
    snap.forEach(d => state.branches.push({ id: d.id, ...d.data() }));
    renderBranches();
    renderBranchPendingBanner();
  }, err => { showToast(LANG_DICT[state.lang].toastLoadBranchErr); });
}

function renderBranches() {
  const list = $("branchList");
  list.innerHTML = state.branches.length ? "" : `<p style="color:var(--text-dim);text-align:center;padding:30px;">${LANG_DICT[state.lang].noBranches}</p>`;
  state.branches.sort((a, b) => (a.name || "").localeCompare(b.name || "", state.lang)).forEach(branch => {
    const card = document.createElement("div");
    card.className = "branch-card";
    card.innerHTML = `<span>${escapeHtml(branch.name)}</span><span class="branch-count">${LANG_DICT[state.lang].openRecords}</span>`;
    card.addEventListener("click", () => openBranch(branch.id, branch.name));
    list.appendChild(card);
  });
}

async function createNewBranch() {
  const name = prompt(LANG_DICT[state.lang].promptNewBranch);
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, "branches"), { name: name.trim(), createdAt: serverTimestamp() });
    showToast(LANG_DICT[state.lang].toastBranchSuccess);
  } catch (err) { showToast(LANG_DICT[state.lang].toastBranchFailed); }
}
$("btnNewBranch").addEventListener("click", createNewBranch);
$("btnNewBranchSettings")?.addEventListener("click", createNewBranch);

function openBranch(id, name) {
  state.currentBranchId = id;
  state.currentBranchName = name;
  $("currentBranchName").textContent = name;
  
  // إظهار قسم تعديل وحذف الفرع داخل الإعدادات لتحديد الإجراء عليه
  $("manageBranchStateName").textContent = name;
  $("branchManagementSection").style.display = "block";
  $("branchManageDivider").style.display = "block";

  showScreen("screen-customers");
  listenCustomers();
}

$("btnBackToBranches").addEventListener("click", () => {
  if (state.unsubCustomers) state.unsubCustomers();
  state.currentBranchId = null;
  state.currentBranchName = "";
  
  $("branchManagementSection").style.display = "none";
  $("branchManageDivider").style.display = "none";

  showScreen("screen-branch");
  renderBranchPendingBanner();
});

$("btnShowPendingInBranch")?.addEventListener("click", async () => {
  const panel = $("branchPendingPanel");
  panel.style.display = "block";
  const listEl = $("branchPendingList");
  listEl.innerHTML = `<p style="padding:10px; color:var(--text-dim); text-align:center;">${LANG_DICT[state.lang].analyzingReports}</p>`;
  try {
    const all = await fetchAllCustomersAcrossBranches();
    const pending = all.filter(c => c.called && !c.answered && !c.isUseless);
    pending.sort((a, b) => (b.lastCallAt?.seconds || 0) - (a.lastCallAt?.seconds || 0));
    if (!pending.length) {
      listEl.innerHTML = `<p style="padding:10px; color:var(--text-dim); text-align:center;">${LANG_DICT[state.lang].noPendingTasks}</p>`;
      return;
    }
    listEl.innerHTML = pending.map(c => `
      <div class="customer-card" style="margin-bottom:8px;">
        <div class="customer-card-top">
          <div><p class="customer-name">${escapeHtml(c.name||"N/A")}</p><p class="customer-phone">${escapeHtml(c.phone||"")}</p></div>
          <span class="mini-branch-badge">${escapeHtml(c.branchName||"")}</span>
        </div>
        <div class="customer-card-actions" style="justify-content:flex-start;border-top:none;padding-top:4px;margin-top:4px;">
          <a class="card-action-btn card-action-call" href="tel:${escapeHtml(c.phone||"")}">${ICONS.call} ${LANG_DICT[state.lang].callBtnText}</a>
        </div>
      </div>`).join("");
  } catch(e) {}
});

$("btnClosePendingPanel")?.addEventListener("click", () => {
  $("branchPendingPanel").style.display = "none";
});

$("btnRenameBranch").addEventListener("click", async () => {
  if (!state.currentBranchId) return;
  const newName = prompt(LANG_DICT[state.lang].promptRenameBranch, state.currentBranchName);
  if (!newName || !newName.trim()) return;
  try {
    await updateDoc(doc(db, "branches", state.currentBranchId), { name: newName.trim() });
    state.currentBranchName = newName.trim();
    $("currentBranchName").textContent = state.currentBranchName;
    $("manageBranchStateName").textContent = state.currentBranchName;
    showToast(LANG_DICT[state.lang].toastBranchRenamed);
  } catch (err) { showToast(LANG_DICT[state.lang].toastSaveFailed); }
});

$("btnDeleteBranch").addEventListener("click", async () => {
  if (!state.currentBranchId) return;
  if (confirm(LANG_DICT[state.lang].confirmDeleteBranch)) {
    try {
      const bId = state.currentBranchId;
      if (state.unsubCustomers) state.unsubCustomers();
      
      await deleteDoc(doc(db, "branches", bId));
      state.currentBranchId = null;
      state.currentBranchName = "";
      $("branchManagementSection").style.display = "none";
      $("branchManageDivider").style.display = "none";
      
      showToast(LANG_DICT[state.lang].toastDataUpdated);
      showScreen("screen-branch");
    } catch (err) { showToast(LANG_DICT[state.lang].toastFirebaseErr); }
  }
});

function customersCol() { return collection(db, "branches", state.currentBranchId, "customers"); }

function listenCustomers() {
  if (state.unsubCustomers) state.unsubCustomers();
  state.unsubCustomers = onSnapshot(query(customersCol(), orderBy("createdAt", "desc")), snap => {
    state.customers = [];
    snap.forEach(d => state.customers.push({ id: d.id, ...d.data() }));
    renderCustomers();
  }, err => { showToast(LANG_DICT[state.lang].toastSyncCustErr); });
}

function renderCustomers() {
  const list = $("customersList");
  if (!list) return;
  list.innerHTML = "";
  $("statTotal").textContent = state.customers.length;
  $("statCalled").textContent = state.customers.filter(c => c.called).length;
  $("statAnswered").textContent = state.customers.filter(c => c.answered).length;

  if (state.customers.length === 0) {
    list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px;">${LANG_DICT[state.lang].noCustomers}</p>`;
    return;
  }

  state.customers.sort((a, b) => {
    const getGroupOrder = (c) => {
      if (c.answered || c.isUseless) return 3;
      if (c.called && !c.answered) return 2;
      return 1;
    };

    const groupA = getGroupOrder(a);
    const groupB = getGroupOrder(b);

    if (groupA !== groupB) return groupA - groupB;

    const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  state.customers.forEach(c => {
    const card = document.createElement("div");
    card.className = "customer-card" + (c.answered || c.isUseless ? " answered" : (c.called ? " called" : ""));
    
    // حالة المكالمة الغير مفيدة
    if (c.isUseless) {
      card.innerHTML = `
        <div class="customer-card-top">
          <div>
            <p class="customer-name">${escapeHtml(c.name || "N/A")}</p>
            <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
            ${c.callDuration ? `<p style="font-size:11px; color:var(--text-dim); margin-top:2px;">⏱ ${c.callDuration}s</p>` : ""}
          </div>
          <span class="status-badge" style="background:var(--danger); color:white; display:flex; align-items:center; gap:4px;">
            ${ICONS.trash} ${LANG_DICT[state.lang].uselessCallLbl}
          </span>
        </div>`;
      list.appendChild(card);
      return;
    }

    const tagsHtml = (c.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
    const statusClass = c.answered ? "answered" : (c.called ? "called" : "not-called");
    
    let statusText = LANG_DICT[state.lang].statusNew;
    if (c.answered) statusText = LANG_DICT[state.lang].statusAnswered;
    else if (c.called) statusText = LANG_DICT[state.lang].statusNoAnswer;

    card.innerHTML = `
      <div class="customer-card-top">
        <div>
          <p class="customer-name">${escapeHtml(c.name || "N/A")}</p>
          <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
          ${c.callDuration ? `<p style="font-size:11px; color:var(--text-dim); margin-top:2px;">⏱ ${c.callDuration}s</p>` : ""}
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      ${c.positiveComment ? `<div class="comment-display-positive"><b>${state.lang === "ar" ? "الإيجابيات:" : "Positives:"}</b> ${escapeHtml(c.positiveComment)}</div>` : ""}
      ${c.improvementComment ? `<div class="comment-display-improvement"><b>${state.lang === "ar" ? "التحسينات:" : "Improvements:"}</b> ${escapeHtml(c.improvementComment)}</div>` : ""}
      <div class="customer-tags">${tagsHtml}</div>
      <div class="customer-card-actions">
        <button class="card-action-btn card-action-record" data-id="${c.id}">${ICONS.detail} ${LANG_DICT[state.lang].detailsRecordsBtn}</button>
        <button class="card-action-btn card-action-call" data-id="${c.id}">${ICONS.call} ${LANG_DICT[state.lang].callBtnText}</button>
      </div>`;
    
    card.querySelector(".card-action-record").addEventListener("click", () => openCustomerDetail(c.id));
    card.querySelector(".card-action-call").addEventListener("click", () => openCallScreen(c.id));
    list.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// إعداد الاستجابة اللحظية للوحة المفاتيح التناظرية
let dialBuffer = "";
$("btnAddCustomerFab").addEventListener("click", () => {
  dialBuffer = ""; $("customerName").value = ""; $("customerPhone").value = "";
  showScreen("screen-add-customer"); $("customerName").focus();
});

$("btnCloseAddCustomer").addEventListener("click", () => showScreen("screen-customers"));

document.querySelectorAll(".dial-key[data-key]").forEach(btn => {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dialBuffer += btn.dataset.key;
    $("customerPhone").value = dialBuffer;
  });
});

$("btnBackspace").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  dialBuffer = dialBuffer.slice(0, -1);
  $("customerPhone").value = dialBuffer;
});

$("btnPastePhone").addEventListener("pointerdown", async (e) => {
  e.preventDefault();
  // محاولة لصق من الحافظة مع fallback لحقل النص
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      const nums = text.replace(/[^\d+]/g, "");
      if (nums) {
        dialBuffer += nums;
        $("customerPhone").value = dialBuffer;
        return;
      }
    }
    // fallback: نفتح input مخفي للصق
    const tmp = document.createElement("input");
    tmp.style.cssText = "position:fixed;top:-100px;left:-100px;opacity:0;";
    document.body.appendChild(tmp);
    tmp.focus();
    const pasted = document.execCommand("paste");
    const val = tmp.value;
    document.body.removeChild(tmp);
    if (val) {
      const nums = val.replace(/[^\d+]/g, "");
      if (nums) { dialBuffer += nums; $("customerPhone").value = dialBuffer; return; }
    }
    showToast(state.lang === "ar" ? "اضغط مطولاً للصق" : "Long press to paste");
  } catch(err) {
    showToast(state.lang === "ar" ? "اضغط مطولاً للصق" : "Long press to paste");
  }
});
// دعم اللصق بالضغط المطوّل على حقل الرقم
$("customerPhone").addEventListener("contextmenu", (e) => { e.preventDefault(); });
document.addEventListener("paste", (e) => {
  if (document.activeElement === $("customerPhone") || document.activeElement?.closest("#screen-add-customer")) {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (text) {
      const nums = text.replace(/[^\d+]/g, "");
      if (nums) { dialBuffer += nums; $("customerPhone").value = dialBuffer; }
      e.preventDefault();
    }
  }
});

$("btnSaveCustomer").addEventListener("click", async () => {
  const phone = normalizePhone($("customerPhone").value);
  if (!phone) return showToast(LANG_DICT[state.lang].toastPhoneRequired);
  
  // التحقق من عدم تكرار الرقم في جميع الفروع
  let isDuplicate = false;
  for (const b of state.branches) {
    try {
      const snap = await getDocs(collection(db, "branches", b.id, "customers"));
      snap.forEach(d => {
         if (d.data().phone === phone) isDuplicate = true;
      });
    } catch(e) {}
  }

  if (isDuplicate) {
    showToast(LANG_DICT[state.lang].toastDuplicatePhone);
    return;
  }

  try {
    await addDoc(customersCol(), {
      name: $("customerName").value.trim() || "N/A",
      phone,
      positiveComment: "",
      improvementComment: "",
      tags: [],
      called: false,
      answered: false,
      isUseless: false,
      callDuration: 0,
      recordingUrl: "",
      createdAt: serverTimestamp()
    });
    showToast(LANG_DICT[state.lang].toastCustSaved);
    dialBuffer = ""; $("customerName").value = ""; $("customerPhone").value = "";
    showScreen("screen-customers");
  } catch (err) { showToast(LANG_DICT[state.lang].toastFirebaseErr); }
});

function listenTags() {
  state.unsubTags = onSnapshot(collection(db, "tags"), snap => {
    state.tags = [];
    snap.forEach(d => state.tags.push({ id: d.id, ...d.data() }));
    renderSettingsTags();
  });
}

function renderSettingsTags() {
  const list = $("settingsTagsList");
  if (!list) return;
  list.innerHTML = state.tags.length ? "" : `<p style="color:var(--text-dim); text-align:center;">${LANG_DICT[state.lang].noCustomTags}</p>`;
  state.tags.forEach(tag => {
    const row = document.createElement("div");
    row.className = "settings-tag-row";
    const typeLabel = LANG_DICT[state.lang]["tagType_" + (tag.type || "positive")] || tag.type || "positive";
    row.innerHTML = `<span>${escapeHtml(tag.name)} <small style="color:var(--text-dim);">(${typeLabel})</small></span><button data-id="${tag.id}">${ICONS.trash}</button>`;
    row.querySelector("button").addEventListener("click", async () => {
      if (confirm(LANG_DICT[state.lang].confirmDeleteTag.replace("{name}", tag.name))) await deleteDoc(doc(db, "tags", tag.id));
    });
    list.appendChild(row);
  });
}

$("btnAddTag").addEventListener("click", async () => {
  const name = $("newTagInput").value.trim();
  const type = $("newTagTypeInput").value;
  if (!name) return;
  await addDoc(collection(db, "tags"), { name, type, createdAt: serverTimestamp() });
  $("newTagInput").value = ""; showToast(LANG_DICT[state.lang].toastTagAdded);
});

function renderTagToggles(container, selectedSet) {
  container.innerHTML = state.tags.length ? "" : `<p style="color:var(--text-dim);">${LANG_DICT[state.lang].noActiveTags}</p>`;
  if(!state.tags.length) return;

  const types = ['positive', 'negative', 'competitor'];
  types.forEach(type => {
    const typeTags = state.tags.filter(t => (t.type || 'positive') === type);
    if(typeTags.length > 0) {
      const groupTitle = document.createElement("h4");
      groupTitle.textContent = LANG_DICT[state.lang]["tagType_" + type];
      groupTitle.style.marginTop = "10px";
      groupTitle.style.marginBottom = "8px";
      groupTitle.style.fontSize = "13px";
      groupTitle.style.color = "var(--text-dim)";
      container.appendChild(groupTitle);

      const wrap = document.createElement("div");
      wrap.className = "tags-wrap";
      typeTags.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "tag-toggle" + (selectedSet.has(tag.name) ? " active" : "");
        btn.textContent = tag.name;
        btn.addEventListener("click", () => {
          if (selectedSet.has(tag.name)) {
            selectedSet.delete(tag.name);
          } else {
            selectedSet.add(tag.name);
          }
          btn.classList.toggle("active");
        });
        wrap.appendChild(btn);
      });
      container.appendChild(wrap);
    }
  });
}

function findCustomer(id) { return state.customers.find(c => c.id === id); }

function openCustomerDetail(id) {
  const c = findCustomer(id);
  if (!c) return;
  state.selectedCustomerId = id;
  state.detailSelectedTags = new Set(c.tags || []);
  $("detailName").textContent = c.name || "N/A";
  $("detailPhone").textContent = c.phone || "";
  
  $("detailPositiveComment").value = c.positiveComment || "";
  $("detailImprovementComment").value = c.improvementComment || "";
  
  const pb = $("recordPlayback");
  let localAudio = null;
  if (c.recordingUrl && c.recordingUrl.startsWith("local:")) {
    localAudio = localStorage.getItem(c.recordingUrl);
  }
  
  if (localAudio) {
    pb.style.display = "block";
    pb.src = localAudio;
  } else {
    pb.style.display = "none";
    pb.src = "";
  }
  
  resetRecordUI("detail");
  renderTagToggles($("detailTagsWrap"), state.detailSelectedTags);
  showScreen("screen-customer-detail");
}

$("btnCloseDetail").addEventListener("click", () => showScreen("screen-customers"));

$("btnDeleteCustomer").addEventListener("click", async () => {
  if (confirm(LANG_DICT[state.lang].confirmDeleteCust)) {
    const c = findCustomer(state.selectedCustomerId);
    if (c && c.recordingUrl && c.recordingUrl.startsWith("local:")) {
      localStorage.removeItem(c.recordingUrl);
    }
    await deleteDoc(doc(customersCol(), state.selectedCustomerId));
    showScreen("screen-customers");
  }
});

$("btnSaveDetail").addEventListener("click", async () => {
  try {
    let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || "";
    if (state.pendingAudioBlob) {
      recordingUrl = await saveRecordingToLocalStorage(state.pendingAudioBlob, state.selectedCustomerId);
    }
    await updateDoc(doc(customersCol(), state.selectedCustomerId), {
      positiveComment: $("detailPositiveComment").value.trim(),
      improvementComment: $("detailImprovementComment").value.trim(),
      tags: Array.from(state.detailSelectedTags),
      recordingUrl,
      updatedAt: serverTimestamp()
    });
    showToast(LANG_DICT[state.lang].toastDataUpdated); showScreen("screen-customers");
  } catch (err) { showToast(LANG_DICT[state.lang].toastSaveFailed); }
});

$("btnCallFromDetail").addEventListener("click", () => openCallScreen(state.selectedCustomerId));

function openCallScreen(id) {
  const c = findCustomer(id);
  state.selectedCustomerId = id;
  state.callStartTime = null;
  $("callName").textContent = c.name || "N/A";
  $("callPhone").textContent = c.phone || "";
  $("callStatus").textContent = LANG_DICT[state.lang].readyToCall;
  $("btnDial").href = "tel:" + (c.phone || "");
  $("btnDial").style.display = "flex"; $("btnAnswered").style.display = "none"; $("postCallActions").style.display = "none";
  showScreen("screen-call");
}

$("btnDial").addEventListener("click", async () => {
  state.callStartTime = Date.now();
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { called: true, lastCallAt: serverTimestamp() });
  $("callStatus").textContent = LANG_DICT[state.lang].callingState;
  $("btnDial").style.display = "none"; $("btnAnswered").style.display = "block";
});

$("btnAnswered").addEventListener("click", () => {
  $("btnAnswered").style.display = "none"; $("postCallActions").style.display = "flex";
});

function getCallDuration() {
  if (state.callStartTime) return Math.floor((Date.now() - state.callStartTime) / 1000);
  return 0;
}

$("btnYesAnswered").addEventListener("click", async () => {
  const duration = getCallDuration();
  const c = findCustomer(state.selectedCustomerId);
  let updatedTags = c ? [...(c.tags || [])] : [];
  const systemDoneTag = state.lang === "ar" ? "تم" : "Done";
  if (!updatedTags.includes(systemDoneTag)) {
    updatedTags.push(systemDoneTag);
  }
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { 
    answered: true,
    callDuration: duration,
    tags: updatedTags 
  });
  openAfterAnswerScreen(state.selectedCustomerId);
});

$("btnNoAnswered").addEventListener("click", async () => {
  const duration = getCallDuration();
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { 
    answered: false,
    callDuration: duration
  });
  showScreen("screen-customers");
});

$("btnUselessCall").addEventListener("click", async () => {
  const duration = getCallDuration();
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { 
    answered: true,
    isUseless: true,
    callDuration: duration,
    tags: [LANG_DICT[state.lang].uselessCallLbl],
    updatedAt: serverTimestamp()
  });
  showScreen("screen-customers");
});

$("btnEndCallScreen").addEventListener("click", () => showScreen("screen-customers"));

function openAfterAnswerScreen(id) {
  const c = findCustomer(id);
  state.afterAnswerSelectedTags = new Set(c.tags || []);
  state.afterAnswerSelectedTags.add(state.lang === "ar" ? "تم" : "Done"); 
  
  $("afterAnswerName").textContent = c.name || "N/A";
  $("afterAnswerPositiveComment").value = c.positiveComment || "";
  $("afterAnswerImprovementComment").value = c.improvementComment || "";
  
  resetRecordUI("afterAnswer");
  renderTagToggles($("afterAnswerTagsWrap"), state.afterAnswerSelectedTags);
  showScreen("screen-after-answer");
}

$("btnSaveAfterAnswer").addEventListener("click", async () => {
  try {
    let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || "";
    if (state.pendingAudioBlob) {
      recordingUrl = await saveRecordingToLocalStorage(state.pendingAudioBlob, state.selectedCustomerId);
    }
    
    state.afterAnswerSelectedTags.add(state.lang === "ar" ? "تم" : "Done");
    
    await updateDoc(doc(customersCol(), state.selectedCustomerId), {
      positiveComment: $("afterAnswerPositiveComment").value.trim(),
      improvementComment: $("afterAnswerImprovementComment").value.trim(),
      tags: Array.from(state.afterAnswerSelectedTags),
      recordingUrl,
      updatedAt: serverTimestamp()
    });
    showToast(LANG_DICT[state.lang].toastDataUpdated);
    showScreen("screen-customers");
  } catch (err) { showToast(LANG_DICT[state.lang].toastSaveFailed); }
});

function resetRecordUI(target) {
  const icon = target === "detail" ? $("recordIcon") : $("recordIcon2");
  const label = target === "detail" ? $("recordLabel") : $("recordLabel2");
  const btn = target === "detail" ? $("btnRecord") : $("btnRecord2");
  icon.innerHTML = ICONS.mic; label.textContent = LANG_DICT[state.lang].recordAudioSummaryLabel;
  btn.classList.remove("recording");
  (target === "detail" ? $("recordTimer") : $("recordTimer2")).textContent = "";
  state.pendingAudioBlob = null;
}

async function startRecording(target) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaRecorder = new MediaRecorder(stream);
    state.audioChunks = []; state.recordSeconds = 0;
    state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
    state.mediaRecorder.onstop = () => {
      const blob = new Blob(state.audioChunks, { type: "audio/webm" });
      state.pendingAudioBlob = blob;
      const url = URL.createObjectURL(blob);
      const pb = target === "detail" ? $("recordPlayback") : $("recordPlayback2");
      pb.src = url; pb.style.display = "block";
      stream.getTracks().forEach(t => t.stop());
    };
    state.mediaRecorder.start();
    const icon = target === "detail" ? $("recordIcon") : $("recordIcon2");
    const label = target === "detail" ? $("recordLabel") : $("recordLabel2");
    const btn = target === "detail" ? $("btnRecord") : $("btnRecord2");
    icon.innerHTML = ICONS.stop; label.textContent = LANG_DICT[state.lang].stopRecordLabel; btn.classList.add("recording");
    state.recordTimerInterval = setInterval(() => {
      state.recordSeconds++;
      (target === "detail" ? $("recordTimer") : $("recordTimer2")).textContent = `${String(Math.floor(state.recordSeconds / 60)).padStart(2, "0")}:${String(state.recordSeconds % 60).padStart(2, "0")}`;
    }, 1000);
  } catch (err) { showToast(LANG_DICT[state.lang].toastMicError); }
}

function stopRecording(target) {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();
  clearInterval(state.recordTimerInterval); resetRecordUI(target);
}

$("btnRecord").addEventListener("click", () => state.mediaRecorder?.state === "recording" ? stopRecording("detail") : startRecording("detail"));
$("btnRecord2").addEventListener("click", () => state.mediaRecorder?.state === "recording" ? stopRecording("afterAnswer") : startRecording("afterAnswer"));

function saveRecordingToLocalStorage(blob, customerId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const localKey = `local:${state.currentBranchId}_${customerId}_audio`;
      try {
        localStorage.setItem(localKey, base64String);
        resolve(localKey);
      } catch (error) {
        console.error("Storage limit reached:", error);
        showToast(LANG_DICT[state.lang].toastStorageFull);
        resolve("");
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// رندرة التحليلات والجداول المتقاطعة
async function renderReports() {
  const currentBox = $("reportTagsCurrentBranch");
  const tableBox = $("reportBranchComparison");
  if (!currentBox || !tableBox) return;
  
  currentBox.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].analyzingReports}</p>`;
  tableBox.innerHTML = "";

  try {
    // جلب بيانات الفرع المختار أو كل الفروع
    let allData = [];
    const branchesToShow = state_analyticsBranchId
      ? state.branches.filter(b => b.id === state_analyticsBranchId)
      : state.branches;

    for (const branch of branchesToShow) {
      const snap = await getDocs(collection(db, "branches", branch.id, "customers"));
      snap.forEach(d => allData.push({ branchId: branch.id, branchName: branch.name, ...d.data() }));
    }

    // ===== KPI Cards =====
    const totalCust = allData.length;
    const totalCalled = allData.filter(c => c.called).length;
    const totalAnswered = allData.filter(c => c.answered).length;
    const totalPending = allData.filter(c => c.called && !c.answered && !c.isUseless).length;

    if ($("kpiTotalCustomers")) $("kpiTotalCustomers").textContent = totalCust;
    if ($("kpiTotalCalled")) $("kpiTotalCalled").textContent = totalCalled;
    if ($("kpiTotalAnswered")) $("kpiTotalAnswered").textContent = totalAnswered;
    if ($("kpiPending")) $("kpiPending").textContent = totalPending;

    // ===== Response Rate =====
    const rate = totalCust > 0 ? Math.round((totalAnswered / totalCust) * 100) : 0;
    if ($("responseRatePct")) $("responseRatePct").textContent = rate + "%";
    if ($("responseRateFill")) $("responseRateFill").style.width = rate + "%";

    // Stacked bar
    const notCalled = totalCust - totalCalled;
    const noAnswer = totalCalled - totalAnswered;
    const stackedBar = $("stackedBar");
    if (stackedBar && totalCust > 0) {
      const pAnswered = (totalAnswered / totalCust) * 100;
      const pNoAnswer = (noAnswer / totalCust) * 100;
      const pNotCalled = (notCalled / totalCust) * 100;
      stackedBar.innerHTML = `
        <div class="stacked-bar-seg" style="width:${pAnswered}%;background:var(--success);" title="${LANG_DICT[state.lang].answeredLegend}:${totalAnswered}"></div>
        <div class="stacked-bar-seg" style="width:${pNoAnswer}%;background:var(--warning);" title="${LANG_DICT[state.lang].noAnswerLegend}:${noAnswer}"></div>
        <div class="stacked-bar-seg" style="width:${pNotCalled}%;background:var(--surface-2);" title="${LANG_DICT[state.lang].notCalledLegend}:${notCalled}"></div>`;
    }

    // ===== Tag Distribution =====
    const tagCounts = {};
    state.tags.forEach(t => tagCounts[t.name] = 0);
    tagCounts[state.lang === "ar" ? "تم" : "Done"] = 0;
    tagCounts[LANG_DICT[state.lang].uselessCallLbl] = 0;
    allData.forEach(c => (c.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

    const maxCount = Math.max(1, ...Object.values(tagCounts));
    currentBox.innerHTML = Object.keys(tagCounts).length
      ? Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).map(([tag, count]) => {
          const tagObj = state.tags.find(t => t.name === tag);
          const colorClass = tagObj ? tagObj.type : (tag === "Done" || tag === "تم" ? "done" : "");
          return `<div class="report-bar-row">
            <span class="report-bar-label">${escapeHtml(tag)}</span>
            <div class="report-bar-track"><div class="report-bar-fill ${colorClass}" style="width:${(count / maxCount) * 100}%"></div></div>
            <span class="report-bar-count">${count}</span>
          </div>`;
        }).join("")
      : `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].noStatsAvailable}</p>`;

    // ===== Cross-branch comparison table =====
    const branchCounts = {};
    for (const branch of state.branches) {
      const snap = await getDocs(collection(db, "branches", branch.id, "customers"));
      const counts = {};
      snap.forEach(d => { (d.data().tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });
      branchCounts[branch.name] = counts;
    }

    const allTags = Array.from(new Set([...state.tags.map(t => t.name), "تم", "Done", LANG_DICT[state.lang].uselessCallLbl]));
    if (!allTags.length || !state.branches.length) {
      tableBox.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].insufficientData}</p>`;
      return;
    }

    let tableHtml = `<table class="report-table"><thead><tr><th>${LANG_DICT[state.lang].fieldBranchColHeader}</th>${allTags.map(t => `<th>${escapeHtml(t)}</th>`).join("")}</tr></thead><tbody>`;
    state.branches.forEach(branch => {
      const counts = branchCounts[branch.name] || {};
      const isSelected = state_analyticsBranchId === branch.id;
      tableHtml += `<tr${isSelected ? ' style="background:rgba(46,125,255,0.1);"' : ""}><td><b>${escapeHtml(branch.name)}</b></td>${allTags.map(t => `<td>${counts[t] || 0}</td>`).join("")}</tr>`;
    });
    tableHtml += `</tbody></table>`;
    tableBox.innerHTML = tableHtml;
  } catch (err) {
    console.error(err);
    showToast(LANG_DICT[state.lang].loadReportsErr);
  }
}

// عرض المهام المعلقة في تبويب الفروع
async function renderBranchPendingBanner() {
  try {
    const all = await fetchAllCustomersAcrossBranches();
    const pending = all.filter(c => c.called && !c.answered && !c.isUseless);
    const banner = $("branchPendingBanner");
    const countEl = $("branchPendingCount");
    if (!banner) return;
    if (pending.length > 0) {
      banner.style.display = "block";
      countEl.textContent = (state.lang === "ar")
        ? `${pending.length} مهمة معلقة`
        : `${pending.length} pending task${pending.length > 1 ? "s" : ""}`;
    } else {
      banner.style.display = "none";
    }
  } catch(e) {}
}

// ===================== تبويبات صفحة التحليلات: كل المكالمات + المهام المعلقة =====================
// ملاحظة: كل ما يلي يعتمد فقط على القراءة (getDocs) من نفس بنية البيانات الحالية
// دون أي إضافة أو تعديل على قاعدة البيانات أو مخطط الحقول.

document.querySelectorAll(".analytics-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".analytics-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".analytics-pane").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $("analyticsPane-" + tab.dataset.tab)?.classList.add("active");
    if (tab.dataset.tab === "allcalls") { populateCallsTagFilter(); renderCallsList(); }
    if (tab.dataset.tab === "pending") renderPendingTasks();
  });
});

// جلب جميع العملاء من كل الفروع مع إرفاق اسم ومعرف الفرع لكل عميل (قراءة فقط)
async function fetchAllCustomersAcrossBranches() {
  const all = [];
  for (const branch of state.branches) {
    try {
      const snap = await getDocs(collection(db, "branches", branch.id, "customers"));
      snap.forEach(d => all.push({ id: d.id, branchId: branch.id, branchName: branch.name, ...d.data() }));
    } catch (e) { /* تجاهل فرع تعذر قراءته دون التأثير على البقية */ }
  }
  return all;
}

// حالة الأوسمة المختارة للفلتر
const state_callsSelectedTags = new Set();
// حالة الفرع المختار في التحليلات
let state_analyticsBranchId = "";

function populateAnalyticsFilters() {
  // بناء chips الفروع في صفحة التحليلات
  const chipsWrap = $("analyticsBranchChips");
  if (chipsWrap) {
    chipsWrap.innerHTML = "";
    // كل الفروع
    const allChip = document.createElement("button");
    allChip.className = "branch-chip" + (!state_analyticsBranchId ? " active" : "");
    allChip.textContent = LANG_DICT[state.lang].allBranchesChip || "All";
    allChip.addEventListener("click", () => {
      state_analyticsBranchId = "";
      chipsWrap.querySelectorAll(".branch-chip").forEach(c => c.classList.remove("active"));
      allChip.classList.add("active");
      renderReports();
    });
    chipsWrap.appendChild(allChip);

    state.branches.forEach(b => {
      const chip = document.createElement("button");
      chip.className = "branch-chip" + (state_analyticsBranchId === b.id ? " active" : "");
      chip.textContent = b.name;
      chip.addEventListener("click", () => {
        state_analyticsBranchId = b.id;
        chipsWrap.querySelectorAll(".branch-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderReports();
      });
      chipsWrap.appendChild(chip);
    });
  }
}

function populateCallsTagFilter() {
  const wrap = $("callsTagFilterChips");
  if (!wrap) return;
  wrap.innerHTML = "";
  const tagNames = new Set(state.tags.map(t => t.name));
  tagNames.add(state.lang === "ar" ? "تم" : "Done");
  tagNames.add(LANG_DICT[state.lang].uselessCallLbl);
  Array.from(tagNames).forEach(t => {
    const chip = document.createElement("button");
    chip.className = "tag-filter-chip" + (state_callsSelectedTags.has(t) ? " active" : "");
    chip.textContent = t;
    chip.addEventListener("click", () => {
      if (state_callsSelectedTags.has(t)) { state_callsSelectedTags.delete(t); chip.classList.remove("active"); }
      else { state_callsSelectedTags.add(t); chip.classList.add("active"); }
      renderCallsList();
    });
    wrap.appendChild(chip);
  });
}

function populateAllCallsFilters() {
  const branchSel = $("allCallsFilterBranch");
  if (branchSel) {
    branchSel.innerHTML = `<option value="">${LANG_DICT[state.lang].allBranchesOption}</option>` +
      state.branches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
    branchSel.addEventListener("change", renderAllCallsList);
  }
  const wrap = $("allCallsTagFilterChips");
  if (wrap) {
    wrap.innerHTML = "";
    const tagNames = new Set(state.tags.map(t => t.name));
    tagNames.add(state.lang === "ar" ? "تم" : "Done");
    tagNames.add(LANG_DICT[state.lang].uselessCallLbl);
    Array.from(tagNames).forEach(t => {
      const chip = document.createElement("button");
      chip.className = "tag-filter-chip" + (state_allCallsSelectedTags.has(t) ? " active" : "");
      chip.textContent = t;
      chip.addEventListener("click", () => {
        if (state_allCallsSelectedTags.has(t)) { state_allCallsSelectedTags.delete(t); chip.classList.remove("active"); }
        else { state_allCallsSelectedTags.add(t); chip.classList.add("active"); }
        renderAllCallsList();
      });
      wrap.appendChild(chip);
    });
  }
}
const state_allCallsSelectedTags = new Set();

function callStatusText(c) {
  if (c.isUseless) return LANG_DICT[state.lang].uselessCallLbl;
  if (c.answered) return LANG_DICT[state.lang].statusAnswered;
  if (c.called) return LANG_DICT[state.lang].statusNoAnswer;
  return LANG_DICT[state.lang].statusNew;
}

// قائمة جميع المكالمات مع إمكانية التصفية حسب الوسم أو الفرع أو الاثنين معاً
async function renderAllCallsList() {
  const box = $("allCallsListBox");
  if (!box) return;
  box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].analyzingReports}</p>`;
  try {
    const all = await fetchAllCustomersAcrossBranches();
    const branchFilter = $("allCallsFilterBranch")?.value || "";
    let calls = all.filter(c => c.called);
    if (branchFilter) calls = calls.filter(c => c.branchId === branchFilter);
    if (state_allCallsSelectedTags.size > 0) {
      calls = calls.filter(c => Array.from(state_allCallsSelectedTags).some(t => (c.tags || []).includes(t)));
    }
    calls.sort((a, b) => { const ta = a.lastCallAt?.seconds || 0, tb = b.lastCallAt?.seconds || 0; return tb - ta; });
    if (!calls.length) {
      box.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px;">${LANG_DICT[state.lang].noCallsFound}</p>`;
      return;
    }
    box.innerHTML = calls.map(c => {
      const tagsHtml = (c.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
      const statusClass = c.answered ? "answered" : (c.called ? "called" : "not-called");
      return `<div class="customer-card">
        <div class="customer-card-top">
          <div>
            <p class="customer-name">${escapeHtml(c.name || "N/A")}</p>
            <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
          </div>
          <span class="mini-branch-badge">${escapeHtml(c.branchName || "")}</span>
        </div>
        <span class="status-badge ${statusClass}">${callStatusText(c)}</span>
        ${c.callDuration ? `<span style="font-size:11px; color:var(--text-dim); margin-inline-start:8px;">⏱ ${c.callDuration}s</span>` : ""}
        <div class="customer-tags">${tagsHtml}</div>
      </div>`;
    }).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].loadReportsErr}</p>`;
  }
}

async function renderCallsList() {
  const box = $("callsListBox");
  if (!box) return;
  box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].analyzingReports}</p>`;
  try {
    const all = await fetchAllCustomersAcrossBranches();
    let calls = all.filter(c => c.called);
    if (state_callsSelectedTags.size > 0) {
      calls = calls.filter(c => Array.from(state_callsSelectedTags).some(t => (c.tags || []).includes(t)));
    }

    calls.sort((a, b) => {
      const ta = a.lastCallAt?.seconds || 0, tb = b.lastCallAt?.seconds || 0;
      return tb - ta;
    });

    if (!calls.length) {
      box.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px;">${LANG_DICT[state.lang].noCallsFound}</p>`;
      return;
    }

    box.innerHTML = calls.map(c => {
      const tagsHtml = (c.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
      const statusClass = c.answered ? "answered" : (c.called ? "called" : "not-called");
      return `<div class="customer-card">
        <div class="customer-card-top">
          <div>
            <p class="customer-name">${escapeHtml(c.name || "N/A")}</p>
            <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
          </div>
          <span class="mini-branch-badge">${escapeHtml(c.branchName || "")}</span>
        </div>
        <span class="status-badge ${statusClass}">${callStatusText(c)}</span>
        ${c.callDuration ? `<span style="font-size:11px; color:var(--text-dim); margin-inline-start:8px;">⏱ ${c.callDuration}s</span>` : ""}
        <div class="customer-tags">${tagsHtml}</div>
      </div>`;
    }).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].loadReportsErr}</p>`;
  }
}

// listeners moved to populateAllCallsFilters

// تبويب المهام المعلقة: أرقام العملاء الذين تم الاتصال بهم ولم يردوا
async function renderPendingTasks() {
  const box = $("pendingTasksBox");
  if (!box) return;
  box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].analyzingReports}</p>`;
  try {
    const all = await fetchAllCustomersAcrossBranches();
    const pending = all.filter(c => c.called && !c.answered && !c.isUseless);

    pending.sort((a, b) => {
      const ta = a.lastCallAt?.seconds || 0, tb = b.lastCallAt?.seconds || 0;
      return tb - ta;
    });

    if (!pending.length) {
      box.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px;">${LANG_DICT[state.lang].noPendingTasks}</p>`;
      return;
    }

    box.innerHTML = pending.map(c => `
      <div class="customer-card">
        <div class="customer-card-top">
          <div>
            <p class="customer-name">${escapeHtml(c.name || "N/A")}</p>
            <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
          </div>
          <span class="mini-branch-badge">${escapeHtml(c.branchName || "")}</span>
        </div>
        <div class="customer-card-actions" style="justify-content:flex-start; border-top:none; padding-top:4px; margin-top:4px;">
          <a class="card-action-btn card-action-call" href="tel:${escapeHtml(c.phone || "")}">${ICONS.call} ${LANG_DICT[state.lang].callBtnText}</a>
        </div>
      </div>`).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p style="color:var(--text-dim);text-align:center;">${LANG_DICT[state.lang].loadReportsErr}</p>`;
  }
}

// ===================== نافذة حقن أرقام العملاء دفعة واحدة =====================
// يتم تحليل النص الملصق فقط في المتصفح، ثم إضافة كل عميل عبر نفس addDoc المستخدم للإضافة الفردية
// دون أي تعديل على بنية أو حقول قاعدة البيانات.

$("btnBulkImport")?.addEventListener("click", () => {
  $("bulkImportTextarea").value = "";
  $("bulkImportPreview").textContent = "";
  $("bulkImportModal").classList.add("show");
});

$("btnBulkImportCancel")?.addEventListener("click", () => {
  $("bulkImportModal").classList.remove("show");
});

function parseBulkImportText(text) {
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const pairs = [];
  for (let i = 0; i < rawLines.length; i += 2) {
    const name = rawLines[i];
    const phoneRaw = rawLines[i + 1];
    if (!phoneRaw) break; // سطر اسم دون رقم مقابل، يتم تجاهله
    const phone = normalizePhone(phoneRaw);
    if (!phone) continue;
    pairs.push({ name, phone });
  }
  return pairs;
}

$("bulkImportTextarea")?.addEventListener("input", (e) => {
  const pairs = parseBulkImportText(e.target.value);
  $("bulkImportPreview").textContent = pairs.length
    ? LANG_DICT[state.lang].bulkImportPreviewText.replace("{count}", pairs.length)
    : "";
});

$("btnBulkImportConfirm").addEventListener("click", async () => {
  if (!state.currentBranchId) return;
  const pairs = parseBulkImportText($("bulkImportTextarea").value);
  if (!pairs.length) {
    showToast(LANG_DICT[state.lang].bulkImportNoValid);
    return;
  }

  $("btnBulkImportConfirm").disabled = true;
  try {
    // جمع كل الأرقام الموجودة حالياً في جميع الفروع لمنع التكرار (قراءة فقط)
    const existingPhones = new Set();
    for (const b of state.branches) {
      try {
        const snap = await getDocs(collection(db, "branches", b.id, "customers"));
        snap.forEach(d => { if (d.data().phone) existingPhones.add(d.data().phone); });
      } catch (e) {}
    }

    let added = 0, skippedDup = 0;
    const seenInBatch = new Set();

    for (const pair of pairs) {
      if (existingPhones.has(pair.phone) || seenInBatch.has(pair.phone)) { skippedDup++; continue; }
      seenInBatch.add(pair.phone);
      try {
        await addDoc(customersCol(), {
          name: pair.name || "N/A",
          phone: pair.phone,
          positiveComment: "",
          improvementComment: "",
          tags: [],
          called: false,
          answered: false,
          isUseless: false,
          callDuration: 0,
          recordingUrl: "",
          createdAt: serverTimestamp()
        });
        added++;
      } catch (e) { /* تجاهل العنصر الفاشل ومتابعة الباقي */ }
    }

    $("bulkImportModal").classList.remove("show");
    let msg = LANG_DICT[state.lang].bulkImportResultText.replace("{added}", added);
    if (skippedDup) msg += LANG_DICT[state.lang].bulkImportDuplicateText.replace("{dup}", skippedDup);
    showToast(msg);
  } catch (err) {
    showToast(LANG_DICT[state.lang].toastFirebaseErr);
  } finally {
    $("btnBulkImportConfirm").disabled = false;
  }
});

// قيود أبعاد المتصفح لمنع التشتت
document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
}, { passive: false });
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
