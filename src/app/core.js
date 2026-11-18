/* نواة واجهة المتجر: الحالة، الموجّه، العناصر المشتركة (الشريط العلوي، القوائم، التذييل، الإشعارات المنبثقة) */
import { $, esc, imgSrc, pad2, ic, P, WA, APPLE_W, GOOGLE_W } from '../lib/ui.js';
import { fmtSAR } from '../lib/pricing.js';

export { $, esc, imgSrc, pad2, ic, P, WA, fmtSAR };
export const MARK = 'assets/logo/mark.svg';
export const LOGO_WHITE = 'assets/logo/logo-white.svg';
export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/* أيقونات إضافية بنفس أسلوب الخط الحالي */
Object.assign(P, {
  cart: '<path d="M3.5 4.5h2l2 11h10l2-8H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.4 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 004 0"/>',
  compare: '<path d="M8 4v16M16 4v16"/><path d="M4 8l4-4 4 4M12 16l4 4 4-4"/>',
  truck: '<path d="M3.5 6.5h10v9h-10zM13.5 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',
  shield: '<path d="M12 3.5l7 3v5.5c0 4.3-3 7.3-7 8.5-4-1.2-7-4.2-7-8.5V6.5z"/><path d="M9 12l2 2 4-4"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10A.5.5 0 016 20V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  building: '<path d="M4.5 20.5V5l8-2v17.5M12.5 8.5h7v12M7.5 8h2M7.5 11.5h2M7.5 15h2M15.5 12h1.5M15.5 15.5h1.5M3 20.5h18"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 014.8.9c0 1.7-2.4 2-2.4 3.6M12 17h.01"/>',
  flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
  logout: '<path d="M14 4.5h4a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/><path d="M13.5 7.5l3 3"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5L18 7M9 7V4.5h6V7"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.4"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  minus: '<path d="M5 12h14"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 00-5 5L4 17l3 3 5.5-5.5a4 4 0 005-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  attach: '<path d="M19 11.5l-7 7a4.6 4.6 0 01-6.5-6.5l7.5-7.5a3 3 0 014.3 4.3l-7.4 7.4a1.5 1.5 0 01-2.1-2.1l6.7-6.7"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
});
export { P as I };

/* ================================================================ state */
export const LS = {
  get(k, d) { try { const v = localStorage.getItem('emdad.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('emdad.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem('emdad.' + k); } catch { /* ignore */ } },
};
export const state = {
  catalog: null, stack: [], pf: 'all',
  user: null, customer: null, authReady: false,
  cart: LS.get('cart2', []), quote: LS.get('quote', []),
  favs: LS.get('favs', []), compare: LS.get('compare', []),
  myOrders: LS.get('myOrders', []),
  shop: { q: '', cat: 'all', mode: 'all', sort: 'default', min: '', max: '', buy: 'all', offers: false, avail: false, attr: '' },
  uploads: {}, lastOrder: null, failure: null,
};
export const save = {
  cart: () => LS.set('cart2', state.cart), quote: () => LS.set('quote', state.quote),
  favs: () => LS.set('favs', state.favs), compare: () => LS.set('compare', state.compare),
  myOrders: () => LS.set('myOrders', state.myOrders.slice(0, 30)),
};

/* ================================================================ data accessors */
export const S = () => state.catalog.settings;
export const CATS = () => state.catalog.categories;
export const PRODUCTS = () => state.catalog.products;
export const catById = (id) => CATS().find((c) => c.id === id);
export const productsOf = (id) => PRODUCTS().filter((p) => p.categoryId === id);
export const productById = (id) => PRODUCTS().find((p) => p.id === id);
export const page = (id) => state.catalog.pages?.[id];
export const waLink = (text) => `https://wa.me/${encodeURIComponent(S().whatsapp || '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
export const telLink = () => `tel:${esc(S().phone)}`;
export const cartCount = () => state.cart.reduce((n, l) => n + 1, 0);
/** حقل لم تعتمده الإدارة بعد */
export const pending = (label = 'بانتظار اعتماد الإدارة') => `<span class="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#9A5B00] bg-[#FFF3E3] border border-dashed border-orange/50 rounded-lg px-1.5 py-px">${ic(P.info, 12, '#F7941E', 2.2)}${esc(label)}</span>`;
export const val = (k, label) => (S()[k] ? esc(S()[k]) : pending(label));

export function riyadhNow() {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { day, h: (+g('hour')) % 24, m: +g('minute') };
}
export const fmtH = (h) => { h = +h; const hh = Math.floor(h) % 24; const mm = Math.round((h - Math.floor(h)) * 60); const ap = hh >= 12 ? 'م' : 'ص'; const x = hh % 12 === 0 ? 12 : hh % 12; return `${x}:${pad2(mm)} ${ap}`; };
export const dayHours = (d) => { const x = S().hours?.[d]; return x && !x.closed && x.open != null && x.close != null ? x : null; };
export function openStatus() {
  const { day, h, m } = riyadhNow(); const t = h + m / 60; const today = dayHours(day);
  if (today && t >= today.open && t < today.close) return { open: true, label: 'مفتوح الآن', sub: `حتى ${fmtH(today.close).replace('م', 'مساءً').replace('ص', 'صباحًا')}` };
  if (today && t < today.open) return { open: false, label: 'مغلق الآن', sub: `يفتح اليوم ${fmtH(today.open)}` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7; const x = dayHours(d);
    if (x) return { open: false, label: 'مغلق الآن', sub: `يفتح ${k === 1 ? 'غدًا' : DAY_NAMES[d]} ${fmtH(x.open)}` };
  }
  return { open: false, label: 'مغلق الآن', sub: 'تواصل معنا عبر واتساب' };
}
export const fmtDate = (ts) => {
  const ms = ts?.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : ts?.toMillis ? ts.toMillis() : null;
  if (!ms) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(ms));
};
const toLatin = (v) => String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
/** يوحّد رقم الجوال السعودي إلى 05XXXXXXXX */
export function normPhone(v) {
  let x = toLatin(v).replace(/[\s\-()]/g, '');
  x = x.replace(/^(\+|00)?966/, '');
  if (/^5\d{8}$/.test(x)) x = '0' + x;
  return x;
}
export const okPhone = (p) => /^05\d{8}$/.test(p);
export const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ================================================================ toast */
let toastT;
export function toast(title, sub = '', kind = 'ok', ms = 2800) {
  const el = $('#toast');
  const lead = kind === 'apple' ? `<span class="flex-none">${APPLE_W}</span>` : kind === 'google' ? `<span class="flex-none w-8 h-8 rounded-full bg-white grid place-items-center">${GOOGLE_W}</span>`
    : `<span class="flex-none w-8 h-8 rounded-full ${kind === 'info' ? 'bg-primary' : kind === 'err' ? 'bg-[#E5484D]' : 'bg-orange'} grid place-items-center">${ic(kind === 'info' || kind === 'err' ? P.info : P.check, 16, '#fff', 2.6)}</span>`;
  const bg = kind === 'apple' ? 'bg-black' : 'bg-deep';
  el.innerHTML = `<div class="${bg} text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lift">${lead}<div class="min-w-0"><b class="block text-[14px]">${esc(title)}</b>${sub ? `<span class="block text-[12px] opacity-80">${esc(sub)}</span>` : ''}</div></div>`;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms);
}

/* ================================================================ shared bits */
export const iconBtn = (act, icon, label, extra = '', badge = 0) => `<button class="press relative w-11 h-11 rounded-full bg-white hair grid place-items-center" data-act="${act}" ${extra} aria-label="${label}">${ic(icon, 18, '#075A9F', 1.9)}${badge ? `<span class="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-white text-[10px] font-bold grid place-items-center">${badge}</span>` : ''}</button>`;
export const cartBtn = () => iconBtn('go', P.cart, 'السلة', 'data-v="cart"', cartCount());
export const appbar = (title, action = '') => `
  <div class="sticky top-0 z-20 safe-top pb-2 px-4 bg-surface/90 backdrop-blur">
    <div class="h-12 flex items-center justify-between gap-2">
      <button class="press w-11 h-11 rounded-full bg-white hair grid place-items-center flex-none" data-act="back" aria-label="رجوع">${ic(P.back, 18, '#075A9F', 2.2)}</button>
      <h1 class="text-[16px] font-bold truncate">${title}</h1>
      ${action || cartBtn()}
    </div>
  </div>`;
export const imgTag = (src, cls = '', alt = '') => `<img src="${imgSrc(src)}" alt="${esc(alt)}" class="${cls}" loading="lazy" decoding="async">`;
export const sectionHead = (title, sub = '', link = '') => `<div class="flex items-end justify-between px-[18px] mt-6">
  <h3 class="relative text-[17px] font-extrabold pb-2">${title}${sub ? ` <small class="text-[11px] font-normal text-muted">· ${sub}</small>` : ''}<i class="absolute right-0 bottom-0 w-7 h-[3px] rounded bg-orange"></i></h3>${link}</div>`;
export const allLink = (attrs, t = 'عرض الكل') => `<button class="press flex items-center gap-1.5 text-[12.5px] font-bold text-deep pb-1.5" data-act="go" ${attrs}>${t} <span class="w-6 h-6 rounded-full bg-white hair grid place-items-center">${ic(P.chev, 12, '#075A9F', 2.4)}</span></button>`;
export const btnP = 'press h-12 rounded-2xl bg-deep text-white text-[14.5px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-60';
export const btnS = 'press h-12 rounded-2xl bg-white hair text-deep text-[14px] font-bold flex items-center justify-center gap-2';
export const btnO = 'press h-12 rounded-2xl bg-orange text-white text-[14.5px] font-extrabold flex items-center justify-center gap-2';
export const card = 'bg-white hair rounded-[22px]';
export const label = (forId, t, req = false) => `<label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="${forId}">${t}${req ? ' *' : ''}</label>`;
export const field = (id, t, attrs = '', req = false) => `${label(id, t, req)}<input id="${id}" class="field" ${attrs}>`;
export const empty = (icon, title, sub, cta = '') => `<div class="text-center py-12 px-6"><span class="mx-auto w-16 h-16 rounded-full bg-tint grid place-items-center">${ic(icon, 28, '#075A9F', 1.7)}</span><b class="block text-[16px] font-extrabold text-deep mt-3">${title}</b><span class="block text-[12.5px] text-muted mt-1 leading-6">${sub}</span>${cta}</div>`;
export const spinner = (c = '#fff') => `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" aria-hidden="true"><path d="M21 12a9 9 0 11-6.2-8.6" stroke-linecap="round"/></svg>`;
export const loadingBlock = () => `<div class="py-16 grid place-items-center">${spinner('#075A9F')}</div>`;
export function busy(btn, on, text = 'جارٍ الإرسال…') {
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `${spinner()}${text}`; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}

/* ================================================================ محتوى الصفحات القابل للتعديل */
const PLACEHOLDERS = {
  phone: () => S().phone, email: () => S().email, whatsapp: () => S().whatsapp, address: () => S().address,
  crNumber: () => S().crNumber, vatNumber: () => S().vatNumber, legalName: () => S().legalName, storeName: () => S().storeName,
  vatRate: () => (S().vatRate != null ? `${S().vatRate}%` : ''),
  paymentMethods: () => '',
};
const PH_LABEL = { email: 'البريد الإلكتروني', crNumber: 'رقم السجل التجاري', vatNumber: 'الرقم الضريبي', phone: 'رقم الهاتف', address: 'العنوان' };
function inline(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b class="text-ink">$1</b>')
    .replace(/\{\{(\w+)\}\}/g, (_, k) => { const v = PLACEHOLDERS[k]?.(); return v ? esc(v) : pending(`${PH_LABEL[k] || 'معلومة'}: بانتظار الإدخال`); })
    .replace(/\[\[(.+?)\]\]/g, (_, x) => pending(x));
}
/** يحوّل نص الصفحة (## / ### / - / فقرات) إلى HTML بأسلوب المتجر */
export function md(body, { faq = false, extra = {} } = {}) {
  const out = []; let list = null; let faqOpen = false;
  const closeList = () => { if (list) { out.push(`<ul class="mt-1.5 grid gap-1.5">${list.join('')}</ul>`); list = null; } };
  const closeFaq = () => { if (faqOpen) { out.push('</div></details>'); faqOpen = false; } };
  for (const raw of String(body || '').split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (line === '{{paymentMethods}}' && extra.paymentMethods) { closeList(); out.push(extra.paymentMethods); continue; }
    if (line.startsWith('## ')) { closeList(); closeFaq(); out.push(`<h2 class="text-[16px] font-extrabold text-deep mt-5 mb-1.5 flex items-center gap-2"><i class="block w-[14px] h-[3px] rounded bg-orange"></i>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('### ')) {
      closeList();
      if (faq) { closeFaq(); out.push(`<details class="faq ${card} mt-2 px-3.5 py-3"><summary class="flex items-center justify-between gap-2 cursor-pointer text-[14px] font-bold list-none">${inline(line.slice(4))}<span class="faq-chev flex-none">${ic(P.down, 16, '#075A9F', 2.2)}</span></summary><div class="text-[13px] text-[#4A6580] leading-7 mt-2">`); faqOpen = true; }
      else out.push(`<h3 class="text-[14.5px] font-extrabold mt-4 mb-1">${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('- ')) { (list ||= []).push(`<li class="flex gap-2 text-[13px] text-[#4A6580] leading-7"><i class="block flex-none w-1.5 h-1.5 rounded-full bg-orange mt-3"></i><span>${inline(line.slice(2))}</span></li>`); continue; }
    closeList();
    out.push(`<p class="text-[13.5px] text-[#4A6580] leading-7 mt-1.5">${inline(line)}</p>`);
  }
  closeList(); closeFaq();
  return out.join('');
}

/* ================================================================ sheet */
export function openSheet(html) {
  $('#sheet').innerHTML = `<div class="pt-2.5 pb-1 flex-none"><div class="w-11 h-[5px] rounded bg-deep/20 mx-auto"></div></div>${html}`;
  $('#scrim').classList.add('on'); $('#sheet').classList.add('on');
}
export function closeSheet() {
  $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on');
  const s = state.stack[state.stack.length - 1]; if (s) renderTabs(TAB_OF[s[0]] || 'more');
}

/* ================================================================ navigation: menus + footer */
export const MAIN_MENU = [['home', 'الرئيسية', P.user && '<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 014 19.5z"/>'], ['shop', 'المنتجات', P.cart], ['categories', 'التصنيفات', P.grid], ['services', 'خدماتنا', P.layers], ['about', 'من نحن', P.info], ['contact', 'اتصل بنا', P.phone]];
export const ACCOUNT_MENU = () => [
  state.user ? ['account', 'حسابي', P.user] : ['login', 'تسجيل الدخول / حساب جديد', P.user],
  ['orders', 'طلباتي', P.box || P.layers], ['track', 'تتبع الطلب', P.truck], ['favorites', `المفضلة${state.favs.length ? ` (${state.favs.length})` : ''}`, P.heart],
  ['compare', `مقارنة المنتجات${state.compare.length ? ` (${state.compare.length})` : ''}`, P.compare], ['notifications', 'الإشعارات', P.bell],
];
export const INFO_MENU = () => [['quote', 'طلب عرض سعر', P.msg], ['project', 'طلب مشروع خاص', P.building], ['portfolio', 'معرض الأعمال', P.image], ['location', 'الموقع وساعات العمل', P.pin], ['faq', 'الأسئلة الشائعة', P.help], ['policies', 'السياسات والشروط', P.doc], ['help', 'المساعدة والدعم', P.wrench], ['report', 'الإبلاغ عن مشكلة', P.flag], ...(S().showLoyalty ? [['loyalty', 'برنامج الولاء', P.crown]] : [])];
const menuRow = ([v, t, d]) => `<button class="press w-full flex items-center gap-3 bg-white hair rounded-2xl px-3 py-2.5 mb-2 text-right" data-act="go" data-v="${v}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><b class="flex-1 text-[14px]">${t}</b>${ic(P.chev, 14, '#6B8299', 2.2)}</button>`;
export function menuSheet() {
  openSheet(`<div class="overflow-y-auto px-4 pb-[max(22px,env(safe-area-inset-bottom))]">
    <b class="block text-[18px] font-extrabold text-deep mb-2">القائمة</b>
    <div class="grid grid-cols-3 gap-2 mb-3">${MAIN_MENU.map(([v, t, d]) => `<button class="press ${card} h-[74px] flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-bold" data-act="go" data-v="${v}"><span class="w-8 h-8 rounded-xl bg-tint grid place-items-center">${ic(d, 17)}</span>${t}</button>`).join('')}</div>
    <b class="block text-[13px] text-muted mb-1.5 mt-1">حسابي</b>${ACCOUNT_MENU().map(menuRow).join('')}
    <b class="block text-[13px] text-muted mb-1.5 mt-2">المساعدة والمعلومات</b>${INFO_MENU().map(menuRow).join('')}
    <div class="grid grid-cols-2 gap-2 mt-1"><a href="${telLink()}" class="press h-11 rounded-2xl bg-deep text-white text-[13.5px] font-bold flex items-center justify-center gap-2">${ic(P.phone, 16, '#fff')}اتصل بنا</a><a href="${esc(waLink())}" target="_blank" rel="noopener" class="press h-11 rounded-2xl bg-white hair text-deep text-[13.5px] font-bold flex items-center justify-center gap-2">${WA(18)}واتساب</a></div>
  </div>`);
}

export const FOOTER_LINKS = [['about', 'من نحن'], ['contact', 'اتصل بنا'], ['faq', 'الأسئلة الشائعة'], ['page', 'سياسة الخصوصية', 'privacy'], ['page', 'الشروط والأحكام', 'terms'], ['page', 'الشحن والتوصيل', 'shipping'], ['page', 'الاستبدال والاسترجاع', 'returns'], ['quote', 'طلب عرض سعر'], ['page', 'سياسة الدفع', 'payment'], ['page', 'الإلغاء والاسترداد', 'cancellation'], ['page', 'ملفات التصميم والحقوق', 'ip'], ['page', 'ملفات الارتباط', 'cookies'], ['help', 'المساعدة والدعم'], ['report', 'الإبلاغ عن مشكلة'], ['track', 'تتبع الطلب'], ['services', 'خدماتنا']];
export function footer() {
  const s = S();
  return `<footer class="mt-8 mx-2 mb-2 rounded-[30px] text-white px-5 pt-6 pb-7" style="background:linear-gradient(135deg,#0A66B0,#075A9F 60%,#043E70)">
    <img src="${LOGO_WHITE}" alt="${esc(s.storeName)}" class="w-[150px]">
    <p class="text-[12.5px] text-white/80 leading-6 mt-3">حلول دعاية وإعلان متكاملة: تصميم، طباعة، إنتاج وتنفيذ — للأفراد والشركات والجهات الحكومية.</p>
    <nav class="grid grid-cols-2 gap-x-3 gap-y-2 mt-4" aria-label="روابط التذييل">${FOOTER_LINKS.map(([v, t, id]) => `<button class="text-right text-[12.5px] text-white/90 hover:text-white flex items-center gap-1.5" data-act="go" data-v="${v}" ${id ? `data-id="${id}"` : ''}><i class="block w-1 h-1 rounded-full bg-orange-2"></i>${t}</button>`).join('')}</nav>
    <div class="flex flex-wrap gap-2 mt-5">
      <a href="${telLink()}" class="h-9 px-3 rounded-full glass text-[12px] flex items-center gap-1.5" dir="ltr">${ic(P.phone, 14, '#fff')}${esc(s.phone)}</a>
      <a href="${esc(waLink())}" target="_blank" rel="noopener" class="h-9 px-3 rounded-full glass text-[12px] flex items-center gap-1.5">${WA(15)}واتساب</a>
      ${s.email ? `<a href="mailto:${esc(s.email)}" class="h-9 px-3 rounded-full glass text-[12px] flex items-center gap-1.5" dir="ltr">${ic(P.mail, 14, '#fff')}${esc(s.email)}</a>` : ''}
    </div>
    <div class="border-t border-white/15 mt-5 pt-4 text-[11px] text-white/70 leading-6">
      <div>${esc(s.legalName)}</div>
      <div>السجل التجاري: ${s.crNumber ? esc(s.crNumber) : '<span class="text-orange-2">بانتظار الإدخال</span>'} · الرقم الضريبي: ${s.vatNumber ? esc(s.vatNumber) : '<span class="text-orange-2">بانتظار الإدخال</span>'}</div>
      <div>© ${new Date().getFullYear()} جميع الحقوق محفوظة · الأسعار بالريال السعودي (⃁)</div>
    </div>
  </footer>`;
}

/* ================================================================ tab bar */
const TABS = [
  ['home', 'الرئيسية', '<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 014 19.5z"/>'],
  ['shop', 'المنتجات', P.grid],
  ['quote', 'اطلب سعر', ''],
  ['cart', 'السلة', P.cart],
  ['more', 'المزيد', '<circle cx="12" cy="12" r="8.5"/><circle cx="8" cy="12" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="16" cy="12" r=".9"/>'],
];
export const TAB_OF = { home: 'home', shop: 'shop', product: 'shop', categories: 'shop', category: 'shop', service: 'shop', favorites: 'shop', compare: 'shop', quote: 'quote', project: 'quote', custom: 'quote', cart: 'cart', checkout: 'cart', 'order-success': 'cart', 'order-failed': 'cart' };
export function renderTabs(active) {
  const n = cartCount();
  $('#tabbar').innerHTML = TABS.map(([k, t, d]) => k === 'quote'
    ? `<button class="tab press" data-act="tab" data-t="quote" aria-label="${t}"><span class="tab-fab">${ic('<path d="M12 5v14M5 12h14"/>', 24, '#fff', 2.4)}</span><span class="${active === 'quote' ? 'text-deep font-bold' : ''}">${t}</span></button>`
    : `<button class="tab press ${active === k ? 'on' : ''}" data-act="tab" data-t="${k}" aria-label="${t}" ${active === k ? 'aria-current="page"' : ''}><span class="relative">${ic(d, 22, 'currentColor', active === k ? 2 : 1.7)}${k === 'cart' && n ? `<span id="cartBadge" class="absolute -top-1.5 -left-2 min-w-[17px] h-[17px] px-1 rounded-full bg-orange text-white text-[10px] font-bold grid place-items-center">${n}</span>` : ''}</span><span>${t}</span></button>`).join('');
  renderSideNav();
}
/** إعادة رسم شريط التبويب للشاشة الحالية (بعد تغيّر عدد السلة) */
export function retab() { const n = state.stack.at(-1)?.[0]; renderTabs(TAB_OF[n] || (n === 'home' ? 'home' : 'more')); }
/** القائمة الرئيسية على الشاشات الكبيرة (اللوحة الجانبية) */
export function renderSideNav() {
  const el = $('#sideNav'); if (!el || !state.catalog) return;
  const cur = state.stack[state.stack.length - 1]?.[0];
  el.innerHTML = `<nav class="grid gap-1" aria-label="القائمة الرئيسية">${MAIN_MENU.map(([v, t]) => `<button class="text-right h-10 px-3 rounded-xl text-[14.5px] ${cur === v ? 'bg-white text-deep font-extrabold shadow-soft' : 'text-ink/80 hover:bg-white/60'}" data-act="go" data-v="${v}">${t}</button>`).join('')}</nav>
    <div class="flex gap-2 mt-4">${[['search', P.search, 'بحث'], ['favorites', P.heart, 'المفضلة'], [state.user ? 'account' : 'login', P.user, 'حسابي'], ['cart', P.cart, 'السلة']].map(([v, d, t]) => `<button class="press relative w-11 h-11 rounded-2xl bg-white hair grid place-items-center" data-act="go" data-v="${v}" aria-label="${t}" title="${t}">${ic(d, 18)}${v === 'cart' && cartCount() ? `<span class="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-white text-[10px] font-bold grid place-items-center">${cartCount()}</span>` : ''}</button>`).join('')}</div>`;
}

/* ================================================================ router */
export const V = {};      // name -> (arg) => html
export const AFTER = {};  // name -> (el, arg) => void
export const TITLES = {}; // name -> (arg) => title
export const ACT = {};    // data-act handlers
const SITE = 'الإمدادات الذكية الحديثة';

export function render(name, arg, dir = 'fwd') {
  if (!V[name]) { name = 'notfound'; }
  const host = $('#views');
  const old = host.lastElementChild;
  const el = document.createElement('section');
  el.className = 'view no-sb ' + (old ? (dir === 'fwd' ? 'off-r' : dir === 'back' ? 'off-l' : '') : '');
  let html;
  try { html = V[name](arg); } catch (e) { console.error(e); html = V.notfound(); name = 'notfound'; }
  if (html === null) { html = V.notfound(); name = 'notfound'; }
  el.innerHTML = html;
  el.dataset.view = name;
  host.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.remove('off-r', 'off-l');
    if (old) { if (dir === 'none') old.remove(); else { old.classList.add(dir === 'fwd' ? 'off-l' : 'off-r'); setTimeout(() => old.remove(), 340); } }
  }));
  renderTabs(TAB_OF[name] || (name === 'home' ? 'home' : 'more'));
  const t = TITLES[name]?.(arg);
  document.title = t ? `${t} | ${SITE}` : `${SITE} | المتجر الرقمي`;
  AFTER[name]?.(el, arg);
  revealIn(el);
}
const hashOf = (name, arg) => '#' + name + (arg ? '/' + encodeURIComponent(arg) : '');
export function go(name, arg) {
  closeSheet();
  state.stack.push([name, arg]);
  history.pushState({ d: state.stack.length }, '', hashOf(name, arg));
  render(name, arg, 'fwd');
}
export function replace(name, arg) {
  state.stack[state.stack.length - 1] = [name, arg];
  history.replaceState({ d: state.stack.length }, '', hashOf(name, arg));
  render(name, arg, 'none');
}
export function home() { state.stack = [['home']]; history.replaceState({ d: 1 }, '', '#home'); render('home', null, 'back'); }
export function back() { if (state.stack.length > 1) history.back(); else home(); }
export function tabGo(k) {
  if (k === 'more') { menuSheet(); renderTabs('more'); return; }
  closeSheet();
  const cur = state.stack[state.stack.length - 1]?.[0];
  if (cur === k && state.stack.length === 1) { $('#views').lastElementChild?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  state.stack = [[k]];
  history.replaceState({ d: 1 }, '', '#' + k);
  render(k, null, k === 'home' ? 'back' : 'fwd');
}
/** إعادة رسم الشاشة الحالية مع الحفاظ على موضع التمرير */
export function refresh() {
  const [name, arg] = state.stack[state.stack.length - 1];
  const v = $('#views').lastElementChild; const top = v ? v.scrollTop : 0;
  render(name, arg, 'none');
  const nv = $('#views').lastElementChild; if (nv) nv.scrollTop = top;
}

/** ظهور تدريجي خفيف للعناصر عند التمرير */
let io;
function revealIn(el) {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  io ||= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: null, threshold: 0.08 });
  el.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
