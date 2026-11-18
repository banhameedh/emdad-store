/*
 * اختبارات قواعد أمان Firestore — تعمل على محاكي Firebase المحلي:
 *   npm test
 * (يشغّل المحاكيات ثم يحذفها تلقائيًا بعد انتهاء الاختبارات)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs, setDoc, updateDoc, query, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';

const PROJECT = 'demo-emdad';
const FS = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const [fsHost, fsPort] = FS.split(':');

async function rest(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'content-type': 'application/json', Authorization: 'Bearer owner', ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json().catch(() => ({}));
}
const docUrl = (path) => `http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
// كتابة مباشرة متجاوزة للقواعد (تهيئة بيانات الاختبار)
const seed = (path, fields) => rest(docUrl(path), { method: 'PATCH', body: JSON.stringify({ fields }) });
const S = (v) => ({ stringValue: v }); const B = (v) => ({ booleanValue: v });

let n = 0; const apps = [];
function client() {
  const app = initializeApp({ apiKey: 'demo-key', projectId: PROJECT }, `c${n++}`); apps.push(app);
  const db = getFirestore(app); connectFirestoreEmulator(db, fsHost, Number(fsPort));
  const auth = getAuth(app); connectAuthEmulator(auth, `http://${AUTH}`, { disableWarnings: true });
  return { db, auth };
}
async function signedIn(email) {
  const c = client(); await signInWithEmailAndPassword(c.auth, email, 'Secret123!'); return c;
}
const denied = (p) => assert.rejects(p, (e) => /permission|PERMISSION_DENIED/i.test(e.code + e.message));

function validOrder(db) {
  const ref = doc(collection(db, 'orders'));
  const data = {
    ref: 'EM-' + ref.id.slice(0, 6).toUpperCase(), name: 'عميل', phone: '0551234567', serviceId: 'signage', serviceName: 'اللوحات',
    description: 'وصف المشروع', items: [{ productId: 'signage-1', name: 'حروف', categoryId: 'signage' }],
    status: 'new', source: 'web', consent: true, createdAt: serverTimestamp(),
  };
  return { ref, data };
}

let anon, user, admin;
test.before(async () => {
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  const signUp = (email) => rest(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, { method: 'POST', body: JSON.stringify({ email, password: 'Secret123!', returnSecureToken: true }) });
  const a = await signUp('admin@test.local'); await signUp('user@test.local');
  await seed(`admins/${a.localId}`, { email: S('admin@test.local') });
  await seed('categories/signage', { name: S('اللوحات'), active: B(true) });
  await seed('categories/hidden', { name: S('مخفي'), active: B(false) });
  await seed('products/p1', { name: S('حروف'), categoryId: S('signage'), active: B(true) });
  await seed('products/p2', { name: S('مسودة'), categoryId: S('signage'), active: B(false) });
  await seed('settings/store', { phone: S('0500000000') });
  anon = client(); user = await signedIn('user@test.local'); admin = await signedIn('admin@test.local');
});

test.after(() => Promise.all(apps.map((a) => deleteApp(a))));

test('الزائر يقرأ الكتالوج المفعّل والإعدادات', async () => {
  const snap = await getDocs(query(collection(anon.db, 'products'), where('active', '==', true)));
  assert.deepEqual(snap.docs.map((d) => d.id), ['p1']);
  assert.equal((await getDoc(doc(anon.db, 'settings', 'store'))).data().phone, '0500000000');
});
test('الزائر لا يقرأ العناصر المخفية ولا يستعلم دون تصفية', async () => {
  await denied(getDoc(doc(anon.db, 'products', 'p2')));
  await denied(getDocs(collection(anon.db, 'categories')));
});
test('الزائر والمستخدم العادي لا يعدّلان الكتالوج', async () => {
  await denied(setDoc(doc(anon.db, 'products', 'x'), { name: 'x', active: true }));
  await denied(setDoc(doc(user.db, 'categories', 'signage'), { name: 'x' }, { merge: true }));
  await denied(setDoc(doc(user.db, 'admins', user.auth.currentUser.uid), { email: 'me' }));
});
test('الزائر ينشئ طلبًا صحيحًا', async () => {
  const { ref, data } = validOrder(anon.db);
  await setDoc(ref, data);
  const { ref: r2, data: d2 } = validOrder(anon.db); await setDoc(r2, { ...d2, email: 'a@b.co', items: [] });
});
test('رفض الطلبات غير الصالحة', async () => {
  const bad = [
    (d) => ({ ...d, phone: '12345' }),
    (d) => ({ ...d, ref: 'EM-AAAAAA' }),
    (d) => ({ ...d, status: 'done' }),
    (d) => ({ ...d, consent: false }),
    (d) => ({ ...d, admin: true }),
    (d) => ({ ...d, description: 'x'.repeat(501) }),
    (d) => ({ ...d, name: '' }),
    (d) => ({ ...d, email: 'not-an-email' }),
    (d) => ({ ...d, items: Array.from({ length: 31 }, () => ({ name: 'x' })) }),
    (d) => ({ ...d, createdAt: Timestamp.fromDate(new Date('2020-01-01')) }),
    (d) => { const { serviceName, ...rest } = d; return rest; },
  ];
  for (const f of bad) { const { ref, data } = validOrder(anon.db); await denied(setDoc(ref, f(data))); }
});
test('الطلبات لا يقرؤها إلا المشرف', async () => {
  const { ref, data } = validOrder(anon.db); await setDoc(ref, data);
  await denied(getDoc(doc(anon.db, 'orders', ref.id)));
  await denied(getDoc(doc(user.db, 'orders', ref.id)));
  await denied(updateDoc(doc(anon.db, 'orders', ref.id), { status: 'done' }));
  assert.equal((await getDoc(doc(admin.db, 'orders', ref.id))).data().name, 'عميل');
});
test('المشرف يحدّث الحالة والملاحظات فقط', async () => {
  const { ref, data } = validOrder(anon.db); await setDoc(ref, data);
  await updateDoc(doc(admin.db, 'orders', ref.id), { status: 'quoted', notes: 'أُرسل العرض', updatedAt: serverTimestamp(), updatedBy: 'admin' });
  await denied(updateDoc(doc(admin.db, 'orders', ref.id), { status: 'unknown' }));
  await denied(updateDoc(doc(admin.db, 'orders', ref.id), { phone: '0500000000' }));
});
test('المشرف يدير الكتالوج', async () => {
  await setDoc(doc(admin.db, 'products', 'p3'), { name: 'جديد', categoryId: 'signage', active: true });
  assert.equal((await getDoc(doc(admin.db, 'products', 'p2'))).data().name, 'مسودة');
});
