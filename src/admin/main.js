/* لوحة تحكم المتجر — مرتبطة بـ Firestore / Auth / Storage
 * الطلبات وعروض الأسعار، المنتجات، الأسعار، العروض، الأقسام، معرض الأعمال، العملاء، الرسائل، الصفحات، الإعدادات */
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import {
  collection, doc, getDoc, onSnapshot, query, orderBy, limit, addDoc, setDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp, arrayUnion, Timestamp,
} from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fb, isConfigured, hasStorage } from './fb.js';
import { $, esc, imgSrc, fmtNum, ic, P, WA } from '../lib/ui.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_PORTFOLIO, SEED_SETTINGS, SEED_PAGES } from '../lib/seed.js';
import {
  fmtSAR, normProduct, applyPromos, verifyLines, STATUS as ST, STATUS_KEYS, FLOW, ORDER_TYPES, QUOTE_KINDS, CUSTOMER_TYPES, PAYMENT_METHODS, DELIVERY, promoLive,
} from '../lib/pricing.js';

const I = {
  ...P,
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/><path d="M13.5 7.5l3 3"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5L18 7M9 7V4.5h6V7"/>',
  logout: '<path d="M14 4.5h4a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 16v2a2 2 0 002 2h11a2 2 0 002-2v-2"/>',
  box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 000 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
  ext: '<path d="M14 4.5h5.5V10M19.5 4.5L11 13"/><path d="M18 14v4a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 015 18V8a1.5 1.5 0 011.5-1.5h4"/>',
  tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.4"/>',
  coins: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>',
  users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5a6 6 0 0112 0"/><path d="M15.5 5.5a3.2 3.2 0 010 6.2M21 19.5a6 6 0 00-3.8-5.6"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10A.5.5 0 016 20V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>',
  attach: '<path d="M19 11.5l-7 7a4.6 4.6 0 01-6.5-6.5l7.5-7.5a3 3 0 014.3 4.3l-7.4 7.4a1.5 1.5 0 01-2.1-2.1l6.7-6.7"/>',
};

const STATUS = STATUS_KEYS.map((k) => [k, ST[k].t, ST[k].c]);
const DAYS = [[6, 'السبت'], [0, 'الأحد'], [1, 'الاثنين'], [2, 'الثلاثاء'], [3, 'الأربعاء'], [4, 'الخميس'], [5, 'الجمعة']];
const TABS = [['orders', 'الطلبات', I.box], ['products', 'المنتجات', I.layers], ['prices', 'الأسعار', I.coins], ['promotions', 'العروض', I.tag], ['categories', 'الأقسام', I.image], ['portfolio', 'معرض الأعمال', I.eye], ['customers', 'العملاء', I.users], ['messages', 'الرسائل', I.mail], ['pages', 'الصفحات', I.doc], ['settings', 'الإعدادات', I.cog]];

const state = {
  user: null, tab: 'orders',
  orders: [], quotes: [], categories: [], products: [], portfolio: [], promotions: [], customers: [], messages: [], pages: [], settings: null,
  loaded: {}, ofilter: 'all', otype: 'all', oq: '', pcat: 'all', unsub: [],
};
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);
const catName = (id) => state.categories.find((c) => c.id === id)?.name || (id === 'other' ? 'مشروع متكامل / أخرى' : id || '');
const tsMs = (ts) => (ts?.toMillis ? ts.toMillis() : ts?.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : 0);
const fmtDate = (ts) => {
  const ms = tsMs(ts); if (!ms) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(ms));
};
const allOrders = () => [...state.orders.map((o) => ({ ...o, coll: 'orders' })), ...state.quotes.map((o) => ({ ...o, coll: 'quotes' }))].sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
const liveProducts = () => applyPromos(state.products.filter((p) => p.active !== false).map(normProduct), state.promotions.map((p) => ({ ...p })));

/* ================================================================ ui helpers */
let toastT;
function toast(title, sub = '', kind = 'ok') {
  const el = $('#toast');
  const color = kind === 'err' ? 'bg-[#E5484D]' : kind === 'info' ? 'bg-primary' : 'bg-orange';
  el.innerHTML = `<div class="bg-deep text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lift"><span class="flex-none w-8 h-8 rounded-full ${color} grid place-items-center">${ic(kind === 'ok' ? I.check : I.info, 16, '#fff', 2.6)}</span><div class="min-w-0"><b class="block text-[14px]">${esc(title)}</b>${sub ? `<span class="block text-[12px] opacity-80">${esc(sub)}</span>` : ''}</div></div>`;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3400);
}
const btn = (cls = '') => `press h-10 px-4 rounded-xl text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 ${cls}`;
const BTN_P = btn('bg-deep text-white');
const BTN_S = btn('bg-white hair text-deep');
const BTN_O = btn('bg-orange text-white');
const fieldCls = 'field !h-11 !text-[14px]';
const card = 'bg-white hair rounded-[20px]';
const errMsg = (e) => {
  const c = e?.code || '';
  if (c.includes('permission-denied')) return 'لا تملك صلاحية تنفيذ هذا الإجراء';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (c.includes('too-many-requests')) return 'محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة';
  if (c.includes('network')) return 'تحقق من الاتصال بالإنترنت';
  return e?.message || 'حدث خطأ غير متوقع';
};
const busy = (b, on, t = 'جارٍ الحفظ…') => { if (!b) return; if (on) { b.dataset.l = b.innerHTML; b.disabled = true; b.textContent = t; } else { b.disabled = false; if (b.dataset.l) b.innerHTML = b.dataset.l; } };
const stamp = () => ({ updatedAt: serverTimestamp(), updatedBy: state.user.email || state.user.uid });

/* ================================================================ screens */
function screenNotConfigured() {
  $('#root').innerHTML = `<div class="max-w-lg mx-auto p-6 text-center">
    <img src="assets/logo/logo-color.svg" alt="الإمدادات" class="w-56 mx-auto mb-6">
    <h1 class="text-[22px] font-extrabold text-deep">لم يتم ربط Firebase بعد</h1>
    <p class="text-muted mt-2 leading-7 text-[14px]">أدخل إعدادات مشروعك في ملف <code dir="ltr" class="bg-white hair rounded px-1.5">firebase-config.js</code> (أو ملف <code dir="ltr">.env</code> ثم <code dir="ltr">npm run build</code>) وأعد تحميل الصفحة. التفاصيل في README.</p>
  </div>`;
}
function screenLogin(msg = '') {
  $('#root').innerHTML = `<form id="loginForm" class="w-full max-w-[380px] mx-auto p-5" novalidate>
    <img src="assets/logo/logo-color.svg" alt="الإمدادات الذكية الحديثة" class="w-56 mx-auto mb-6">
    <div class="${card} rounded-[24px] shadow-soft p-5">
      <h1 class="text-[20px] font-extrabold text-deep">لوحة التحكم</h1>
      <p class="text-[12.5px] text-muted mb-3">سجّل الدخول بحساب المشرف لإدارة المتجر.</p>
      ${msg ? `<div class="mb-3 text-[12.5px] text-[#B4232A] bg-[#FDECEC] rounded-xl px-3 py-2">${msg}</div>` : ''}
      <label class="block text-[12.5px] font-bold mb-1.5" for="lEmail">البريد الإلكتروني</label>
      <input id="lEmail" class="${fieldCls}" type="email" dir="ltr" autocomplete="username" required>
      <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="lPass">كلمة المرور</label>
      <input id="lPass" class="${fieldCls}" type="password" dir="ltr" autocomplete="current-password" required>
      <button id="lBtn" class="${BTN_P} w-full mt-4 !h-12" type="submit">دخول</button>
      <button type="button" class="w-full mt-2 text-[12.5px] text-deep font-bold py-1.5" data-act="reset">نسيت كلمة المرور؟</button>
    </div>
  </form>`;
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = $('#lBtn'); b.disabled = true; b.textContent = 'جارٍ الدخول…';
    try { await signInWithEmailAndPassword(fb().auth, $('#lEmail').value.trim(), $('#lPass').value); }
    catch (err) { screenLogin(esc(errMsg(err))); }
  });
}
function screenNotAdmin(user) {
  $('#root').innerHTML = `<div class="max-w-lg mx-auto p-6 text-center">
    <img src="assets/logo/mark.svg" alt="" class="w-16 h-16 mx-auto mb-4">
    <h1 class="text-[20px] font-extrabold text-deep">هذا الحساب ليس مشرفًا</h1>
    <p class="text-muted mt-2 leading-7 text-[14px]">حسابات العملاء لا تملك صلاحية لوحة التحكم. لمنح الصلاحية، أنشئ مستندًا في مجموعة <code dir="ltr">admin_users</code> في Firestore معرّفه:</p>
    <div class="mt-3 bg-white hair rounded-xl px-3 py-2 font-mono text-[13px] select-all" dir="ltr">${esc(user.uid)}</div>
    <button class="${BTN_S} mt-5" data-act="logout">${ic(I.logout, 16)}تسجيل الخروج</button>
  </div>`;
}

function shell() {
  const newCount = allOrders().filter((o) => o.status === 'new').length; const newMsg = state.messages.filter((m) => m.status === 'new').length;
  document.title = `${newCount ? `(${newCount}) ` : ''}لوحة التحكم | الإمدادات`;
  return `
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-deep/10">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
      <img src="assets/logo/mark.svg" alt="" class="w-9 h-9">
      <div class="flex-1 min-w-0"><b class="block text-[15px] font-extrabold text-deep leading-tight">لوحة التحكم</b><span class="block text-[11px] text-muted truncate" dir="ltr" style="text-align:right">${esc(state.user.email || '')}</span></div>
      <a href="./" target="_blank" class="${BTN_S} !h-9 !px-3 hidden sm:inline-flex">${ic(I.ext, 15)}عرض المتجر</a>
      <button class="${BTN_S} !h-9 !px-3" data-act="logout" aria-label="تسجيل الخروج">${ic(I.logout, 16)}<span class="hidden sm:inline">خروج</span></button>
    </div>
    <nav class="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto no-sb" aria-label="أقسام لوحة التحكم">
      ${TABS.map(([k, t, d]) => { const n = k === 'orders' ? newCount : k === 'messages' ? newMsg : 0; return `<button class="relative h-11 px-3 text-[13.5px] whitespace-nowrap flex items-center gap-1.5 ${state.tab === k ? 'text-deep font-extrabold' : 'text-muted'}" data-act="tab" data-t="${k}">${ic(d, 16, 'currentColor', 1.9)}${t}${n ? `<span class="min-w-[20px] h-5 px-1.5 rounded-full bg-orange text-white text-[11px] font-bold grid place-items-center">${n}</span>` : ''}${state.tab === k ? '<i class="absolute bottom-0 inset-x-2 h-[3px] rounded-t bg-orange"></i>' : ''}</button>`; }).join('')}
    </nav>
  </header>
  <main id="panel" class="max-w-6xl mx-auto px-4 py-5 pb-16"></main>`;
}
function renderAll() {
  if (!$('#panel')) { $('#root').className = ''; $('#root').innerHTML = shell(); }
  else { const h = document.createElement('div'); h.innerHTML = shell(); $('#root header').replaceWith(h.querySelector('header')); }
  renderPanel();
}
const VIEWS = {};
function renderPanel() {
  const p = $('#panel'); if (!p) return;
  if (p.querySelector('[data-keep]') && p.dataset.tab === state.tab) return; // نماذج قيد التحرير
  const focused = document.activeElement?.id; const pos = document.activeElement?.selectionStart;
  p.dataset.tab = state.tab;
  p.innerHTML = VIEWS[state.tab]();
  if (focused && $('#' + focused) && $('#' + focused).tagName === 'INPUT') { const f = $('#' + focused); f.focus(); try { f.setSelectionRange(pos, pos); } catch { /* not text */ } }
}
const emptyDbBanner = () => (state.loaded.categories && !state.categories.length ? `
  <div class="mb-4 flex flex-wrap items-center gap-3 bg-[#FFF3E3] border border-orange/30 rounded-2xl p-4">
    <span class="w-10 h-10 rounded-xl bg-white grid place-items-center flex-none">${ic(I.info, 20, '#F7941E')}</span>
    <div class="flex-1 min-w-[200px]"><b class="block text-[14px]">قاعدة البيانات فارغة</b><span class="block text-[12px] text-muted">استورد الأقسام والمنتجات (بأسعار مبدئية غير معتمدة) ومعرض الأعمال والصفحات والإعدادات لتبدأ مباشرة.</span></div>
    <button class="${BTN_O}" data-act="seed">${ic(I.download, 16, '#fff')}استيراد البيانات الأولية</button>
  </div>` : '');
const loading = () => `<div class="py-16 grid place-items-center"><svg class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#075A9F" stroke-width="2.4"><path d="M21 12a9 9 0 11-6.2-8.6" stroke-linecap="round"/></svg></div>`;
const statCard = (t, v, s = '') => `<div class="${card} p-3"><span class="block text-[11.5px] text-muted">${t}</span><b class="block text-[20px] font-extrabold text-deep mt-0.5">${v}</b>${s ? `<span class="block text-[11px] text-muted">${s}</span>` : ''}</div>`;

/* ================================================================ orders + quotes */
VIEWS.orders = () => {
  if (!state.loaded.orders || !state.loaded.quotes) return loading();
  const q = state.oq.trim(); const all = allOrders();
  const list = all.filter((o) => (state.ofilter === 'all' || o.status === state.ofilter) && (state.otype === 'all' || o.type === state.otype)
    && (!q || [o.ref, o.name, o.phone, o.email, o.company, o.description].some((v) => String(v || '').includes(q))));
  const count = (k) => all.filter((o) => o.status === k).length;
  const purch = state.orders.filter((o) => o.status !== 'cancelled');
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const sum = (arr) => arr.reduce((n, o) => n + (o.totals?.total || 0), 0);
  return `${emptyDbBanner()}
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
    ${statCard('طلبات الشراء', fmtNum(state.orders.length), `${state.orders.filter((o) => o.status === 'new').length} جديدة`)}
    ${statCard('طلبات عروض الأسعار', fmtNum(state.quotes.length), `${state.quotes.filter((o) => o.status === 'new').length} جديدة`)}
    ${statCard('قيمة طلبات الشراء', fmtSAR(sum(purch)), 'باستثناء الملغاة')}
    ${statCard('هذا الشهر', fmtSAR(sum(purch.filter((o) => tsMs(o.createdAt) >= month.getTime()))), 'قيمة طلبات الشراء')}
  </div>
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <h2 class="text-[20px] font-extrabold text-deep flex-1">الطلبات وعروض الأسعار</h2>
    <button class="${BTN_S}" data-act="popularity">${ic(I.coins, 16)}تحديث «الأكثر طلبًا»</button>
    <button class="${BTN_S}" data-act="csv">${ic(I.download, 16)}تصدير CSV</button>
  </div>
  <label class="h-11 rounded-2xl bg-white hair flex items-center gap-2.5 px-3.5">${ic(I.search, 17, '#6B8299')}
    <input id="oSearch" class="flex-1 bg-transparent outline-none text-[14px]" placeholder="ابحث برقم الطلب أو الاسم أو الجهة أو الجوال…" value="${esc(state.oq)}"></label>
  <div class="no-sb flex gap-2 overflow-x-auto mt-3">${[['all', 'كل الأنواع'], ['purchase', 'طلبات الشراء'], ['quote', 'عروض الأسعار']].map(([k, t]) => `<button class="chip press ${state.otype === k ? 'on' : ''}" data-act="otype" data-k="${k}">${t}</button>`).join('')}</div>
  <div class="no-sb flex gap-2 overflow-x-auto my-3">
    <button class="chip press ${state.ofilter === 'all' ? 'on' : ''}" data-act="ofilter" data-k="all">كل الحالات (${all.length})</button>
    ${STATUS.map(([k, t]) => `<button class="chip press ${state.ofilter === k ? 'on' : ''}" data-act="ofilter" data-k="${k}">${t} (${count(k)})</button>`).join('')}
  </div>
  <div class="grid gap-3 lg:grid-cols-2">${list.map(orderCard).join('') || `<p class="lg:col-span-2 text-center text-muted text-[13px] py-14">لا توجد طلبات${q || state.ofilter !== 'all' ? ' مطابقة' : ' بعد'}.</p>`}</div>`;
};
const filesHtml = (files) => (files?.length ? `<div class="flex flex-wrap gap-1.5 mt-1">${files.map((f) => `<button class="h-7 px-2 rounded-lg bg-tint text-[11.5px] text-deep flex items-center gap-1" data-act="dl" data-path="${esc(f.path)}">${ic(I.attach, 12, '#075A9F', 2)}<span dir="ltr">${esc(f.name)}</span></button>`).join('')}</div>` : '');
function orderCard(o) {
  const st = ST[o.status] || ST.new; const isP = o.type === 'purchase';
  const intl = '966' + String(o.phone || '').replace(/^0/, '');
  const wa = `https://wa.me/${intl}?text=${encodeURIComponent(`مرحبًا ${o.name}، معك الإمدادات الذكية الحديثة بخصوص طلبك رقم ${o.ref}.`)}`;
  const ver = isP ? verifyLines(o.items, liveProducts(), { ...state.settings, ...SEED_SETTINGS, ...(state.settings || {}), delivery: o.delivery }) : null;
  const t = o.totals;
  return `<article class="${card} p-4 shadow-soft" data-order="${esc(o.id)}">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0"><span class="text-[11px] font-bold ${isP ? 'text-deep' : 'text-orange'}">${isP ? ORDER_TYPES.purchase : `طلب ${QUOTE_KINDS[o.kind] || 'عرض سعر'}`}</span><b class="block text-[16px] font-extrabold tracking-wide" dir="ltr" style="text-align:right">${esc(o.ref)}</b><span class="block text-[11.5px] text-muted">${fmtDate(o.createdAt)}${o.uid ? ' · عميل مسجل' : ' · زائر'}</span></div>
      <span class="flex-none text-[11.5px] font-bold rounded-lg px-2.5 py-1 ${st.c}">${st.t}</span>
    </div>
    <div class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
      <span class="text-muted">العميل</span><b>${esc(o.name)}${o.role ? ` <small class="font-normal text-muted">(${esc(o.role)})</small>` : ''}</b>
      ${o.company ? `<span class="text-muted">الجهة</span><span>${esc(o.company)} · ${esc(CUSTOMER_TYPES[o.customerType] || '')}${o.vatNumber ? ` · ض: <span dir="ltr">${esc(o.vatNumber)}</span>` : ''}</span>` : ''}
      <span class="text-muted">الجوال</span><a class="text-deep font-bold" href="tel:${esc(o.phone)}" dir="ltr" style="text-align:right">${esc(o.phone)}</a>
      ${o.email ? `<span class="text-muted">البريد</span><a class="text-deep truncate" href="mailto:${esc(o.email)}" dir="ltr" style="text-align:right">${esc(o.email)}</a>` : ''}
      ${o.city ? `<span class="text-muted">المدينة</span><span>${esc(o.city)}</span>` : ''}
      ${isP ? `<span class="text-muted">الاستلام</span><span>${DELIVERY[o.delivery] || ''}${o.address ? ` — ${esc([o.address.city, o.address.district, o.address.street, o.address.details].filter(Boolean).join('، '))}` : ''}</span>
      <span class="text-muted">الدفع</span><span>${PAYMENT_METHODS[o.paymentMethod]?.t || ''}</span>` : `<span class="text-muted">الخدمة</span><span>${esc(o.serviceName || catName(o.serviceId))}${o.categories?.length ? ` · ${o.categories.map(catName).map(esc).join('، ')}` : ''}</span>`}
      ${o.deadline ? `<span class="text-muted">التسليم المطلوب</span><span>${esc(o.deadline)}</span>` : ''}
      ${o.budget ? `<span class="text-muted">الميزانية</span><span>${esc(o.budget)}</span>` : ''}
      ${o.quantity ? `<span class="text-muted">الكميات</span><span>${esc(o.quantity)}</span>` : ''}
    </div>
    ${o.items?.length ? `<div class="mt-2.5 grid gap-1.5">${o.items.map((i) => `<div class="bg-surface rounded-xl px-3 py-2 text-[12.5px]"><div class="flex justify-between gap-2"><b>${esc(i.name)} × ${esc(i.qty)}</b>${i.lineTotal != null ? `<b class="text-deep" dir="ltr">${fmtSAR(i.lineTotal)}</b>` : ''}</div>${i.selText ? `<span class="block text-[11px] text-muted">${esc(i.selText)}</span>` : ''}${i.unitPrice != null ? `<span class="block text-[11px] text-muted">سعر الوحدة ${fmtSAR(i.unitPrice)}${i.priceApproved === false ? ' · سعر مبدئي' : ''}</span>` : ''}${i.notes ? `<span class="block text-[11px]">ملاحظات: ${esc(i.notes)}</span>` : ''}${filesHtml(i.files)}</div>`).join('')}</div>` : ''}
    ${o.title ? `<p class="mt-2 text-[12.5px]"><b>المشروع:</b> ${esc(o.title)}</p>` : ''}
    ${o.specs ? `<p class="mt-2 text-[12.5px] whitespace-pre-line"><b>المواصفات:</b> ${esc(o.specs)}</p>` : ''}
    ${o.description && o.description !== '—' ? `<p class="mt-2 text-[13px] text-[#3E5873] leading-7 bg-surface rounded-xl px-3 py-2 whitespace-pre-line">${esc(o.description)}</p>` : ''}
    ${o.notes && isP ? `<p class="mt-2 text-[12.5px]"><b>ملاحظات العميل:</b> ${esc(o.notes)}</p>` : ''}
    ${o.files?.length ? `<div class="mt-2"><b class="text-[12px]">المرفقات</b>${filesHtml(o.files)}</div>` : ''}
    ${t ? `<div class="mt-2.5 grid gap-0.5 text-[12.5px] border-t border-deep/5 pt-2"><div class="flex justify-between"><span>المجموع</span><span dir="ltr">${fmtSAR(t.subtotal)}</span></div>${t.savings ? `<div class="flex justify-between text-[#12804A]"><span>الخصم</span><span dir="ltr">-${fmtSAR(t.savings)}</span></div>` : ''}<div class="flex justify-between"><span>التوصيل</span><span>${o.delivery === 'delivery' ? (t.deliveryFee != null ? fmtSAR(t.deliveryFee) : 'يُحدد') : '—'}</span></div><div class="flex justify-between text-muted"><span>ضريبة ${t.vatRate}%${t.vatIncluded ? ' (مشمولة)' : ''}</span><span dir="ltr">${fmtSAR(t.vat)}</span></div><div class="flex justify-between font-extrabold text-deep text-[14px]"><span>الإجمالي</span><span dir="ltr">${fmtSAR(t.total)}</span></div></div>` : ''}
    ${o.verification ? `<div class="mt-2 text-[12px] rounded-xl px-3 py-2 ${o.verification.ok ? 'bg-[#E6F6EE] text-[#12804A]' : 'bg-[#FDECEC] text-[#B4232A]'}"><b>${o.verification.ok ? 'تحقق الخادم: الأسعار مطابقة' : 'تحقق الخادم: يوجد اختلاف'}</b>${o.verification.issues?.length ? `<br>${o.verification.issues.map(esc).join('<br>')}` : ''}</div>`
      : ver ? `<div class="mt-2 text-[12px] rounded-xl px-3 py-2 ${ver.ok && Math.abs(ver.total - (t?.total || 0)) < 0.01 ? 'bg-[#E6F6EE] text-[#12804A]' : 'bg-[#FFF3E3] text-[#9A5B00]'}"><b>مطابقة مع الأسعار الحالية:</b> ${ver.ok && Math.abs(ver.total - (t?.total || 0)) < 0.01 ? 'مطابق' : `الإجمالي حسب الأسعار الحالية ${fmtSAR(ver.total)}`}${ver.issues.length ? `<br>${ver.issues.map(esc).join('<br>')}` : ''}</div>` : ''}
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <select class="field !h-10 !w-auto !text-[13px] !rounded-xl" data-act="status" data-id="${esc(o.id)}" data-coll="${o.coll}" aria-label="حالة الطلب">${(FLOW[o.type] || STATUS_KEYS).concat(['cancelled']).filter((k, i, a) => a.indexOf(k) === i).map((k) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${ST[k].t}</option>`).join('')}</select>
      <a class="${BTN_S} !h-10" href="${esc(wa)}" target="_blank" rel="noopener">${WA(17)}واتساب</a>
      <a class="${BTN_S} !h-10" href="tel:${esc(o.phone)}">${ic(I.phone, 15)}اتصال</a>
    </div>
    <div class="mt-2 grid gap-2 ${isP ? '' : 'sm:grid-cols-[150px_1fr]'}">
      ${isP ? '' : `<input class="${fieldCls} !h-10 !text-[13px]" id="qa-${esc(o.id)}" inputmode="decimal" dir="ltr" style="text-align:right" placeholder="قيمة العرض ⃁" value="${o.quotedAmount ?? ''}">`}
      <input class="${fieldCls} !h-10 !text-[13px]" id="cm-${esc(o.id)}" placeholder="رسالة تظهر للعميل في صفحة التتبع" value="${esc(o.customerMessage || '')}" maxlength="300">
    </div>
    <div class="mt-2 flex gap-2">
      <input class="${fieldCls} !h-10 !text-[13px]" id="note-${esc(o.id)}" placeholder="ملاحظة داخلية (لا تظهر للعميل)" value="${esc(o.notes && !isP ? o.notes : o.adminNotes || '')}" maxlength="500">
      <button class="${BTN_P} !h-10 flex-none" data-act="note" data-id="${esc(o.id)}" data-coll="${o.coll}">حفظ</button>
    </div>
  </article>`;
}
async function updateOrder(o, patch, historyStatus) {
  const { db } = fb(); const batch = writeBatch(db);
  batch.update(doc(db, o.coll, o.id), { ...patch, ...stamp(), ...(historyStatus ? { history: arrayUnion({ status: historyStatus, at: Timestamp.now() }) } : {}) });
  const tpatch = {}; for (const k of ['status', 'quotedAmount', 'customerMessage']) if (k in patch) tpatch[k] = patch[k];
  if (historyStatus) tpatch.history = arrayUnion({ status: historyStatus, at: Timestamp.now() });
  tpatch.updatedAt = serverTimestamp();
  batch.set(doc(db, 'tracking', `${o.ref}_${String(o.phone).slice(-4)}`), tpatch, { merge: true });
  await batch.commit();
}
function exportCsv() {
  const rows = [['رقم الطلب', 'النوع', 'التاريخ', 'الحالة', 'نوع العميل', 'الجهة', 'الاسم', 'الجوال', 'البريد', 'البنود', 'الإجمالي (⃁)', 'قيمة العرض (⃁)', 'الدفع', 'الاستلام', 'الوصف']];
  allOrders().forEach((o) => rows.push([o.ref, o.type === 'purchase' ? 'شراء' : `عرض سعر (${QUOTE_KINDS[o.kind] || ''})`, fmtDate(o.createdAt), ST[o.status]?.t || o.status, CUSTOMER_TYPES[o.customerType] || '', o.company || '', o.name, o.phone, o.email || '', (o.items || []).map((i) => `${i.name} × ${i.qty}`).join(' | '), o.totals?.total ?? '', o.quotedAmount ?? '', PAYMENT_METHODS[o.paymentMethod]?.t || '', DELIVERY[o.delivery] || '', o.description || '']));
  const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `emdad-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function recomputePopularity(b) {
  const counts = {};
  for (const o of allOrders()) if (o.status !== 'cancelled') for (const i of o.items || []) if (i.productId) counts[i.productId] = (counts[i.productId] || 0) + 1;
  busy(b, true, 'جارٍ التحديث…');
  try {
    const { db } = fb(); const batch = writeBatch(db); let n = 0;
    for (const p of state.products) { const v = counts[p.id] || 0; if ((p.popularity || 0) !== v) { batch.update(doc(db, 'products', p.id), { popularity: v }); n++; } }
    if (n) await batch.commit();
    toast('تم تحديث مؤشر الأكثر طلبًا', `${Object.keys(counts).length} منتجًا لها طلبات`);
  } catch (e) { toast('تعذّر التحديث', errMsg(e), 'err'); }
  busy(b, false);
}

/* ================================================================ catalog lists */
const activeBadge = (a) => (a === false ? '<span class="text-[11px] font-bold text-[#B4232A] bg-[#FDECEC] rounded-lg px-2 py-0.5">مخفي</span>' : '<span class="text-[11px] font-bold text-[#12804A] bg-[#E6F6EE] rounded-lg px-2 py-0.5">منشور</span>');
const rowActions = (coll, id) => `<button class="w-9 h-9 rounded-xl bg-tint grid place-items-center flex-none" data-act="edit" data-c="${coll}" data-id="${esc(id)}" aria-label="تعديل">${ic(I.edit, 16)}</button>
  <button class="w-9 h-9 rounded-xl bg-[#FDECEC] grid place-items-center flex-none" data-act="del" data-c="${coll}" data-id="${esc(id)}" aria-label="حذف">${ic(I.trash, 16, '#B4232A')}</button>`;
const listHead = (title, n, coll, extra = '') => `${emptyDbBanner()}
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <h2 class="text-[20px] font-extrabold text-deep flex-1">${title} <small class="text-[12px] text-muted font-normal">· ${n}</small></h2>${extra}
    ${coll ? `<button class="${BTN_P}" data-act="new" data-c="${coll}">${ic(I.plus, 16, '#fff', 2.4)}إضافة</button>` : ''}
  </div>`;
const catSelect = (act) => `<select class="field !h-10 !w-auto !text-[13px] !rounded-xl" data-act="${act}" aria-label="تصفية حسب القسم"><option value="all">كل الأقسام</option>${state.categories.map((c) => `<option value="${esc(c.id)}" ${state.pcat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
const sortedProducts = () => { const co = (id) => state.categories.find((c) => c.id === id)?.order ?? 999; return state.products.filter((p) => state.pcat === 'all' || p.categoryId === state.pcat).sort((a, b) => co(a.categoryId) - co(b.categoryId) || byOrder(a, b)); };
const priceLabel = (p) => { const n = normProduct(p); return n.mode === 'buy' ? `${fmtSAR(n.price)}${n.compareAt ? ` <s class="text-muted">${fmtSAR(n.compareAt)}</s>` : ''}` : n.price !== null ? `يبدأ من ${fmtSAR(n.price)}` : 'عند الطلب'; };

VIEWS.products = () => {
  if (!state.loaded.products || !state.loaded.categories) return loading();
  const list = sortedProducts();
  return `${listHead('المنتجات', list.length, 'products', catSelect('pcat'))}
  <div class="grid gap-2">${list.map((p) => `<div class="flex items-center gap-3 ${card} p-2 pl-3">
      <img src="${imgSrc(p.image)}" alt="" class="w-16 h-16 rounded-[14px] object-cover flex-none bg-tint" loading="lazy">
      <div class="flex-1 min-w-0"><b class="block text-[14px] truncate">${esc(p.name)}</b><span class="block text-[12px] text-muted truncate">${esc(catName(p.categoryId))} · ${p.mode === 'buy' ? 'شراء مباشر' : 'عرض سعر'}${p.unit ? ` · ${esc(p.unit)}` : ''}</span>
        <span class="flex flex-wrap items-center gap-2 mt-1">${activeBadge(p.active)}<span class="text-[12px] text-deep">${priceLabel(p)}</span>${p.priceApproved ? '<span class="text-[11px] text-[#12804A]">معتمد</span>' : '<span class="text-[11px] text-[#9A5B00]">مبدئي</span>'}${p.stock != null && p.stock !== '' ? `<span class="text-[11px] text-muted">المخزون ${p.stock}</span>` : ''}${p.featured ? '<span class="text-[11px] text-orange">مميز</span>' : ''}</span></div>
      ${rowActions('products', p.id)}</div>`).join('') || '<p class="text-center text-muted text-[13px] py-14">لا توجد منتجات.</p>'}</div>`;
};

/* ---------------------------------------------------------------- prices */
VIEWS.prices = () => {
  if (!state.loaded.products) return loading();
  const list = sortedProducts(); const pending = state.products.filter((p) => !p.priceApproved).length;
  return `<div data-keep>${listHead('إدارة الأسعار', list.length, '', catSelect('pcat'))}
  <div class="${card} p-3.5 mb-3 text-[12.5px] text-[#3E5873] leading-6">جميع الأسعار بالريال السعودي. الأسعار غير المعتمدة تظهر للعملاء بشارة «سعر مبدئي» حتى تعتمدها. ${pending ? `<b class="text-[#9A5B00]">${pending} منتجًا بأسعار مبدئية.</b>` : '<b class="text-[#12804A]">كل الأسعار معتمدة.</b>'}</div>
  <div class="flex flex-wrap items-end gap-2 mb-3 ${card} p-3">
    <label class="text-[12px] font-bold">خصم جماعي على المعروض (%)<input id="bulkPct" class="${fieldCls} !h-10 !w-28 mt-1" inputmode="decimal" dir="ltr" placeholder="10"></label>
    <button class="${BTN_O} !h-10" data-act="bulkdisc">تطبيق الخصم</button>
    <button class="${BTN_S} !h-10" data-act="bulkundisc">إلغاء الخصومات</button>
    <span class="flex-1"></span>
    <button class="${BTN_P} !h-10" data-act="bulkapprove">${ic(I.check, 16, '#fff', 2.4)}اعتماد أسعار المعروض</button>
  </div>
  <div class="${card} overflow-x-auto"><table class="w-full text-[12.5px] min-w-[760px]">
    <thead class="bg-tint text-right"><tr><th class="p-2.5">المنتج</th><th class="p-2">الطريقة</th><th class="p-2">السعر (⃁)</th><th class="p-2">قبل الخصم</th><th class="p-2">الوحدة</th><th class="p-2">المخزون</th><th class="p-2">معتمد</th><th class="p-2"></th></tr></thead>
    <tbody>${list.map((p) => `<tr class="border-t border-deep/5" data-row="${esc(p.id)}">
      <td class="p-2.5"><b class="block">${esc(p.name)}</b><span class="text-[11px] text-muted">${esc(catName(p.categoryId))}</span></td>
      <td class="p-2"><select class="field !h-9 !w-28 !text-[12.5px] !px-2" data-f="mode"><option value="buy" ${p.mode === 'buy' ? 'selected' : ''}>شراء مباشر</option><option value="quote" ${p.mode !== 'buy' ? 'selected' : ''}>عرض سعر</option></select></td>
      <td class="p-2"><input class="field !h-9 !w-24 !px-2" data-f="price" inputmode="decimal" dir="ltr" value="${p.price ?? ''}"></td>
      <td class="p-2"><input class="field !h-9 !w-24 !px-2" data-f="compareAt" inputmode="decimal" dir="ltr" value="${p.compareAt ?? ''}"></td>
      <td class="p-2"><input class="field !h-9 !w-28 !px-2" data-f="unit" value="${esc(p.unit || '')}"></td>
      <td class="p-2"><input class="field !h-9 !w-20 !px-2" data-f="stock" inputmode="numeric" dir="ltr" placeholder="—" value="${p.stock ?? ''}"></td>
      <td class="p-2 text-center"><input type="checkbox" class="w-5 h-5 accent-[#12A150]" data-f="priceApproved" ${p.priceApproved ? 'checked' : ''}></td>
      <td class="p-2"><button class="${BTN_P} !h-9 !px-3" data-act="saverow" data-id="${esc(p.id)}">حفظ</button></td></tr>`).join('')}</tbody></table></div>
  <p class="text-[11.5px] text-muted mt-2">اترك «المخزون» فارغًا للمنتجات المصنّعة حسب الطلب. «قبل الخصم» يظهر مشطوبًا بجانب السعر عند وجود عرض.</p></div>`;
};
const numOrNull = (v) => (String(v).trim() === '' ? null : Number(v));
async function saveRow(id, b) {
  const tr = document.querySelector(`[data-row="${CSS.escape(id)}"]`); const g = (f) => tr.querySelector(`[data-f="${f}"]`);
  const price = numOrNull(g('price').value); const compareAt = numOrNull(g('compareAt').value); const stock = numOrNull(g('stock').value);
  if ([price, compareAt, stock].some((v) => v !== null && (Number.isNaN(v) || v < 0))) { toast('قيم غير صحيحة', 'الأسعار والمخزون أرقام موجبة', 'err'); return; }
  if (g('mode').value === 'buy' && price === null) { toast('أدخل السعر', 'منتجات الشراء المباشر تحتاج سعرًا', 'err'); return; }
  busy(b, true, '…');
  try { await updateDoc(doc(fb().db, 'products', id), { mode: g('mode').value, price, compareAt: compareAt !== null && price !== null && compareAt > price ? compareAt : null, unit: g('unit').value.trim(), stock: stock === null ? null : Math.floor(stock), priceApproved: g('priceApproved').checked, ...stamp() }); toast('تم حفظ السعر', state.products.find((p) => p.id === id)?.name); }
  catch (e) { toast('تعذّر الحفظ', errMsg(e), 'err'); }
  busy(b, false);
}
async function bulk(kind, b) {
  const list = sortedProducts(); const { db } = fb(); const batch = writeBatch(db); let n = 0;
  if (kind === 'disc') {
    const pct = Number($('#bulkPct').value); if (!(pct > 0 && pct < 90)) { toast('أدخل نسبة خصم بين 1 و89', '', 'err'); return; }
    for (const p of list) if (p.mode === 'buy' && p.price != null) { const base = p.compareAt && p.compareAt > p.price ? p.compareAt : p.price; batch.update(doc(db, 'products', p.id), { compareAt: base, price: Math.round(base * (1 - pct / 100)), ...stamp() }); n++; }
  } else if (kind === 'undisc') {
    for (const p of list) if (p.compareAt) { batch.update(doc(db, 'products', p.id), { price: p.compareAt, compareAt: null, ...stamp() }); n++; }
  } else if (kind === 'approve') {
    for (const p of list) if (!p.priceApproved) { batch.update(doc(db, 'products', p.id), { priceApproved: true, ...stamp() }); n++; }
  }
  if (!n) { toast('لا توجد منتجات تنطبق عليها العملية', '', 'info'); return; }
  busy(b, true, '…');
  try { await batch.commit(); toast('تم التحديث', `${n} منتجًا`); $('#panel').querySelector('[data-keep]')?.removeAttribute('data-keep'); renderPanel(); }
  catch (e) { toast('تعذّر التحديث', errMsg(e), 'err'); }
  busy(b, false);
}

/* ---------------------------------------------------------------- promotions */
VIEWS.promotions = () => {
  if (!state.loaded.promotions) return loading();
  return `${listHead('العروض والخصومات', state.promotions.length, 'promotions')}
  <p class="text-[12.5px] text-muted mb-3">تُطبَّق العروض الفعالة تلقائيًا على أسعار منتجات الشراء المباشر في المتجر (أفضل عرض لكل منتج)، ويظهر السعر الأصلي مشطوبًا.</p>
  <div class="grid gap-2 md:grid-cols-2">${state.promotions.map((pr) => `<div class="${card} p-3.5"><div class="flex items-start gap-2"><span class="w-10 h-10 rounded-xl bg-[#FFF3E3] grid place-items-center flex-none">${ic(I.tag, 19, '#F7941E')}</span>
    <div class="flex-1 min-w-0"><b class="block text-[14px]">${esc(pr.name)}</b><span class="block text-[12px] text-muted">${pr.type === 'fixed' ? `خصم ${fmtSAR(pr.value)}` : `خصم ${esc(pr.value)}%`} · ${pr.scope === 'all' ? 'كل المنتجات' : pr.scope === 'category' ? `أقسام: ${(pr.categoryIds || []).map(catName).map(esc).join('، ')}` : `${(pr.productIds || []).length} منتج`}</span>
    <span class="block text-[11.5px] text-muted">${pr.startAt || 'الآن'} ← ${pr.endAt || 'بدون نهاية'}</span>
    <span class="inline-block mt-1 text-[11px] font-bold rounded-lg px-2 py-0.5 ${promoLive(pr) ? 'text-[#12804A] bg-[#E6F6EE]' : 'text-muted bg-tint'}">${promoLive(pr) ? 'فعّال الآن' : 'غير فعّال'}</span></div>${rowActions('promotions', pr.id)}</div></div>`).join('') || '<p class="md:col-span-2 text-center text-muted text-[13px] py-14">لا توجد عروض بعد. أضف عرضًا لتطبيق خصم على قسم أو منتجات محددة.</p>'}</div>`;
};

VIEWS.categories = () => {
  if (!state.loaded.categories) return loading();
  return `${listHead('الأقسام (التصنيفات)', state.categories.length, 'categories')}
  <div class="grid gap-2 sm:grid-cols-2">${state.categories.map((c) => `<div class="flex items-center gap-3 ${card} p-2 pl-3">
      <img src="${imgSrc(c.image)}" alt="" class="w-16 h-16 rounded-[14px] object-cover flex-none bg-tint" loading="lazy">
      <div class="flex-1 min-w-0"><b class="block text-[14px] truncate">${esc(c.name)}</b><span class="block text-[12px] text-muted truncate">${(c.items || []).length} خدمة · ${state.products.filter((p) => p.categoryId === c.id).length} منتج</span>
        <span class="flex items-center gap-2 mt-1">${activeBadge(c.active)}<span class="text-[11px] text-muted">ترتيب ${c.order ?? '—'}</span></span></div>
      ${rowActions('categories', c.id)}</div>`).join('')}</div>`;
};
VIEWS.portfolio = () => {
  if (!state.loaded.portfolio) return loading();
  return `${listHead('معرض الأعمال', state.portfolio.length, 'portfolio')}
  <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">${state.portfolio.map((p) => `<div class="${card} overflow-hidden">
      <img src="${imgSrc(p.image)}" alt="" class="w-full h-32 object-cover bg-tint" loading="lazy">
      <div class="p-2.5"><b class="block text-[13px] truncate">${esc(p.title)}</b><span class="block text-[11.5px] text-muted truncate">${esc(p.group || '')}</span>
        <div class="flex items-center gap-1.5 mt-2">${activeBadge(p.active)}<span class="flex-1"></span>${rowActions('portfolio', p.id)}</div></div></div>`).join('')}</div>`;
};

/* ---------------------------------------------------------------- customers + messages */
VIEWS.customers = () => {
  if (!state.loaded.customers) return loading();
  const all = allOrders();
  return `${listHead('العملاء المسجلون', state.customers.length, '')}
  <p class="text-[12.5px] text-muted mb-3">بيانات العملاء محمية: لا يطلع عليها إلا المشرفون، وكل عميل يرى بياناته وطلباته فقط.</p>
  <div class="${card} overflow-x-auto"><table class="w-full text-[12.5px] min-w-[700px]"><thead class="bg-tint text-right"><tr><th class="p-2.5">العميل</th><th class="p-2">الجوال</th><th class="p-2">البريد</th><th class="p-2">الجهة</th><th class="p-2">العناوين</th><th class="p-2">الطلبات</th><th class="p-2">قيمة المشتريات</th></tr></thead>
  <tbody>${state.customers.map((c) => { const mine = all.filter((o) => o.uid === c.id); return `<tr class="border-t border-deep/5"><td class="p-2.5"><b>${esc(c.name || '—')}</b><span class="block text-[11px] text-muted">${fmtDate(c.createdAt)}</span></td><td class="p-2" dir="ltr" style="text-align:right">${esc(c.phone || '')}</td><td class="p-2" dir="ltr" style="text-align:right">${esc(c.email || '')}</td><td class="p-2">${esc(c.company || '')}${c.vatNumber ? `<span class="block text-[11px] text-muted" dir="ltr">${esc(c.vatNumber)}</span>` : ''}</td><td class="p-2">${(c.addresses || []).length}</td><td class="p-2">${mine.length}</td><td class="p-2" dir="ltr" style="text-align:right">${fmtSAR(mine.reduce((n, o) => n + (o.status !== 'cancelled' ? o.totals?.total || 0 : 0), 0))}</td></tr>`; }).join('') || '<tr><td colspan="7" class="text-center text-muted p-10">لا يوجد عملاء مسجلون بعد.</td></tr>'}</tbody></table></div>`;
};
VIEWS.messages = () => {
  if (!state.loaded.messages) return loading();
  return `${listHead('الرسائل والبلاغات', state.messages.length, '')}
  <div class="grid gap-3 lg:grid-cols-2">${state.messages.map((m) => `<article class="${card} p-4 ${m.status === 'new' ? 'ring-2 ring-orange/30' : ''}">
    <div class="flex justify-between gap-2"><span><span class="text-[11px] font-bold ${m.kind === 'issue' ? 'text-[#B4232A]' : 'text-deep'}">${m.kind === 'issue' ? 'بلاغ عن مشكلة' : 'رسالة تواصل'}</span><b class="block text-[14.5px]">${esc(m.subject || '')}</b><span class="block text-[11.5px] text-muted">${fmtDate(m.createdAt)}${m.orderRef ? ` · <span dir="ltr">${esc(m.orderRef)}</span>` : ''}</span></span><span class="text-[11px] font-bold rounded-lg px-2 py-0.5 h-fit ${m.status === 'new' ? 'bg-orange text-white' : 'bg-tint text-muted'}">${m.status === 'new' ? 'جديدة' : 'تمت المعالجة'}</span></div>
    <p class="mt-2 text-[13px] text-[#3E5873] leading-7 whitespace-pre-line bg-surface rounded-xl px-3 py-2">${esc(m.message)}</p>
    <p class="mt-2 text-[12.5px]"><b>${esc(m.name)}</b> · <a class="text-deep" href="tel:${esc(m.phone)}" dir="ltr">${esc(m.phone)}</a>${m.email ? ` · <a class="text-deep" href="mailto:${esc(m.email)}" dir="ltr">${esc(m.email)}</a>` : ''}</p>
    ${filesHtml(m.files)}
    <div class="flex gap-2 mt-3"><button class="${BTN_S} !h-9" data-act="msgdone" data-id="${esc(m.id)}" data-s="${m.status === 'new' ? 'done' : 'new'}">${m.status === 'new' ? 'تمت المعالجة' : 'إعادة كجديدة'}</button><a class="${BTN_S} !h-9" href="https://wa.me/966${esc(String(m.phone || '').replace(/^0/, ''))}" target="_blank" rel="noopener">${WA(16)}واتساب</a><button class="w-9 h-9 rounded-xl bg-[#FDECEC] grid place-items-center" data-act="del" data-c="messages" data-id="${esc(m.id)}" aria-label="حذف">${ic(I.trash, 16, '#B4232A')}</button></div>
  </article>`).join('') || '<p class="lg:col-span-2 text-center text-muted text-[13px] py-14">لا توجد رسائل.</p>'}</div>`;
};

/* ---------------------------------------------------------------- pages */
const pagesMerged = () => Object.entries(SEED_PAGES).map(([id, sp]) => { const db = state.pages.find((p) => p.id === id); return { id, ...sp, ...(db || {}), stored: !!db }; });
VIEWS.pages = () => {
  if (!state.loaded.pages) return loading();
  return `${listHead('محتوى الصفحات', Object.keys(SEED_PAGES).length, '')}
  <p class="text-[12.5px] text-muted mb-3">عدّل نصوص الصفحات التعريفية والقانونية. الصفحات غير المعتمدة تظهر للزوار بشارة «مسودة بانتظار الاعتماد». راجع السياسات قانونيًا قبل اعتمادها.</p>
  <div class="grid gap-2 sm:grid-cols-2">${pagesMerged().map((p) => `<div class="flex items-center gap-3 ${card} p-3"><span class="w-10 h-10 rounded-xl bg-tint grid place-items-center flex-none">${ic(I.doc, 19)}</span><div class="flex-1"><b class="block text-[14px]">${esc(p.title)}</b><span class="text-[11px] font-bold rounded-lg px-2 py-0.5 ${p.approved ? 'text-[#12804A] bg-[#E6F6EE]' : 'text-[#9A5B00] bg-[#FFF3E3]'}">${p.approved ? 'معتمدة' : 'مسودة'}</span> <span class="text-[11px] text-muted">${(p.body.match(/\[\[/g) || []).length ? `${(p.body.match(/\[\[/g) || []).length} حقول بانتظار الإدارة` : ''}</span></div><button class="w-9 h-9 rounded-xl bg-tint grid place-items-center" data-act="editpage" data-id="${p.id}" aria-label="تعديل">${ic(I.edit, 16)}</button></div>`).join('')}</div>`;
};
function editPage(id) {
  const p = pagesMerged().find((x) => x.id === id);
  openModal(`<form id="pgForm" class="w-full max-w-[760px] my-6 bg-surface rounded-[26px] shadow-lift" novalidate>
    <div class="flex items-center justify-between px-5 pt-4 pb-2"><b class="text-[18px] font-extrabold text-deep">تعديل صفحة: ${esc(p.title)}</b><button type="button" class="w-9 h-9 rounded-full bg-white hair grid place-items-center" data-act="close" aria-label="إغلاق">${ic(I.x, 16, '#0B2A45', 2)}</button></div>
    <div class="px-5 grid gap-3">
      <div><label class="block text-[12.5px] font-bold mb-1.5" for="pgTitle">العنوان</label><input id="pgTitle" class="${fieldCls}" value="${esc(p.title)}" maxlength="80"></div>
      <div><label class="block text-[12.5px] font-bold mb-1.5" for="pgBody">المحتوى</label><textarea id="pgBody" class="field !text-[13.5px] !leading-7" style="height:420px" dir="rtl">${esc(p.body)}</textarea>
        <span class="block text-[11px] text-muted mt-1 leading-5">الصيغة: «## عنوان» · «### سؤال» (للأسئلة الشائعة) · «- بند» · **عريض** · {{phone}} {{email}} {{crNumber}} {{vatNumber}} {{address}} {{legalName}} تُستبدل من الإعدادات · [[نص]] = معلومة بانتظار الإدارة.</span></div>
      <label class="flex items-center gap-2 text-[13.5px] font-bold"><input id="pgApproved" type="checkbox" class="w-5 h-5 accent-[#12A150]" ${p.approved ? 'checked' : ''}>معتمدة للنشر (تُزال شارة «مسودة»)</label>
    </div>
    <div class="px-5 py-4 flex gap-2 justify-end"><button type="button" class="${BTN_S}" data-act="close">إلغاء</button><button id="pgSave" class="${BTN_P} min-w-[110px]" type="submit">حفظ</button></div>
  </form>`);
  $('#pgForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = $('#pgSave'); busy(b, true);
    try { await setDoc(doc(fb().db, 'pages', id), { title: $('#pgTitle').value.trim(), body: $('#pgBody').value, approved: $('#pgApproved').checked, updatedAtText: new Date().toISOString().slice(0, 10), ...stamp() }, { merge: true }); closeModal(); toast('تم حفظ الصفحة'); }
    catch (err) { busy(b, false); toast('تعذّر الحفظ', errMsg(err), 'err'); }
  });
}

/* ================================================================ forms */
const fmtSpecs = (v) => (v || []).map((s) => `${s.k}: ${s.v}`).join('\n');
const fmtOptions = (v) => (v || []).map((o) => `${o.name}: ${o.values.map((x) => (x.delta ? `${x.label} (${x.delta > 0 ? '+' : ''}${x.delta})` : x.label)).join('، ')}`).join('\n');
const fmtAddons = (v) => (v || []).map((a) => `${a.label} | ${a.price}`).join('\n');
const parseSpecs = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i > 0 ? { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() } : { k: l, v: '' }; });
const parseOptions = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); if (i < 1) return null; return { name: l.slice(0, i).trim(), values: l.slice(i + 1).split(/[،,]/).map((x) => x.trim()).filter(Boolean).map((x) => { const m = x.match(/^(.*?)\s*\(([+-−]?\s*[\d.]+)\)\s*$/); return m ? { label: m[1].trim(), delta: Number(m[2].replace(/[−\s]/g, (c) => (c === '−' ? '-' : ''))) } : { label: x, delta: 0 }; }) }; }).filter((o) => o && o.values.length);
const parseAddons = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [a, b] = l.split('|'); return { label: a.trim(), price: Number(b) || 0 }; });
const dateIn = (v) => v || '';

const SCHEMA = {
  products: () => [
    ['name', 'اسم المنتج', 'text', { required: true, max: 120 }],
    ['categoryId', 'القسم (التصنيف)', 'select', { required: true, options: state.categories.map((c) => [c.id, c.name]) }],
    ['mode', 'طريقة الطلب', 'select', { options: [['buy', 'شراء مباشر (سعر محدد + سلة)'], ['quote', 'عرض سعر (يبدأ من / حسب المواصفات)']] }],
    ['price', 'السعر بالريال السعودي', 'price', { hint: 'للشراء المباشر: سعر الوحدة. لعرض السعر: «يبدأ من» (اختياري)' }],
    ['compareAt', 'السعر قبل الخصم (⃁)', 'price', { hint: 'اتركه فارغًا إن لا يوجد خصم' }],
    ['unit', 'الوحدة', 'text', { max: 40, hint: 'مثال: للقطعة، للمتر المربع، لكل 100 قطعة' }],
    ['priceApproved', 'السعر معتمد من الإدارة', 'bool', {}],
    ['stock', 'المخزون المتوفر', 'number', { hint: 'اتركه فارغًا للمنتجات المصنّعة حسب الطلب' }],
    ['minQty', 'الحد الأدنى للطلب', 'number', {}],
    ['leadTime', 'مدة التنفيذ المتوقعة', 'text', { max: 60, hint: 'مثال: 3–5 أيام عمل' }],
    ['desc', 'وصف مختصر (للبطاقة)', 'text', { max: 160 }],
    ['details', 'الوصف التفصيلي', 'textarea', { max: 2000, rows: 4 }],
    ['image', 'الصورة الرئيسية', 'image', { required: true }],
    ['images', 'صور إضافية (رابط في كل سطر)', 'lines', { rows: 2 }],
    ['imageCredit', 'مصدر الصورة وترخيصها', 'text', { max: 300, hint: 'مثال: Wikimedia Commons — اسم المصور — CC BY-SA 4.0' }],
    ['specs', 'المواصفات الفنية (بند: قيمة — سطر لكل بند)', 'specs', { rows: 3 }],
    ['options', 'خيارات التخصيص (الاسم: قيمة، قيمة (+فرق السعر))', 'options', { rows: 3, hint: 'مثال: المقاس: 85×200 سم، 100×200 سم (+40)' }],
    ['addons', 'الإضافات والملحقات (الاسم | السعر)', 'addons', { rows: 2, hint: 'مثال: تصميم البوستر | 150' }],
    ['allowUpload', 'السماح برفع ملفات التصميم', 'bool', {}],
    ['badge', 'شارة (مثال: باقة، جديد)', 'text', { max: 20 }],
    ['featured', 'منتج مميز (يظهر في الرئيسية)', 'bool', {}],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'منشور في المتجر', 'bool', {}],
  ],
  categories: () => [
    ['name', 'اسم القسم', 'text', { required: true, max: 120 }],
    ['short', 'الاسم المختصر للبطاقة', 'textarea', { max: 60, rows: 2 }],
    ['tag', 'العبارة التسويقية', 'text', { max: 120 }],
    ['desc', 'الوصف', 'textarea', { max: 600, rows: 3 }],
    ['image', 'صورة القسم', 'image', { required: true }],
    ['items', 'الخدمات (سطر لكل خدمة)', 'lines', { rows: 5 }],
    ['uses', 'الاستخدامات (صفحة خدماتنا)', 'lines', { rows: 3 }],
    ['benefits', 'المميزات (صفحة خدماتنا)', 'lines', { rows: 3 }],
    ['works', 'صور من معرض الأعمال (رابط في كل سطر)', 'lines', { rows: 3 }],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'منشور في المتجر', 'bool', {}],
  ],
  portfolio: () => [
    ['title', 'العنوان', 'text', { required: true, max: 120 }],
    ['desc', 'وصف قصير', 'text', { max: 160 }],
    ['group', 'التصنيف (يظهر كفلتر)', 'text', { required: true, max: 60, list: [...new Set(state.portfolio.map((p) => p.group).filter(Boolean))] }],
    ['image', 'الصورة', 'image', { required: true }],
    ['height', 'ارتفاع البطاقة (110–260)', 'number', {}],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'منشور في المتجر', 'bool', {}],
  ],
  promotions: () => [
    ['name', 'اسم العرض', 'text', { required: true, max: 80, hint: 'يظهر للعميل في صفحة المنتج' }],
    ['type', 'نوع الخصم', 'select', { options: [['percent', 'نسبة مئوية %'], ['fixed', 'مبلغ ثابت (⃁)']] }],
    ['value', 'قيمة الخصم', 'number', { required: true }],
    ['scope', 'يطبَّق على', 'select', { options: [['all', 'كل منتجات الشراء المباشر'], ['category', 'أقسام محددة'], ['products', 'منتجات محددة']] }],
    ['categoryIds', 'الأقسام', 'multi', { options: state.categories.map((c) => [c.id, c.name]) }],
    ['productIds', 'المنتجات', 'multi', { options: state.products.filter((p) => p.mode === 'buy').map((p) => [p.id, p.name]) }],
    ['startAt', 'يبدأ في', 'date', {}],
    ['endAt', 'ينتهي في', 'date', {}],
    ['badge', 'شارة على المنتج', 'text', { max: 20, hint: 'مثال: عرض اليوم الوطني' }],
    ['active', 'مفعّل', 'bool', {}],
  ],
};
const ITEM_T = { products: 'منتج', categories: 'قسم', portfolio: 'عمل', promotions: 'عرض' };

function fieldHtml([k, lab, type, o], v) {
  const id = 'f_' + k; const req = o.required ? ' <b class="text-orange">*</b>' : '';
  const hint = o.hint ? `<span class="block text-[11px] text-muted mt-1">${esc(o.hint)}</span>` : '';
  const labl = `<label class="block text-[12.5px] font-bold mb-1.5" for="${id}">${lab}${req}</label>`;
  const ta = (txt) => `<div>${labl}<textarea id="${id}" class="field !text-[13.5px]" style="height:${(o.rows || 3) * 28 + 20}px" ${o.max ? `maxlength="${o.max}"` : ''}>${esc(txt)}</textarea>${hint}</div>`;
  if (type === 'bool') return `<label class="flex items-center gap-2 text-[13.5px] font-bold"><input id="${id}" type="checkbox" class="w-5 h-5 accent-[#075A9F]" ${v === true || (v !== false && ['active', 'allowUpload'].includes(k)) ? 'checked' : ''}>${lab}</label>`;
  if (type === 'select') return `<div>${labl}<select id="${id}" class="${fieldCls}">${o.options.map(([val, t]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${hint}</div>`;
  if (type === 'multi') return `<div>${labl}<div id="${id}" class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">${o.options.map(([val, t]) => `<label class="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white hair text-[12.5px]"><input type="checkbox" value="${esc(val)}" class="accent-[#075A9F]" ${(v || []).includes(val) ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div>${hint}</div>`;
  if (type === 'textarea') return ta(v || '');
  if (type === 'lines') return ta((v || []).join('\n'));
  if (type === 'specs') return ta(fmtSpecs(v));
  if (type === 'options') return ta(fmtOptions(v));
  if (type === 'addons') return ta(fmtAddons(v));
  if (type === 'date') return `<div>${labl}<input id="${id}" type="date" class="${fieldCls}" value="${esc(dateIn(v))}">${hint}</div>`;
  if (type === 'number' || type === 'price') return `<div>${labl}<input id="${id}" type="number" inputmode="decimal" min="0" step="any" class="${fieldCls}" dir="ltr" style="text-align:right" value="${v ?? ''}">${hint}</div>`;
  if (type === 'image') return `<div>${labl}<div class="flex gap-2 items-start">
      <img id="${id}_pv" src="${imgSrc(v)}" alt="" class="w-20 h-20 rounded-xl object-cover bg-tint flex-none">
      <div class="flex-1 min-w-0"><input id="${id}" class="${fieldCls}" dir="ltr" placeholder="https://… أو assets/…" value="${esc(v || '')}">
      ${hasStorage ? `<label class="${BTN_S} !h-9 mt-2 cursor-pointer">${ic(I.upload, 15)}رفع صورة إلى Firebase Storage<input type="file" accept="image/*" class="hidden" data-up="${id}"></label>` : '<span class="block text-[11px] text-muted mt-1">ضع رابط الصورة (فعّل Firebase Storage لرفع الصور مباشرة).</span>'}</div></div></div>`;
  return `<div>${labl}<input id="${id}" class="${fieldCls}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.list ? `list="${id}_dl"` : ''} value="${esc(v ?? '')}">${o.list ? `<datalist id="${id}_dl">${o.list.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>` : ''}${hint}</div>`;
}
function readForm(schema) {
  const out = {}; let bad = null;
  for (const [k, , type, o] of schema) {
    const el = $('#f_' + k); let v;
    if (type === 'bool') v = el.checked;
    else if (type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (type === 'price') v = el.value === '' ? null : Math.max(0, Number(el.value));
    else if (type === 'lines') v = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
    else if (type === 'specs') v = parseSpecs(el.value);
    else if (type === 'options') v = parseOptions(el.value);
    else if (type === 'addons') v = parseAddons(el.value);
    else if (type === 'multi') v = [...el.querySelectorAll('input:checked')].map((i) => i.value);
    else v = el.value.trim();
    const isEmpty = v === '' || v === null || (Array.isArray(v) && !v.length);
    el.classList.toggle('err', !!o.required && isEmpty);
    if (o.required && isEmpty && !bad) bad = el;
    out[k] = v;
  }
  if (bad) { bad.focus(); return null; }
  return out;
}
function openModal(html) { const m = $('#modal'); m.innerHTML = html; m.classList.remove('hidden'); m.classList.add('flex'); }
function closeModal() { const m = $('#modal'); m.classList.add('hidden'); m.classList.remove('flex'); m.innerHTML = ''; }

function editForm(coll, id) {
  const item = id ? state[coll].find((x) => x.id === id) : null;
  if (coll === 'products' && !state.categories.length) { toast('أضف قسمًا أولًا', 'كل منتج يتبع قسمًا', 'info'); return; }
  const defaults = { active: true, allowUpload: true, mode: 'buy', minQty: 1, type: 'percent', scope: 'category', order: (state[coll].reduce((m, x) => Math.max(m, x.order || 0), 0) + 1), categoryId: state.pcat !== 'all' ? state.pcat : state.categories[0]?.id, height: 160 };
  const data = item || defaults;
  const schema = SCHEMA[coll]();
  openModal(`<form id="editForm" class="w-full max-w-[620px] my-6 bg-surface rounded-[26px] shadow-lift" novalidate>
    <div class="flex items-center justify-between px-5 pt-4 pb-2"><b class="text-[18px] font-extrabold text-deep">${item ? 'تعديل' : 'إضافة'} ${ITEM_T[coll]}</b>
      <button type="button" class="w-9 h-9 rounded-full bg-white hair grid place-items-center" data-act="close" aria-label="إغلاق">${ic(I.x, 16, '#0B2A45', 2)}</button></div>
    <div class="px-5 pb-2 grid gap-3">${schema.map((f) => fieldHtml(f, data[f[0]])).join('')}</div>
    <div class="px-5 py-4 flex gap-2 justify-end"><button type="button" class="${BTN_S}" data-act="close">إلغاء</button><button id="saveBtn" class="${BTN_P} min-w-[110px]" type="submit">حفظ</button></div>
  </form>`);
  $('#editForm').addEventListener('input', (e) => {
    e.target.classList.remove('err');
    if (e.target.id?.endsWith('image') && $('#' + e.target.id + '_pv')) $('#' + e.target.id + '_pv').src = e.target.value || 'assets/logo/mark.svg';
  });
  $('#editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = readForm(schema); if (!v) { toast('أكمل الحقول المطلوبة', '', 'info'); return; }
    if (coll === 'portfolio' && v.height != null) v.height = Math.max(110, Math.min(260, v.height));
    if (coll === 'products') {
      if (v.mode === 'buy' && v.price === null) { toast('أدخل السعر', 'منتجات الشراء المباشر تحتاج سعرًا بالريال', 'err'); $('#f_price').classList.add('err'); return; }
      if (v.compareAt !== null && (v.price === null || v.compareAt <= v.price)) v.compareAt = null;
      v.minQty = Math.max(1, v.minQty || 1);
      if (v.stock !== null) v.stock = Math.max(0, Math.floor(v.stock));
      if (!item) { v.addedAt = Date.now(); v.popularity = 0; }
    }
    if (coll === 'promotions' && v.type === 'percent' && !(v.value > 0 && v.value < 100)) { toast('النسبة بين 1 و99', '', 'err'); return; }
    const b = $('#saveBtn'); busy(b, true);
    try {
      const { db } = fb(); const payload = { ...v, ...stamp() };
      if (item) await setDoc(doc(db, coll, item.id), payload, { merge: true });
      else await addDoc(collection(db, coll), payload);
      closeModal(); toast('تم الحفظ', v.name || v.title || '');
    } catch (err) { console.error(err); busy(b, false); toast('تعذّر الحفظ', errMsg(err), 'err'); }
  });
}

async function uploadImage(input) {
  const file = input.files?.[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { toast('الملف ليس صورة', '', 'err'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('حجم الصورة كبير', 'الحد الأقصى 5 ميجابايت', 'err'); return; }
  const target = $('#' + input.dataset.up); const lab = input.closest('label');
  lab.classList.add('opacity-60', 'pointer-events-none');
  try {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
    const r = sRef(fb().storage, `catalog/${Date.now()}-${safe}`);
    await uploadBytes(r, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
    target.value = await getDownloadURL(r); $('#' + target.id + '_pv').src = target.value; target.classList.remove('err');
    toast('تم رفع الصورة إلى Firebase Storage');
  } catch (err) { console.error(err); toast('تعذّر رفع الصورة', errMsg(err), 'err'); }
  lab.classList.remove('opacity-60', 'pointer-events-none');
}
/** ينقل صور المنتجات والأقسام والأعمال المخزنة داخل الموقع (assets/…) إلى Firebase Storage ويحدّث الروابط */
async function migrateImages(b) {
  if (!hasStorage) { toast('Firebase Storage غير مفعّل', '', 'err'); return; }
  busy(b, true, 'جارٍ النقل…'); const { db, storage } = fb(); const cache = {}; let n = 0;
  const up = async (path) => {
    if (!path || /^https?:/.test(path)) return path;
    if (cache[path]) return cache[path];
    const blob = await (await fetch(path)).blob();
    const r = sRef(storage, `catalog/migrated/${path.split('/').pop()}`);
    await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg', cacheControl: 'public, max-age=31536000' });
    return (cache[path] = await getDownloadURL(r));
  };
  try {
    for (const coll of ['products', 'categories', 'portfolio']) for (const it of state[coll]) {
      const patch = {};
      if (it.image && !/^https?:/.test(it.image)) patch.image = await up(it.image);
      if (it.images?.some((x) => !/^https?:/.test(x))) patch.images = await Promise.all(it.images.map(up));
      if (it.works?.some((x) => !/^https?:/.test(x))) patch.works = await Promise.all(it.works.map(up));
      if (Object.keys(patch).length) { await updateDoc(doc(db, coll, it.id), patch); n++; b.textContent = `جارٍ النقل… ${n}`; }
    }
    toast('تم نقل الصور إلى Firebase Storage', `${n} سجلًا · ${Object.keys(cache).length} صورة`);
  } catch (e) { console.error(e); toast('توقف النقل', errMsg(e), 'err'); }
  busy(b, false);
}

function confirmDel(coll, id) {
  const item = state[coll].find((x) => x.id === id); if (!item) return;
  if (coll === 'categories' && state.products.some((p) => p.categoryId === id)) { toast('لا يمكن حذف قسم يحتوي على منتجات', 'انقل المنتجات أو احذفها أولًا، أو أخفِ القسم', 'info'); return; }
  openModal(`<div class="w-full max-w-[400px] my-6 bg-surface rounded-[24px] shadow-lift p-5 text-center">
    <span class="mx-auto w-14 h-14 rounded-full bg-[#FDECEC] grid place-items-center">${ic(I.trash, 24, '#B4232A')}</span>
    <b class="block text-[17px] font-extrabold mt-3">حذف «${esc(item.name || item.title || item.subject || 'العنصر')}»؟</b>
    <p class="text-[12.5px] text-muted mt-1">لا يمكن التراجع عن الحذف.${coll !== 'messages' ? ' لإخفائه مؤقتًا عدّله وألغِ «منشور».' : ''}</p>
    <div class="flex gap-2 mt-4"><button class="${BTN_S} flex-1" data-act="close">إلغاء</button><button class="${btn('bg-[#E5484D] text-white')} flex-1" data-act="delYes" data-c="${coll}" data-id="${esc(id)}">حذف</button></div>
  </div>`);
}

/* ---------------------------------------------------------------- settings */
const toTime = (h) => (h == null ? '' : `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`);
const fromTime = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h + m / 60; };
VIEWS.settings = () => {
  if (!state.loaded.settings) return loading();
  if ($('#setForm')) return $('#panel').innerHTML;
  const s = { ...SEED_SETTINGS, ...(state.settings || {}) }; const hours = { ...SEED_SETTINGS.hours, ...(s.hours || {}) }; const pay = { ...SEED_SETTINGS.payments, ...(s.payments || {}) };
  const f = (k, lab, attrs = '') => `<div><label class="block text-[12.5px] font-bold mb-1.5" for="s_${k}">${lab}${!s[k] && ['email', 'crNumber', 'vatNumber'].includes(k) ? ' <span class="text-[10.5px] text-[#9A5B00] bg-[#FFF3E3] rounded px-1">مطلوب للاعتماد</span>' : ''}</label><input id="s_${k}" class="${fieldCls}" value="${esc(s[k] ?? '')}" ${attrs}></div>`;
  const chk = (id, lab, on) => `<label class="flex items-center gap-2 text-[13.5px] font-bold"><input id="${id}" type="checkbox" class="w-5 h-5 accent-[#075A9F]" ${on ? 'checked' : ''}>${lab}</label>`;
  const sec = (t, body) => `<section class="${card} rounded-[22px] p-4 grid gap-3 content-start"><h2 class="text-[16px] font-extrabold text-deep">${t}</h2>${body}</section>`;
  return `<div data-keep>${emptyDbBanner()}
  <form id="setForm" class="grid gap-4 lg:grid-cols-2" novalidate>
    <section class="${card} rounded-[22px] p-4 grid gap-3 content-start lg:col-span-2"><h2 class="text-[16px] font-extrabold text-deep">سلايدر الصفحة الرئيسية</h2>
      <p class="text-[12px] text-muted -mt-2">حتى 6 شرائح؛ الشريحة بلا عنوان أو صورة لا تظهر. الرابط مسار داخل المتجر مثل: category/printing · shop/offers · shop/cat:gifts · services · quote · product/printing-3</p>
      <div class="grid gap-3 md:grid-cols-2">${Array.from({ length: 6 }, (_, i) => { const sl = (s.heroSlides || [])[i] || {}; return `<div class="bg-surface hair rounded-2xl p-3 grid gap-2"><b class="text-[13px]">الشريحة ${i + 1}</b>
        <input class="${fieldCls}" id="hs_t_${i}" placeholder="العنوان" maxlength="60" value="${esc(sl.title || '')}">
        <input class="${fieldCls}" id="hs_d_${i}" placeholder="الوصف" maxlength="120" value="${esc(sl.desc || '')}">
        <div class="grid grid-cols-2 gap-2"><input class="${fieldCls}" id="hs_c_${i}" placeholder="نص الزر" maxlength="30" value="${esc(sl.cta || '')}"><input class="${fieldCls}" id="hs_l_${i}" dir="ltr" placeholder="category/printing" value="${esc(sl.link || '')}"></div>
        <div class="flex gap-2 items-start"><img id="f_hs_i_${i}_pv" src="${imgSrc(sl.image || 'assets/logo/mark.svg')}" alt="" class="w-16 h-16 rounded-xl object-cover bg-tint flex-none"><div class="flex-1 min-w-0"><input class="${fieldCls}" id="f_hs_i_${i}" dir="ltr" placeholder="رابط الصورة" value="${esc(sl.image || '')}">${hasStorage ? `<label class="${BTN_S} !h-8 mt-1.5 cursor-pointer text-[12px]">${ic(I.upload, 14)}رفع صورة<input type="file" accept="image/*" class="hidden" data-up="f_hs_i_${i}"></label>` : ''}</div></div>
      </div>`; }).join('')}</div>
      <div class="w-48">${f('heroInterval', 'مدة كل شريحة (ثوانٍ)', 'type="number" min="3" max="10" step="0.5" dir="ltr" style="text-align:right"')}</div>
    </section>
    ${sec('بيانات المؤسسة (تظهر في التذييل والسياسات والفواتير)', `${f('legalName', 'الاسم النظامي')}${f('storeName', 'اسم المتجر')}${f('crNumber', 'رقم السجل التجاري', 'dir="ltr" style="text-align:right"')}${f('vatNumber', 'الرقم الضريبي', 'dir="ltr" style="text-align:right"')}${f('email', 'البريد الإلكتروني الرسمي', 'type="email" dir="ltr" style="text-align:right"')}`)}
    ${sec('التواصل والموقع', `${f('phone', 'رقم الهاتف', 'dir="ltr" style="text-align:right"')}${f('whatsapp', 'رقم واتساب (بالصيغة الدولية بدون +)', 'dir="ltr" style="text-align:right" placeholder="9665XXXXXXXX"')}${f('branchName', 'اسم الفرع')}${f('city', 'المدينة (تظهر في الرئيسية)')}${f('address', 'العنوان')}${f('mapsUrl', 'رابط خرائط Google', 'dir="ltr"')}`)}
    ${sec('التسعير والضريبة', `<div class="grid grid-cols-2 gap-2">${f('vatRate', 'نسبة ضريبة القيمة المضافة %', 'type="number" min="0" max="100" dir="ltr" style="text-align:right"')}<div class="self-end pb-2">${chk('s_pricesIncludeVat', 'الأسعار المعروضة شاملة الضريبة', s.pricesIncludeVat !== false)}</div></div>${f('pricesApprovedNote', 'ملاحظة الأسعار المبدئية (تظهر في السلة)')}`)}
    ${sec('الدفع (طرق لا تتطلب بوابة دفع)', `${chk('p_cod', 'الدفع عند الاستلام', pay.cod)}${chk('p_store', 'الدفع في المقر', pay.store)}${chk('p_bank', 'التحويل البنكي (يظهر بعد إدخال الآيبان)', pay.bank)}<div class="grid grid-cols-2 gap-2">${f('bankName', 'اسم البنك')}${f('accountName', 'اسم المستفيد')}</div>${f('iban', 'رقم الآيبان', 'dir="ltr" style="text-align:right" placeholder="SA…"')}${chk('s_showPaymentLogos', 'إظهار شعارات مدى/Apple Pay/البطاقات في الرئيسية (فعّلها فقط بعد تفعيل الدفع الإلكتروني)', s.showPaymentLogos)}`)}
    ${sec('الاستلام والتوصيل', `${chk('s_pickupEnabled', 'الاستلام من المقر', s.pickupEnabled !== false)}${chk('s_deliveryEnabled', 'التوصيل', s.deliveryEnabled !== false)}${f('deliveryFee', 'رسوم التوصيل الثابتة (⃁) — اتركها فارغة لتحديدها حسب المدينة', 'type="number" min="0" dir="ltr" style="text-align:right"')}`)}
    ${sec('ساعات العمل <small class="text-[11px] text-muted font-normal">بتوقيت السعودية</small>', `${DAYS.map(([d, n]) => { const x = hours[d] || {}; const closed = !!x.closed || x.open == null; return `<div class="flex items-center gap-2 text-[13px]">
        <b class="w-16 flex-none">${n}</b>
        <input type="time" class="${fieldCls} !h-10 !px-2" id="h_${d}_o" value="${toTime(closed ? null : x.open)}" ${closed ? 'disabled' : ''} aria-label="يفتح ${n}">
        <span class="text-muted">–</span>
        <input type="time" class="${fieldCls} !h-10 !px-2" id="h_${d}_c" value="${toTime(closed ? null : x.close)}" ${closed ? 'disabled' : ''} aria-label="يغلق ${n}">
        <label class="flex items-center gap-1 flex-none text-[12px]"><input type="checkbox" class="w-4 h-4 accent-[#E5484D]" id="h_${d}_x" data-act="closedDay" data-d="${d}" ${closed ? 'checked' : ''}>مغلق</label></div>`; }).join('')}${chk('s_hoursApproved', 'ساعات العمل معتمدة (تُزال ملاحظة «أولية»)', s.hoursApproved)}`)}
    ${sec('حسابات التواصل الاجتماعي', `<p class="text-[11.5px] text-muted -mt-2">اترك الحقل فارغًا ليظهر «قريبًا».</p>${f('instagram', 'إنستغرام', 'dir="ltr"')}${f('snapchat', 'سناب شات', 'dir="ltr"')}${f('tiktok', 'تيك توك', 'dir="ltr"')}${f('youtube', 'يوتيوب', 'dir="ltr"')}`)}
    ${sec('التقييم والمزايا والصيانة', `<div class="grid grid-cols-2 gap-2">${f('googleRating', 'تقييم Google الفعلي', 'type="number" step="0.1" min="0" max="5" dir="ltr" style="text-align:right"')}${f('googleRatingCount', 'عدد التقييمات', 'type="number" min="0" dir="ltr" style="text-align:right"')}</div>${f('googleUrl', 'رابط صفحة التقييمات على Google', 'dir="ltr"')}${chk('s_showLoyalty', 'إظهار برنامج الولاء (تجريبي — النقاط محلية فقط)', s.showLoyalty)}${chk('s_maintenance', 'وضع الصيانة (إيقاف المتجر مؤقتًا للزوار)', s.maintenance)}${f('maintenanceMessage', 'رسالة الصيانة')}`)}
    ${sec('أدوات البيانات', `<p class="text-[12px] text-muted leading-6">«ترقية الكتالوج» تضيف المنتجات والحقول الجديدة (الأسعار المبدئية، الخيارات، المواصفات) دون حذف أو استبدال أي قيمة موجودة.</p><button type="button" class="${BTN_S}" data-act="upgrade">${ic(I.download, 16)}ترقية الكتالوج من البيانات الأولية</button>${hasStorage ? `<button type="button" class="${BTN_S}" data-act="migrate">${ic(I.upload, 16)}نقل صور الكتالوج إلى Firebase Storage</button>` : '<p class="text-[11.5px] text-muted">فعّل Firebase Storage لنقل الصور إليه.</p>'}`)}
    <div class="lg:col-span-2 flex justify-end"><button id="setSave" class="${BTN_P} min-w-[160px] !h-12" type="submit">حفظ الإعدادات</button></div>
  </form></div>`;
};
async function saveSettings() {
  const g = (k) => $('#s_' + k).value.trim(); const c = (id) => $('#' + id).checked;
  const hours = {};
  for (const [d] of DAYS) {
    const closed = $(`#h_${d}_x`).checked; const o = fromTime($(`#h_${d}_o`).value); const cl = fromTime($(`#h_${d}_c`).value);
    if (!closed && (o == null || cl == null || cl <= o)) { toast('تحقق من ساعات العمل', 'وقت الإغلاق يجب أن يكون بعد وقت الفتح', 'info'); $(`#h_${d}_o`).focus(); return; }
    hours[d] = closed ? { closed: true } : { open: o, close: cl };
  }
  if (c('p_bank') && !g('iban')) { toast('أدخل رقم الآيبان', 'لتفعيل التحويل البنكي', 'info'); return; }
  const num = (k) => (g(k) === '' ? null : Number(g(k)));
  const data = {
    legalName: g('legalName'), storeName: g('storeName'), crNumber: g('crNumber'), vatNumber: g('vatNumber'), email: g('email'),
    phone: g('phone'), whatsapp: g('whatsapp').replace(/\D/g, ''), branchName: g('branchName'), city: g('city'), address: g('address'), mapsUrl: g('mapsUrl'),
    vatRate: Number(g('vatRate') || 0), pricesIncludeVat: c('s_pricesIncludeVat'), pricesApprovedNote: g('pricesApprovedNote'),
    payments: { cod: c('p_cod'), store: c('p_store'), bank: c('p_bank') }, bankName: g('bankName'), accountName: g('accountName'), iban: g('iban').replace(/\s/g, ''), showPaymentLogos: c('s_showPaymentLogos'),
    pickupEnabled: c('s_pickupEnabled'), deliveryEnabled: c('s_deliveryEnabled'), deliveryFee: num('deliveryFee'),
    instagram: g('instagram'), snapchat: g('snapchat'), tiktok: g('tiktok'), youtube: g('youtube'),
    googleRating: num('googleRating'), googleRatingCount: num('googleRatingCount'), googleUrl: g('googleUrl'),
    showLoyalty: c('s_showLoyalty'), maintenance: c('s_maintenance'), maintenanceMessage: g('maintenanceMessage'),
    hours, hoursApproved: c('s_hoursApproved'),
    heroSlides: Array.from({ length: 6 }, (_, i) => ({ title: $('#hs_t_' + i).value.trim(), desc: $('#hs_d_' + i).value.trim(), cta: $('#hs_c_' + i).value.trim(), link: $('#hs_l_' + i).value.trim().replace(/^#/, ''), image: $('#f_hs_i_' + i).value.trim() })).filter((x) => x.title && x.image),
    heroInterval: Number(g('heroInterval') || 4.5), ...stamp(),
  };
  const b = $('#setSave'); busy(b, true);
  try { await setDoc(doc(fb().db, 'settings', 'store'), data, { merge: true }); toast('تم حفظ الإعدادات'); }
  catch (err) { console.error(err); toast('تعذّر الحفظ', errMsg(err), 'err'); }
  busy(b, false);
}

/* ---------------------------------------------------------------- seed + upgrade */
async function importSeed(b) {
  busy(b, true, 'جارٍ الاستيراد…');
  try {
    const { db } = fb(); const batch = writeBatch(db); const ts = serverTimestamp();
    SEED_CATEGORIES.forEach(({ id, ...d }) => batch.set(doc(db, 'categories', id), { ...d, updatedAt: ts }));
    SEED_PRODUCTS.forEach(({ id, ...d }) => batch.set(doc(db, 'products', id), { ...d, updatedAt: ts }));
    SEED_PORTFOLIO.forEach(({ id, ...d }) => batch.set(doc(db, 'portfolio', id), { ...d, updatedAt: ts }));
    if (!state.settings) batch.set(doc(db, 'settings', 'store'), { ...SEED_SETTINGS, updatedAt: ts });
    await batch.commit();
    toast('تم استيراد البيانات الأولية', `${SEED_CATEGORIES.length} أقسام · ${SEED_PRODUCTS.length} منتجًا (أسعار مبدئية) · ${SEED_PORTFOLIO.length} عملًا`);
  } catch (err) { console.error(err); toast('تعذّر الاستيراد', errMsg(err), 'err'); busy(b, false); }
}
/** ترقية آمنة: تضيف الناقص فقط ولا تستبدل أي قيمة موجودة */
async function upgradeCatalog(b) {
  busy(b, true, 'جارٍ الترقية…');
  try {
    const { db } = fb(); const batch = writeBatch(db); let added = 0; let merged = 0;
    const fill = (coll, seed, existing) => {
      for (const { id, ...d } of seed) {
        const ex = existing.find((x) => x.id === id);
        if (!ex) { batch.set(doc(db, coll, id), { ...d, updatedAt: serverTimestamp() }); added++; continue; }
        const patch = {}; for (const [k, v] of Object.entries(d)) if (ex[k] === undefined) patch[k] = v;
        if (coll === 'products' && ex.price != null && ex.mode === undefined) { patch.mode = d.mode; patch.priceApproved = false; }
        if (Object.keys(patch).length) { batch.set(doc(db, coll, id), patch, { merge: true }); merged++; }
      }
    };
    fill('categories', SEED_CATEGORIES, state.categories); fill('products', SEED_PRODUCTS, state.products); fill('portfolio', SEED_PORTFOLIO, state.portfolio);
    const sp = {}; for (const [k, v] of Object.entries(SEED_SETTINGS)) if ((state.settings || {})[k] === undefined) sp[k] = v;
    if (Object.keys(sp).length) batch.set(doc(db, 'settings', 'store'), sp, { merge: true });
    await batch.commit();
    toast('تمت ترقية الكتالوج', `أُضيف ${added} · حُدّث ${merged} (دون استبدال قيم موجودة)`);
  } catch (e) { console.error(e); toast('تعذّرت الترقية', errMsg(e), 'err'); }
  busy(b, false);
}

/* ================================================================ data subscriptions */
function subscribe() {
  const { db } = fb();
  const sub = (key, q, sort) => state.unsub.push(onSnapshot(q, (snap) => {
    state[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); if (sort) state[key].sort(sort);
    state.loaded[key] = true;
    if (['orders', 'quotes', 'categories', 'messages'].includes(key)) renderAll(); else renderPanel();
  }, (err) => { console.error(key, err); state.loaded[key] = true; toast('تعذّر تحميل البيانات', `${key}: ${errMsg(err)}`, 'err'); }));
  sub('orders', query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)));
  sub('quotes', query(collection(db, 'quotes'), orderBy('createdAt', 'desc'), limit(500)));
  sub('categories', collection(db, 'categories'), byOrder);
  sub('products', collection(db, 'products'), byOrder);
  sub('portfolio', collection(db, 'portfolio'), byOrder);
  sub('promotions', collection(db, 'promotions'));
  sub('customers', collection(db, 'customers'), (a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  sub('messages', query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(300)));
  sub('pages', collection(db, 'pages'));
  state.unsub.push(onSnapshot(doc(db, 'settings', 'store'), (d) => { state.settings = d.exists() ? d.data() : null; state.loaded.settings = true; if (state.tab === 'settings') renderPanel(); }));
}
function unsubscribeAll() { state.unsub.forEach((u) => u()); state.unsub = []; state.loaded = {}; }

/* ================================================================ events */
const findOrder = (id, coll) => allOrders().find((o) => o.id === id && o.coll === coll);
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]'); if (!t) { if (e.target.id === 'modal') closeModal(); return; }
  const a = t.dataset.act;
  if (a === 'logout') { unsubscribeAll(); await signOut(fb().auth); }
  else if (a === 'reset') {
    const email = $('#lEmail')?.value.trim(); if (!email) { toast('اكتب بريدك الإلكتروني أولًا', '', 'info'); return; }
    try { await sendPasswordResetEmail(fb().auth, email); toast('أُرسل رابط إعادة التعيين', email); } catch (err) { toast('تعذّر الإرسال', errMsg(err), 'err'); }
  }
  else if (a === 'tab') { state.tab = t.dataset.t; $('#panel').innerHTML = ''; renderAll(); window.scrollTo(0, 0); }
  else if (a === 'ofilter') { state.ofilter = t.dataset.k; renderPanel(); }
  else if (a === 'otype') { state.otype = t.dataset.k; renderPanel(); }
  else if (a === 'csv') exportCsv();
  else if (a === 'popularity') recomputePopularity(t);
  else if (a === 'note') {
    const o = findOrder(t.dataset.id, t.dataset.coll); if (!o) return;
    const patch = { customerMessage: $('#cm-' + o.id).value.trim() };
    patch[o.type === 'purchase' ? 'adminNotes' : 'notes'] = $('#note-' + o.id).value.trim();
    if (o.type === 'purchase') { delete patch.adminNotes; patch.notes = undefined; }
    const qa = $('#qa-' + o.id); if (qa) { const v = qa.value.trim(); if (v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0)) { toast('قيمة العرض غير صحيحة', '', 'err'); return; } patch.quotedAmount = v === '' ? null : Number(v); }
    const adminNote = $('#note-' + o.id).value.trim();
    const final = { customerMessage: patch.customerMessage, adminNotes: adminNote }; if ('quotedAmount' in patch) final.quotedAmount = patch.quotedAmount;
    busy(t, true, '…');
    try { await updateOrder(o, final, patch.quotedAmount != null && o.status === 'new' ? null : null); toast('تم الحفظ', o.ref); }
    catch (err) { toast('تعذّر الحفظ', errMsg(err), 'err'); }
    busy(t, false);
  }
  else if (a === 'new') editForm(t.dataset.c);
  else if (a === 'edit') editForm(t.dataset.c, t.dataset.id);
  else if (a === 'del') confirmDel(t.dataset.c, t.dataset.id);
  else if (a === 'delYes') {
    try { await deleteDoc(doc(fb().db, t.dataset.c, t.dataset.id)); closeModal(); toast('تم الحذف'); }
    catch (err) { toast('تعذّر الحذف', errMsg(err), 'err'); }
  }
  else if (a === 'close') closeModal();
  else if (a === 'seed') importSeed(t);
  else if (a === 'upgrade') upgradeCatalog(t);
  else if (a === 'migrate') migrateImages(t);
  else if (a === 'saverow') saveRow(t.dataset.id, t);
  else if (a === 'bulkdisc') bulk('disc', t);
  else if (a === 'bulkundisc') bulk('undisc', t);
  else if (a === 'bulkapprove') bulk('approve', t);
  else if (a === 'editpage') editPage(t.dataset.id);
  else if (a === 'msgdone') { try { await updateDoc(doc(fb().db, 'messages', t.dataset.id), { status: t.dataset.s, ...stamp() }); } catch (err) { toast('تعذّر التحديث', errMsg(err), 'err'); } }
  else if (a === 'dl') {
    if (!fb().storage) { toast('Firebase Storage غير مفعّل', '', 'err'); return; }
    try { window.open(await getDownloadURL(sRef(fb().storage, t.dataset.path)), '_blank', 'noopener'); } catch (err) { toast('تعذّر فتح الملف', errMsg(err), 'err'); }
  }
  else if (a === 'closedDay') { const d = t.dataset.d; $(`#h_${d}_o`).disabled = t.checked; $(`#h_${d}_c`).disabled = t.checked; if (!t.checked && !$(`#h_${d}_o`).value) { $(`#h_${d}_o`).value = '08:00'; $(`#h_${d}_c`).value = '23:00'; } }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset?.act === 'status') {
    const o = findOrder(t.dataset.id, t.dataset.coll); if (!o) return;
    try { await updateOrder(o, { status: t.value }, t.value); toast('تم تحديث حالة الطلب', `${o.ref} · ${ST[t.value].t}`); }
    catch (err) { toast('تعذّر التحديث', errMsg(err), 'err'); }
  }
  else if (t.dataset?.act === 'pcat') { state.pcat = t.value; $('#panel').querySelector('[data-keep]')?.removeAttribute('data-keep'); renderPanel(); }
  else if (t.dataset?.up) uploadImage(t);
});
document.addEventListener('input', (e) => { if (e.target.id === 'oSearch') { state.oq = e.target.value; renderPanel(); } });
document.addEventListener('submit', (e) => { if (e.target.id === 'setForm') { e.preventDefault(); saveSettings(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ================================================================ boot */
if (!isConfigured) screenNotConfigured();
else {
  onAuthStateChanged(fb().auth, async (user) => {
    unsubscribeAll(); state.user = user; $('#root').className = 'min-h-screen grid place-items-center';
    if (!user || user.isAnonymous) { screenLogin(); return; }
    try {
      const adm = await getDoc(doc(fb().db, 'admin_users', user.uid));
      if (!adm.exists()) { screenNotAdmin(user); return; }
    } catch (err) { console.error(err); screenNotAdmin(user); return; }
    $('#root').innerHTML = ''; renderAll(); subscribe();
  });
}
