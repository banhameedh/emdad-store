/* لوحة تحكم المتجر: الطلبات، المنتجات، الأقسام، معرض الأعمال، الإعدادات */
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import {
  collection, doc, getDoc, onSnapshot, query, orderBy, limit, addDoc, setDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fb, isConfigured, hasStorage } from './fb.js';
import { $, $$, esc, imgSrc, fmtNum, fmtPrice, ic, P, WA } from '../lib/ui.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_PORTFOLIO, SEED_SETTINGS } from '../lib/seed.js';

const I = {
  ...P,
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/><path d="M13.5 7.5l3 3"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5L18 7M9 7V4.5h6V7"/>',
  logout: '<path d="M14 4.5h4a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 16v2a2 2 0 002 2h11a2 2 0 002-2v-2"/>',
  box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 000 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
  ext: '<path d="M14 4.5h5.5V10M19.5 4.5L11 13"/><path d="M18 14v4a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 015 18V8a1.5 1.5 0 011.5-1.5h4"/>',
};

const STATUS = [
  ['new', 'جديد', 'bg-orange text-white'],
  ['contacted', 'تم التواصل', 'bg-primary text-white'],
  ['quoted', 'أُرسل العرض', 'bg-brand text-white'],
  ['in_progress', 'قيد التنفيذ', 'bg-deep text-white'],
  ['done', 'مكتمل', 'bg-[#12A150] text-white'],
  ['cancelled', 'ملغي', 'bg-[#8A9DB0] text-white'],
];
const STATUS_OF = Object.fromEntries(STATUS.map(([k, t, c]) => [k, { t, c }]));
const DAYS = [[6, 'السبت'], [0, 'الأحد'], [1, 'الاثنين'], [2, 'الثلاثاء'], [3, 'الأربعاء'], [4, 'الخميس'], [5, 'الجمعة']];
const TABS = [['orders', 'الطلبات', I.box], ['products', 'المنتجات', I.layers], ['categories', 'الأقسام', I.image], ['portfolio', 'معرض الأعمال', I.eye], ['settings', 'الإعدادات', I.cog]];

const state = {
  user: null, tab: 'orders',
  orders: [], categories: [], products: [], portfolio: [], settings: null,
  loaded: {}, ofilter: 'all', oq: '', pcat: 'all', unsub: [],
};
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);
const catName = (id) => state.categories.find((c) => c.id === id)?.name || (id === 'other' ? 'مشروع متكامل / استفسار آخر' : id);
const fmtDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null; if (!d) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }).format(d);
};

/* ================================================================ ui helpers */
let toastT;
function toast(title, sub = '', kind = 'ok') {
  const el = $('#toast');
  const color = kind === 'err' ? 'bg-[#E5484D]' : kind === 'info' ? 'bg-primary' : 'bg-orange';
  el.innerHTML = `<div class="bg-deep text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lift"><span class="flex-none w-8 h-8 rounded-full ${color} grid place-items-center">${ic(kind === 'ok' ? I.check : I.info, 16, '#fff', 2.6)}</span><div class="min-w-0"><b class="block text-[14px]">${esc(title)}</b>${sub ? `<span class="block text-[12px] opacity-80">${esc(sub)}</span>` : ''}</div></div>`;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
}
const btn = (cls = '') => `press h-10 px-4 rounded-xl text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 ${cls}`;
const BTN_P = btn('bg-deep text-white');
const BTN_S = btn('bg-white hair text-deep');
const BTN_O = btn('bg-orange text-white');
const fieldCls = 'field !h-11 !text-[14px]';
const errMsg = (e) => {
  const c = e?.code || '';
  if (c.includes('permission-denied')) return 'لا تملك صلاحية تنفيذ هذا الإجراء';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (c.includes('too-many-requests')) return 'محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة';
  if (c.includes('network')) return 'تحقق من الاتصال بالإنترنت';
  return e?.message || 'حدث خطأ غير متوقع';
};

/* ================================================================ screens */
function screenNotConfigured() {
  $('#root').innerHTML = `<div class="max-w-lg mx-auto p-6 text-center">
    <img src="assets/logo/logo-color.svg" alt="الإمدادات" class="w-56 mx-auto mb-6">
    <h1 class="text-[22px] font-extrabold text-deep">لم يتم ربط Firebase بعد</h1>
    <p class="text-muted mt-2 leading-7 text-[14px]">أدخل إعدادات مشروعك في ملف <code dir="ltr" class="bg-white hair rounded px-1.5">firebase-config.js</code> ثم أعد تحميل الصفحة. التفاصيل في ملف README.</p>
  </div>`;
}

function screenLogin(msg = '') {
  $('#root').innerHTML = `<form id="loginForm" class="w-full max-w-[380px] mx-auto p-5" novalidate>
    <img src="assets/logo/logo-color.svg" alt="الإمدادات الذكية الحديثة" class="w-56 mx-auto mb-6">
    <div class="bg-white hair rounded-[24px] shadow-soft p-5">
      <h1 class="text-[20px] font-extrabold text-deep">لوحة التحكم</h1>
      <p class="text-[12.5px] text-muted mb-3">سجّل الدخول بحساب المشرف لإدارة الطلبات والمنتجات.</p>
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
    <p class="text-muted mt-2 leading-7 text-[14px]">لتفعيل الصلاحية، أنشئ مستندًا في مجموعة <code dir="ltr">admins</code> في Firestore معرّفه هو:</p>
    <div class="mt-3 bg-white hair rounded-xl px-3 py-2 font-mono text-[13px] select-all" dir="ltr">${esc(user.uid)}</div>
    <button class="${BTN_S} mt-5" data-act="logout">${ic(I.logout, 16)}تسجيل الخروج</button>
  </div>`;
}

function shell() {
  const newCount = state.orders.filter((o) => o.status === 'new').length;
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
      ${TABS.map(([k, t, d]) => `<button class="relative h-11 px-3.5 text-[13.5px] whitespace-nowrap flex items-center gap-1.5 ${state.tab === k ? 'text-deep font-extrabold' : 'text-muted'}" data-act="tab" data-t="${k}">${ic(d, 16, 'currentColor', 1.9)}${t}${k === 'orders' && newCount ? `<span class="min-w-[20px] h-5 px-1.5 rounded-full bg-orange text-white text-[11px] font-bold grid place-items-center">${newCount}</span>` : ''}${state.tab === k ? '<i class="absolute bottom-0 inset-x-2 h-[3px] rounded-t bg-orange"></i>' : ''}</button>`).join('')}
    </nav>
  </header>
  <main id="panel" class="max-w-6xl mx-auto px-4 py-5 pb-16"></main>`;
}

function renderAll() {
  if (!$('#panel')) { $('#root').className = ''; $('#root').innerHTML = shell(); }
  else { const h = document.createElement('div'); h.innerHTML = shell(); $('#root header').replaceWith(h.querySelector('header')); }
  renderPanel();
}

function renderPanel() {
  const p = $('#panel'); if (!p) return;
  const focused = document.activeElement?.id; const pos = document.activeElement?.selectionStart;
  if (state.tab === 'orders') p.innerHTML = vOrders();
  if (state.tab === 'products') p.innerHTML = vProducts();
  if (state.tab === 'categories') p.innerHTML = vCategories();
  if (state.tab === 'portfolio') p.innerHTML = vPortfolio();
  if (state.tab === 'settings') { if (!$('#setForm')) p.innerHTML = vSettings(); }
  if (focused && $('#' + focused) && $('#' + focused).tagName === 'INPUT') { const f = $('#' + focused); f.focus(); try { f.setSelectionRange(pos, pos); } catch { /* not text */ } }
}

const emptyDbBanner = () => state.loaded.categories && !state.categories.length ? `
  <div class="mb-4 flex flex-wrap items-center gap-3 bg-[#FFF3E3] border border-orange/30 rounded-2xl p-4">
    <span class="w-10 h-10 rounded-xl bg-white grid place-items-center flex-none">${ic(I.info, 20, '#F7941E')}</span>
    <div class="flex-1 min-w-[200px]"><b class="block text-[14px]">قاعدة البيانات فارغة</b><span class="block text-[12px] text-muted">استورد الأقسام والمنتجات ومعرض الأعمال والإعدادات من تصميم المتجر لتبدأ مباشرة، ثم عدّلها كما تريد.</span></div>
    <button class="${BTN_O}" data-act="seed">${ic(I.download, 16, '#fff')}استيراد البيانات الأولية</button>
  </div>` : '';

const loading = () => `<div class="py-16 grid place-items-center"><svg class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#075A9F" stroke-width="2.4"><path d="M21 12a9 9 0 11-6.2-8.6" stroke-linecap="round"/></svg></div>`;

/* ---------------------------------------------------------------- orders */
function vOrders() {
  if (!state.loaded.orders) return loading();
  const q = state.oq.trim();
  const list = state.orders.filter((o) => (state.ofilter === 'all' || o.status === state.ofilter)
    && (!q || [o.ref, o.name, o.phone, o.email, o.description].some((v) => String(v || '').includes(q))));
  const count = (k) => state.orders.filter((o) => o.status === k).length;
  return `${emptyDbBanner()}
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <h2 class="text-[20px] font-extrabold text-deep flex-1">طلبات عروض الأسعار <small class="text-[12px] text-muted font-normal">· ${fmtNum(state.orders.length)}</small></h2>
    <button class="${BTN_S}" data-act="csv">${ic(I.download, 16)}تصدير CSV</button>
  </div>
  <label class="h-11 rounded-2xl bg-white hair flex items-center gap-2.5 px-3.5">${ic(I.search, 17, '#6B8299')}
    <input id="oSearch" class="flex-1 bg-transparent outline-none text-[14px]" placeholder="ابحث برقم الطلب أو الاسم أو الجوال…" value="${esc(state.oq)}"></label>
  <div class="no-sb flex gap-2 overflow-x-auto my-3">
    <button class="chip press ${state.ofilter === 'all' ? 'on' : ''}" data-act="ofilter" data-k="all">الكل (${state.orders.length})</button>
    ${STATUS.map(([k, t]) => `<button class="chip press ${state.ofilter === k ? 'on' : ''}" data-act="ofilter" data-k="${k}">${t} (${count(k)})</button>`).join('')}
  </div>
  <div class="grid gap-3 md:grid-cols-2">${list.map(orderCard).join('') || `<p class="md:col-span-2 text-center text-muted text-[13px] py-14">لا توجد طلبات${q || state.ofilter !== 'all' ? ' مطابقة' : ' بعد'}.</p>`}</div>`;
}
function orderCard(o) {
  const st = STATUS_OF[o.status] || STATUS_OF.new;
  const intl = '966' + String(o.phone || '').replace(/^0/, '');
  const wa = `https://wa.me/${intl}?text=${encodeURIComponent(`مرحبًا ${o.name}، معك الإمدادات الذكية الحديثة بخصوص طلبك رقم ${o.ref}.`)}`;
  return `<article class="bg-white hair rounded-[20px] p-4 shadow-soft" data-order="${esc(o.id)}">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0"><b class="block text-[16px] font-extrabold tracking-wide" dir="ltr" style="text-align:right">${esc(o.ref)}</b><span class="block text-[11.5px] text-muted">${fmtDate(o.createdAt)}</span></div>
      <span class="flex-none text-[11.5px] font-bold rounded-lg px-2.5 py-1 ${st.c}">${st.t}</span>
    </div>
    <div class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
      <span class="text-muted">العميل</span><b>${esc(o.name)}</b>
      <span class="text-muted">الجوال</span><a class="text-deep font-bold" href="tel:${esc(o.phone)}" dir="ltr" style="text-align:right">${esc(o.phone)}</a>
      ${o.email ? `<span class="text-muted">البريد</span><a class="text-deep truncate" href="mailto:${esc(o.email)}" dir="ltr" style="text-align:right">${esc(o.email)}</a>` : ''}
      <span class="text-muted">الخدمة</span><span>${esc(o.serviceName || catName(o.serviceId))}</span>
    </div>
    ${o.items?.length ? `<div class="flex flex-wrap gap-1.5 mt-2.5">${o.items.map((i) => `<span class="h-7 px-2.5 rounded-lg bg-tint text-[11.5px] flex items-center">${esc(i.name)}</span>`).join('')}</div>` : ''}
    <p class="mt-2.5 text-[13px] text-[#3E5873] leading-7 bg-surface rounded-xl px-3 py-2 whitespace-pre-line">${esc(o.description)}</p>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <select class="field !h-10 !w-auto !text-[13px] !rounded-xl" data-act="status" data-id="${esc(o.id)}" aria-label="حالة الطلب">${STATUS.map(([k, t]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <a class="${BTN_S} !h-10" href="${esc(wa)}" target="_blank" rel="noopener">${WA(17)}واتساب</a>
      <a class="${BTN_S} !h-10" href="tel:${esc(o.phone)}">${ic(I.phone, 15)}اتصال</a>
    </div>
    <div class="mt-2 flex gap-2">
      <input class="${fieldCls} !h-10 !text-[13px]" id="note-${esc(o.id)}" placeholder="ملاحظة داخلية (لا تظهر للعميل)" value="${esc(o.notes || '')}" maxlength="500">
      <button class="${BTN_P} !h-10 flex-none" data-act="note" data-id="${esc(o.id)}">حفظ</button>
    </div>
  </article>`;
}
function exportCsv() {
  const rows = [['رقم الطلب', 'التاريخ', 'الحالة', 'الاسم', 'الجوال', 'البريد', 'الخدمة', 'المنتجات', 'الوصف', 'ملاحظات']];
  state.orders.forEach((o) => rows.push([o.ref, fmtDate(o.createdAt), STATUS_OF[o.status]?.t || o.status, o.name, o.phone, o.email || '', o.serviceName || catName(o.serviceId), (o.items || []).map((i) => i.name).join(' | '), o.description, o.notes || '']));
  const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `emdad-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------------------------------------------------------------- catalog lists */
const activeBadge = (a) => a === false ? '<span class="text-[11px] font-bold text-[#B4232A] bg-[#FDECEC] rounded-lg px-2 py-0.5">مخفي</span>' : '<span class="text-[11px] font-bold text-[#12804A] bg-[#E6F6EE] rounded-lg px-2 py-0.5">ظاهر</span>';
const rowActions = (coll, id) => `<button class="w-9 h-9 rounded-xl bg-tint grid place-items-center" data-act="edit" data-c="${coll}" data-id="${esc(id)}" aria-label="تعديل">${ic(I.edit, 16)}</button>
  <button class="w-9 h-9 rounded-xl bg-[#FDECEC] grid place-items-center" data-act="del" data-c="${coll}" data-id="${esc(id)}" aria-label="حذف">${ic(I.trash, 16, '#B4232A')}</button>`;
const listHead = (title, n, coll, extra = '') => `${emptyDbBanner()}
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <h2 class="text-[20px] font-extrabold text-deep flex-1">${title} <small class="text-[12px] text-muted font-normal">· ${n}</small></h2>${extra}
    <button class="${BTN_P}" data-act="new" data-c="${coll}">${ic(I.plus, 16, '#fff', 2.4)}إضافة</button>
  </div>`;

function vProducts() {
  if (!state.loaded.products || !state.loaded.categories) return loading();
  const corder = (id) => state.categories.find((c) => c.id === id)?.order ?? 999;
  const list = state.products.filter((p) => state.pcat === 'all' || p.categoryId === state.pcat)
    .sort((a, b) => corder(a.categoryId) - corder(b.categoryId) || byOrder(a, b));
  return `${listHead('المنتجات', list.length, 'products', `<select class="field !h-10 !w-auto !text-[13px] !rounded-xl" data-act="pcat" aria-label="تصفية حسب القسم"><option value="all">كل الأقسام</option>${state.categories.map((c) => `<option value="${esc(c.id)}" ${state.pcat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}
  <div class="grid gap-2">${list.map((p) => `<div class="flex items-center gap-3 bg-white hair rounded-[18px] p-2 pl-3">
      <img src="${imgSrc(p.image)}" alt="" class="w-16 h-16 rounded-[14px] object-cover flex-none bg-tint" loading="lazy">
      <div class="flex-1 min-w-0"><b class="block text-[14px] truncate">${esc(p.name)}</b><span class="block text-[12px] text-muted truncate">${esc(catName(p.categoryId))} · ${esc(p.desc || '')}</span>
        <span class="flex items-center gap-2 mt-1">${activeBadge(p.active)}<span class="text-[11.5px] text-deep">${fmtPrice(p.price) || 'السعر عند الطلب'}</span><span class="text-[11px] text-muted">ترتيب ${p.order ?? '—'}</span></span></div>
      ${rowActions('products', p.id)}</div>`).join('') || '<p class="text-center text-muted text-[13px] py-14">لا توجد منتجات.</p>'}</div>`;
}
function vCategories() {
  if (!state.loaded.categories) return loading();
  return `${listHead('الأقسام', state.categories.length, 'categories')}
  <div class="grid gap-2 sm:grid-cols-2">${state.categories.map((c) => `<div class="flex items-center gap-3 bg-white hair rounded-[18px] p-2 pl-3">
      <img src="${imgSrc(c.image)}" alt="" class="w-16 h-16 rounded-[14px] object-cover flex-none bg-tint" loading="lazy">
      <div class="flex-1 min-w-0"><b class="block text-[14px] truncate">${esc(c.name)}</b><span class="block text-[12px] text-muted truncate">${(c.items || []).length} خدمة · ${state.products.filter((p) => p.categoryId === c.id).length} منتج</span>
        <span class="flex items-center gap-2 mt-1">${activeBadge(c.active)}<span class="text-[11px] text-muted">ترتيب ${c.order ?? '—'}</span></span></div>
      ${rowActions('categories', c.id)}</div>`).join('')}</div>`;
}
function vPortfolio() {
  if (!state.loaded.portfolio) return loading();
  return `${listHead('معرض الأعمال', state.portfolio.length, 'portfolio')}
  <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">${state.portfolio.map((p) => `<div class="bg-white hair rounded-[18px] overflow-hidden">
      <img src="${imgSrc(p.image)}" alt="" class="w-full h-32 object-cover bg-tint" loading="lazy">
      <div class="p-2.5"><b class="block text-[13px] truncate">${esc(p.title)}</b><span class="block text-[11.5px] text-muted truncate">${esc(p.group || '')}</span>
        <div class="flex items-center gap-1.5 mt-2">${activeBadge(p.active)}<span class="flex-1"></span>${rowActions('portfolio', p.id)}</div></div></div>`).join('')}</div>`;
}

/* ---------------------------------------------------------------- forms */
const SCHEMA = {
  products: () => [
    ['name', 'اسم المنتج', 'text', { required: true, max: 120 }],
    ['categoryId', 'القسم', 'select', { required: true, options: state.categories.map((c) => [c.id, c.name]) }],
    ['desc', 'وصف مختصر', 'text', { max: 160, hint: 'مثال: ستيل / أكريلك · إضاءة LED' }],
    ['image', 'الصورة', 'image', { required: true }],
    ['price', 'السعر يبدأ من (ر.س)', 'price', { hint: 'اتركه فارغًا ليظهر «السعر عند الطلب»' }],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'ظاهر في المتجر', 'bool', {}],
  ],
  categories: () => [
    ['name', 'اسم القسم', 'text', { required: true, max: 120 }],
    ['short', 'الاسم المختصر للبطاقة', 'textarea', { max: 60, rows: 2, hint: 'سطران كحد أقصى، مثال: لوحات ⏎ وواجهات' }],
    ['tag', 'العبارة التسويقية', 'text', { max: 120 }],
    ['desc', 'الوصف', 'textarea', { max: 600, rows: 3 }],
    ['image', 'صورة القسم', 'image', { required: true }],
    ['items', 'الخدمات (سطر لكل خدمة)', 'lines', { rows: 6 }],
    ['works', 'صور من معرض الأعمال (رابط في كل سطر)', 'lines', { rows: 3 }],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'ظاهر في المتجر', 'bool', {}],
  ],
  portfolio: () => [
    ['title', 'العنوان', 'text', { required: true, max: 120 }],
    ['desc', 'وصف قصير', 'text', { max: 160 }],
    ['group', 'التصنيف (يظهر كفلتر)', 'text', { required: true, max: 60, list: [...new Set(state.portfolio.map((p) => p.group).filter(Boolean))] }],
    ['image', 'الصورة', 'image', { required: true }],
    ['height', 'ارتفاع البطاقة (110–260)', 'number', {}],
    ['order', 'الترتيب', 'number', {}],
    ['active', 'ظاهر في المتجر', 'bool', {}],
  ],
};
const TITLES = { products: 'منتج', categories: 'قسم', portfolio: 'عمل' };

function fieldHtml([k, label, type, o], v) {
  const id = 'f_' + k; const req = o.required ? ' <b class="text-orange">*</b>' : '';
  const hint = o.hint ? `<span class="block text-[11px] text-muted mt-1">${esc(o.hint)}</span>` : '';
  const lab = `<label class="block text-[12.5px] font-bold mb-1.5" for="${id}">${label}${req}</label>`;
  if (type === 'bool') return `<label class="flex items-center gap-2 text-[13.5px] font-bold"><input id="${id}" type="checkbox" class="w-5 h-5 accent-[#075A9F]" ${v !== false ? 'checked' : ''}>${label}</label>`;
  if (type === 'select') return `<div>${lab}<select id="${id}" class="${fieldCls}">${o.options.map(([val, t]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${hint}</div>`;
  if (type === 'textarea' || type === 'lines') return `<div>${lab}<textarea id="${id}" class="field !text-[14px]" style="height:${(o.rows || 3) * 28 + 20}px" ${o.max ? `maxlength="${o.max}"` : ''}>${esc(type === 'lines' ? (v || []).join('\n') : v || '')}</textarea>${hint}</div>`;
  if (type === 'number' || type === 'price') return `<div>${lab}<input id="${id}" type="number" inputmode="decimal" min="0" step="any" class="${fieldCls}" dir="ltr" style="text-align:right" value="${v ?? ''}">${hint}</div>`;
  if (type === 'image') return `<div>${lab}<div class="flex gap-2 items-start">
      <img id="${id}_pv" src="${imgSrc(v)}" alt="" class="w-20 h-20 rounded-xl object-cover bg-tint flex-none">
      <div class="flex-1 min-w-0"><input id="${id}" class="${fieldCls}" dir="ltr" placeholder="https://… أو assets/images/…" value="${esc(v || '')}">
      ${hasStorage ? `<label class="${BTN_S} !h-9 mt-2 cursor-pointer">${ic(I.upload, 15)}رفع صورة<input type="file" accept="image/*" class="hidden" data-up="${id}"></label>` : '<span class="block text-[11px] text-muted mt-1">ضع رابط الصورة (فعّل Firebase Storage لرفع الصور مباشرة).</span>'}</div></div></div>`;
  return `<div>${lab}<input id="${id}" class="${fieldCls}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.list ? `list="${id}_dl"` : ''} value="${esc(v ?? '')}">${o.list ? `<datalist id="${id}_dl">${o.list.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>` : ''}${hint}</div>`;
}
function readForm(schema) {
  const out = {}; let bad = null;
  for (const [k, , type, o] of schema) {
    const el = $('#f_' + k); let v;
    if (type === 'bool') v = el.checked;
    else if (type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (type === 'price') v = el.value === '' ? null : Math.max(0, Number(el.value));
    else if (type === 'lines') v = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
    else v = el.value.trim();
    const empty = v === '' || v === null || (Array.isArray(v) && !v.length);
    el.classList.toggle('err', !!o.required && empty);
    if (o.required && empty && !bad) bad = el;
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
  const defaults = { active: true, order: (state[coll].reduce((m, x) => Math.max(m, x.order || 0), 0) + 1), categoryId: state.pcat !== 'all' ? state.pcat : state.categories[0]?.id, height: 160 };
  const data = item || defaults;
  const schema = SCHEMA[coll]();
  openModal(`<form id="editForm" class="w-full max-w-[560px] my-6 bg-surface rounded-[26px] shadow-lift" novalidate>
    <div class="flex items-center justify-between px-5 pt-4 pb-2"><b class="text-[18px] font-extrabold text-deep">${item ? 'تعديل' : 'إضافة'} ${TITLES[coll]}</b>
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
    const b = $('#saveBtn'); b.disabled = true; b.textContent = 'جارٍ الحفظ…';
    try {
      const { db } = fb(); const payload = { ...v, updatedAt: serverTimestamp() };
      if (item) await setDoc(doc(db, coll, item.id), payload, { merge: true });
      else await addDoc(collection(db, coll), payload);
      closeModal(); toast('تم الحفظ', v.name || v.title || '');
    } catch (err) { console.error(err); b.disabled = false; b.textContent = 'حفظ'; toast('تعذّر الحفظ', errMsg(err), 'err'); }
  });
}

async function uploadImage(input) {
  const file = input.files?.[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { toast('الملف ليس صورة', '', 'err'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('حجم الصورة كبير', 'الحد الأقصى 5 ميجابايت', 'err'); return; }
  const target = $('#' + input.dataset.up); const label = input.closest('label');
  label.classList.add('opacity-60', 'pointer-events-none');
  try {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
    const r = sRef(fb().storage, `catalog/${Date.now()}-${safe}`);
    await uploadBytes(r, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
    target.value = await getDownloadURL(r); $('#' + target.id + '_pv').src = target.value; target.classList.remove('err');
    toast('تم رفع الصورة');
  } catch (err) { console.error(err); toast('تعذّر رفع الصورة', errMsg(err), 'err'); }
  label.classList.remove('opacity-60', 'pointer-events-none');
}

function confirmDel(coll, id) {
  const item = state[coll].find((x) => x.id === id); if (!item) return;
  if (coll === 'categories' && state.products.some((p) => p.categoryId === id)) {
    toast('لا يمكن حذف قسم يحتوي على منتجات', 'انقل المنتجات أو احذفها أولًا، أو أخفِ القسم بدلًا من حذفه', 'info'); return;
  }
  openModal(`<div class="w-full max-w-[400px] my-6 bg-surface rounded-[24px] shadow-lift p-5 text-center">
    <span class="mx-auto w-14 h-14 rounded-full bg-[#FDECEC] grid place-items-center">${ic(I.trash, 24, '#B4232A')}</span>
    <b class="block text-[17px] font-extrabold mt-3">حذف «${esc(item.name || item.title)}»؟</b>
    <p class="text-[12.5px] text-muted mt-1">لا يمكن التراجع عن الحذف. لإخفائه مؤقتًا عدّله وألغِ «ظاهر في المتجر».</p>
    <div class="flex gap-2 mt-4"><button class="${BTN_S} flex-1" data-act="close">إلغاء</button><button class="${btn('bg-[#E5484D] text-white')} flex-1" data-act="delYes" data-c="${coll}" data-id="${esc(id)}">حذف</button></div>
  </div>`);
}

/* ---------------------------------------------------------------- settings */
const toTime = (h) => h == null ? '' : `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const fromTime = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h + m / 60; };
function vSettings() {
  if (!state.loaded.settings) return loading();
  const s = { ...SEED_SETTINGS, ...(state.settings || {}) }; const hours = { ...SEED_SETTINGS.hours, ...(s.hours || {}) };
  const f = (k, label, attrs = '') => `<div><label class="block text-[12.5px] font-bold mb-1.5" for="s_${k}">${label}</label><input id="s_${k}" class="${fieldCls}" value="${esc(s[k] ?? '')}" ${attrs}></div>`;
  return `${emptyDbBanner()}
  <form id="setForm" class="grid gap-4 lg:grid-cols-2" novalidate>
    <section class="bg-white hair rounded-[22px] p-4 grid gap-3 content-start">
      <h2 class="text-[16px] font-extrabold text-deep">بيانات التواصل والموقع</h2>
      ${f('phone', 'رقم الهاتف', 'dir="ltr" style="text-align:right"')}
      ${f('whatsapp', 'رقم واتساب (بالصيغة الدولية بدون +)', 'dir="ltr" style="text-align:right" placeholder="9665XXXXXXXX"')}
      ${f('branchName', 'اسم الفرع')}
      ${f('city', 'المدينة (تظهر في الرئيسية)')}
      ${f('address', 'العنوان')}
      ${f('mapsUrl', 'رابط خرائط Google', 'dir="ltr"')}
    </section>
    <section class="bg-white hair rounded-[22px] p-4 grid gap-3 content-start">
      <h2 class="text-[16px] font-extrabold text-deep">ساعات العمل <small class="text-[11px] text-muted font-normal">بتوقيت السعودية</small></h2>
      ${DAYS.map(([d, n]) => { const x = hours[d] || {}; const closed = !!x.closed || x.open == null; return `<div class="flex items-center gap-2 text-[13px]">
        <b class="w-16 flex-none">${n}</b>
        <input type="time" class="${fieldCls} !h-10 !px-2" id="h_${d}_o" value="${toTime(closed ? null : x.open)}" ${closed ? 'disabled' : ''} aria-label="يفتح ${n}">
        <span class="text-muted">–</span>
        <input type="time" class="${fieldCls} !h-10 !px-2" id="h_${d}_c" value="${toTime(closed ? null : x.close)}" ${closed ? 'disabled' : ''} aria-label="يغلق ${n}">
        <label class="flex items-center gap-1 flex-none text-[12px]"><input type="checkbox" class="w-4 h-4 accent-[#E5484D]" id="h_${d}_x" data-act="closedDay" data-d="${d}" ${closed ? 'checked' : ''}>مغلق</label></div>`; }).join('')}
    </section>
    <section class="bg-white hair rounded-[22px] p-4 grid gap-3 content-start">
      <h2 class="text-[16px] font-extrabold text-deep">حسابات التواصل الاجتماعي</h2>
      <p class="text-[11.5px] text-muted -mt-2">اترك الحقل فارغًا ليظهر «قريبًا».</p>
      ${f('instagram', 'إنستغرام', 'dir="ltr"')}${f('snapchat', 'سناب شات', 'dir="ltr"')}${f('tiktok', 'تيك توك', 'dir="ltr"')}${f('youtube', 'يوتيوب', 'dir="ltr"')}
    </section>
    <section class="bg-white hair rounded-[22px] p-4 grid gap-3 content-start">
      <h2 class="text-[16px] font-extrabold text-deep">التقييم والمزايا</h2>
      <div class="grid grid-cols-2 gap-2">${f('googleRating', 'تقييم Google', 'type="number" step="0.1" min="0" max="5" dir="ltr" style="text-align:right"')}${f('googleRatingCount', 'عدد التقييمات', 'type="number" min="0" dir="ltr" style="text-align:right"')}</div>
      ${f('googleUrl', 'رابط صفحة التقييمات على Google', 'dir="ltr"')}
      <label class="flex items-center gap-2 text-[13.5px] font-bold"><input id="s_showLoyalty" type="checkbox" class="w-5 h-5 accent-[#075A9F]" ${s.showLoyalty !== false ? 'checked' : ''}>إظهار برنامج الولاء في المتجر</label>
    </section>
    <div class="lg:col-span-2 flex justify-end"><button id="setSave" class="${BTN_P} min-w-[160px] !h-12" type="submit">حفظ الإعدادات</button></div>
  </form>`;
}
async function saveSettings() {
  const g = (k) => $('#s_' + k).value.trim();
  const hours = {};
  for (const [d] of DAYS) {
    const closed = $(`#h_${d}_x`).checked; const o = fromTime($(`#h_${d}_o`).value); const c = fromTime($(`#h_${d}_c`).value);
    if (!closed && (o == null || c == null || c <= o)) { toast('تحقق من ساعات العمل', 'وقت الإغلاق يجب أن يكون بعد وقت الفتح', 'info'); $(`#h_${d}_o`).focus(); return; }
    hours[d] = closed ? { closed: true } : { open: o, close: c };
  }
  const data = {
    phone: g('phone'), whatsapp: g('whatsapp').replace(/\D/g, ''), branchName: g('branchName'), city: g('city'), address: g('address'), mapsUrl: g('mapsUrl'),
    instagram: g('instagram'), snapchat: g('snapchat'), tiktok: g('tiktok'), youtube: g('youtube'),
    googleRating: Number(g('googleRating') || 0), googleRatingCount: Number(g('googleRatingCount') || 0), googleUrl: g('googleUrl'),
    showLoyalty: $('#s_showLoyalty').checked, hours, updatedAt: serverTimestamp(),
  };
  const b = $('#setSave'); b.disabled = true; b.textContent = 'جارٍ الحفظ…';
  try { await setDoc(doc(fb().db, 'settings', 'store'), data); toast('تم حفظ الإعدادات'); }
  catch (err) { console.error(err); toast('تعذّر الحفظ', errMsg(err), 'err'); }
  b.disabled = false; b.textContent = 'حفظ الإعدادات';
}

/* ---------------------------------------------------------------- seed */
async function importSeed(b) {
  b.disabled = true; b.textContent = 'جارٍ الاستيراد…';
  try {
    const { db } = fb(); const batch = writeBatch(db); const ts = serverTimestamp();
    SEED_CATEGORIES.forEach(({ id, ...d }) => batch.set(doc(db, 'categories', id), { ...d, updatedAt: ts }));
    SEED_PRODUCTS.forEach(({ id, ...d }) => batch.set(doc(db, 'products', id), { ...d, updatedAt: ts }));
    SEED_PORTFOLIO.forEach(({ id, ...d }) => batch.set(doc(db, 'portfolio', id), { ...d, updatedAt: ts }));
    if (!state.settings) batch.set(doc(db, 'settings', 'store'), { ...SEED_SETTINGS, updatedAt: ts });
    await batch.commit();
    toast('تم استيراد البيانات الأولية', `${SEED_CATEGORIES.length} أقسام · ${SEED_PRODUCTS.length} منتجًا · ${SEED_PORTFOLIO.length} عملًا`);
  } catch (err) { console.error(err); toast('تعذّر الاستيراد', errMsg(err), 'err'); b.disabled = false; }
}

/* ================================================================ data subscriptions */
function subscribe() {
  const { db } = fb();
  const sub = (key, q, sort) => state.unsub.push(onSnapshot(q, (snap) => {
    state[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); if (sort) state[key].sort(sort);
    state.loaded[key] = true;
    if (key === 'orders' || key === 'categories') renderAll(); else renderPanel();
  }, (err) => { console.error(key, err); toast('تعذّر تحميل البيانات', errMsg(err), 'err'); }));
  sub('orders', query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)));
  sub('categories', collection(db, 'categories'), byOrder);
  sub('products', collection(db, 'products'), byOrder);
  sub('portfolio', collection(db, 'portfolio'), byOrder);
  state.unsub.push(onSnapshot(doc(db, 'settings', 'store'), (d) => { state.settings = d.exists() ? d.data() : null; state.loaded.settings = true; if (state.tab === 'settings') renderPanel(); }));
}
function unsubscribeAll() { state.unsub.forEach((u) => u()); state.unsub = []; state.loaded = {}; }

/* ================================================================ events */
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
  else if (a === 'csv') exportCsv();
  else if (a === 'note') {
    const v = $('#note-' + t.dataset.id).value.trim();
    try { await updateDoc(doc(fb().db, 'orders', t.dataset.id), { notes: v, updatedAt: serverTimestamp(), updatedBy: state.user.email || state.user.uid }); toast('حُفظت الملاحظة'); }
    catch (err) { toast('تعذّر الحفظ', errMsg(err), 'err'); }
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
  else if (a === 'closedDay') { const d = t.dataset.d; $(`#h_${d}_o`).disabled = t.checked; $(`#h_${d}_c`).disabled = t.checked; if (!t.checked && !$(`#h_${d}_o`).value) { $(`#h_${d}_o`).value = '08:00'; $(`#h_${d}_c`).value = '23:00'; } }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset?.act === 'status') {
    try { await updateDoc(doc(fb().db, 'orders', t.dataset.id), { status: t.value, updatedAt: serverTimestamp(), updatedBy: state.user.email || state.user.uid }); toast('تم تحديث حالة الطلب', STATUS_OF[t.value].t); }
    catch (err) { toast('تعذّر التحديث', errMsg(err), 'err'); }
  }
  else if (t.dataset?.act === 'pcat') { state.pcat = t.value; renderPanel(); }
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
    if (!user) { screenLogin(); return; }
    try {
      const adm = await getDoc(doc(fb().db, 'admins', user.uid));
      if (!adm.exists()) { screenNotAdmin(user); return; }
    } catch (err) { console.error(err); screenNotAdmin(user); return; }
    $('#root').innerHTML = ''; renderAll(); subscribe();
  });
}
