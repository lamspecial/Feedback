import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// تمت إضافة مكتبة المصادقة هنا
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0kcj6C_PgrSBfmZ0DE3w0CVQEq5y8WZU",
  authDomain: "comp-100d1.firebaseapp.com",
  projectId: "comp-100d1",
  storageBucket: "comp-100d1.firebasestorage.app",
  messagingSenderId: "427417913381",
  appId: "1:427417913381:web:80262b33c432cc540197cc",
  measurementId: "G-P0XWTP6MTD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // إعداد المصادقة
const db = getFirestore(app);
const storage = getStorage(app);

// SVGs Icon Library
const ICONS = {
  sun: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  moon: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  mic: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>`,
  stop: `<svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  detail: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  call: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`,
  trash: `<svg class="icon-svg text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`
};

const state = {
  branches: [], currentBranchId: null, customers: [], tags: [], selectedCustomerId: null,
  detailSelectedTags: new Set(), afterAnswerSelectedTags: new Set(),
  mediaRecorder: null, audioChunks: [], recordTarget: null, recordTimerInterval: null,
  recordSeconds: 0, pendingAudioBlob: null, unsubCustomers: null, unsubBranches: null, unsubTags: null
};

function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

function normalizePhone(p) { return (p || "").replace(/[^\d+]/g, ""); }

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("app-theme", theme);
  const themeIcon = $("themeIcon");
  if (themeIcon) themeIcon.outerHTML = `<svg class="icon-svg" id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${theme === "dark" ? ICONS.sun.match(/<svg.*?>(.*?)<\/svg>/)[1] : ICONS.moon.match(/<svg.*?>(.*?)<\/svg>/)[1]}</svg>`;
}

function initTheme() { applyTheme(localStorage.getItem("app-theme") || "dark"); }

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

$("btnThemeToggle")?.addEventListener("click", toggleTheme);
$("btnThemeToggleSettings")?.addEventListener("click", toggleTheme);


// ===================== المصادقة (Auth) =====================
let isLoginMode = true;

$("btnToggleAuth").addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  $("loginTitle").textContent = isLoginMode ? "تسجيل الدخول" : "إنشاء حساب";
  $("btnSubmitAuth").textContent = isLoginMode ? "دخول" : "إنشاء الحساب";
  $("btnToggleAuth").textContent = isLoginMode ? "إنشاء حساب جديد" : "لدي حساب بالفعل";
  $("authError").textContent = "";
});

$("btnSubmitAuth").addEventListener("click", async () => {
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  $("authError").textContent = "";

  if (!email || !password) {
    $("authError").textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
    return;
  }

  try {
    $("btnSubmitAuth").disabled = true;
    $("btnSubmitAuth").textContent = "جارٍ التحميل...";
    
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    console.error(err);
    let errorMsg = "حدث خطأ في المصادقة";
    if (err.code === "auth/invalid-email") errorMsg = "البريد الإلكتروني غير صالح";
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") errorMsg = "البريد أو كلمة المرور غير صحيحة";
    if (err.code === "auth/email-already-in-use") errorMsg = "البريد الإلكتروني مستخدم مسبقاً";
    if (err.code === "auth/weak-password") errorMsg = "كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)";
    
    $("authError").textContent = errorMsg;
    $("btnSubmitAuth").disabled = false;
    $("btnSubmitAuth").textContent = isLoginMode ? "دخول" : "إنشاء الحساب";
  }
});

$("btnLogout")?.addEventListener("click", () => {
  signOut(auth);
});

// مراقبة حالة تسجيل الدخول وتوجيه المستخدم
onAuthStateChanged(auth, (user) => {
  if (user) {
    $("authEmail").value = "";
    $("authPassword").value = "";
    $("btnSubmitAuth").disabled = false;
    $("btnSubmitAuth").textContent = isLoginMode ? "دخول" : "إنشاء الحساب";
    
    showScreen("screen-branch");
    listenBranches();
    listenTags();
  } else {
    showScreen("screen-login");
    // إيقاف جلب البيانات عند تسجيل الخروج
    if (state.unsubBranches) state.unsubBranches();
    if (state.unsubTags) state.unsubTags();
    if (state.unsubCustomers) state.unsubCustomers();
  }
});
// ==========================================================


function listenBranches() {
  state.unsubBranches = onSnapshot(collection(db, "branches"), snap => {
    state.branches = [];
    snap.forEach(d => state.branches.push({ id: d.id, ...d.data() }));
    renderBranches();
  }, err => { showToast("تعذر تحميل الفروع"); });
}

function renderBranches() {
  const list = $("branchList");
  list.innerHTML = state.branches.length ? "" : `<p style="color:var(--text-dim);text-align:center;padding:30px;">لا توجد فروع بعد.</p>`;
  state.branches.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar")).forEach(branch => {
    const card = document.createElement("div");
    card.className = "branch-card";
    card.innerHTML = `<span>${escapeHtml(branch.name)}</span><span class="branch-count">فتح ›</span>`;
    card.addEventListener("click", () => openBranch(branch.id, branch.name));
    list.appendChild(card);
  });
}

$("btnNewBranch").addEventListener("click", async () => {
  const name = prompt("اسم الفرع الجديد:");
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, "branches"), { name: name.trim(), createdAt: serverTimestamp() });
    showToast("تم إنشاء الفرع");
  } catch (err) { showToast("فشل إنشاء الفرع"); }
});

function openBranch(id, name) {
  state.currentBranchId = id;
  $("currentBranchName").textContent = name;
  showScreen("screen-customers");
  listenCustomers();
}

$("btnBackToBranches").addEventListener("click", () => {
  if (state.unsubCustomers) state.unsubCustomers();
  state.currentBranchId = null;
  showScreen("screen-branch");
});

function customersCol() { return collection(db, "branches", state.currentBranchId, "customers"); }

function listenCustomers() {
  if (state.unsubCustomers) state.unsubCustomers();
  state.unsubCustomers = onSnapshot(query(customersCol(), orderBy("createdAt", "desc")), snap => {
    state.customers = [];
    snap.forEach(d => state.customers.push({ id: d.id, ...d.data() }));
    renderCustomers();
  }, err => { showToast("تعذر تحميل العملاء"); });
}

function renderCustomers() {
  const list = $("customersList");
  list.innerHTML = "";
  $("statTotal").textContent = state.customers.length;
  $("statCalled").textContent = state.customers.filter(c => c.called).length;
  $("statAnswered").textContent = state.customers.filter(c => c.answered).length;

  if (state.customers.length === 0) {
    list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px;">لا يوجد عملاء بعد.</p>`;
    return;
  }

  state.customers.forEach(c => {
    const card = document.createElement("div");
    card.className = "customer-card" + (c.answered ? " answered" : (c.called ? " called" : ""));
    const tagsHtml = (c.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
    const statusClass = c.answered ? "answered" : (c.called ? "called" : "not-called");
    const statusText = c.answered ? "رد العميل" : (c.called ? "تم الاتصال" : "لم يتصل بعد");

    card.innerHTML = `
      <div class="customer-card-top">
        <div>
          <p class="customer-name">${escapeHtml(c.name || "بدون اسم")}</p>
          <p class="customer-phone">${escapeHtml(c.phone || "")}</p>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      ${c.comment ? `<p class="customer-comment">${escapeHtml(c.comment)}</p>` : ""}
      <div class="customer-tags">${tagsHtml}</div>
      <div class="customer-card-actions">
        <button class="card-action-btn card-action-record" data-id="${c.id}">${ICONS.detail} تفاصيل</button>
        <button class="card-action-btn card-action-call" data-id="${c.id}">${ICONS.call} اتصال</button>
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

let dialBuffer = "";
$("btnAddCustomerFab").addEventListener("click", () => {
  dialBuffer = ""; $("customerName").value = ""; $("customerPhone").value = "";
  showScreen("screen-add-customer"); $("customerName").focus();
});

$("btnCloseAddCustomer").addEventListener("click", () => showScreen("screen-customers"));

document.querySelectorAll(".dial-key[data-key]").forEach(btn => {
  btn.addEventListener("click", () => { dialBuffer += btn.dataset.key; $("customerPhone").value = dialBuffer; });
});

$("btnBackspace").addEventListener("click", () => {
  dialBuffer = dialBuffer.slice(0, -1); $("customerPhone").value = dialBuffer;
});

$("btnSaveCustomer").addEventListener("click", async () => {
  const phone = normalizePhone($("customerPhone").value);
  if (!phone) return showToast("أدخل رقم الجوال");
  try {
    await addDoc(customersCol(), { name: $("customerName").value.trim() || "بدون اسم", phone, comment: "", tags: [], called: false, answered: false, recordingUrl: "", createdAt: serverTimestamp() });
    showToast("تم الحفظ");
    dialBuffer = ""; $("customerName").value = ""; $("customerPhone").value = "";
  } catch (err) { showToast("فشل الحفظ"); }
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
  list.innerHTML = state.tags.length ? "" : `<p style="color:var(--text-dim);">لا توجد أوسمة بعد.</p>`;
  state.tags.forEach(tag => {
    const row = document.createElement("div");
    row.className = "settings-tag-row";
    row.innerHTML = `<span>${escapeHtml(tag.name)}</span><button data-id="${tag.id}">${ICONS.trash}</button>`;
    row.querySelector("button").addEventListener("click", async () => {
      if (confirm(`حذف الوسم "${tag.name}"؟`)) await deleteDoc(doc(db, "tags", tag.id));
    });
    list.appendChild(row);
  });
}

$("btnAddTag").addEventListener("click", async () => {
  const name = $("newTagInput").value.trim();
  if (!name) return;
  await addDoc(collection(db, "tags"), { name, createdAt: serverTimestamp() });
  $("newTagInput").value = ""; showToast("تم إضافة الوسم");
});

function renderTagToggles(container, selectedSet) {
  container.innerHTML = state.tags.length ? "" : `<p style="color:var(--text-dim);">لا توجد أوسمة.</p>`;
  state.tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag-toggle" + (selectedSet.has(tag.name) ? " active" : "");
    btn.textContent = tag.name;
    btn.addEventListener("click", () => {
      selectedSet.has(tag.name) ? selectedSet.delete(tag.name) : selectedSet.add(tag.name);
      btn.classList.toggle("active");
    });
    container.appendChild(btn);
  });
}

function findCustomer(id) { return state.customers.find(c => c.id === id); }

function openCustomerDetail(id) {
  const c = findCustomer(id);
  if (!c) return;
  state.selectedCustomerId = id;
  state.detailSelectedTags = new Set(c.tags || []);
  $("detailName").textContent = c.name || "بدون اسم";
  $("detailPhone").textContent = c.phone || "";
  $("detailComment").value = c.comment || "";
  const pb = $("recordPlayback");
  pb.style.display = c.recordingUrl ? "block" : "none"; pb.src = c.recordingUrl || "";
  resetRecordUI("detail");
  renderTagToggles($("detailTagsWrap"), state.detailSelectedTags);
  showScreen("screen-customer-detail");
}

$("btnCloseDetail").addEventListener("click", () => showScreen("screen-customers"));
$("btnDeleteCustomer").addEventListener("click", async () => {
  if (confirm("حذف هذا العميل نهائيًا؟")) {
    await deleteDoc(doc(customersCol(), state.selectedCustomerId));
    showScreen("screen-customers");
  }
});

$("btnSaveDetail").addEventListener("click", async () => {
  try {
    let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || "";
    if (state.pendingAudioBlob) recordingUrl = await uploadRecording(state.pendingAudioBlob, state.selectedCustomerId);
    await updateDoc(doc(customersCol(), state.selectedCustomerId), {
      comment: $("detailComment").value.trim(), tags: Array.from(state.detailSelectedTags), recordingUrl, updatedAt: serverTimestamp()
    });
    showToast("تم الحفظ"); showScreen("screen-customers");
  } catch (err) { showToast("فشل الحفظ"); }
});

$("btnCallFromDetail").addEventListener("click", () => openCallScreen(state.selectedCustomerId));

function openCallScreen(id) {
  const c = findCustomer(id);
  state.selectedCustomerId = id;
  $("callName").textContent = c.name || "بدون اسم";
  $("callPhone").textContent = c.phone || "";
  $("callStatus").textContent = "جاهز للاتصال";
  $("btnDial").href = "tel:" + (c.phone || "");
  $("btnDial").style.display = "flex"; $("btnAnswered").style.display = "none"; $("postCallActions").style.display = "none";
  showScreen("screen-call");
}

$("btnDial").addEventListener("click", async () => {
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { called: true, lastCallAt: serverTimestamp() });
  $("callStatus").textContent = "جارٍ الاتصال...";
  $("btnDial").style.display = "none"; $("btnAnswered").style.display = "block";
});

$("btnAnswered").addEventListener("click", () => {
  $("btnAnswered").style.display = "none"; $("postCallActions").style.display = "flex";
});

$("btnYesAnswered").addEventListener("click", async () => {
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { answered: true });
  openAfterAnswerScreen(state.selectedCustomerId);
});

$("btnNoAnswered").addEventListener("click", async () => {
  await updateDoc(doc(customersCol(), state.selectedCustomerId), { answered: false });
  showScreen("screen-customers");
});
$("btnEndCallScreen").addEventListener("click", () => showScreen("screen-customers"));

function openAfterAnswerScreen(id) {
  const c = findCustomer(id);
  state.afterAnswerSelectedTags = new Set(c.tags || []);
  $("afterAnswerName").textContent = c.name || "بدون اسم";
  $("afterAnswerComment").value = c.comment || "";
  resetRecordUI("afterAnswer");
  renderTagToggles($("afterAnswerTagsWrap"), state.afterAnswerSelectedTags);
  showScreen("screen-after-answer");
}

$("btnSaveAfterAnswer").addEventListener("click", async () => {
  try {
    let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || "";
    if (state.pendingAudioBlob) recordingUrl = await uploadRecording(state.pendingAudioBlob, state.selectedCustomerId);
    await updateDoc(doc(customersCol(), state.selectedCustomerId), {
      comment: $("afterAnswerComment").value.trim(), tags: Array.from(state.afterAnswerSelectedTags), recordingUrl, updatedAt: serverTimestamp()
    });
    showScreen("screen-customers");
  } catch (err) { showToast("فشل الحفظ"); }
});

function resetRecordUI(target) {
  const icon = target === "detail" ? $("recordIcon") : $("recordIcon2");
  const label = target === "detail" ? $("recordLabel") : $("recordLabel2");
  const btn = target === "detail" ? $("btnRecord") : $("btnRecord2");
  icon.innerHTML = ICONS.mic; label.textContent = "تسجيل ملخص";
  btn.classList.remove("recording");
  (target === "detail" ? $("recordTimer") : $("recordTimer2")).textContent = "";
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
    icon.innerHTML = ICONS.stop; label.textContent = "إيقاف التسجيل"; btn.classList.add("recording");
    state.recordTimerInterval = setInterval(() => {
      state.recordSeconds++;
      (target === "detail" ? $("recordTimer") : $("recordTimer2")).textContent = `${String(Math.floor(state.recordSeconds / 60)).padStart(2, "0")}:${String(state.recordSeconds % 60).padStart(2, "0")}`;
    }, 1000);
  } catch (err) { showToast("تعذر الوصول للميكروفون"); }
}

function stopRecording(target) {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();
  clearInterval(state.recordTimerInterval); resetRecordUI(target);
}

$("btnRecord").addEventListener("click", () => state.mediaRecorder?.state === "recording" ? stopRecording("detail") : startRecording("detail"));
$("btnRecord2").addEventListener("click", () => state.mediaRecorder?.state === "recording" ? stopRecording("afterAnswer") : startRecording("afterAnswer"));

async function uploadRecording(blob, customerId) {
  const storageRef = ref(storage, `recordings/${state.currentBranchId}/${customerId}_${Date.now()}.webm`);
  await uploadBytes(storageRef, blob); return await getDownloadURL(storageRef);
}

$("btnSettings").addEventListener("click", () => showScreen("screen-settings"));
$("btnCloseSettings").addEventListener("click", () => showScreen("screen-customers"));
$("btnGoReports").addEventListener("click", () => { showScreen("screen-reports"); });
$("btnCloseReports").addEventListener("click", () => showScreen("screen-settings"));

try {
  initTheme();
} catch (err) { console.error(err); }
