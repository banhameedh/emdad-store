/*
 * اختبارات قواعد أمان Firestore — تعمل على محاكي Firebase المحلي:
 *   npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs, setDoc, updateDoc, query, where, writeBatch,
  serverTimestamp, Timestamp, arrayUnion,
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
const seed = (path, fields) => rest(`http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, { method: 'PATCH', body: JSON.stringify({ fields }) });
const S = (v) => ({ stringValue: v }); const B = (v) => ({ booleanValue: v }); const N = (v) => ({ doubleValue: v });

let n = 0; const apps = [];
function client() {
  const app = initializeApp({ apiKey: 'demo-key', projectId: PROJECT }, `c${n++}`); apps.push(app);
  const db = getFirestore(app); connectFirestoreEmulator(db, fsHost, Number(fsPort));
  const auth = getAuth(app); connectAuthEmulator(auth, `http://${AUTH}`, { disableWarnings: true });
  return { db, auth };
}
async function signedIn(email) { const c = client(); await signInWithEmailAndPassword(c.auth, email, 'Secret123!'); return c; }
const denied = (p) => assert.rejects(p, (e) => /permission|PERMISSION_DENIED/i.test(e.code + e.message));

/** ينشئ طلبًا + مستند تتبع كما يفعل المتجر */
function build(db, coll, extra = {}) {
  const ref = doc(collection(db, coll)); const no = 'EM-' + ref.id.slice(0, 6).toUpperCase();
  const base = coll === 'orders'
    ? { type: 'purchase', delivery: 'pickup', paymentMethod: 'cod', totals: { subtotal: 180, total: 180, vat: 23.48, vatRate: 15, vatIncluded: true, currency: 'SAR' }, items: [{ productId: 'p1', name: 'رول أب', qty: 1, unitPrice: 180, lineTotal: 180 }] }
    : { type: 'quote', kind: 'rfq', description: 'لوحات إرشادية لمستشفى', items: [], files: [], customerType: 'government', company: 'جهة حكومية' };
  const data = { ref: no, name: 'عميل', phone: '0551234567', status: 'new', source: 'web', consent: true, createdAt: serverTimestamp(), ...base, ...extra };
  const track = { ref: no, coll, orderId: ref.id, phoneTail: '4567', type: data.type, status: 'new', createdAt: serverTimestamp() };
  return { ref, data, no, track, tid: `${no}_4567` };
}
async function place(db, coll, extra) {
  const o = build(db, coll, extra); const b = writeBatch(db);
  b.set(o.ref, o.data); b.set(doc(db, 'tracking', o.tid), o.track); await b.commit(); return o;
}

let anon, user, user2, admin, anonAuthed;
test.before(async () => {
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  const signUp = (email) => rest(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, { method: 'POST', body: JSON.stringify({ email, password: 'Secret123!', returnSecureToken: true }) });
  const a = await signUp('admin@test.local'); await signUp('user@test.local'); await signUp('user2@test.local');
  await seed(`admin_users/${a.localId}`, { email: S('admin@test.local') });
  await seed('categories/signage', { name: S('اللوحات'), active: B(true) });
  await seed('products/p1', { name: S('رول أب'), categoryId: S('signage'), active: B(true), price: N(180) });
  await seed('products/p2', { name: S('مسودة'), categoryId: S('signage'), active: B(false) });
  await seed('promotions/pr1', { name: S('عرض'), active: B(true), value: N(10) });
  await seed('settings/store', { phone: S('0500000000') });
  anon = client(); user = await signedIn('user@test.local'); user2 = await signedIn('user2@test.local'); admin = await signedIn('admin@test.local');
  anonAuthed = client(); await signInAnonymously(anonAuthed.auth);
});
test.after(() => Promise.all(apps.map((x) => deleteApp(x))));

test('الزائر يقرأ الكتالوج المنشور والإعدادات والعروض الفعالة', async () => {
  const snap = await getDocs(query(collection(anon.db, 'products'), where('active', '==', true)));
  assert.deepEqual(snap.docs.map((d) => d.id), ['p1']);
  assert.equal((await getDoc(doc(anon.db, 'settings', 'store'))).data().phone, '0500000000');
  assert.equal((await getDocs(query(collection(anon.db, 'promotions'), where('active', '==', true)))).size, 1);
});
test('الزائر لا يقرأ المخفي ولا يستعلم دون تصفية', async () => {
  await denied(getDoc(doc(anon.db, 'products', 'p2')));
  await denied(getDocs(collection(anon.db, 'categories')));
});
test('العميل لا يعدّل المنتجات أو الأسعار ولا يمنح نفسه صلاحية المشرف', async () => {
  await denied(updateDoc(doc(user.db, 'products', 'p1'), { price: 1 }));
  await denied(setDoc(doc(user.db, 'promotions', 'x'), { name: 'x', active: true, value: 99 }));
  await denied(setDoc(doc(user.db, 'settings', 'store'), { phone: '1' }, { merge: true }));
  await denied(setDoc(doc(user.db, 'admin_users', user.auth.currentUser.uid), { email: 'me' }));
});
test('الزائر ينشئ طلب شراء وطلب عرض سعر مع مستند التتبع', async () => {
  const o = await place(anon.db, 'orders'); const q = await place(anon.db, 'quotes');
  const t = await getDoc(doc(anon.db, 'tracking', o.tid)); assert.equal(t.data().status, 'new');
  assert.equal((await getDoc(doc(anon.db, 'tracking', q.tid))).data().type, 'quote');
});
test('رفض الطلبات غير الصالحة', async () => {
  const bad = [
    ['orders', { phone: '12345' }], ['orders', { ref: 'EM-AAAAAA' }], ['orders', { status: 'paid' }], ['orders', { consent: false }],
    ['orders', { admin: true }], ['orders', { items: [] }], ['orders', { paymentMethod: 'card' }], ['orders', { email: 'bad' }],
    ['orders', { createdAt: Timestamp.fromDate(new Date('2020-01-01')) }], ['orders', { uid: 'someone-else' }],
    ['quotes', { kind: 'other' }], ['quotes', { description: 'x'.repeat(2001) }], ['quotes', { type: 'purchase' }],
    ['quotes', { files: Array.from({ length: 11 }, () => ({ name: 'f' })) }],
  ];
  for (const [coll, extra] of bad) { const o = build(anon.db, coll, extra); await denied(setDoc(o.ref, o.data)); }
});
test('مستند التتبع لا يُنشأ لطلب غير موجود أو برقم جوال مختلف', async () => {
  const o = build(anon.db, 'orders');
  await denied(setDoc(doc(anon.db, 'tracking', o.tid), o.track)); // بلا طلب
  const o2 = build(anon.db, 'orders'); const b = writeBatch(anon.db);
  b.set(o2.ref, o2.data); b.set(doc(anon.db, 'tracking', `${o2.no}_9999`), { ...o2.track, phoneTail: '9999' });
  await denied(b.commit());
  await denied(getDocs(collection(anon.db, 'tracking')));
});
test('العميل يرى طلباته فقط، والطلبات لا يقرؤها الزائر', async () => {
  const mine = await place(user.db, 'orders', { uid: user.auth.currentUser.uid });
  const other = await place(anon.db, 'orders');
  assert.equal((await getDoc(doc(user.db, 'orders', mine.ref.id))).data().ref, mine.no);
  await denied(getDoc(doc(user.db, 'orders', other.ref.id)));
  await denied(getDoc(doc(user2.db, 'orders', mine.ref.id)));
  await denied(getDoc(doc(anon.db, 'orders', other.ref.id)));
  await denied(getDocs(collection(user.db, 'orders')));
  const list = await getDocs(query(collection(user.db, 'orders'), where('uid', '==', user.auth.currentUser.uid)));
  assert.equal(list.size, 1);
  // الجلسة المجهولة لا تربط الطلب بحساب
  const o = build(anonAuthed.db, 'orders', { uid: anonAuthed.auth.currentUser.uid }); await denied(setDoc(o.ref, o.data));
});
test('المشرف يحدّث الحالة والملاحظات والتتبع فقط', async () => {
  const o = await place(anon.db, 'quotes');
  const b = writeBatch(admin.db);
  b.update(doc(admin.db, 'quotes', o.ref.id), { status: 'quoted', quotedAmount: 12500, customerMessage: 'أُرسل العرض', history: arrayUnion({ status: 'quoted', at: Timestamp.now() }), updatedAt: serverTimestamp(), updatedBy: 'admin' });
  b.set(doc(admin.db, 'tracking', o.tid), { status: 'quoted', quotedAmount: 12500, history: arrayUnion({ status: 'quoted', at: Timestamp.now() }), updatedAt: serverTimestamp() }, { merge: true });
  await b.commit();
  assert.equal((await getDoc(doc(anon.db, 'tracking', o.tid))).data().quotedAmount, 12500);
  await denied(updateDoc(doc(admin.db, 'quotes', o.ref.id), { status: 'unknown' }));
  await denied(updateDoc(doc(admin.db, 'quotes', o.ref.id), { phone: '0500000000' }));
  await denied(updateDoc(doc(user.db, 'quotes', o.ref.id), { status: 'done' }));
  await denied(setDoc(doc(anon.db, 'tracking', o.tid), { status: 'done' }, { merge: true }));
});
test('ملف العميل: صاحبه والمشرف فقط', async () => {
  const uid = user.auth.currentUser.uid;
  await setDoc(doc(user.db, 'customers', uid), { name: 'عميل', phone: '0551234567', addresses: [{ city: 'بريدة' }], favorites: ['p1'], createdAt: Date.now() });
  assert.equal((await getDoc(doc(admin.db, 'customers', uid))).data().name, 'عميل');
  await denied(getDoc(doc(user2.db, 'customers', uid)));
  await denied(setDoc(doc(user2.db, 'customers', uid), { name: 'x' }, { merge: true }));
  await denied(setDoc(doc(user.db, 'customers', uid), { role: 'admin' }, { merge: true }));
  await denied(setDoc(doc(anonAuthed.db, 'customers', anonAuthed.auth.currentUser.uid), { name: 'x' }));
});
test('الرسائل: إنشاء عام بصيغة صحيحة وقراءة للمشرف فقط', async () => {
  const r = doc(collection(anon.db, 'messages'));
  await setDoc(r, { kind: 'contact', name: 'زائر', phone: '0551234567', subject: 'استفسار', message: 'أريد عرض سعر', status: 'new', createdAt: serverTimestamp() });
  await denied(getDoc(r));
  assert.equal((await getDoc(doc(admin.db, 'messages', r.id))).data().kind, 'contact');
  await denied(setDoc(doc(collection(anon.db, 'messages')), { kind: 'spam', name: 'x', phone: '1', subject: '', message: '', status: 'new', createdAt: serverTimestamp() }));
});
test('المشرف يدير الكتالوج والصفحات', async () => {
  await setDoc(doc(admin.db, 'products', 'p3'), { name: 'جديد', categoryId: 'signage', active: true, price: 250, priceApproved: false });
  await setDoc(doc(admin.db, 'pages', 'privacy'), { title: 'سياسة الخصوصية', body: '## نص', approved: false });
  assert.equal((await getDoc(doc(anon.db, 'pages', 'privacy'))).data().approved, false);
  await denied(setDoc(doc(user.db, 'pages', 'privacy'), { body: 'x' }, { merge: true }));
});
