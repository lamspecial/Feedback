# نظام رضا العملاء - دليل النشر الكامل

## هيكل الملفات

```
survey-system/
├── index.html          ← صفحة تسجيل الدخول
├── dashboard.html      ← التطبيق الرئيسي (SPA)
├── css/
│   └── styles.css
└── js/
    ├── firebase.js     ← إعداد Firebase
    ├── auth.js         ← المصادقة
    ├── branches.js     ← الفروع
    ├── tags.js         ← الوسوم
    ├── customers.js    ← العملاء
    ├── surveys.js      ← الاستطلاعات
    └── reports.js      ← التقارير
```

---

## خطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً (مثلاً: `customer-survey`)
3. من الإعدادات، أضف تطبيق ويب، ستحصل على `firebaseConfig`
4. انسخه في `js/firebase.js`

---

## خطوة 2: تفعيل الخدمات في Firebase

### Authentication
- من القائمة الجانبية: **Build → Authentication → Sign-in method**
- فعّل: **Email/Password**

### Firestore Database
- **Build → Firestore Database → Create database**
- ابدأ بـ **Production mode**
- اختر المنطقة (مثلاً: `asia-south1` أو `europe-west1`)

### Storage
- **Build → Storage → Get started**
- الإعدادات الافتراضية مناسبة

---

## خطوة 3: قواعد Firestore

في Firestore → **Rules**، استبدل القواعد بـ:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }

    function isResearcher() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'researcher'];
    }

    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if isOwner();
    }

    match /branches/{branchId} {
      allow read: if isResearcher();
      allow write: if isOwner();
    }

    match /tags/{tagId} {
      allow read: if isResearcher();
      allow write: if isOwner();
    }

    match /customers/{customerId} {
      allow read: if isResearcher();
      allow write: if isResearcher();
    }

    match /imports/{importId} {
      allow read: if isResearcher();
      allow write: if isResearcher();
    }

    match /surveys/{surveyId} {
      allow read: if isResearcher();
      allow create: if isResearcher();
      allow update: if isResearcher() && !resource.data.locked;
      allow delete: if isOwner();
    }
  }
}
```

---

## خطوة 4: قواعد Storage

في Storage → **Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /calls/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## خطوة 5: فهارس Firestore

في Firestore → **Indexes → Composite**، أنشئ:

| Collection | Field 1         | Field 2    | Order |
|------------|-----------------|------------|-------|
| customers  | branches (Array)| lastSeen   | ASC   |
| surveys    | customerId      | callDate   | DESC  |
| surveys    | branchId        | callDate   | DESC  |
| surveys    | locked          | callDate   | ASC   |
| surveys    | positives (Array)| —         | —     |
| surveys    | negatives (Array)| —         | —     |

---

## خطوة 6: إنشاء المستخدمين

### إنشاء حساب المالك:

1. في Firebase Console: **Authentication → Users → Add user**
2. أدخل البريد وكلمة المرور للمالك
3. انسخ الـ **UID**

### إضافة بيانات المستخدم في Firestore:

في **Firestore → users** (إنشاء المجموعة يدوياً):

```
Collection: users
Document ID: [UID الذي نسخته]
Fields:
  role: "owner"
  name: "اسم المالك"
```

### لإنشاء باحث:
1. أنشئ المستخدم في Authentication
2. أضف document في `users` بـ:
```
  role: "researcher"
  name: "اسم الباحث"
```

---

## خطوة 7: النشر على GitHub Pages

```bash
# 1. أنشئ repository جديد على GitHub
git init
git add .
git commit -m "نظام رضا العملاء"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# 2. في GitHub: Settings → Pages
# Source: Deploy from branch → main → / (root)
# Save

# 3. الرابط سيكون:
# https://USERNAME.github.io/REPO/
```

---

## ملاحظات مهمة

- **قبل النشر**: تأكد من تحديث `firebaseConfig` في `js/firebase.js`
- **Authorized domains**: في Firebase Console → Authentication → Settings → Authorized domains
  - أضف: `USERNAME.github.io`
- **CORS للـ Storage**: لا يحتاج إعداد إضافي مع Firebase SDK
- **الأداء**: يستخدم النظام Pagination و Lazy loading تلقائياً

---

## البيانات الأولية المقترحة

أضف في Firestore هذه الوسوم الافتراضية:

**Collection: tags**

```
{ name: "النظافة", type: "positive" }
{ name: "التعامل", type: "positive" }
{ name: "السرعة", type: "positive" }
{ name: "الجودة", type: "positive" }
{ name: "الأسعار", type: "negative" }
{ name: "الانتظار", type: "negative" }
{ name: "الازدحام", type: "negative" }
{ name: "النظافة", type: "negative" }
```
