# متجر الإمدادات الذكية الحديثة — المتجر الرقمي

واجهة المتجر الرقمي لمؤسسة **الإمدادات الذكية الحديثة للدعاية والإعلان** (alimdadat.sa)، مطابقة لتصميم النموذج التفاعلي، ومربوطة بـ **Firebase**:

- **واجهة المتجر** (`index.html`): الأقسام والمنتجات ومعرض الأعمال والإعدادات تُقرأ من Firestore، وطلبات عروض الأسعار تُحفظ في مجموعة `orders`.
- **لوحة التحكم** (`admin.html`): تسجيل دخول المشرف، متابعة الطلبات لحظيًا وتغيير حالتها، إدارة المنتجات والأقسام ومعرض الأعمال، ساعات العمل وبيانات التواصل، تصدير الطلبات CSV.
- عربي RTL، خط Shamel، مُحسَّن للجوال، ويعمل على Firebase Hosting أو GitHub Pages أو Vercel بلا خادم.

---

## خطوات التشغيل الفعلي (مرة واحدة)

### 1) إنشاء مشروع Firebase
1. ادخل إلى <https://console.firebase.google.com> وأنشئ مشروعًا جديدًا.
2. **Build ← Firestore Database ← Create database** (اختر أقرب موقع متاح لعملائك — لا يمكن تغييره لاحقًا — ووضع *Production*).
3. **Build ← Authentication ← Get started ← Email/Password ← Enable**.
4. (اختياري) **Build ← Storage** لرفع صور المنتجات من لوحة التحكم مباشرة (يتطلب خطة Blaze). بدونه تُضاف الصور برابط.

### 2) ربط الموقع بالمشروع
**Project settings ← General ← Your apps ← Web (`</>`)**، سجّل تطبيقًا وانسخ قيم `firebaseConfig` إلى ملف **`firebase-config.js`** في جذر الموقع:

```js
window.EMDAD_FIREBASE_CONFIG = {
  apiKey: '...', authDomain: '....firebaseapp.com', projectId: '...',
  storageBucket: '....firebasestorage.app', messagingSenderId: '...', appId: '...'
};
```
> هذه القيم ليست سرية؛ الحماية الفعلية تتم عبر قواعد الأمان في الخطوة التالية.

### 3) نشر قواعد الأمان والموقع
```bash
npm install
```
```bash
npx firebase-tools@15 login
```
```bash
npx firebase-tools@15 use --add
```
```bash
npm run deploy
```
يبني `npm run deploy` الملفات وينشر الموقع وقواعد Firestore وStorage. لنشر القواعد فقط: `npx firebase-tools@15 deploy --only firestore:rules,storage`.

> إن كنت تستضيف الموقع على GitHub Pages أو Vercel فانشر القواعد فقط بالأمر السابق؛ ملفات `dist/` مبنية ومرفوعة مسبقًا.

### 4) إنشاء حساب المشرف
1. **Authentication ← Users ← Add user**: أدخل بريد المشرف وكلمة المرور، وانسخ **User UID**.
2. **Firestore ← Start collection**: اسم المجموعة `admins`، ومعرّف المستند = **User UID**، وأضف حقلًا `email` (نص).
3. افتح `admin.html` وسجّل الدخول. (إن نسيت الـ UID فستعرضه لك لوحة التحكم عند الدخول بحساب غير مشرف.)

### 5) تعبئة البيانات
في أول دخول ستظهر رسالة «قاعدة البيانات فارغة» ← اضغط **استيراد البيانات الأولية**: تُنشأ الأقسام الستة و23 منتجًا و12 عملًا وإعدادات المتجر من التصميم، ثم عدّلها من اللوحة.

---

## بنية البيانات (Firestore)

| المجموعة | الوصف | الحقول الرئيسية |
|---|---|---|
| `categories` | أقسام المتجر | `name`, `short`, `tag`, `desc`, `image`, `items[]`, `works[]`, `order`, `active` |
| `products` | منتجات كل قسم | `categoryId`, `name`, `desc`, `image`, `price` (فارغ = «السعر عند الطلب»), `order`, `active` |
| `portfolio` | معرض الأعمال | `title`, `desc`, `group` (فلتر), `image`, `height`, `order`, `active` |
| `settings/store` | بيانات المتجر | الهاتف، واتساب، العنوان، الخرائط، ساعات العمل، الحسابات، التقييم، `showLoyalty` |
| `orders` | طلبات عروض الأسعار | `ref` (EM-XXXXXX), `name`, `phone`, `email`, `serviceId`, `serviceName`, `description`, `items[]`, `status`, `notes`, `createdAt` |
| `admins/{uid}` | المشرفون | `email` |

**حالات الطلب:** جديد ← تم التواصل ← أُرسل العرض ← قيد التنفيذ ← مكتمل / ملغي.

### قواعد الأمان (`firestore.rules`)
- الزوار يقرؤون العناصر الظاهرة (`active == true`) والإعدادات فقط.
- الزوار ينشئون طلبًا بصيغة محددة فقط (جوال سعودي `05XXXXXXXX`، أطوال محددة، حالة `new`، رقم طلب مطابق لمعرّف المستند، وقت الخادم)، ولا يمكنهم قراءة أي طلب.
- المشرف يدير الكتالوج، ويحدّث حالة الطلب وملاحظاته دون تعديل بيانات العميل.
- القواعد مغطاة باختبارات آلية: `npm test` (يتطلب Java لتشغيل محاكي Firestore).

---

## التطوير المحلي

```bash
npm install
```
```bash
npm run build
```
```bash
npm run dev
```
ثم افتح <http://localhost:5173>. لتجربة كاملة دون مشروع حقيقي شغّل المحاكيات (`npm run emulators`) وضع في `firebase-config.js` قيمة `projectId: 'demo-emdad'` و`apiKey: 'demo-key'` — أي مشروع يبدأ بـ `demo-` يتصل بالمحاكيات تلقائيًا.

| المسار | المحتوى |
|---|---|
| `index.html`, `admin.html` | الصفحتان |
| `firebase-config.js` | إعدادات Firebase (تُعدَّل دون إعادة بناء) |
| `src/app/main.js` | واجهة المتجر |
| `src/admin/main.js` | لوحة التحكم |
| `src/lib/` | طبقة البيانات، تهيئة Firebase، أدوات الواجهة، البيانات الأولية (`seed.js`) |
| `src/styles.css`, `tailwind.config.cjs` | التنسيقات وألوان الهوية |
| `dist/` | الملفات المبنية (مرفوعة في المستودع ليعمل الموقع على GitHub Pages مباشرة) |
| `assets/` | الصور والخطوط والشعار |
| `firestore.rules`, `storage.rules`, `firebase.json` | إعدادات Firebase |
| `tests/` | اختبارات قواعد الأمان |

> بعد أي تعديل في `src/` شغّل `npm run build` وارفع مجلد `dist/`.

## ملاحظات قبل الإطلاق
- **برنامج الولاء** ما زال تجريبيًا: النقاط تُحفظ في متصفح العميل فقط وأزرار Apple/Google Wallet للعرض. يمكن إخفاؤه من **الإعدادات ← إظهار برنامج الولاء** إلى أن تُعتمد قواعده.
- **طرق الدفع** المعروضة في الرئيسية للتعريف فقط؛ المتجر يعمل بنظام طلب عرض السعر.
- **تنبيهات الطلبات الجديدة**: تظهر لحظيًا في لوحة التحكم (مع عدّاد في عنوان الصفحة). لإرسال بريد/رسالة تلقائيًا عند كل طلب يمكن إضافة Cloud Function أو إضافة *Trigger Email* (تتطلب خطة Blaze).
- يُنصح بتفعيل **App Check** (reCAPTCHA Enterprise) في Firebase للحد من الطلبات المزعجة.
- خط Shamel تجاري؛ تأكد من رخصة الاستخدام على الويب.
- إن تعذّر الاتصال بقاعدة البيانات يعرض المتجر آخر نسخة محفوظة، ويقترح على العميل إرسال طلبه عبر واتساب.
