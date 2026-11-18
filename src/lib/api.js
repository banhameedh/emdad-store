/* طبقة البيانات لواجهة المتجر: قراءة الكتالوج وإنشاء الطلبات في Firestore */
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { getDb, isConfigured } from './firebase.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_PORTFOLIO, SEED_SETTINGS } from './seed.js';

const CACHE_KEY = 'emdad.catalog.v1';
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);

const withTimeout = (p, ms, msg = 'timeout') =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

function normalize({ categories, products, portfolio, settings }, source) {
  return {
    source,
    categories: categories.filter((c) => c.active !== false).sort(byOrder),
    products: products.filter((p) => p.active !== false).sort(byOrder),
    portfolio: portfolio.filter((p) => p.active !== false).sort(byOrder),
    settings: { ...SEED_SETTINGS, ...(settings || {}), hours: { ...SEED_SETTINGS.hours, ...(settings?.hours || {}) } },
  };
}

export const seedCatalog = () =>
  normalize({ categories: SEED_CATEGORIES, products: SEED_PRODUCTS, portfolio: SEED_PORTFOLIO, settings: SEED_SETTINGS }, 'seed');

/** آخر نسخة ناجحة من الكتالوج (للعرض الفوري ثم التحديث في الخلفية) */
export function cachedCatalog() {
  if (!isConfigured) return seedCatalog();
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.categories?.length) return { ...c, source: 'cache' };
  } catch { /* storage unavailable */ }
  return null;
}

/** يجلب الأقسام والمنتجات والأعمال والإعدادات من Firestore */
export async function fetchCatalog() {
  if (!isConfigured) return seedCatalog();
  const db = getDb();
  const list = async (name) => {
    const snap = await getDocs(query(collection(db, name), where('active', '==', true)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };
  const [categories, products, portfolio, settingsSnap] = await withTimeout(
    Promise.all([list('categories'), list('products'), list('portfolio'), getDoc(doc(db, 'settings', 'store'))]),
    12000
  );
  if (!categories.length) {
    console.warn('[emdad] Firestore فارغ — افتح admin.html واستورد البيانات الأولية. يتم عرض البيانات الافتراضية مؤقتًا.');
    return { ...seedCatalog(), source: 'seed-empty' };
  }
  const cat = normalize({ categories, products, portfolio, settings: settingsSnap.exists() ? settingsSnap.data() : null }, 'firebase');
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cat)); } catch { /* quota / private mode */ }
  return cat;
}

/**
 * ينشئ طلب عرض سعر في مجموعة orders ويعيد رقم الطلب (EM-XXXXXX).
 * رقم الطلب مشتق من معرّف المستند، وقواعد Firestore تتحقق من ذلك.
 */
export async function createOrder(order) {
  const db = getDb();
  const ref = doc(collection(db, 'orders'));
  const no = 'EM-' + ref.id.slice(0, 6).toUpperCase();
  const data = {
    ref: no,
    name: order.name,
    phone: order.phone,
    serviceId: order.serviceId,
    serviceName: order.serviceName,
    description: order.description,
    items: order.items || [],
    status: 'new',
    source: 'web',
    consent: true,
    createdAt: serverTimestamp(),
  };
  if (order.email) data.email = order.email;
  await withTimeout(setDoc(ref, data), 15000, 'order-timeout');
  return no;
}
