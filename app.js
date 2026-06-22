// ===================================================================
// app.js — منطق تطبيق متابعة الباحث الميداني
// Firebase: Auth + Firestore + Storage
// ===================================================================

import { initializeApp } from “https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js”;
import {
getAuth,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from “https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js”;
import {
getFirestore,
collection,
doc,
addDoc,
setDoc,
updateDoc,
deleteDoc,
getDocs,
getDoc,
query,
orderBy,
onSnapshot,
serverTimestamp
} from “https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js”;
import {
getStorage,
ref,
uploadBytes,
getDownloadURL
} from “https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js”;

// ===================== إعداد Firebase =====================
const firebaseConfig = {
apiKey: “AIzaSyA0kcj6C_PgrSBfmZ0DE3w0CVQEq5y8WZU”,
authDomain: “comp-100d1.firebaseapp.com”,
projectId: “comp-100d1”,
storageBucket: “comp-100d1.firebasestorage.app”,
messagingSenderId: “427417913381”,
appId: “1:427417913381:web:80262b33c432cc540197cc”,
measurementId: “G-P0XWTP6MTD”
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===================== حالة التطبيق =====================
const state = {
user: null,
branches: [],          // { id, name }
currentBranchId: null,
customers: [],          // عملاء الفرع الحالي (مع id)
tags: [],               // [{id, name}]
selectedCustomerId: null,   // العميل المفتوح حاليا في شاشة التفاصيل/الاتصال
detailSelectedTags: new Set(),
afterAnswerSelectedTags: new Set(),
mediaRecorder: null,
audioChunks: [],
recordTarget: null,     // ‘detail’ | ‘afterAnswer’
recordTimerInterval: null,
recordSeconds: 0,
pendingAudioBlob: null,  // آخر تسجيل لم يُحفظ بعد
unsubCustomers: null,
unsubBranches: null,
unsubTags: null
};

// ===================== أدوات مساعدة =====================
function $(id){ return document.getElementById(id); }

function showScreen(id){
document.querySelectorAll(”.screen”).forEach(s => s.classList.remove(“active”));
$(id).classList.add(“active”);
}

function showToast(msg){
const t = $(“toast”);
t.textContent = msg;
t.classList.add(“show”);
setTimeout(() => t.classList.remove(“show”), 2200);
}

function normalizePhone(p){
return (p || “”).replace(/[^\d+]/g, “”);
}

// ===================== تسجيل الدخول =====================
$(“btnLogin”).addEventListener(“click”, async () => {
const email = $(“loginEmail”).value.trim();
const password = $(“loginPassword”).value;
$(“loginError”).textContent = “”;
if (!email || !password){
$(“loginError”).textContent = “يرجى إدخال البريد وكلمة المرور”;
return;
}
try{
await signInWithEmailAndPassword(auth, email, password);
}catch(err){
$(“loginError”).textContent = “تعذر تسجيل الدخول: تحقق من البيانات”;
console.error(err);
}
});

$(“btnLogout”).addEventListener(“click”, async () => {
await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
state.user = user;
if (user){
showScreen(“screen-branch”);
listenBranches();
listenTags();
} else {
showScreen(“screen-login”);
if (state.unsubBranches) state.unsubBranches();
if (state.unsubCustomers) state.unsubCustomers();
if (state.unsubTags) state.unsubTags();
}
});

// ===================== الفروع =====================
function listenBranches(){
const branchesRef = collection(db, “branches”);
state.unsubBranches = onSnapshot(branchesRef, (snap) => {
state.branches = [];
snap.forEach(d => state.branches.push({ id: d.id, …d.data() }));
renderBranches();
});
}

function renderBranches(){
const list = $(“branchList”);
list.innerHTML = “”;
if (state.branches.length === 0){
list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:30px;">لا توجد فروع بعد. أضف فرعًا جديدًا.</p>`;
return;
}
state.branches
.sort((a,b) => (a.name || “”).localeCompare(b.name || “”, “ar”))
.forEach(branch => {
const card = document.createElement(“div”);
card.className = “branch-card”;
card.innerHTML = `<span>${escapeHtml(branch.name)}</span><span class="branch-count">فتح ›</span>`;
card.addEventListener(“click”, () => openBranch(branch.id, branch.name));
list.appendChild(card);
});
}

$(“btnNewBranch”).addEventListener(“click”, async () => {
const name = prompt(“اسم الفرع الجديد:”);
if (!name || !name.trim()) return;
try{
await addDoc(collection(db, “branches”), {
name: name.trim(),
createdAt: serverTimestamp(),
createdBy: state.user?.email || “unknown”
});
showToast(“تم إنشاء الفرع”);
}catch(err){
console.error(err);
showToast(“فشل إنشاء الفرع”);
}
});

function openBranch(id, name){
state.currentBranchId = id;
$(“currentBranchName”).textContent = name;
showScreen(“screen-customers”);
listenCustomers();
}

$(“btnBackToBranches”).addEventListener(“click”, () => {
if (state.unsubCustomers) state.unsubCustomers();
state.currentBranchId = null;
showScreen(“screen-branch”);
});

// ===================== العملاء =====================
function customersCol(){
return collection(db, “branches”, state.currentBranchId, “customers”);
}

function listenCustomers(){
if (state.unsubCustomers) state.unsubCustomers();
state.unsubCustomers = onSnapshot(query(customersCol(), orderBy(“createdAt”, “desc”)), (snap) => {
state.customers = [];
snap.forEach(d => state.customers.push({ id: d.id, …d.data() }));
renderCustomers();
});
}

function renderCustomers(){
const list = $(“customersList”);
list.innerHTML = “”;

const total = state.customers.length;
const called = state.customers.filter(c => c.called).length;
const answered = state.customers.filter(c => c.answered).length;
$(“statTotal”).textContent = total;
$(“statCalled”).textContent = called;
$(“statAnswered”).textContent = answered;

if (total === 0){
list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px;">لا يوجد عملاء بعد. اضغط + لإضافة عميل.</p>`;
return;
}

state.customers.forEach(c => {
const card = document.createElement(“div”);
card.className = “customer-card” + (c.answered ? “ answered” : (c.called ? “ called” : “”));

```
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
    <button class="card-action-btn card-action-record" data-id="${c.id}">📝 تفاصيل</button>
    <button class="card-action-btn card-action-call" data-id="${c.id}">📞 اتصال</button>
  </div>
`;

card.querySelector(".card-action-record").addEventListener("click", () => openCustomerDetail(c.id));
card.querySelector(".card-action-call").addEventListener("click", () => openCallScreen(c.id));

list.appendChild(card);
```

});
}

function escapeHtml(str){
const div = document.createElement(“div”);
div.textContent = str ?? “”;
return div.innerHTML;
}

// ===================== إضافة عميل (لوحة طلب) =====================
let dialBuffer = “”;

$(“btnAddCustomerFab”).addEventListener(“click”, () => {
dialBuffer = “”;
$(“customerName”).value = “”;
$(“customerPhone”).value = “”;
showScreen(“screen-add-customer”);
$(“customerName”).focus();
});

$(“btnCloseAddCustomer”).addEventListener(“click”, () => showScreen(“screen-customers”));

document.querySelectorAll(”.dial-key[data-key]”).forEach(btn => {
btn.addEventListener(“click”, () => {
dialBuffer += btn.dataset.key;
$(“customerPhone”).value = dialBuffer;
});
});

$(“btnBackspace”).addEventListener(“click”, () => {
dialBuffer = dialBuffer.slice(0, -1);
$(“customerPhone”).value = dialBuffer;
});

// السماح أيضًا بلصق/تعديل الرقم يدويًا عبر لوحة المفاتيح الفعلية إن رغب الباحث
$(“customerPhone”).addEventListener(“input”, (e) => {
dialBuffer = normalizePhone(e.target.value);
e.target.value = dialBuffer;
});

$(“btnSaveCustomer”).addEventListener(“click”, async () => {
const name = $(“customerName”).value.trim();
const phone = normalizePhone($(“customerPhone”).value);

if (!phone){
showToast(“أدخل رقم الجوال”);
return;
}
if (!state.currentBranchId){
showToast(“لم يتم تحديد الفرع”);
return;
}

try{
await addDoc(customersCol(), {
name: name || “بدون اسم”,
phone,
comment: “”,
tags: [],
called: false,
answered: false,
recordingUrl: “”,
createdAt: serverTimestamp(),
createdBy: state.user?.email || “unknown”
});
showToast(“تم الحفظ”);
// إعادة التهيئة تلقائيًا للإدخال التالي
dialBuffer = “”;
$(“customerName”).value = “”;
$(“customerPhone”).value = “”;
$(“customerName”).focus();
}catch(err){
console.error(err);
showToast(“فشل الحفظ، حاول مجددًا”);
}
});

// ===================== الأوسمة =====================
function listenTags(){
state.unsubTags = onSnapshot(collection(db, “tags”), (snap) => {
state.tags = [];
snap.forEach(d => state.tags.push({ id: d.id, …d.data() }));
renderSettingsTags();
});
}

function renderSettingsTags(){
const list = $(“settingsTagsList”);
list.innerHTML = “”;
if (state.tags.length === 0){
list.innerHTML = `<p style="color:var(--text-dim);">لا توجد أوسمة بعد.</p>`;
return;
}
state.tags
.sort((a,b) => (a.name||””).localeCompare(b.name||””, “ar”))
.forEach(tag => {
const row = document.createElement(“div”);
row.className = “settings-tag-row”;
row.innerHTML = `<span>${escapeHtml(tag.name)}</span><button data-id="${tag.id}">🗑</button>`;
row.querySelector(“button”).addEventListener(“click”, async () => {
if (confirm(`حذف الوسم "${tag.name}"؟`)){
await deleteDoc(doc(db, “tags”, tag.id));
showToast(“تم حذف الوسم”);
}
});
list.appendChild(row);
});
}

$(“btnAddTag”).addEventListener(“click”, async () => {
const name = $(“newTagInput”).value.trim();
if (!name) return;
try{
await addDoc(collection(db, “tags”), { name, createdAt: serverTimestamp() });
$(“newTagInput”).value = “”;
showToast(“تمت إضافة الوسم”);
}catch(err){
console.error(err);
showToast(“فشل إضافة الوسم”);
}
});

function renderTagToggles(container, selectedSet){
container.innerHTML = “”;
state.tags.forEach(tag => {
const btn = document.createElement(“button”);
btn.className = “tag-toggle” + (selectedSet.has(tag.name) ? “ active” : “”);
btn.textContent = tag.name;
btn.addEventListener(“click”, () => {
if (selectedSet.has(tag.name)) selectedSet.delete(tag.name);
else selectedSet.add(tag.name);
btn.classList.toggle(“active”);
});
container.appendChild(btn);
});
if (state.tags.length === 0){
container.innerHTML = `<p style="color:var(--text-dim);font-size:14px;">لا توجد أوسمة، أضفها من الإعدادات ⚙</p>`;
}
}

// ===================== شاشة تفاصيل العميل =====================
function findCustomer(id){
return state.customers.find(c => c.id === id);
}

function openCustomerDetail(id){
const c = findCustomer(id);
if (!c) return;
state.selectedCustomerId = id;
state.detailSelectedTags = new Set(c.tags || []);
state.pendingAudioBlob = null;

$(“detailName”).textContent = c.name || “بدون اسم”;
$(“detailPhone”).textContent = c.phone || “”;
$(“detailComment”).value = c.comment || “”;

const playback = $(“recordPlayback”);
if (c.recordingUrl){
playback.src = c.recordingUrl;
playback.style.display = “block”;
} else {
playback.style.display = “none”;
playback.src = “”;
}

resetRecordUI(“detail”);
renderTagToggles($(“detailTagsWrap”), state.detailSelectedTags);
showScreen(“screen-customer-detail”);
}

$(“btnCloseDetail”).addEventListener(“click”, () => showScreen(“screen-customers”));

$(“btnDeleteCustomer”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
if (!confirm(“حذف هذا العميل نهائيًا؟”)) return;
try{
await deleteDoc(doc(customersCol(), state.selectedCustomerId));
showToast(“تم حذف العميل”);
showScreen(“screen-customers”);
}catch(err){
console.error(err);
showToast(“فشل الحذف”);
}
});

$(“btnSaveDetail”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
const comment = $(“detailComment”).value.trim();
const tags = Array.from(state.detailSelectedTags);

try{
let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || “”;
if (state.pendingAudioBlob){
recordingUrl = await uploadRecording(state.pendingAudioBlob, state.selectedCustomerId);
}
await updateDoc(doc(customersCol(), state.selectedCustomerId), {
comment,
tags,
recordingUrl,
updatedAt: serverTimestamp()
});
showToast(“تم الحفظ”);
showScreen(“screen-customers”);
}catch(err){
console.error(err);
showToast(“فشل الحفظ”);
}
});

$(“btnCallFromDetail”).addEventListener(“click”, () => {
if (!state.selectedCustomerId) return;
openCallScreen(state.selectedCustomerId);
});

// ===================== شاشة الاتصال =====================
function openCallScreen(id){
const c = findCustomer(id);
if (!c) return;
state.selectedCustomerId = id;

$(“callName”).textContent = c.name || “بدون اسم”;
$(“callPhone”).textContent = c.phone || “”;
$(“callStatus”).textContent = “جاهز للاتصال”;
$(“btnDial”).href = “tel:” + (c.phone || “”);
$(“btnDial”).style.display = “flex”;
$(“btnAnswered”).style.display = “none”;
$(“postCallActions”).style.display = “none”;

showScreen(“screen-call”);
}

$(“btnDial”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
try{
await updateDoc(doc(customersCol(), state.selectedCustomerId), {
called: true,
lastCallAt: serverTimestamp()
});
}catch(err){
console.error(err);
}
$(“callStatus”).textContent = “جارٍ الاتصال…”;
$(“btnDial”).style.display = “none”;
$(“btnAnswered”).style.display = “block”;
});

$(“btnAnswered”).addEventListener(“click”, () => {
$(“btnAnswered”).style.display = “none”;
$(“postCallActions”).style.display = “flex”;
});

$(“btnYesAnswered”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
try{
await updateDoc(doc(customersCol(), state.selectedCustomerId), {
answered: true
});
}catch(err){ console.error(err); }
openAfterAnswerScreen(state.selectedCustomerId);
});

$(“btnNoAnswered”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
try{
await updateDoc(doc(customersCol(), state.selectedCustomerId), {
answered: false
});
}catch(err){ console.error(err); }
showToast(“تم تسجيل: لم يرد”);
showScreen(“screen-customers”);
});

$(“btnEndCallScreen”).addEventListener(“click”, () => {
showScreen(“screen-customers”);
});

// ===================== شاشة بعد الرد =====================
function openAfterAnswerScreen(id){
const c = findCustomer(id);
if (!c) return;
state.afterAnswerSelectedTags = new Set(c.tags || []);
state.pendingAudioBlob = null;

$(“afterAnswerName”).textContent = c.name || “بدون اسم”;
$(“afterAnswerComment”).value = c.comment || “”;

const playback = $(“recordPlayback2”);
if (c.recordingUrl){
playback.src = c.recordingUrl;
playback.style.display = “block”;
} else {
playback.style.display = “none”;
playback.src = “”;
}

resetRecordUI(“afterAnswer”);
renderTagToggles($(“afterAnswerTagsWrap”), state.afterAnswerSelectedTags);
showScreen(“screen-after-answer”);
}

$(“btnSaveAfterAnswer”).addEventListener(“click”, async () => {
if (!state.selectedCustomerId) return;
const comment = $(“afterAnswerComment”).value.trim();
const tags = Array.from(state.afterAnswerSelectedTags);

try{
let recordingUrl = findCustomer(state.selectedCustomerId)?.recordingUrl || “”;
if (state.pendingAudioBlob){
recordingUrl = await uploadRecording(state.pendingAudioBlob, state.selectedCustomerId);
}
await updateDoc(doc(customersCol(), state.selectedCustomerId), {
comment,
tags,
recordingUrl,
updatedAt: serverTimestamp()
});
showToast(“تم الحفظ بنجاح”);
showScreen(“screen-customers”);
}catch(err){
console.error(err);
showToast(“فشل الحفظ”);
}
});

// ===================== التسجيل الصوتي =====================
function resetRecordUI(target){
if (target === “detail”){
$(“recordIcon”).textContent = “🎙”;
$(“recordLabel”).textContent = “تسجيل ملخص صوتي”;
$(“btnRecord”).classList.remove(“recording”);
$(“recordTimer”).textContent = “”;
} else {
$(“recordIcon2”).textContent = “🎙”;
$(“recordLabel2”).textContent = “تسجيل ملخص صوتي”;
$(“btnRecord2”).classList.remove(“recording”);
$(“recordTimer2”).textContent = “”;
}
}

async function startRecording(target){
try{
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
state.mediaRecorder = new MediaRecorder(stream);
state.audioChunks = [];
state.recordTarget = target;
state.recordSeconds = 0;

```
state.mediaRecorder.ondataavailable = (e) => state.audioChunks.push(e.data);
state.mediaRecorder.onstop = () => {
  const blob = new Blob(state.audioChunks, { type: "audio/webm" });
  state.pendingAudioBlob = blob;
  const url = URL.createObjectURL(blob);
  if (target === "detail"){
    $("recordPlayback").src = url;
    $("recordPlayback").style.display = "block";
  } else {
    $("recordPlayback2").src = url;
    $("recordPlayback2").style.display = "block";
  }
  stream.getTracks().forEach(t => t.stop());
};

state.mediaRecorder.start();

const iconEl = target === "detail" ? $("recordIcon") : $("recordIcon2");
const labelEl = target === "detail" ? $("recordLabel") : $("recordLabel2");
const btnEl = target === "detail" ? $("btnRecord") : $("btnRecord2");
const timerEl = target === "detail" ? $("recordTimer") : $("recordTimer2");

iconEl.textContent = "⏹";
labelEl.textContent = "إيقاف التسجيل";
btnEl.classList.add("recording");

state.recordTimerInterval = setInterval(() => {
  state.recordSeconds++;
  const m = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
  const s = String(state.recordSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}, 1000);
```

}catch(err){
console.error(err);
showToast(“تعذر الوصول إلى الميكروفون”);
}
}

function stopRecording(target){
if (state.mediaRecorder && state.mediaRecorder.state !== “inactive”){
state.mediaRecorder.stop();
}
clearInterval(state.recordTimerInterval);
resetRecordUI(target);
}

$(“btnRecord”).addEventListener(“click”, () => {
if (state.mediaRecorder && state.mediaRecorder.state === “recording”){
stopRecording(“detail”);
} else {
startRecording(“detail”);
}
});

$(“btnRecord2”).addEventListener(“click”, () => {
if (state.mediaRecorder && state.mediaRecorder.state === “recording”){
stopRecording(“afterAnswer”);
} else {
startRecording(“afterAnswer”);
}
});

async function uploadRecording(blob, customerId){
const path = `recordings/${state.currentBranchId}/${customerId}_${Date.now()}.webm`;
const storageRef = ref(storage, path);
await uploadBytes(storageRef, blob);
return await getDownloadURL(storageRef);
}

// ===================== الإعدادات =====================
$(“btnSettings”).addEventListener(“click”, () => showScreen(“screen-settings”));
$(“btnCloseSettings”).addEventListener(“click”, () => showScreen(“screen-customers”));
$(“btnGoReports”).addEventListener(“click”, () => {
showScreen(“screen-reports”);
renderReports();
});
$(“btnCloseReports”).addEventListener(“click”, () => showScreen(“screen-settings”));

// ===================== التقارير =====================
async function renderReports(){
// 1) توزيع الأوسمة للفرع الحالي
const currentWrap = $(“reportTagsCurrentBranch”);
currentWrap.innerHTML = `<p style="color:var(--text-dim);">جاري التحميل...</p>`;

const tagCounts = {};
state.customers.forEach(c => {
(c.tags || []).forEach(t => {
tagCounts[t] = (tagCounts[t] || 0) + 1;
});
});

const maxCount = Math.max(1, …Object.values(tagCounts));
currentWrap.innerHTML = “”;
if (Object.keys(tagCounts).length === 0){
currentWrap.innerHTML = `<p style="color:var(--text-dim);">لا توجد بيانات أوسمة في هذا الفرع.</p>`;
} else {
Object.entries(tagCounts)
.sort((a,b) => b[1]-a[1])
.forEach(([tag, count]) => {
const row = document.createElement(“div”);
row.className = “report-bar-row”;
const pct = Math.round((count / maxCount) * 100);
row.innerHTML = `<div class="report-bar-label"><span>${escapeHtml(tag)}</span><span>${count}</span></div> <div class="report-bar-track"><div class="report-bar-fill" style="width:${pct}%"></div></div>`;
currentWrap.appendChild(row);
});
}

// 2) مقارنة الفروع حسب الأوسمة
const compWrap = $(“reportBranchComparison”);
compWrap.innerHTML = `<p style="color:var(--text-dim);">جاري تحميل بيانات جميع الفروع...</p>`;

try{
const allTagsSet = new Set(state.tags.map(t => t.name));
const branchStats = {}; // { branchName: { tagName: count, __total, __called, __answered } }

```
for (const branch of state.branches){
  const custSnap = await getDocs(collection(db, "branches", branch.id, "customers"));
  const stats = { __total: 0, __called: 0, __answered: 0 };
  custSnap.forEach(d => {
    const data = d.data();
    stats.__total++;
    if (data.called) stats.__called++;
    if (data.answered) stats.__answered++;
    (data.tags || []).forEach(t => {
      allTagsSet.add(t);
      stats[t] = (stats[t] || 0) + 1;
    });
  });
  branchStats[branch.name] = stats;
}

const allTags = Array.from(allTagsSet);
let html = `<table class="report-table"><thead><tr><th>الفرع</th><th>الإجمالي</th><th>تم الاتصال</th><th>رد</th>`;
allTags.forEach(t => html += `<th>${escapeHtml(t)}</th>`);
html += `</tr></thead><tbody>`;

Object.entries(branchStats).forEach(([branchName, stats]) => {
  html += `<tr><td>${escapeHtml(branchName)}</td><td>${stats.__total}</td><td>${stats.__called}</td><td>${stats.__answered}</td>`;
  allTags.forEach(t => html += `<td>${stats[t] || 0}</td>`);
  html += `</tr>`;
});
html += `</tbody></table>`;

compWrap.innerHTML = state.branches.length ? html : `<p style="color:var(--text-dim);">لا توجد فروع لعرض المقارنة.</p>`;
```

}catch(err){
console.error(err);
compWrap.innerHTML = `<p style="color:var(--danger);">تعذر تحميل بيانات المقارنة.</p>`;
}
}
