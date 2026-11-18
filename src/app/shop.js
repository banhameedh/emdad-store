/* صفحات التسوق: شبكة المنتجات، التصنيفات، تفاصيل المنتج، المفضلة، المقارنة */
import {
  $, esc, ic, P, WA, state, save, S, CATS, PRODUCTS, catById, productsOf, productById, waLink, appbar, imgTag, openSheet, closeSheet,
  V, AFTER, TITLES, ACT, go, refresh, toast, empty, btnP, btnS, btnO, card, pad2, footer, retab,
} from './core.js';
import { fmtSAR, unitPrice, unitCompare, discountPct, isOffer, stockState, defaultSel, selText } from '../lib/pricing.js';
import { uploadBox, bindUploads, filesOf } from './uploads.js';

/* ================================================================ price + card */
export const isFav = (id) => state.favs.includes(id);
const preliminary = (p) => (p.priceApproved ? '' : '<span class="inline-block text-[10px] font-bold text-[#9A5B00] bg-[#FFF3E3] rounded-md px-1.5 py-px" title="سعر تقديري غير معتمد بعد">سعر مبدئي</span>');

/** كتلة السعر الموحدة (بطاقة / صفحة منتج) */
export function priceBlock(p, size = 'sm', sel = null) {
  const big = size === 'lg';
  if (p.mode === 'buy') {
    const up = sel ? unitPrice(p, sel) : p.price; const uc = sel ? unitCompare(p, sel) : p.compareAt;
    return `<div class="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
      <b class="${big ? 'text-[24px]' : 'text-[15.5px]'} font-extrabold text-deep" data-price>${fmtSAR(up)}</b>
      ${uc ? `<s class="${big ? 'text-[14px]' : 'text-[11.5px]'} text-muted" data-compare>${fmtSAR(uc)}</s>` : ''}
      ${p.unit ? `<span class="text-[${big ? '12' : '10.5'}px] text-muted">${esc(p.unit)}</span>` : ''}
    </div>`;
  }
  return `<div class="flex items-baseline flex-wrap gap-x-1.5">
    ${p.price !== null ? `<span class="${big ? 'text-[13px]' : 'text-[10.5px]'} text-muted">يبدأ من</span><b class="${big ? 'text-[22px]' : 'text-[15px]'} font-extrabold text-deep">${fmtSAR(p.price)}</b>${p.unit ? `<span class="text-[10.5px] text-muted">${esc(p.unit)}</span>` : ''}` : `<b class="${big ? 'text-[18px]' : 'text-[14px]'} font-extrabold text-deep">السعر عند الطلب</b>`}
  </div>`;
}

/** بطاقة منتج موحدة: صورة · اسم · سعر (قبل/بعد الخصم) · التوفر · التفاصيل · إضافة */
export function productCard(p, cls = '') {
  const st = stockState(p); const pct = discountPct(p);
  const canBuy = p.mode === 'buy' && (!st || st.canBuy);
  return `<article class="pcard reveal ${card} overflow-hidden shadow-soft flex flex-col ${cls}" data-pid="${esc(p.id)}">
    <div class="relative m-1.5 mb-0 rounded-[17px] overflow-hidden aspect-square bg-tint">
      <button class="block w-full h-full" data-act="go" data-v="product" data-id="${esc(p.id)}" aria-label="${esc(p.name)}">${imgTag(p.image, 'pimg w-full h-full object-cover', p.name)}</button>
      <span class="absolute top-2 right-2 flex flex-col items-start gap-1">
        ${pct ? `<span class="text-[10.5px] font-extrabold text-white bg-orange rounded-full px-2 py-0.5" dir="ltr">-${pct}%</span>` : ''}
        ${p.badge ? `<span class="text-[10.5px] font-bold text-white bg-deep rounded-full px-2 py-0.5">${esc(p.badge)}</span>` : ''}
      </span>
      <button class="press absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 grid place-items-center shadow-soft" data-act="fav" data-id="${esc(p.id)}" aria-pressed="${isFav(p.id)}" aria-label="${isFav(p.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}">${ic(P.heart, 16, isFav(p.id) ? '#F7941E' : '#075A9F', 2, isFav(p.id) ? '#F7941E' : 'none')}</button>
    </div>
    <div class="px-2.5 pt-2 pb-2.5 flex-1 flex flex-col">
      <button class="text-right" data-act="go" data-v="product" data-id="${esc(p.id)}"><b class="block text-[13.5px] font-bold leading-snug line-clamp-2 min-h-[2.6em]">${esc(p.name)}</b></button>
      <div class="mt-1">${priceBlock(p)}</div>
      <div class="flex flex-wrap items-center gap-1 mt-1 min-h-[18px]">${preliminary(p)}${st ? `<span class="text-[10px] font-bold rounded-md px-1.5 py-px ${st.cls}">${st.label}</span>` : '<span class="text-[10px] font-bold rounded-md px-1.5 py-px text-deep bg-tint">حسب المواصفات</span>'}</div>
      <div class="mt-auto pt-2 grid grid-cols-[auto_1fr] gap-1.5">
        <button class="press h-9 px-2.5 rounded-xl bg-white hair text-deep text-[12px] font-bold" data-act="go" data-v="product" data-id="${esc(p.id)}">التفاصيل</button>
        ${p.mode === 'buy'
          ? `<button class="press h-9 rounded-xl ${canBuy ? 'bg-deep text-white' : 'bg-tint text-muted'} text-[12px] font-extrabold flex items-center justify-center gap-1 whitespace-nowrap" data-act="quickadd" data-id="${esc(p.id)}" ${canBuy ? '' : 'disabled'} aria-label="أضف ${esc(p.name)} إلى السلة">${ic(P.cart, 14, canBuy ? '#fff' : '#6B8299', 2)}${canBuy ? 'أضف' : 'غير متوفر'}</button>`
          : `<button class="press h-9 rounded-xl bg-orange text-white text-[12px] font-extrabold flex items-center justify-center whitespace-nowrap" data-act="quickquote" data-id="${esc(p.id)}">اطلب سعر</button>`}
      </div>
    </div>
  </article>`;
}
export const grid = (list, emptyHtml = '') => list.length ? `<div class="pgrid">${list.map((p) => productCard(p)).join('')}</div>` : emptyHtml;
export const rail = (list) => `<div class="no-sb flex gap-2.5 overflow-x-auto px-4 pt-3 pb-1 snap-x snap-mandatory scroll-px-4">${list.map((p) => productCard(p, 'w-[168px] flex-none snap-start')).join('')}</div>`;

/* ================================================================ lists */
export const newest = () => [...PRODUCTS()].sort((a, b) => b.addedAt - a.addedAt);
export const offers = () => PRODUCTS().filter(isOffer);
export const featured = () => PRODUCTS().filter((p) => p.featured);
/** الأكثر طلبًا: من مؤشر popularity (يُحدَّث من الطلبات الفعلية في لوحة التحكم) */
export const popular = () => PRODUCTS().filter((p) => p.popularity > 0).sort((a, b) => b.popularity - a.popularity);

const MODES = { all: 'جميع المنتجات', new: 'المنتجات الجديدة', popular: 'الأكثر طلبًا', offers: 'العروض والخصومات', search: 'نتائج البحث' };
const SORTS = [['default', 'ترتيب المتجر'], ['new', 'الأحدث'], ['popular', 'الأكثر طلبًا'], ['price-asc', 'السعر: من الأقل'], ['price-desc', 'السعر: من الأعلى']];
const attrValues = () => [...new Set(PRODUCTS().flatMap((p) => p.options.filter((o) => o.name === 'الخامة' || o.name === 'التشطيب').flatMap((o) => o.values.map((v) => v.label))))];

/** arg: all | new | popular | offers | search | cat:<id> | q:<text> */
function parseShopArg(arg = 'all') {
  const f = state.shop;
  if (arg?.startsWith('cat:')) { f.cat = arg.slice(4); f.mode = 'all'; }
  else if (arg?.startsWith('q:')) { f.q = arg.slice(2); f.mode = 'search'; }
  else if (arg && MODES[arg]) { f.mode = arg; if (arg !== 'search') f.q = f.mode === 'search' ? f.q : ''; }
  if (f.mode === 'popular') f.sort = 'popular';
  if (f.mode === 'new') f.sort = 'new';
  if (f.mode === 'offers') f.offers = true;
}
function shopList() {
  const f = state.shop; const q = f.q.trim();
  let list = PRODUCTS();
  if (f.mode === 'popular') list = popular().length ? popular() : featured();
  if (f.cat !== 'all') list = list.filter((p) => p.categoryId === f.cat);
  if (q) list = list.filter((p) => [p.name, p.desc, p.details, catById(p.categoryId)?.name, ...p.options.flatMap((o) => o.values.map((v) => v.label))].some((x) => String(x || '').includes(q)));
  if (f.offers) list = list.filter(isOffer);
  if (f.buy !== 'all') list = list.filter((p) => p.mode === f.buy);
  if (f.avail) list = list.filter((p) => { const s = stockState(p); return !s || s.canBuy; });
  if (f.attr) list = list.filter((p) => p.options.some((o) => o.values.some((v) => v.label === f.attr)));
  const min = Number(f.min); const max = Number(f.max);
  if (f.min !== '' && !Number.isNaN(min)) list = list.filter((p) => p.price !== null && p.price >= min);
  if (f.max !== '' && !Number.isNaN(max)) list = list.filter((p) => p.price !== null && p.price <= max);
  const pr = (p) => (p.price === null ? Infinity : p.price);
  const sorters = { new: (a, b) => b.addedAt - a.addedAt, popular: (a, b) => b.popularity - a.popularity || (b.featured - a.featured), 'price-asc': (a, b) => pr(a) - pr(b), 'price-desc': (a, b) => (b.price ?? -1) - (a.price ?? -1) };
  if (sorters[f.sort]) list = [...list].sort(sorters[f.sort]);
  return list;
}
const activeFilters = () => { const f = state.shop; return [f.offers && 'offers', f.buy !== 'all' && 'buy', f.avail && 'avail', f.attr && 'attr', (f.min !== '' || f.max !== '') && 'price'].filter(Boolean).length; };

V.shop = (arg) => {
  parseShopArg(arg); const f = state.shop;
  const title = f.cat !== 'all' && f.mode === 'all' ? catById(f.cat)?.name || 'المنتجات' : MODES[f.mode];
  return `${appbar(esc(title))}
  <div class="px-4 pb-6">
    <form id="shopSearch" class="h-[46px] rounded-2xl bg-white hair flex items-center gap-2.5 px-3.5" role="search">${ic(P.search, 17, '#6B8299')}
      <input id="shopQ" type="search" enterkeyhint="search" class="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[#9AABBB]" placeholder="ابحث عن منتج أو خدمة…" aria-label="بحث" value="${esc(f.q)}"></form>
    <div class="no-sb flex gap-2 overflow-x-auto mt-3" id="modeChips">${Object.entries(MODES).filter(([k]) => k !== 'search' || f.mode === 'search').map(([k, t]) => `<button class="chip press ${f.mode === k ? 'on' : ''}" data-act="shopmode" data-k="${k}">${k === 'all' ? 'الكل' : t.replace('المنتجات ', '')}</button>`).join('')}</div>
    <div class="no-sb flex gap-2 overflow-x-auto mt-2" id="catChips"><button class="chip press ${f.cat === 'all' ? 'on' : ''}" data-act="shopcat" data-k="all">كل التصنيفات</button>${CATS().map((c) => `<button class="chip press ${f.cat === c.id ? 'on' : ''}" data-act="shopcat" data-k="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div>
    <div class="flex items-center gap-2 mt-3">
      <span id="shopCount" class="text-[12px] text-muted flex-1"></span>
      <label class="relative"><span class="sr-only">الفرز</span><select id="shopSort" class="h-9 rounded-xl bg-white hair text-[12.5px] pr-3 pl-7 appearance-none" aria-label="الفرز">${SORTS.map(([k, t]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select><span class="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">${ic(P.down, 13, '#075A9F', 2.2)}</span></label>
      <button class="press relative h-9 px-3 rounded-xl bg-white hair text-[12.5px] font-bold text-deep flex items-center gap-1" data-act="filters">${ic(P.filter, 15, '#075A9F', 2)}فلترة${activeFilters() ? `<span class="min-w-[18px] h-[18px] rounded-full bg-orange text-white text-[10px] grid place-items-center">${activeFilters()}</span>` : ''}</button>
    </div>
    ${f.mode === 'popular' && !popular().length ? '<p class="mt-2 text-[11.5px] text-muted bg-tint rounded-xl px-3 py-2">لا تتوفر بعد بيانات طلبات كافية لترتيب الأكثر طلبًا؛ نعرض لك مختارات المتجر، وتُحدَّث القائمة تلقائيًا مع الطلبات.</p>' : ''}
    <div id="shopGrid" class="mt-3"></div>
  </div>${footer()}`;
};
function renderShopGrid() {
  const g = $('#shopGrid'); if (!g) return;
  const list = shopList();
  $('#shopCount').textContent = `${list.length} منتج`;
  g.innerHTML = grid(list, empty(P.search, 'لا توجد منتجات مطابقة', 'جرّب كلمات بحث أخرى أو أزل بعض الفلاتر، أو اطلب منتجًا مخصصًا وسنوفره لك.', `<div class="flex gap-2 justify-center mt-4"><button class="${btnS} px-4 !h-11" data-act="resetfilters">إزالة الفلاتر</button><button class="${btnO} px-4 !h-11" data-act="go" data-v="custom">طلب منتج مخصص</button></div>`));
}
AFTER.shop = (el) => {
  renderShopGrid();
  const q = el.querySelector('#shopQ'); let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.shop.q = q.value; if (q.value.trim() && state.shop.mode !== 'search') state.shop.mode = 'all'; renderShopGrid(); }, 180); });
  el.querySelector('#shopSearch').addEventListener('submit', (e) => { e.preventDefault(); q.blur(); });
  el.querySelector('#shopSort').addEventListener('change', (e) => { state.shop.sort = e.target.value; renderShopGrid(); });
};
TITLES.shop = (arg) => (arg?.startsWith('cat:') ? catById(arg.slice(4))?.name : MODES[arg || 'all']) || 'المنتجات';
V.search = () => { state.shop.mode = 'search'; return V.shop('search'); };
AFTER.search = (el) => { AFTER.shop(el); setTimeout(() => el.querySelector('#shopQ')?.focus(), 350); };
TITLES.search = () => 'البحث';

ACT.shopmode = (t) => { const f = state.shop; f.mode = t.dataset.k; f.offers = f.mode === 'offers'; f.sort = f.mode === 'new' ? 'new' : f.mode === 'popular' ? 'popular' : 'default'; if (f.mode !== 'search') f.q = ''; refresh(); };
ACT.shopcat = (t) => { state.shop.cat = t.dataset.k; refresh(); };
ACT.resetfilters = () => { Object.assign(state.shop, { q: '', cat: 'all', mode: 'all', sort: 'default', min: '', max: '', buy: 'all', offers: false, avail: false, attr: '' }); refresh(); };
ACT.filters = () => {
  const f = state.shop; const attrs = attrValues();
  const seg = (name, opts, cur) => `<div class="flex gap-1.5 flex-wrap">${opts.map(([k, t]) => `<button type="button" class="chip press ${String(cur) === String(k) ? 'on' : ''}" data-seg="${name}" data-k="${k}">${t}</button>`).join('')}</div>`;
  openSheet(`<form id="fForm" class="flex flex-col min-h-0">
    <div class="px-4 flex items-center justify-between flex-none"><b class="text-[18px] font-extrabold text-deep">فلترة المنتجات</b><button type="button" class="press w-9 h-9 rounded-full bg-white hair grid place-items-center" data-act="close" aria-label="إغلاق">${ic(P.x, 16, '#0B2A45', 2)}</button></div>
    <div class="overflow-y-auto px-4 pb-3 flex-1">
      <b class="block text-[13px] mt-3 mb-1.5">السعر (⃁)</b>
      <div class="grid grid-cols-2 gap-2"><input id="fMin" class="field !h-11" inputmode="decimal" placeholder="من" value="${f.min}" dir="ltr" style="text-align:right"><input id="fMax" class="field !h-11" inputmode="decimal" placeholder="إلى" value="${f.max}" dir="ltr" style="text-align:right"></div>
      <b class="block text-[13px] mt-3 mb-1.5">طريقة الطلب</b>${seg('buy', [['all', 'الكل'], ['buy', 'جاهز للشراء'], ['quote', 'حسب الطلب (عرض سعر)']], f.buy)}
      <b class="block text-[13px] mt-3 mb-1.5">العروض والتوفر</b>${seg('offers', [['false', 'كل المنتجات'], ['true', 'العروض والباقات فقط']], f.offers)}<div class="mt-1.5">${seg('avail', [['false', 'الكل'], ['true', 'المتوفر فقط']], f.avail)}</div>
      ${attrs.length ? `<b class="block text-[13px] mt-3 mb-1.5">الخامة والتشطيب</b>${seg('attr', [['', 'الكل'], ...attrs.map((a) => [a, a])], f.attr)}` : ''}
    </div>
    <div class="px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] flex-none border-t border-deep/5 grid grid-cols-[1fr_2fr] gap-2"><button type="button" class="${btnS}" data-act="resetfilters">إعادة الضبط</button><button class="${btnP}" type="submit">عرض النتائج</button></div>
  </form>`);
  const fm = $('#fForm'); const pick = {};
  fm.addEventListener('click', (e) => { const b = e.target.closest('[data-seg]'); if (!b) return; pick[b.dataset.seg] = b.dataset.k; fm.querySelectorAll(`[data-seg="${b.dataset.seg}"]`).forEach((x) => x.classList.toggle('on', x === b)); });
  fm.addEventListener('submit', (e) => {
    e.preventDefault();
    f.min = $('#fMin').value.trim(); f.max = $('#fMax').value.trim();
    if ('buy' in pick) f.buy = pick.buy; if ('offers' in pick) f.offers = pick.offers === 'true'; if ('avail' in pick) f.avail = pick.avail === 'true'; if ('attr' in pick) f.attr = pick.attr;
    closeSheet(); refresh();
  });
};

/* ================================================================ product page */
const selOf = {}; // productId -> current selection on the product page
V.product = (id) => {
  const p = productById(id); if (!p) return null;
  const c = catById(p.categoryId); const st = stockState(p); const pct = discountPct(p);
  const sel = selOf[id] ||= { ...defaultSel(p), qty: p.minQty, notes: '' };
  const canBuy = p.mode === 'buy' && (!st || st.canBuy);
  const inCompare = state.compare.includes(p.id);
  return `<div data-light="1">
    <section class="relative m-2 rounded-[46px] overflow-hidden bg-tint">
      <div id="gal" class="no-sb flex overflow-x-auto snap-x snap-mandatory aspect-square">${p.images.map((im, i) => `<div class="w-full flex-none snap-center">${imgTag(im, 'w-full h-full object-cover', `${p.name} ${i + 1}`)}</div>`).join('')}</div>
      <div class="absolute inset-x-0 top-0 h-28 pointer-events-none" style="background:linear-gradient(180deg,rgba(2,26,49,.5),rgba(2,26,49,0))"></div>
      <div class="absolute hero-top inset-x-4 flex justify-between">
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="back" aria-label="رجوع">${ic(P.back, 18, '#fff', 2.2)}</button>
        <span class="flex gap-2"><button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="fav" data-id="${esc(p.id)}" aria-label="المفضلة">${ic(P.heart, 18, '#fff', 2, isFav(p.id) ? '#fff' : 'none')}</button><button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18, '#fff')}</button></span>
      </div>
      ${p.images.length > 1 ? `<div class="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" id="galDots">${p.images.map((_, i) => `<i class="block h-1.5 rounded bg-white transition-all ${i ? 'w-1.5 opacity-60' : 'w-[18px]'}"></i>`).join('')}</div>` : ''}
      <span class="absolute bottom-3 right-4 flex gap-1">${pct ? `<span class="text-[11px] font-extrabold text-white bg-orange rounded-full px-2.5 py-1" dir="ltr">-${pct}%</span>` : ''}${p.badge ? `<span class="text-[11px] font-bold text-white bg-deep rounded-full px-2.5 py-1">${esc(p.badge)}</span>` : ''}</span>
    </section>
    <div class="px-4 pt-2">
      <button class="flex items-center gap-2 text-[12px] text-muted" data-act="go" data-v="category" data-id="${esc(p.categoryId)}"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>${esc(c?.name || '')}</button>
      <h1 class="text-[22px] font-extrabold text-deep leading-snug mt-1">${esc(p.name)}</h1>
      <p class="text-[13px] text-muted">${esc(p.desc)}</p>
      <div class="mt-3 ${card} p-3.5">
        <div id="pPrice">${priceBlock(p, 'lg', p.mode === 'buy' ? sel : null)}</div>
        <div class="flex flex-wrap items-center gap-1.5 mt-1.5">${preliminary(p)}${st ? `<span class="text-[11px] font-bold rounded-md px-2 py-0.5 ${st.cls}">${st.label}</span>` : ''}${p.mode === 'buy' ? `<span class="text-[11px] text-muted">${S().pricesIncludeVat !== false ? `شامل ضريبة القيمة المضافة ${esc(S().vatRate)}%` : 'غير شامل ضريبة القيمة المضافة'}</span>` : '<span class="text-[11px] text-muted">السعر النهائي يُحدد حسب المقاسات والخامات والكمية</span>'}</div>
        ${p.promo ? `<p class="mt-2 text-[12px] text-orange font-bold flex items-center gap-1">${ic(P.tag, 14, '#F7941E', 2)}${esc(p.promo.name || 'عرض خاص')}</p>` : ''}
        ${!p.priceApproved ? '<p class="mt-2 text-[11px] text-[#9A5B00] leading-5">هذا سعر تقديري مبدئي غير معتمد بعد، ويُؤكَّد قبل تنفيذ الطلب.</p>' : ''}
      </div>
      <form id="pForm" class="mt-3" novalidate>
        ${p.options.map((o, oi) => `<fieldset class="mt-3"><legend class="text-[13px] font-extrabold mb-1.5">${esc(o.name)}</legend><div class="flex flex-wrap gap-1.5">${o.values.map((v) => `<label class="opt"><input type="radio" class="sr-only" name="o${oi}" data-opt="${esc(o.name)}" value="${esc(v.label)}" ${sel.opts[o.name] === v.label ? 'checked' : ''}><span>${esc(v.label)}${p.mode === 'buy' && v.delta ? ` <small>${v.delta > 0 ? `+ ${fmtSAR(v.delta)}` : `− ${fmtSAR(-v.delta)}`}</small>` : ''}</span></label>`).join('')}</div></fieldset>`).join('')}
        ${p.addons.length ? `<fieldset class="mt-3"><legend class="text-[13px] font-extrabold mb-1.5">الإضافات والملحقات</legend>${p.addons.map((a) => `<label class="flex items-center gap-2.5 ${card} px-3 py-2.5 mb-1.5 text-[13px]"><input type="checkbox" class="w-5 h-5 accent-[#075A9F]" data-addon="${esc(a.label)}" ${sel.addons.includes(a.label) ? 'checked' : ''}><span class="flex-1">${esc(a.label)}</span><b class="text-deep">+ ${fmtSAR(a.price)}</b></label>`).join('')}</fieldset>` : ''}
        <div class="mt-3 flex items-center gap-3">
          <b class="text-[13px] font-extrabold">${p.unit && /م²|متر/.test(p.unit) ? 'الكمية (م²)' : 'الكمية'}</b>
          <div class="flex items-center ${card} h-11 overflow-hidden"><button type="button" class="w-11 h-11 grid place-items-center" data-act="qty" data-d="1" aria-label="زيادة">${ic(P.plus, 16, '#075A9F', 2.4)}</button><input id="pQty" class="w-14 text-center outline-none text-[15px] font-bold" inputmode="numeric" value="${sel.qty}" aria-label="الكمية" dir="ltr"><button type="button" class="w-11 h-11 grid place-items-center" data-act="qty" data-d="-1" aria-label="إنقاص">${ic(P.minus, 16, '#075A9F', 2.4)}</button></div>
          ${p.minQty > 1 ? `<span class="text-[11.5px] text-muted">الحد الأدنى ${p.minQty}</span>` : ''}
        </div>
        ${p.mode === 'buy' ? `<div class="mt-2 text-[13px] flex justify-between bg-tint rounded-xl px-3 py-2"><span>الإجمالي التقديري</span><b class="text-deep" id="pTotal" dir="ltr"></b></div>` : ''}
        <label class="block text-[13px] font-extrabold mt-3 mb-1.5" for="pNotes">ملاحظات ${p.mode === 'buy' ? 'التخصيص' : 'ومواصفات إضافية'}</label>
        <textarea id="pNotes" class="field !h-20" maxlength="500" placeholder="مثال: النص المطلوب، الألوان، توزيع المقاسات…">${esc(sel.notes)}</textarea>
        ${p.allowUpload ? `<div class="mt-3">${uploadBox('p_' + p.id, 'إرفاق ملفات التصميم (اختياري)')}</div>` : ''}
      </form>
      <div class="sticky bottom-0 z-20 grid ${p.mode === 'buy' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-3 pb-3 mt-3 bg-surface"><span class="absolute inset-x-0 -top-6 h-6 pointer-events-none" style="background:linear-gradient(180deg,rgba(247,250,253,0),#F7FAFD)"></span>
        ${p.mode === 'buy'
          ? `<button class="${btnS}" data-act="addcart" data-id="${esc(p.id)}" ${canBuy ? '' : 'disabled'}>${ic(P.cart, 17, '#075A9F', 2)}أضف إلى السلة</button><button class="${btnP}" data-act="buynow" data-id="${esc(p.id)}" ${canBuy ? '' : 'disabled'}>${canBuy ? 'اشترِ الآن' : 'نفدت الكمية'}</button>`
          : `<button class="${btnO}" data-act="addquote" data-id="${esc(p.id)}">${ic(P.msg, 17, '#fff', 2)}اطلب عرض سعر لهذا المنتج</button>`}
      </div>
      <div class="grid grid-cols-2 gap-2 mt-1">
        ${p.mode === 'buy' ? `<button class="press h-10 rounded-xl bg-white hair text-[12px] font-bold text-deep" data-act="addquote" data-id="${esc(p.id)}">كميات كبيرة؟ اطلب عرض سعر</button>` : `<button class="press h-10 rounded-xl bg-white hair text-[12px] font-bold text-deep" data-act="go" data-v="custom" data-id="${esc(p.id)}">طلب منتج مخصص</button>`}
        <button class="press h-10 rounded-xl bg-white hair text-[12px] font-bold ${inCompare ? 'text-orange' : 'text-deep'} flex items-center justify-center gap-1" data-act="cmp" data-id="${esc(p.id)}">${ic(P.compare, 14, inCompare ? '#F7941E' : '#075A9F', 2)}${inCompare ? 'في المقارنة' : 'أضف للمقارنة'}</button>
      </div>
      ${p.leadTime ? `<div class="mt-3 flex items-center gap-2.5 ${card} px-3 py-2.5"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(P.clock, 18)}</span><span><b class="block text-[13px]">مدة التنفيذ المتوقعة</b><span class="block text-[12px] text-muted">${esc(p.leadTime)} — تبدأ بعد اعتماد التصميم</span></span></div>` : ''}
      ${p.details ? `<h3 class="text-[14.5px] font-extrabold mt-5 mb-1.5">الوصف</h3><p class="text-[13.5px] text-[#4A6580] leading-7">${esc(p.details)}</p>` : ''}
      ${p.specs.length || p.options.length ? `<h3 class="text-[14.5px] font-extrabold mt-5 mb-2">المواصفات الفنية</h3><div class="${card} overflow-hidden">${[...p.specs.map((s) => [s.k, s.v]), ...p.options.map((o) => [`${o.name} المتاحة`, o.values.map((v) => v.label).join('، ')]), ...(p.minQty > 1 ? [['الحد الأدنى للطلب', `${p.minQty} ${p.unit ? esc(p.unit.replace(/^ل(ل|كل )?/, '')) : ''}`]] : [])].map(([k, v], i) => `<div class="grid grid-cols-[40%_1fr] text-[12.5px] ${i ? 'border-t border-deep/5' : ''}"><span class="bg-tint/60 px-3 py-2 font-bold">${esc(k)}</span><span class="px-3 py-2 text-[#3E5873]">${esc(v)}</span></div>`).join('')}</div>` : ''}
      <div class="mt-4 grid grid-cols-3 gap-2 text-center">${[[P.shield, 'جودة تنفيذ', 'نراجع التصميم معك قبل التنفيذ'], [P.truck, 'استلام أو توصيل', 'حسب مدينتك'], [P.msg, 'دعم مباشر', 'عبر واتساب']].map(([d, t, s]) => `<div class="${card} p-2.5"><span class="mx-auto w-8 h-8 rounded-xl bg-tint grid place-items-center">${ic(d, 16)}</span><b class="block text-[11.5px] mt-1">${t}</b><span class="block text-[10px] text-muted leading-4 mt-0.5">${s}</span></div>`).join('')}</div>
      ${related(p)}
    </div>
  </div>`;
};
function related(p) {
  const list = productsOf(p.categoryId).filter((x) => x.id !== p.id).slice(0, 8);
  return list.length ? `<h3 class="text-[14.5px] font-extrabold mt-6 mb-0">منتجات مشابهة</h3><div class="-mx-4">${rail(list)}</div>` : '';
}
function readSel(p) {
  const fm = $('#pForm'); const s = selOf[p.id];
  fm.querySelectorAll('input[data-opt]:checked').forEach((i) => { s.opts[i.dataset.opt] = i.value; });
  s.addons = [...fm.querySelectorAll('input[data-addon]:checked')].map((i) => i.dataset.addon);
  let q = parseInt(String($('#pQty').value).replace(/[^\d]/g, ''), 10); if (!q || q < p.minQty) q = p.minQty; if (p.stock !== null && p.stock > 0) q = Math.min(q, p.stock);
  s.qty = q; s.notes = $('#pNotes').value.trim();
  return s;
}
function updatePrice(p) {
  if (p.mode !== 'buy') return;
  const s = readSel(p); $('#pPrice').innerHTML = priceBlock(p, 'lg', s);
  $('#pTotal').textContent = fmtSAR(unitPrice(p, s) * s.qty);
}
AFTER.product = (el, id) => {
  const p = productById(id); if (!p) return;
  updatePrice(p);
  el.querySelector('#pForm').addEventListener('change', () => updatePrice(p));
  el.querySelector('#pQty').addEventListener('change', () => { readSel(p); el.querySelector('#pQty').value = selOf[id].qty; updatePrice(p); });
  if (p.allowUpload) bindUploads(el);
  const g = el.querySelector('#gal'); const dots = el.querySelectorAll('#galDots i');
  g?.addEventListener('scroll', () => { const i = Math.round(Math.abs(g.scrollLeft) / g.clientWidth); dots.forEach((d, j) => { d.style.width = i === j ? '18px' : '6px'; d.style.opacity = i === j ? 1 : 0.6; }); }, { passive: true });
  injectProductLd(p);
};
TITLES.product = (id) => productById(id)?.name;
function injectProductLd(p) {
  document.getElementById('ldProduct')?.remove();
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.details || p.desc, image: p.images.map((i) => new URL(i, location.href).href), category: catById(p.categoryId)?.name };
  if (p.mode === 'buy' && p.price !== null) ld.offers = { '@type': 'Offer', priceCurrency: 'SAR', price: p.price, availability: stockState(p)?.canBuy === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' };
  const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ldProduct'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
}

ACT.qty = (t) => { const p = productById(state.stack.at(-1)[1]); const i = $('#pQty'); const step = p.minQty >= 10 ? p.minQty : 1; i.value = Math.max(p.minQty, (parseInt(i.value, 10) || p.minQty) + Number(t.dataset.d) * step); readSel(p); i.value = selOf[p.id].qty; updatePrice(p); };

/* ---------------------------------------------------------------- cart / quote basket */
const lineKey = (pid, sel) => pid + '|' + JSON.stringify([sel.opts, [...sel.addons].sort()]);
export function addToCart(p, sel, files = []) {
  const s = sel || { ...defaultSel(p), qty: p.minQty, notes: '' };
  const key = lineKey(p.id, s);
  const ex = state.cart.find((l) => l.key === key);
  if (ex) { ex.qty += s.qty; ex.files = [...(ex.files || []), ...files].slice(0, 10); if (s.notes) ex.notes = s.notes; }
  else state.cart.push({ key, productId: p.id, qty: s.qty, sel: { opts: { ...s.opts }, addons: [...s.addons] }, notes: s.notes || '', files });
  save.cart(); retab();
  const b = document.querySelector('[data-t="cart"] .relative'); b?.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 350 });
}
export function addToQuote(p, sel, files = []) {
  const s = sel || { ...defaultSel(p), qty: p.minQty, notes: '' };
  const key = lineKey(p.id, s);
  if (!state.quote.find((l) => l.key === key)) state.quote.push({ key, productId: p.id, qty: s.qty, sel: { opts: { ...s.opts }, addons: [...s.addons] }, notes: s.notes || '', files });
  save.quote();
}
const curTab = () => { const n = state.stack.at(-1)?.[0]; return n; };
ACT.quickadd = (t) => {
  const p = productById(t.dataset.id); if (!p) return;
  if (p.options.length > 1) { go('product', p.id); toast('اختر المواصفات', 'حدد الخيارات المناسبة ثم أضف إلى السلة', 'info'); return; }
  addToCart(p); toast('أُضيف إلى السلة', `${p.name} · ${fmtSAR(unitPrice(p, defaultSel(p)) * p.minQty)}`);
};
ACT.quickquote = (t) => { const p = productById(t.dataset.id); if (!p) return; addToQuote(p); toast('أُضيف إلى طلب عرض السعر', p.name); go('quote'); };
ACT.addcart = (t, e, andGo) => {
  const p = productById(t.dataset.id); const s = readSel(p);
  addToCart(p, { ...s }, filesOf('p_' + p.id)); state.uploads['p_' + p.id] = [];
  delete selOf[p.id];
  if (andGo) { go('checkout'); return; }
  toast('أُضيف إلى السلة', `${p.name} × ${s.qty}`);
};
ACT.buynow = (t, e) => ACT.addcart(t, e, true);
ACT.addquote = (t) => {
  const p = productById(t.dataset.id); const s = readSel(p);
  addToQuote(p, { ...s }, filesOf('p_' + p.id)); state.uploads['p_' + p.id] = []; delete selOf[p.id];
  toast('أُضيف إلى طلب عرض السعر', p.name); go('quote');
};

/* ================================================================ favorites + compare */
ACT.fav = (t) => {
  const id = t.dataset.id; const on = !isFav(id);
  state.favs = on ? [...state.favs, id] : state.favs.filter((x) => x !== id); save.favs();
  t.setAttribute('aria-pressed', on);
  const svg = t.querySelector('svg'); if (svg) { svg.setAttribute('fill', on ? (t.classList.contains('glass') ? '#fff' : '#F7941E') : 'none'); if (!t.classList.contains('glass')) svg.setAttribute('stroke', on ? '#F7941E' : '#075A9F'); }
  toast(on ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة', productById(id)?.name || '');
  import('./account.js').then((m) => m.syncFavs());
  if (curTab() === 'favorites') refresh();
};
V.favorites = () => {
  const list = state.favs.map(productById).filter(Boolean);
  return `${appbar('المفضلة')}<div class="px-4 pb-6">${grid(list, empty(P.heart, 'لا توجد منتجات في المفضلة', 'اضغط على رمز القلب في أي منتج لحفظه هنا والرجوع إليه لاحقًا.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="shop">تصفح المنتجات</button>`))}</div>`;
};
TITLES.favorites = () => 'المفضلة';
ACT.cmp = (t) => {
  const id = t.dataset.id; const on = !state.compare.includes(id);
  if (on && state.compare.length >= 4) { toast('يمكن مقارنة 4 منتجات كحد أقصى', 'أزل منتجًا من صفحة المقارنة أولًا', 'info'); return; }
  state.compare = on ? [...state.compare, id] : state.compare.filter((x) => x !== id); save.compare();
  if (curTab() === 'compare') { refresh(); return; }
  toast(on ? 'أُضيف إلى المقارنة' : 'أُزيل من المقارنة', on ? `${state.compare.length} منتجات في المقارنة` : '');
  refresh();
};
V.compare = () => {
  const list = state.compare.map(productById).filter(Boolean);
  if (!list.length) return `${appbar('مقارنة المنتجات')}${empty(P.compare, 'لا توجد منتجات للمقارنة', 'أضف حتى 4 منتجات من صفحاتها عبر زر «أضف للمقارنة» لمقارنة الأسعار والمواصفات.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="shop">تصفح المنتجات</button>`)}`;
  const rows = [
    ['السعر', (p) => (p.mode === 'buy' ? fmtSAR(p.price) : p.price !== null ? `يبدأ من ${fmtSAR(p.price)}` : 'عند الطلب')],
    ['قبل الخصم', (p) => (p.compareAt ? `<s>${fmtSAR(p.compareAt)}</s>` : '—')],
    ['الوحدة', (p) => esc(p.unit || '—')], ['طريقة الطلب', (p) => (p.mode === 'buy' ? 'شراء مباشر' : 'عرض سعر')],
    ['التصنيف', (p) => esc(catById(p.categoryId)?.name || '')], ['الحد الأدنى', (p) => p.minQty],
    ['مدة التنفيذ', (p) => esc(p.leadTime || '—')], ['التوفر', (p) => stockState(p)?.label || 'حسب المواصفات'],
    ['الخيارات', (p) => p.options.map((o) => `<b>${esc(o.name)}:</b> ${o.values.map((v) => esc(v.label)).join('، ')}`).join('<br>') || '—'],
    ['الإضافات', (p) => p.addons.map((a) => `${esc(a.label)} (${fmtSAR(a.price)})`).join('<br>') || '—'],
    ...[...new Set(list.flatMap((p) => p.specs.map((s) => s.k)))].map((k) => [k, (p) => esc(p.specs.find((s) => s.k === k)?.v || '—')]),
  ];
  return `${appbar('مقارنة المنتجات')}<div class="px-4 pb-6"><div class="overflow-x-auto no-sb ${card}"><table class="text-[12px] min-w-full" style="width:${140 + list.length * 150}px">
    <thead><tr><th class="sticky right-0 bg-white w-[110px]"></th>${list.map((p) => `<th class="p-2 align-top w-[150px]"><div class="relative">${imgTag(p.image, 'w-full aspect-square object-cover rounded-xl', p.name)}<button class="absolute top-1 left-1 w-7 h-7 rounded-full bg-white/90 grid place-items-center" data-act="cmp" data-id="${esc(p.id)}" aria-label="إزالة">${ic(P.x, 13, '#0B2A45', 2.4)}</button></div><button class="block text-right text-[12.5px] font-bold mt-1.5 leading-snug" data-act="go" data-v="product" data-id="${esc(p.id)}">${esc(p.name)}</button></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([k, f]) => `<tr class="border-t border-deep/5"><th class="sticky right-0 bg-tint text-right p-2 font-bold">${esc(k)}</th>${list.map((p) => `<td class="p-2 align-top text-[#3E5873] leading-5">${f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="text-[11px] text-muted mt-2">اسحب الجدول أفقيًا لرؤية جميع المنتجات. الأسعار بالريال السعودي.</p></div>`;
};
TITLES.compare = () => 'مقارنة المنتجات';

/* ================================================================ category sheet (from home cards) */
export function productSheet(id) {
  const s = catById(id); if (!s) return; const idx = CATS().indexOf(s);
  const prods = productsOf(s.id);
  const rows = prods.map((p) => `<div class="fade-in flex items-center gap-3 bg-white hair rounded-[20px] p-2 mt-2">
      <button class="flex-none" data-act="go" data-v="product" data-id="${esc(p.id)}">${imgTag(p.image, 'w-[68px] h-[68px] rounded-[15px] object-cover', p.name)}</button>
      <button class="flex-1 min-w-0 text-right" data-act="go" data-v="product" data-id="${esc(p.id)}"><b class="block text-[14px] truncate">${esc(p.name)}</b><span class="block text-[11.5px] text-muted truncate">${esc(p.desc)}</span><span class="block mt-0.5">${priceBlock(p)}</span></button>
      <button class="press w-9 h-9 rounded-full grid place-items-center ml-1 flex-none border-[1.5px] border-deep/25" data-act="${p.mode === 'buy' ? 'quickadd' : 'quickquote'}" data-id="${esc(p.id)}" aria-label="${p.mode === 'buy' ? 'أضف إلى السلة' : 'اطلب عرض سعر'} ${esc(p.name)}">${ic(p.mode === 'buy' ? P.plus : P.msg, 15, '#075A9F', 2.4)}</button>
    </div>`).join('') || '<p class="text-center text-muted text-[13px] py-8">لا توجد منتجات معروضة في هذا القسم حاليًا — اطلب عرض سعر ونخدمك بما تحتاج.</p>';
  openSheet(`
    <div class="px-4 flex items-start justify-between flex-none">
      <div><span class="flex items-center gap-2 text-[12px] text-muted"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>القسم ${pad2(idx + 1)} · ${prods.length} منتج</span><b class="block text-[20px] font-extrabold text-deep mt-0.5">${esc(s.name)}</b></div>
      <button class="press w-9 h-9 rounded-full bg-white hair grid place-items-center flex-none" data-act="close" aria-label="إغلاق">${ic(P.x, 16, '#0B2A45', 2)}</button>
    </div>
    <div class="overflow-y-auto px-4 pb-3 flex-1">${rows}
      <button class="press mt-3 w-full text-[12.5px] font-bold text-deep py-2" data-act="go" data-v="category" data-id="${esc(s.id)}">صفحة القسم وكل خدماته ‹</button></div>
    <div class="px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] flex-none border-t border-deep/5 grid grid-cols-2 gap-2">
      <button class="${btnS}" data-act="go" data-v="shop" data-id="cat:${esc(s.id)}">كل منتجات القسم</button>
      <button class="${btnP}" data-act="go" data-v="quote" data-id="cat:${esc(s.id)}">اطلب عرض سعر</button>
    </div>`);
}
ACT.sheet = (t) => productSheet(t.dataset.id);
