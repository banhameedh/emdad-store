/* طبقة البيانات لواجهة المتجر */
import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc, addDoc, serverTimestamp } from 'firebase/firestore/lite';
import { getDb, isConfigured, loadStorage, loadAuth } from './firebase.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_PORTFOLIO, SEED_SETTINGS, SEED_PAGES } from './seed.js';
import { normProduct, applyPromos } from './pricing.js';

const CACHE_KEY = 'emdad.catalog.v2';
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);
export const withTimeout = (p, ms, msg = 'timeout') =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

function normalize({ categories, products, portfolio, settings, pages, promotions = [] }, source) {
  const pg = { ...SEED_PAGES };
  for (const p of pages || []) pg[p.id] = { ...(pg[p.id] || {}), ...p };
  return {
    source,
    categories: categories.filter((c) => c.active !== false).sort(byOrder),
    products: applyPromos(products.filter((p) => p.active !== false).map(normProduct), promotions).sort(byOrder),
    promotions,
    portfolio: portfolio.filter((p) => p.active !== false).sort(byOrder),
    settings: { ...SEED_SETTINGS, ...(settings || {}), hours: { ...SEED_SETTINGS.hours, ...(settings?.hours || {}) }, payments: { ...SEED_SETTINGS.payments, ...(settings?.payments || {}) } },
    pages: pg,
  };
}

export const seedCatalog = () =>
  normalize({ categories: SEED_CATEGORIES, products: SEED_PRODUCTS, portfolio: SEED_PORTFOLIO, settings: SEED_SETTINGS, pages: [] }, 'seed');

export function cachedCatalog() {
  if (!isConfigured) return seedCatalog();
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.categories?.length) return { ...c, source: 'cache' };
  } catch { /* storage unavailable */ }
  return null;
}

export async function fetchCatalog() {
  if (!isConfigured) return seedCatalog();
  const db = getDb();
  const list = async (name, active = true) => {
    const snap = await getDocs(active ? query(collection(db, name), where('active', '==', true)) : collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };
  const [categories, products, portfolio, settingsSnap, pages, promotions] = await withTimeout(
    Promise.all([list('categories'), list('products'), list('portfolio'), getDoc(doc(db, 'settings', 'store')), list('pages', false), list('promotions')]),
    12000
  );
  if (!categories.length) {
    console.warn('[emdad] Firestore فارغ — افتح admin.html واستورد البيانات الأولية. يتم عرض البيانات الافتراضية مؤقتًا.');
    return { ...seedCatalog(), source: 'seed-empty' };
  }
  const clean = (arr) => arr.map(({ updatedAt, createdAt, ...rest }) => rest); // Timestamps لا تُخزَّن في الذاكرة المؤقتة
  const st = settingsSnap.exists() ? (({ updatedAt, ...r }) => r)(settingsSnap.data()) : null;
  const cat = normalize({ categories: clean(categories), products: clean(products), portfolio: clean(portfolio), settings: st, pages: clean(pages), promotions: clean(promotions) }, 'firebase');
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cat)); } catch { /* quota */ }
  return cat;
}

/**
 * ينشئ طلبًا (شراء أو عرض سعر) + مستند تتبع عام بمعرّف «رقم الطلب_آخر 4 أرقام من الجوال».
 * يُعيد { ref, id, trackId }.
 */
export async function createOrder(order, uid = null) {
  const db = getDb();
  const coll = order.type === 'purchase' ? 'orders' : 'quotes';
  const ref = doc(collection(db, coll));
  const no = 'EM-' + ref.id.slice(0, 6).toUpperCase();
  const tail = order.phone.slice(-4);
  const data = { ...order, ref: no, status: 'new', source: 'web', consent: true, createdAt: serverTimestamp() };
  Object.keys(data).forEach((k) => (data[k] === '' || data[k] === undefined || data[k] === null) && delete data[k]);
  if (uid) data.uid = uid;
  const trackId = `${no}_${tail}`;
  const batch = writeBatch(db);
  batch.set(ref, data);
  batch.set(doc(db, 'tracking', trackId), {
    ref: no, coll, orderId: ref.id, phoneTail: tail, type: order.type, status: 'new',
    ...(order.totals ? { total: order.totals.total } : {}),
    createdAt: serverTimestamp(),
  });
  await withTimeout(batch.commit(), 15000, 'order-timeout');
  return { ref: no, id: ref.id, coll, trackId };
}

/** قراءة حالة الطلب للزائر (رقم الطلب + رقم الجوال) */
export async function getTracking(refNo, phone) {
  const id = `${String(refNo).trim().toUpperCase()}_${String(phone).slice(-4)}`;
  const s = await withTimeout(getDoc(doc(getDb(), 'tracking', id)), 12000);
  return s.exists() ? { id, ...s.data() } : null;
}

/** رسائل التواصل والبلاغات */
export async function sendMessage(msg) {
  const data = { ...msg, status: 'new', createdAt: serverTimestamp() };
  Object.keys(data).forEach((k) => (data[k] === '' || data[k] === undefined) && delete data[k]);
  const r = await withTimeout(addDoc(collection(getDb(), 'messages'), data), 15000);
  return r.id;
}

/* ---------------------------------------------------------------- العملاء */
export async function getCustomer(uid) {
  const s = await getDoc(doc(getDb(), 'customers', uid));
  return s.exists() ? s.data() : null;
}
export const saveCustomer = (uid, data) => setDoc(doc(getDb(), 'customers', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
/** طلبات العميل (الشراء + عروض الأسعار) */
export async function myOrders(uid) {
  const db = getDb();
  const [o, q] = await Promise.all(['orders', 'quotes'].map((c) => getDocs(query(collection(db, c), where('uid', '==', uid)))));
  return [...o.docs.map((d) => ({ id: d.id, coll: 'orders', ...d.data() })), ...q.docs.map((d) => ({ id: d.id, coll: 'quotes', ...d.data() }))]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
export async function getOrder(coll, id) {
  const s = await getDoc(doc(getDb(), coll === 'quotes' ? 'quotes' : 'orders', id));
  return s.exists() ? { id: s.id, coll, ...s.data() } : null;
}

/* ---------------------------------------------------------------- رفع الملفات */
const MAX_FILE = 20 * 1024 * 1024;
const OK_EXT = /\.(pdf|ai|eps|psd|svg|jpe?g|png|webp|tiff?|zip|rar|cdr|dwg|dxf)$/i;
export function checkFile(f) {
  if (f.size > MAX_FILE) return 'حجم الملف أكبر من 20 ميجابايت';
  if (!OK_EXT.test(f.name)) return 'صيغة الملف غير مدعومة';
  return '';
}
/** يرفع ملفًا إلى Firebase Storage (يسجّل دخول مجهول عند الحاجة) ويعيد بياناته */
export async function uploadFile(file, onProgress) {
  const [{ storage, m }, { auth, m: am }] = await Promise.all([loadStorage(), loadAuth()]);
  if (!auth.currentUser) await am.signInAnonymously(auth);
  const uid = auth.currentUser.uid;
  const safe = file.name.replace(/[^\w.\-]+/g, '-').slice(-80);
  const path = `uploads/${uid}/${Date.now()}-${safe}`;
  const task = m.uploadBytesResumable(m.ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });
  await new Promise((res, rej) => task.on('state_changed', (s) => onProgress && onProgress(s.bytesTransferred / s.totalBytes), rej, res));
  return { name: file.name.slice(0, 120), size: file.size, path };
}
