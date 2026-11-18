/* التسعير وحالات الطلب — مشترك بين المتجر ولوحة التحكم. العملة الموحدة: الريال السعودي (⃁) */

const bad = (n) => n === null || n === undefined || n === '' || Number.isNaN(Number(n));
const numStr = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
/** رمز الريال السعودي الرسمي (Unicode 17: U+20C1) — يُعرض بخط saudi-riyal المضمّن */
export const SAR = '\u20C1';
/** تنسيق موحد للأسعار: ⃁ 1,250 — الرمز يسار الرقم، معزول اتجاهيًا ليظهر بنفس الترتيب في كل السياقات */
export const fmtSAR = (n) => (bad(n) ? '' : `\u2066${SAR}\u00A0${numStr(n)}\u2069`);
/** نسخة نصية للرسائل خارج المتجر (واتساب) حيث قد لا يتوفر الرمز الجديد: 1,250 ر.س */
export const fmtSARText = (n) => (bad(n) ? '' : `${numStr(n)} ر.س`);
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const round2 = (n) => Math.round(n * 100) / 100;

/** يوحّد بيانات المنتج (بما فيها المنتجات القديمة قبل إضافة الحقول الجديدة) */
export function normProduct(p) {
  const price = num(p.price); const compareAt = num(p.compareAt);
  return {
    ...p,
    mode: p.mode === 'buy' && price !== null ? 'buy' : 'quote',
    price, compareAt: compareAt !== null && price !== null && compareAt > price ? compareAt : null,
    unit: p.unit || '', priceApproved: !!p.priceApproved,
    stock: num(p.stock), minQty: Math.max(1, num(p.minQty) || 1),
    images: (p.images && p.images.length ? p.images : [p.image]).filter(Boolean),
    specs: Array.isArray(p.specs) ? p.specs.filter((s) => s && s.k) : [],
    options: Array.isArray(p.options) ? p.options.filter((o) => o && o.name && o.values?.length) : [],
    addons: Array.isArray(p.addons) ? p.addons.filter((a) => a && a.label) : [],
    allowUpload: p.allowUpload !== false, featured: !!p.featured, badge: p.badge || '',
    popularity: num(p.popularity) || 0, addedAt: num(p.addedAt) || 0,
    leadTime: p.leadTime || '', details: p.details || '', desc: p.desc || '',
  };
}

/** اختيارات افتراضية: أول قيمة لكل خيار، دون إضافات */
export const defaultSel = (p) => ({ opts: Object.fromEntries(p.options.map((o) => [o.name, o.values[0].label])), addons: [] });

function deltas(p, sel = {}) {
  let d = 0;
  for (const o of p.options) {
    const v = o.values.find((x) => x.label === sel.opts?.[o.name]) || o.values[0];
    d += Number(v.delta) || 0;
  }
  for (const a of p.addons) if ((sel.addons || []).includes(a.label)) d += Number(a.price) || 0;
  return d;
}
/** سعر الوحدة بعد الخيارات والإضافات (للمنتجات الجاهزة للشراء) */
export const unitPrice = (p, sel) => (p.price === null ? null : round2(p.price + deltas(p, sel)));
/** سعر الوحدة قبل الخصم */
export const unitCompare = (p, sel) => (p.compareAt === null ? null : round2(p.compareAt + deltas(p, sel)));
export const discountPct = (p) => (p.compareAt && p.price !== null ? Math.round((1 - p.price / p.compareAt) * 100) : 0);
export const isOffer = (p) => !!p.compareAt || !!p.badge;

/** حالة التوفر — تُعرض فقط عند إدخال المخزون، وإلا «يُنفَّذ حسب الطلب» للمنتجات المخصصة */
export function stockState(p) {
  if (p.stock === null) return p.mode === 'buy' ? { key: 'made', label: 'يُنفَّذ حسب الطلب', cls: 'text-deep bg-tint', canBuy: true } : null;
  if (p.stock <= 0) return { key: 'out', label: 'نفدت الكمية', cls: 'text-[#B4232A] bg-[#FDECEC]', canBuy: false };
  if (p.stock <= 5) return { key: 'low', label: `كمية محدودة (${p.stock})`, cls: 'text-[#9A5B00] bg-[#FFF3E3]', canBuy: true };
  return { key: 'in', label: 'متوفر', cls: 'text-[#12804A] bg-[#E6F6EE]', canBuy: true };
}

/** نص وصف الاختيارات: «المقاس: 85×200 سم · الخامة: …» */
export const selText = (p, sel) => [
  ...p.options.map((o) => `${o.name}: ${sel?.opts?.[o.name] || o.values[0].label}`),
  ...(sel?.addons || []).map((a) => `+ ${a}`),
].join(' · ');

/** ملخص السلة: الإجمالي والتوفير والضريبة */
export function totals(lines, settings = {}) {
  let subtotal = 0; let compare = 0;
  for (const l of lines) {
    subtotal += (l.unitPrice || 0) * l.qty;
    compare += (l.unitCompare || l.unitPrice || 0) * l.qty;
  }
  subtotal = round2(subtotal);
  const rate = Number(settings.vatRate) || 0;
  const fee = settings.deliveryFee != null && settings.delivery === 'delivery' ? Number(settings.deliveryFee) : 0;
  const total = round2(subtotal + fee);
  const vat = settings.pricesIncludeVat !== false ? round2(total - total / (1 + rate / 100)) : round2(total * rate / 100);
  return {
    subtotal, savings: round2(Math.max(0, compare - subtotal)), deliveryFee: fee,
    vat, vatRate: rate, vatIncluded: settings.pricesIncludeVat !== false,
    total: settings.pricesIncludeVat !== false ? total : round2(total + vat),
  };
}

/* ---------------------------------------------------------------- حالات الطلب */
export const STATUS = {
  new: { t: 'جديد', c: 'bg-orange text-white' },
  contacted: { t: 'تم التواصل', c: 'bg-primary text-white' },
  quoted: { t: 'أُرسل عرض السعر', c: 'bg-brand text-white' },
  confirmed: { t: 'مؤكد', c: 'bg-brand text-white' },
  paid: { t: 'تم الدفع', c: 'bg-[#12A150] text-white' },
  in_progress: { t: 'قيد التنفيذ', c: 'bg-deep text-white' },
  ready: { t: 'جاهز للاستلام / الشحن', c: 'bg-primary text-white' },
  shipped: { t: 'تم الشحن', c: 'bg-primary text-white' },
  done: { t: 'مكتمل', c: 'bg-[#12A150] text-white' },
  cancelled: { t: 'ملغي', c: 'bg-[#8A9DB0] text-white' },
};
export const STATUS_KEYS = Object.keys(STATUS);
/** مراحل التنفيذ المعروضة للعميل حسب نوع الطلب */
export const FLOW = {
  purchase: ['new', 'confirmed', 'paid', 'in_progress', 'ready', 'done'],
  quote: ['new', 'contacted', 'quoted', 'confirmed', 'in_progress', 'ready', 'done'],
};
export const ORDER_TYPES = { purchase: 'طلب شراء', quote: 'طلب عرض سعر' };
export const QUOTE_KINDS = { rfq: 'عرض سعر', project: 'مشروع خاص', custom: 'منتج مخصص' };
export const CUSTOMER_TYPES = { individual: 'فرد', business: 'شركة / مؤسسة', government: 'جهة حكومية' };
export const PAYMENT_METHODS = {
  cod: { t: 'الدفع عند الاستلام', d: 'نقدًا أو بالشبكة عند استلام الطلب' },
  store: { t: 'الدفع في المقر', d: 'ادفع عند استلام طلبك من مقر المؤسسة' },
  bank: { t: 'تحويل بنكي', d: 'حوّل المبلغ بعد تأكيد الطلب وأرسل الإيصال' },
};
export const DELIVERY = { pickup: 'استلام من المقر', delivery: 'توصيل' };

/* ---------------------------------------------------------------- العروض والخصومات (مجموعة promotions) */
/** تاريخ اليوم بتوقيت الرياض بصيغة YYYY-MM-DD */
export const todayRiyadh = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
export const promoLive = (pr, today = todayRiyadh()) => pr.active !== false && (!pr.startAt || pr.startAt <= today) && (!pr.endAt || pr.endAt >= today);
export function promoHits(pr, p) {
  return pr.scope === 'all' || (pr.scope === 'category' && (pr.categoryIds || []).includes(p.categoryId)) || (pr.scope === 'products' && (pr.productIds || []).includes(p.id));
}
/**
 * يطبّق أفضل عرض فعّال على السعر الأساسي لكل منتج جاهز للشراء.
 * السعر قبل الخصم = السعر الأصلي (أو compareAt إن كان أعلى).
 */
export function applyPromos(products, promos = [], today = todayRiyadh()) {
  const live = promos.filter((pr) => promoLive(pr, today) && Number(pr.value) > 0);
  if (!live.length) return products;
  return products.map((p) => {
    if (p.mode !== 'buy' || p.price === null) return p;
    let best = null; let bestPrice = p.price;
    for (const pr of live) {
      if (!promoHits(pr, p)) continue;
      const np = Math.max(0, round2(pr.type === 'fixed' ? p.price - Number(pr.value) : p.price * (1 - Number(pr.value) / 100)));
      if (np < bestPrice) { bestPrice = np; best = pr; }
    }
    if (!best) return p;
    return { ...p, price: bestPrice, compareAt: Math.max(p.compareAt || 0, p.price), promo: { id: best.id, name: best.name || '', badge: best.badge || '' }, badge: p.badge || best.badge || '' };
  });
}

/**
 * يعيد حساب أسعار بنود الطلب من بيانات المنتجات الحالية (تستخدمه Cloud Function ولوحة التحكم للتحقق).
 * lines: [{ productId, qty, sel }] — products: منتجات بعد normProduct + applyPromos
 */
export function verifyLines(lines, products, settings = {}) {
  const issues = []; const out = [];
  for (const l of lines || []) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) { issues.push(`منتج غير موجود: ${l.name || l.productId}`); continue; }
    if (p.mode !== 'buy') { issues.push(`منتج يتطلب عرض سعر: ${p.name}`); continue; }
    const qty = Number(l.qty) || 0;
    if (qty < p.minQty) issues.push(`الكمية أقل من الحد الأدنى: ${p.name}`);
    if (p.stock !== null && qty > p.stock) issues.push(`الكمية أكبر من المخزون: ${p.name}`);
    const up = unitPrice(p, l.sel);
    if (Math.abs((Number(l.unitPrice) || 0) - up) > 0.01) issues.push(`سعر مختلف: ${p.name} (${fmtSAR(l.unitPrice)} ← ${fmtSAR(up)})`);
    out.push({ unitPrice: up, unitCompare: unitCompare(p, l.sel), qty });
  }
  const t = totals(out, settings);
  return { ok: issues.length === 0, issues, subtotal: t.subtotal, total: t.total, vat: t.vat };
}
