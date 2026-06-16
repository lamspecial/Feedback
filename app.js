// ══════════════════════════════════════════════
// app.js  —  نظام رضا العملاء
// Firebase v9 compat SDK  (no auth required)
// ══════════════════════════════════════════════

import { initializeApp }           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
         query, where, orderBy, limit, startAfter,
         serverTimestamp, arrayUnion, increment }
                                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

// ── Firebase init ──────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyC9hft4HD1Yms4oamZq59REe6lyKkqHE9k",
  authDomain:        "feedback-68557.firebaseapp.com",
  projectId:         "feedback-68557",
  messagingSenderId: "1056419419871",
  appId:             "1:1056419419871:web:e6fa72598fb44875d03b6a"
};
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);


// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let currentPage  = "dashboard";
let prevPage     = null;
let branchCache  = null;
let tagCache     = null;

// call-screen state
let callQueue    = [];
let callIdx      = 0;
let callBranchId = null;
let callLastDoc  = null;
let callHasMore  = false;

// customers list state
let custLastDoc  = null;
let custHasMore  = false;
let custBranch   = "";
let searchTimer  = null;

// reports state
let rptBranch    = null;

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
const $  = id  => document.getElementById(id);
const qs = sel => document.querySelector(sel);

function toast(msg, type = "") {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.className   = "toast show " + type;
  setTimeout(() => (t.className = "toast"), 2600);
}

function showPage(name, navEl) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const targetPage = $("page-" + name);
  if (targetPage) targetPage.classList.add("active");
  
  document.querySelectorAll(".bnav-item").forEach(b => b.classList.remove("active"));
  if (navEl) {
    navEl.classList.add("active");
  } else {
    const found = qs(`.bnav-item[data-p="${name}"]`);
    if (found) found.classList.add("active");
  }
  prevPage    = currentPage;
  currentPage = name;
  onPageOpen(name);
}

function goBack() { showPage(prevPage || "dashboard"); }

function loading(id) { 
  const el = $(id);
  if (el) el.innerHTML = '<div class="loading"></div>'; 
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ar-SA");
}

function normalizePhone(p) {
  return String(p).replace(/\s/g, "").replace(/^(\+966|00966)/, "0").trim();
}
function validPhone(p) { return /^05\d{8}$/.test(p); }

// ══════════════════════════════════════════════
// PAGE INIT DISPATCH
// ══════════════════════════════════════════════
async function onPageOpen(name) {
  if (name === "dashboard")        loadDashboard();
  if (name === "customers")        { custLastDoc = null; loadCustomers(); }
  if (name === "call")             initCallPage();
  if (name === "import")           initImportPage();
  if (name === "reports")          loadReports();
  if (name === "admin")            loadAdmin();
}

// ══════════════════════════════════════════════
// BRANCHES
// ══════════════════════════════════════════════
async function getBranches() {
  if (branchCache) return branchCache;
  const snap = await getDocs(query(collection(db, "branches"), orderBy("name")));
  branchCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return branchCache;
}
function clearBranchCache() { branchCache = null; }

async function fillSelect(selId, placeholder = "اختر الفرع") {
  const sel = $(selId);
  if (!sel) return;
  const branches = await getBranches();
  sel.innerHTML = `<option value="">-- ${placeholder} --</option>` +
    branches.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
}

// ══════════════════════════════════════════════
// TAGS
// ══════════════════════════════════════════════
async function getTags() {
  if (tagCache) return tagCache;
  const snap = await getDocs(query(collection(db, "tags"), orderBy("name")));
  tagCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return tagCache;
}
function clearTagCache() { tagCache = null; }

function buildTagButtons(containerId, type, selectedIds = []) {
  getTags().then(tags => {
    const cont = $(containerId);
    if (!cont) return;
    cont.innerHTML = "";
    tags.filter(t => t.type === type).forEach(t => {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = `tag-btn ${type === "positive" ? "pos" : "neg"}${selectedIds.includes(t.id) ? " on" : ""}`;
      btn.dataset.id = t.id;
      btn.textContent = t.name;
      btn.addEventListener("click", () => btn.classList.toggle("on"));
      cont.appendChild(btn);
    });
  });
}

function getSelectedTags(containerId) {
  const cont = $(containerId);
  if (!cont) return [];
  return [...cont.querySelectorAll(".tag-btn.on")].map(b => b.dataset.id);
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
async function loadDashboard() {
  const grid = $("kpi-grid");
  if (grid) grid.innerHTML = '<div class="loading" style="margin:.5rem auto;width:22px;height:22px;border-width:2px"></div>';

  const [surveysSnap, custSnap, branches, tags] = await Promise.all([
    getDocs(collection(db, "surveys")),
    getDocs(collection(db, "customers")),
    getBranches(),
    getTags()
  ]);

  const total   = custSnap.size;
  const surveys = surveysSnap.size;
  const rate    = total > 0 ? Math.round(surveys / total * 100) : 0;
  const tagMap  = {};
  tags.forEach(t => (tagMap[t.id] = t.name));

  const posCnt = {}, negCnt = {};
  surveysSnap.docs.forEach(d => {
    const s = d.data();
    (s.positives || []).forEach(id => (posCnt[id] = (posCnt[id] || 0) + 1));
    (s.negatives || []).forEach(id => (negCnt[id] = (negCnt[id] || 0) + 1));
  });

  if (grid) {
    grid.innerHTML = `
      <div class="kpi-card"><div class="kpi-value">${total}</div><div class="kpi-label">العملاء</div></div>
      <div class="kpi-card"><div class="kpi-value">${surveys}</div><div class="kpi-label">الاستطلاعات</div></div>
      <div class="kpi-card"><div class="kpi-value">${rate}%</div><div class="kpi-label">نسبة التواصل</div></div>
      <div class="kpi-card"><div class="kpi-value">${branches.length}</div><div class="kpi-label">الفروع</div></div>
    `;
  }

  renderMiniBar("dash-pos", posCnt, tagMap, "pos");
  renderMiniBar("dash-neg", negCnt, tagMap, "neg");
}

function renderMiniBar(id, counts, tagMap, cls) {
  const cont = $(id);
  if (!cont) return;
  const sorted = Object.entries(counts)
    .map(([k, v]) => ({ name: tagMap[k] || k, count: v }))
    .sort((a, b) => b.count - a.count).slice(0, 5);
  const max = sorted[0]?.count || 1;
  cont.innerHTML = sorted.length === 0
    ? '<p class="empty" style="padding:.5rem">لا بيانات بعد</p>'
    : sorted.map(t => `
        <div class="bar-item">
          <div class="bar-label"><span>${t.name}</span><span class="bar-count">${t.count}</span></div>
          <div class="bar-track"><div class="bar-fill ${cls}" style="width:${Math.round(t.count/max*100)}%"></div></div>
        </div>`).join("");
}

// ══════════════════════════════════════════════
// CALL SCREEN
// ══════════════════════════════════════════════
async function initCallPage() {
  if (!callBranchId) {
    $("call-setup").style.display = "block";
    $("call-interface").style.display = "none";
    fillSelect("call-branch-sel");
  }
}

async function startCalling() {
  const branchId = $("call-branch-sel").value;
  if (!branchId) { toast("اختر الفرع أولاً", "err"); return; }
  callBranchId = branchId;
  callQueue    = [];
  callIdx      = 0;
  callLastDoc  = null;

  await loadCallBatch();

  if (callQueue.length === 0) { toast("لا يوجد عملاء في هذا الفرع", "err"); return; }

  $("call-setup").style.display    = "none";
  $("call-interface").style.display = "block";

  buildTagButtons("pos-tags", "positive");
  buildTagButtons("neg-tags", "negative");
  renderCallCustomer();
}

async function loadCallBatch() {
  let q = query(
    collection(db, "customers"),
    where("branches", "array-contains", callBranchId),
    orderBy("lastSeen"), limit(25)
  );
  if (callLastDoc) q = query(q, startAfter(callLastDoc));
  const snap = await getDocs(q);
  callQueue   = [...callQueue, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
  callLastDoc = snap.docs[snap.docs.length - 1] || null;
  callHasMore = snap.docs.length === 25;
}

function renderCallCustomer() {
  if (callIdx >= callQueue.length) {
    if (callHasMore) { loadCallBatch().then(renderCallCustomer); return; }
    $("call-interface").innerHTML = `
      <div class="card" style="text-align:center;padding:2rem">
        <div style="font-size:2.5rem">✅</div>
        <h3 style="margin:.75rem 0 .4rem">انتهت القائمة</h3>
        <p class="empty" style="padding:0 0 1rem">تم إجراء ${callIdx} محادثة</p>
        <button class="btn btn-primary" onclick="resetCallScreen()">اختيار فرع آخر</button>
      </div>`;
    return;
  }

  const c   = callQueue[callIdx];
  const tot = callQueue.length;
  const pct = tot > 0 ? Math.round(callIdx / tot * 100) : 0;

  $("call-progress-txt").textContent = `${callIdx} / ${tot}`;
  $("call-pbar").style.width         = pct + "%";
  $("call-name").textContent  = c.name || "بدون اسم";
  $("call-phone").textContent = c.phone;
  $("call-tel").href          = "tel:" + c.phone;

  // reset inputs
  document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("on"));
  $("pos-notes").value = "";
  $("neg-notes").value = "";
}

function resetCallScreen() {
  callBranchId = null; callQueue = []; callIdx = 0; callLastDoc = null;
  $("call-setup").style.display    = "block";
  $("call-interface").style.display = "none";
}

function skipCustomer() { callIdx++; renderCallCustomer(); }

async function saveSurveyAndNext() {
  const c   = callQueue[callIdx];
  const btn = $("save-btn");
  btn.disabled    = true;
  btn.textContent = "جاري الحفظ...";

  try {
    const positives = getSelectedTags("pos-tags");
    const negatives = getSelectedTags("neg-tags");

    await addDoc(collection(db, "surveys"), {
      customerId:    c.id,
      branchId:      callBranchId,
      positives,
      negatives,
      positiveNotes: $("pos-notes").value.trim(),
      negativeNotes: $("neg-notes").value.trim(),
      callDate:      serverTimestamp(),
      locked:        false
    });

    await updateDoc(doc(db, "customers", c.id), { lastSeen: serverTimestamp() });

    toast("تم الحفظ ✓", "ok");
    callIdx++;
    renderCallCustomer();
  } catch (e) {
    toast("خطأ: " + e.message, "err");
  } finally {
    btn.disabled    = false;
    btn.textContent = "حفظ والانتقال للعميل التالي ←";
  }
}

// ══════════════════════════════════════════════
// CUSTOMERS LIST
// ══════════════════════════════════════════════
async function loadCustomers(append = false) {
  if (!append) {
    custLastDoc = null;
    loading("cust-list");
  }

  try {
    let q;
    if (custBranch) {
      q = query(
        collection(db, "customers"),
        where("branches", "array-contains", custBranch),
        orderBy("lastSeen", "desc"), limit(20)
      );
    } else {
      q = query(collection(db, "customers"), orderBy("lastSeen", "desc"), limit(20));
    }
    if (append && custLastDoc) q = query(q, startAfter(custLastDoc));

    const snap    = await getDocs(q);
    const custs   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    custLastDoc   = snap.docs[snap.docs.length - 1] || null;
    custHasMore   = snap.docs.length === 20;

    const branches = await getBranches();
    const bMap = {};
    branches.forEach(b => (bMap[b.id] = b.name));

    const list = $("cust-list");
    if (!append && list) list.innerHTML = "";

    if (custs.length === 0 && !append && list) {
      list.innerHTML = '<p class="empty">لا يوجد عملاء</p>';
    } else if (list) {
      custs.forEach(c => {
        const li = document.createElement("li");
        li.className = "c-item";
        li.innerHTML = `
          <div>
            <div class="c-name">${c.name || "بدون اسم"}</div>
            <div class="c-phone ltr">${c.phone}</div>
          </div>
          <div class="c-meta">${(c.branches || []).map(id => bMap[id] || "").filter(Boolean).join(" · ")}</div>
        `;
        li.addEventListener("click", () => openProfile(c.id));
        list.appendChild(li);
      });
    }

    $("load-more-btn").style.display = custHasMore ? "block" : "none";
  } catch (e) {
    const list = $("cust-list");
    if (list) list.innerHTML = `<p class="err-msg">${e.message}</p>`;
  }
}

function loadMoreCustomers() { loadCustomers(true); }

function filterCustBranch(val) {
  custBranch = val;
  loadCustomers();
}

function searchCustomers(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!val.trim()) { loadCustomers(); return; }

    const phone = normalizePhone(val);
    if (validPhone(phone)) {
      const snap = await getDocs(query(collection(db, "customers"), where("phone", "==", phone), limit(1)));
      renderSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      return;
    }

    // prefix search by name
    const snap = await getDocs(query(
      collection(db, "customers"),
      orderBy("name"),
      where("name", ">=", val),
      where("name", "<=", val + "\uf8ff"),
      limit(20)
    ));
    renderSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, 350);
}

async function renderSearchResults(custs) {
  const branches = await getBranches();
  const bMap = {};
  branches.forEach(b => (bMap[b.id] = b.name));
  const list = $("cust-list");
  if (!list) return;
  list.innerHTML = "";
  if (custs.length === 0) { list.innerHTML = '<p class="empty">لا نتائج</p>'; return; }
  custs.forEach(c => {
    const li = document.createElement("li");
    li.className = "c-item";
    li.innerHTML = `
      <div>
        <div class="c-name">${c.name || "بدون اسم"}</div>
        <div class="c-phone ltr">${c.phone}</div>
      </div>
      <div class="c-meta">${(c.branches || []).map(id => bMap[id] || "").filter(Boolean).join(" · ")}</div>
    `;
    li.addEventListener("click", () => openProfile(c.id));
    list.appendChild(li);
  });
  $("load-more-btn").style.display = "none";
}

// ══════════════════════════════════════════════
// CUSTOMER PROFILE
// ══════════════════════════════════════════════
async function openProfile(custId) {
  prevPage = currentPage;
  showPage("profile");
  loading("profile-content");

  try {
    const [custDoc, surveysSnap, branches, tags] = await Promise.all([
      getDoc(doc(db, "customers", custId)),
      getDocs(query(collection(db, "surveys"), where("customerId", "==", custId), orderBy("callDate", "desc"))),
      getBranches(),
      getTags()
    ]);

    const c    = { id: custDoc.id, ...custDoc.data() };
    const bMap = {}, tMap = {};
    branches.forEach(b => (bMap[b.id] = b.name));
    tags.forEach(t => (tMap[t.id]  = { name: t.name, type: t.type }));

    // auto-lock expired surveys
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const surveys = surveysSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    for (const s of surveys) {
      if (!s.locked && s.callDate) {
        const cd = s.callDate.toDate();
        const cDay = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
        if (cDay < today) {
          await updateDoc(doc(db, "surveys", s.id), { locked: true });
          s.locked = true;
        }
      }
    }

    const branchNames = (c.branches || []).map(id => bMap[id]).filter(Boolean);

    $("profile-content").innerHTML = `
      <div class="profile-header">
        <div class="profile-name">${c.name || "بدون اسم"}</div>
        <span class="profile-phone ltr">${c.phone}</span>
        <div class="profile-tags">
          ${branchNames.map(n => `<span class="branch-badge">${n}</span>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">المكالمات السابقة (${surveys.length})</span>
        </div>
        ${surveys.length === 0
          ? '<p class="empty">لا توجد مكالمات بعد</p>'
          : surveys.map(s => {
              const posTags = (s.positives || []).map(id => tMap[id]?.name || id);
              const negTags = (s.negatives || []).map(id => tMap[id]?.name || id);
              return `
                <div class="survey-item ${s.locked ? "locked" : ""}">
                  <div class="survey-date">
                    ${formatDate(s.callDate)}
                    ${s.locked ? '<span class="locked-pill">🔒 مقفل</span>' : ""}
                  </div>
                  <div class="stags">
                    ${posTags.map(n => `<span class="stag pos">${n}</span>`).join("")}
                    ${negTags.map(n => `<span class="stag neg">${n}</span>`).join("")}
                  </div>
                  ${s.positiveNotes ? `<div class="survey-note pos">✦ ${s.positiveNotes}</div>` : ""}
                  ${s.negativeNotes ? `<div class="survey-note neg">◈ ${s.negativeNotes}</div>` : ""}
                </div>`;
            }).join("")
        }
      </div>
    `;

  } catch (e) {
    $("profile-content").innerHTML = `<p class="err-msg">${e.message}</p>`;
  }
}

// ══════════════════════════════════════════════
// IMPORT
// ══════════════════════════════════════════════
let importMode = "text";
let xlsxFile   = null;

async function initImportPage() {
  $("import-result").style.display = "none";
  $("prog-wrap").style.display     = "none";
  fillSelect("import-branch-sel");
}

function switchImportTab(mode, btn) {
  importMode = mode;
  document.querySelectorAll(".itab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  $("text-section").style.display  = mode === "text"  ? "block" : "none";
  $("excel-section").style.display = mode === "excel" ? "block" : "none";
}

function handleXlsx(input) {
  if (input.files[0]) {
    xlsxFile = input.files[0];
    $("xlsx-name").textContent = "✅ " + input.files[0].name;
    $("xlsx-name").style.display = "block";
  }
}

async function doImport() {
  const branchId = $("import-branch-sel").value;
  if (!branchId) { toast("اختر الفرع أولاً", "err"); return; }

  const btn  = $("import-btn");
  const prog = $("prog-wrap");
  const fill = $("prog-fill");

  btn.disabled    = true;
  btn.textContent = "جاري الاستيراد...";
  prog.style.display = "block";
  fill.style.width   = "0%";
  $("import-result").style.display = "none";

  const onProg = (done, total) => (fill.style.width = Math.round(done / total * 100) + "%");

  try {
    let entries = [];

    if (importMode === "text") {
      const raw = $("import-text").value.trim();
      if (!raw) { toast("أدخل البيانات أولاً", "err"); return; }
      entries = parseText(raw);
    } else {
      if (!xlsxFile) { toast("اختر ملف Excel أولاً", "err"); return; }
      entries = await parseXlsx(xlsxFile);
    }

    if (entries.length === 0) { toast("لم يُعثر على أرقام صالحة", "err"); return; }

    const results = await upsertCustomers(entries, branchId, onProg);

    fill.style.width = "100%";
    $("import-result").style.display = "block";
    $("import-result").innerHTML = `
      ✅ <strong>اكتمل الاستيراد</strong><br>
      جديد: ${results.added} &nbsp;|&nbsp; محدّث: ${results.updated}<br>
      ${results.errors.length > 0
        ? `<span style="color:var(--neg)">أخطاء (${results.errors.length}): ${results.errors.slice(0, 3).join("، ")}</span>`
        : ""}
    `;
    toast(`تم استيراد ${results.added + results.updated} عميل`, "ok");
    clearBranchCache();

  } catch (e) {
    toast("خطأ: " + e.message, "err");
  } finally {
    btn.disabled    = false;
    btn.textContent = "بدء الاستيراد";
    setTimeout(() => (prog.style.display = "none"), 1400);
  }
}

function parseText(raw) {
  return raw.split("\n").map(l => l.trim()).filter(Boolean).flatMap(line => {
    const m = line.match(/^(05\d{8})\s*[\(\（]?([^\)\）]*)[\)\）]?$/);
    return m ? [{ phone: m[1], name: m[2].trim() }] : [];
  });
}

async function parseXlsx(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = e => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
        const entries = [];
        rows.forEach(row => {
          let phone = "", name = "";
          (row || []).forEach(cell => {
            const v = normalizePhone(String(cell || "").trim());
            if (validPhone(v)) phone = v;
            else if (String(cell || "").trim()) name = name || String(cell).trim();
          });
          if (phone) entries.push({ phone, name });
        });
        res(entries);
      } catch (err) { rej(err); }
    };
    fr.readAsArrayBuffer(file);
  });
}

async function upsertCustomers(entries, branchId, onProg) {
  const results = { added: 0, updated: 0, errors: [] };
  for (let i = 0; i < entries.length; i++) {
    const { phone, name } = entries[i];
    try {
      if (!validPhone(phone)) throw new Error("رقم غير صالح");
      const snap = await getDocs(query(collection(db, "customers"), where("phone", "==", phone), limit(1)));
      if (snap.empty) {
        await addDoc(collection(db, "customers"), {
          phone, name: name || "",
          branches:  [branchId],
          firstSeen: serverTimestamp(),
          lastSeen:  serverTimestamp()
        });
        results.added++;
      } else {
        const ref = snap.docs[0].ref;
        const upd = { lastSeen: serverTimestamp(), branches: arrayUnion(branchId) };
        if (name) upd.name = name;
        await updateDoc(ref, upd);
        results.updated++;
      }
    } catch (e) {
      results.errors.push(phone + ": " + e.message);
    }
    if (onProg) onProg(i + 1, entries.length);
  }

  await addDoc(collection(db, "imports"), {
    branchId,
    importDate: serverTimestamp(),
    count: results.added + results.updated,
    source: importMode
  });

  return results;
}

// ══════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════
async function loadReports() {
  const branches = await getBranches();
  const bar = $("rpt-branch-bar");
  if (bar) {
    bar.innerHTML =
      `<button class="bfilter active" data-bid="" id="btn-rpt-all">جميع الفروع</button>` +
      branches.map(b =>
        `<button class="bfilter" data-bid="${b.id}">${b.name}</button>`
      ).join("");

    // إعداد مستمعي الأحداث ديناميكياً بدلاً من inline onClick
    bar.querySelectorAll(".bfilter").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        bar.querySelectorAll(".bfilter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        rptBranch = btn.dataset.bid || null;
        await renderTagReport();
        $("branch-cmp-card").style.display = !rptBranch ? "block" : "none";
      });
    });
  }

  await renderTagReport();
  await renderBranchCmp();
  await renderSnippets();
}

async function renderTagReport() {
  loading("tag-report");
  let q = rptBranch
    ? query(collection(db, "surveys"), where("branchId", "==", rptBranch))
    : collection(db, "surveys");
  const snap = await getDocs(q);

  const tags   = await getTags();
  const tagMap = {};
  tags.forEach(t => (tagMap[t.id] = t.name));

  const pos = {}, neg = {};
  snap.docs.forEach(d => {
    const s = d.data();
    (s.positives || []).forEach(id => (pos[id] = (pos[id] || 0) + 1));
    (s.negatives || []).forEach(id => (neg[id] = (neg[id] || 0) + 1));
  });

  const sortedPos = Object.entries(pos).map(([id, c]) => ({ name: tagMap[id] || id, count: c })).sort((a, b) => b.count - a.count).slice(0, 10);
  const sortedNeg = Object.entries(neg).map(([id, c]) => ({ name: tagMap[id] || id, count: c })).sort((a, b) => b.count - a.count).slice(0, 10);
  const maxP = sortedPos[0]?.count || 1, maxN = sortedNeg[0]?.count || 1;

  const repContainer = $("tag-report");
  if (repContainer) {
    repContainer.innerHTML = `
      <div class="report-grid">
        <div>
          <div class="rep-section-title pos">✦ أكثر الإشادات</div>
          ${sortedPos.length === 0 ? '<p class="empty" style="padding:.5rem">لا بيانات</p>'
            : sortedPos.map(t => barHTML(t.name, t.count, maxP, "pos")).join("")}
        </div>
        <div>
          <div class="rep-section-title neg">◈ أكثر الشكاوى</div>
          ${sortedNeg.length === 0 ? '<p class="empty" style="padding:.5rem">لا بيانات</p>'
            : sortedNeg.map(t => barHTML(t.name, t.count, maxN, "neg")).join("")}
        </div>
      </div>
      <p style="font-size:.8rem;color:var(--ink-3);text-align:center;margin-top:.75rem">إجمالي الاستطلاعات: ${snap.size}</p>
    `;
  }
}

function barHTML(name, count, max, cls) {
  const pct = Math.round(count / max * 100);
  return `
    <div class="bar-item">
      <div class="bar-label"><span>${name}</span><span class="bar-count">${count}</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
}

async function renderBranchCmp() {
  loading("branch-cmp");
  const [branches, surveysSnap] = await Promise.all([getBranches(), getDocs(collection(db, "surveys"))]);
  const stats = {};
  branches.forEach(b => (stats[b.id] = { name: b.name, surveys: 0, pos: 0, neg: 0 }));
  surveysSnap.docs.forEach(d => {
    const s = d.data();
    if (stats[s.branchId]) {
      stats[s.branchId].surveys++;
      stats[s.branchId].pos += (s.positives || []).length;
      stats[s.branchId].neg += (s.negatives || []).length;
    }
  });
  const rows = Object.values(stats);
  const cmpContainer = $("branch-cmp");
  if (cmpContainer) {
    cmpContainer.innerHTML = rows.length === 0
      ? '<p class="empty">لا بيانات</p>'
      : `<div style="overflow-x:auto"><table class="cmp-table">
          <thead><tr><th>الفرع</th><th>الاستطلاعات</th><th>الإشادات</th><th>الشكاوى</th></tr></thead>
          <tbody>${rows.map(r => `
            <tr>
              <td><strong>${r.name}</strong></td>
              <td>${r.surveys}</td>
              <td class="td-pos">${r.pos}</td>
              <td class="td-neg">${r.neg}</td>
            </tr>`).join("")}
          </tbody>
        </table></div>`;
  }
}

async function renderSnippets() {
  const snap = await getDocs(query(collection(db, "surveys"), limit(60)));
  const all  = [];
  snap.docs.forEach(d => {
    const s = d.data();
    if (s.positiveNotes?.trim().length > 4) all.push({ text: s.positiveNotes.trim(), type: "pos" });
    if (s.negativeNotes?.trim().length > 4) all.push({ text: s.negativeNotes.trim(), type: "neg" });
  });
  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const pick = all.slice(0, 6);
  const snipContainer = $("snippets");
  if (snipContainer) {
    snipContainer.innerHTML = pick.length === 0
      ? '<p class="empty">لا توجد ملاحظات بعد</p>'
      : pick.map(s => `<div class="snippet ${s.type}">"${s.text}"</div>`).join("");
  }
}

// ══════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════
async function loadAdmin() {
  await Promise.all([loadBranchAdmin(), loadTagsAdmin()]);
}

// ── Branches ──
async function loadBranchAdmin() {
  clearBranchCache();
  const branches = await getBranches();
  const list = $("branch-list");
  if (list) {
    list.innerHTML = branches.length === 0
      ? '<p class="empty">لا توجد فروع</p>'
      : branches.map(b => `
          <li class="admin-item">
            <span class="admin-name">${b.name}</span>
            <div class="admin-actions">
              <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${b.id}" data-name="${b.name.replace(/'/g,"\\'")}">تعديل</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${b.id}" data-name="${b.name.replace(/'/g,"\\'")}">حذف</button>
            </div>
          </li>`).join("");

    // ربط الأحداث ديناميكياً
    list.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const action = btn.dataset.action;
        if (action === "edit") editBranch(btn.dataset.id, btn.dataset.name);
        if (action === "delete") deleteBranch(btn.dataset.id, btn.dataset.name);
      });
    });
  }
}

function toggleAddBranch() {
  const f = $("add-branch-form");
  if (f) f.classList.toggle("show");
}

async function addBranch() {
  const name = $("new-branch-name").value.trim();
  if (!name) return;
  try {
    await addDoc(collection(db, "branches"), { name, createdAt: serverTimestamp() });
    toast("تمت الإضافة", "ok");
    $("new-branch-name").value = "";
    $("add-branch-form").classList.remove("show");
    loadBranchAdmin();
    clearBranchCache();
    fillSelect("call-branch-sel");
    fillSelect("import-branch-sel");
    fillSelect("cust-branch-filter");
  } catch (e) { toast(e.message, "err"); }
}

async function editBranch(id, old) {
  const name = prompt("اسم الفرع الجديد:", old);
  if (!name || name.trim() === old) return;
  await updateDoc(doc(db, "branches", id), { name: name.trim() });
  toast("تم التعديل", "ok");
  clearBranchCache();
  loadBranchAdmin();
}

async function deleteBranch(id, name) {
  if (!confirm(`حذف فرع "${name}"؟`)) return;
  const snap = await getDocs(query(collection(db, "customers"), where("branches", "array-contains", id), limit(1)));
  if (!snap.empty) { toast("لا يمكن حذف فرع مرتبط بعملاء", "err"); return; }
  await deleteDoc(doc(db, "branches", id));
  toast("تم الحذف", "ok");
  clearBranchCache();
  loadBranchAdmin();
}

// ── Tags ──
async function loadTagsAdmin() {
  clearTagCache();
  const tags = await getTags();
  renderTagAdmin("pos-tag-list", tags.filter(t => t.type === "positive"), "positive");
  renderTagAdmin("neg-tag-list", tags.filter(t => t.type === "negative"), "negative");
}

function renderTagAdmin(listId, tags, type) {
  const list = $(listId);
  if (!list) return;
  list.innerHTML = tags.length === 0
    ? '<p class="empty" style="padding:.5rem">لا توجد وسوم</p>'
    : tags.map(t => `
        <li class="admin-item">
          <span class="admin-name">${t.name}</span>
          <div class="admin-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${t.id}" data-name="${t.name.replace(/'/g,"\\'")}">تعديل</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${t.id}" data-name="${t.name.replace(/'/g,"\\'")}">حذف</button>
          </div>
        </li>`).join("");

  list.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "edit") editTag(btn.dataset.id, btn.dataset.name);
      if (action === "delete") deleteTag(btn.dataset.id, btn.dataset.name, type);
    });
  });
}

function toggleAddTag(type) {
  $("add-pos-tag-form").classList.remove("show");
  $("add-neg-tag-form").classList.remove("show");
  const f = $(`add-${type === "positive" ? "pos" : "neg"}-tag-form`);
  if (f) f.classList.toggle("show");
}

async function addTag(type) {
  const inputId = type === "positive" ? "new-pos-tag" : "new-neg-tag";
  const name    = $(inputId).value.trim();
  if (!name) return;
  await addDoc(collection(db, "tags"), { name, type, createdAt: serverTimestamp() });
  toast("تمت الإضافة", "ok");
  $(inputId).value = "";
  $(`add-${type === "positive" ? "pos" : "neg"}-tag-form`).classList.remove("show");
  clearTagCache();
  loadTagsAdmin();
}

async function editTag(id, old) {
  const name = prompt("اسم الوسم الجديد:", old);
  if (!name || name.trim() === old) return;
  await updateDoc(doc(db, "tags", id), { name: name.trim() });
  toast("تم التعديل", "ok");
  clearTagCache();
  loadTagsAdmin();
}

async function deleteTag(id, name, type) {
  if (!confirm(`حذف وسم "${name}"؟`)) return;
  const field = type === "positive" ? "positives" : "negatives";
  const snap  = await getDocs(query(collection(db, "surveys"), where(field, "array-contains", id), limit(1)));
  if (!snap.empty) { toast("الوسم مستخدم في استطلاعات ولا يمكن حذفه", "err"); return; }
  await deleteDoc(doc(db, "tags", id));
  toast("تم الحذف", "ok");
  clearTagCache();
  loadTagsAdmin();
}

// ══════════════════════════════════════════════
// EXPORTING TO GLOBAL SCOPE (لربط أزرار الـ HTML)
// ══════════════════════════════════════════════
window.showPage = showPage;
window.goBack = goBack;
window.startCalling = startCalling;
window.resetCallScreen = resetCallScreen;
window.skipCustomer = skipCustomer;
window.saveSurveyAndNext = saveSurveyAndNext;
window.loadMoreCustomers = loadMoreCustomers;
window.filterCustBranch = filterCustBranch;
window.searchCustomers = searchCustomers;
window.switchImportTab = switchImportTab;
window.handleXlsx = handleXlsx;
window.doImport = doImport;
window.refreshSnippets = renderSnippets;
window.loadDashboard = loadDashboard;
window.loadReports = loadReports;
window.toggleAddBranch = toggleAddBranch;
window.addBranch = addBranch;
window.toggleAddTag = toggleAddTag;
window.addTag = addTag;

// ══════════════════════════════════════════════
// BOOT — init selects on first load
// ══════════════════════════════════════════════
(async () => {
  await Promise.all([
    fillSelect("call-branch-sel"),
    fillSelect("import-branch-sel"),
    fillSelect("cust-branch-filter", "جميع الفروع")
  ]);
  const f = $("cust-branch-filter");
  if (f && f.querySelector("option")) f.querySelector("option").value = "";

  loadDashboard();
})();
