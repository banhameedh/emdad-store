/* السلة، إتمام الطلب، التأكيد/الفشل، تتبع الطلب، ونماذج عروض الأسعار (شركات / مشاريع / منتجات مخصصة) */
import {
  $, esc, ic, P, WA, state, save, S, CATS, catById, productById, waLink, appbar, imgTag, V, AFTER, TITLES, ACT, go, replace, refresh, home,
  toast, empty, btnP, btnS, btnO, card, label, field, normPhone, okPhone, okEmail, busy, footer, fmtDate, renderTabs, pending, LS,
} from './core.js';
import { fmtSAR, fmtSARText, unitPrice, unitCompare, selText, totals, stockState, STATUS, FLOW, PAYMENT_METHODS, DELIVERY, CUSTOMER_TYPES, QUOTE_KINDS } from '../lib/pricing.js';
import { isConfigured } from '../lib/firebase.js';
import { createOrder, getTracking } from '../lib/api.js';
import { uploadBox, bindUploads, filesOf, uploading } from './uploads.js';
import { productCard } from './shop.js';

/* ================================================================ cart */
/** بنود السلة بأسعار محسوبة من بيانات المنتجات الحالية */
export function cartLines() {
  return state.cart.map((l) => {
    const p = productById(l.productId);
    if (!p || p.mode !== 'buy') return { ...l, p, invalid: true };
    const st = stockState(p);
    const up = unitPrice(p, l.sel); const uc = unitCompare(p, l.sel);
    return { ...l, p, unitPrice: up, unitCompare: uc, lineTotal: Math.round(up * l.qty * 100) / 100, out: st && !st.canBuy, low: p.stock !== null && l.qty > p.stock };
  });
}
const vatLine = (t) => (t.vatIncluded ? `<div class="flex justify-between text-[12px] text-muted"><span>منها ضريبة القيمة المضافة (${t.vatRate}%)</span><span dir="ltr">${fmtSAR(t.vat)}</span></div>` : `<div class="flex justify-between text-[13px]"><span>ضريبة القيمة المضافة (${t.vatRate}%)</span><span dir="ltr">${fmtSAR(t.vat)}</span></div>`);
function summaryHtml(t, delivery) {
  return `<div class="grid gap-1.5">
    <div class="flex justify-between text-[13px]"><span>المجموع الفرعي</span><span dir="ltr">${fmtSAR(t.subtotal)}</span></div>
    ${t.savings ? `<div class="flex justify-between text-[13px] text-[#12804A]"><span>وفّرت</span><span dir="ltr">-${fmtSAR(t.savings)}</span></div>` : ''}
    <div class="flex justify-between text-[13px]"><span>التوصيل</span><span>${delivery === 'delivery' ? (S().deliveryFee != null ? `<span dir="ltr">${fmtSAR(S().deliveryFee)}</span>` : 'يُحدد حسب المدينة ويُؤكد قبل التنفيذ') : 'استلام من المقر'}</span></div>
    ${vatLine(t)}
    <div class="flex justify-between text-[16px] font-extrabold text-deep border-t border-deep/10 pt-2 mt-1"><span>الإجمالي</span><span dir="ltr">${fmtSAR(t.total)}</span></div>
  </div>`;
}
const lineThumb = (l) => imgTag(l.p?.image, 'w-[72px] h-[72px] rounded-[15px] object-cover flex-none bg-tint', l.p?.name || '');

V.cart = () => {
  const lines = cartLines(); const ok = lines.filter((l) => !l.invalid);
  const t = totals(ok, S());
  const qn = state.quote.length;
  if (!lines.length) {
    return `${appbar('سلة المشتريات', '<span class="w-11"></span>')}
    ${empty(P.cart, 'سلتك فارغة', 'تصفح المنتجات الجاهزة وأضفها إلى السلة، أو اطلب عرض سعر للمنتجات المخصصة والكميات الكبيرة.', `<div class="flex gap-2 justify-center mt-4"><button class="${btnP} px-5 !h-11" data-act="go" data-v="shop">تصفح المنتجات</button><button class="${btnS} px-5 !h-11" data-act="go" data-v="quote">اطلب عرض سعر</button></div>`)}
    ${qn ? quoteNotice(qn) : ''}`;
  }
  return `${appbar(`سلة المشتريات <small class="text-muted font-normal text-[12px]">(${lines.length})</small>`, '<span class="w-11"></span>')}
  <div class="px-4 pb-8">
    ${steps(1)}
    <div class="grid gap-2">${lines.map((l, i) => `<div class="${card} p-2 flex gap-3 fade-in ${l.invalid || l.out ? 'opacity-70' : ''}">
      <button data-act="go" data-v="product" data-id="${esc(l.productId)}">${lineThumb(l)}</button>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-2"><b class="text-[14px] leading-snug">${esc(l.p?.name || 'منتج غير متوفر')}</b><button class="w-7 h-7 rounded-lg grid place-items-center flex-none" data-act="rmline" data-i="${i}" aria-label="حذف">${ic(P.trash, 15, '#B4232A', 1.9)}</button></div>
        ${l.p ? `<span class="block text-[11px] text-muted leading-5">${esc(selText(l.p, l.sel))}</span>` : ''}
        ${l.notes ? `<span class="block text-[11px] text-muted truncate">ملاحظات: ${esc(l.notes)}</span>` : ''}
        ${l.files?.length ? `<span class="block text-[11px] text-deep">${ic(P.attach, 12, '#075A9F', 2)} ${l.files.length} ملف مرفق</span>` : ''}
        ${l.invalid ? '<span class="block text-[11.5px] text-[#B4232A] font-bold">لم يعد هذا المنتج متاحًا للشراء المباشر — احذفه أو اطلب له عرض سعر</span>' : `
        <div class="flex items-center justify-between mt-1.5">
          <div class="flex items-center bg-tint rounded-xl h-8"><button class="w-8 h-8 grid place-items-center" data-act="lineqty" data-i="${i}" data-d="1" aria-label="زيادة">${ic(P.plus, 13, '#075A9F', 2.6)}</button><b class="min-w-[30px] text-center text-[13px]" dir="ltr">${l.qty}</b><button class="w-8 h-8 grid place-items-center" data-act="lineqty" data-i="${i}" data-d="-1" aria-label="إنقاص">${ic(P.minus, 13, '#075A9F', 2.6)}</button></div>
          <span class="text-left"><b class="block text-[14.5px] text-deep" dir="ltr">${fmtSAR(l.lineTotal)}</b>${l.unitCompare ? `<s class="block text-[11px] text-muted" dir="ltr">${fmtSAR(l.unitCompare * l.qty)}</s>` : ''}</span>
        </div>
        ${l.out ? '<span class="block text-[11.5px] text-[#B4232A] font-bold mt-1">نفدت الكمية</span>' : l.low ? `<span class="block text-[11.5px] text-[#9A5B00] font-bold mt-1">المتوفر ${l.p.stock} فقط</span>` : ''}
        ${l.qty < (l.p.minQty || 1) ? `<span class="block text-[11.5px] text-[#9A5B00] font-bold mt-1">الحد الأدنى ${l.p.minQty}</span>` : ''}`}
      </div></div>`).join('')}</div>
    <div class="${card} p-3.5 mt-3">${summaryHtml(t, 'pickup')}
      <p class="text-[11px] text-muted mt-2 leading-5">${esc(S().pricesApprovedNote || '')} رسوم التوصيل تُحتسب في الخطوة التالية.</p></div>
    <button class="${btnP} w-full mt-3" data-act="go" data-v="checkout" ${ok.length && !lines.some((l) => l.out || l.low) ? '' : 'disabled'}>متابعة إتمام الطلب <span class="text-[12px] font-medium bg-white/20 rounded-lg px-2.5 py-0.5" dir="ltr">${fmtSAR(t.total)}</span></button>
    <button class="${btnS} w-full mt-2" data-act="go" data-v="shop">مواصلة التسوق</button>
    ${qn ? quoteNotice(qn) : ''}
  </div>`;
};
const quoteNotice = (n) => `<button class="press mx-4 mt-4 w-[calc(100%-2rem)] flex items-center gap-2.5 bg-white border border-dashed border-deep/25 rounded-[20px] p-3 text-right" data-act="go" data-v="quote"><span class="w-10 h-10 rounded-[13px] bg-[#FFF3E3] grid place-items-center flex-none">${ic(P.msg, 20, '#F7941E')}</span><span class="flex-1"><b class="block text-[13.5px]">لديك ${n} ${n === 1 ? 'بند' : 'بنود'} في طلب عرض السعر</b><span class="block text-[11px] text-muted">منتجات تُسعَّر حسب المواصفات — أكمل الطلب لنرسل لك السعر</span></span>${ic(P.chev, 14, '#6B8299', 2.2)}</button>`;
TITLES.cart = () => 'سلة المشتريات';
ACT.rmline = (t) => { state.cart.splice(+t.dataset.i, 1); save.cart(); refresh(); };
ACT.lineqty = (t) => {
  const l = state.cart[+t.dataset.i]; const p = productById(l.productId); if (!p) return;
  const step = p.minQty >= 10 ? p.minQty : 1;
  l.qty = Math.max(p.minQty, l.qty + Number(t.dataset.d) * step); if (p.stock !== null && p.stock > 0) l.qty = Math.min(l.qty, p.stock);
  save.cart(); refresh();
};
const steps = (n) => `<div class="flex items-center gap-1.5 mb-3.5" aria-label="خطوات الطلب">${['السلة', 'البيانات والاستلام', 'الدفع والتأكيد'].map((t, i) => `<span class="flex items-center gap-1.5 ${i ? 'flex-1' : ''}">${i ? `<i class="flex-1 h-0.5 rounded ${i < n ? 'bg-deep' : 'bg-deep/10'}"></i>` : ''}<span class="w-[26px] h-[26px] rounded-full ${i < n ? 'bg-deep text-white font-bold' : 'bg-white hair text-muted'} text-[12px] grid place-items-center flex-none">${i + 1}</span><span class="text-[11px] ${i < n ? 'text-deep font-bold' : 'text-muted'} whitespace-nowrap">${t}</span></span>`).join('')}</div>`;

/* ================================================================ checkout */
const draft = () => LS.get('checkout', {});
const seg = (name, opts, cur) => `<div class="grid grid-cols-${opts.length} gap-1.5">${opts.map(([k, t, d]) => `<label class="opt block"><input type="radio" class="sr-only" name="${name}" value="${k}" ${cur === k ? 'checked' : ''}><span class="!flex !flex-col !items-start !h-auto !py-2.5 !rounded-2xl w-full"><b class="text-[13px]">${t}</b>${d ? `<small class="text-[10.5px] !opacity-80 font-normal leading-4">${d}</small>` : ''}</span></label>`).join('')}</div>`;
V.checkout = () => {
  const lines = cartLines().filter((l) => !l.invalid);
  if (!lines.length) return `${appbar('إتمام الطلب', '<span class="w-11"></span>')}${empty(P.cart, 'لا توجد منتجات لإتمام الطلب', 'أضف منتجات جاهزة إلى السلة أولًا.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="shop">تصفح المنتجات</button>`)}`;
  const d = { customerType: 'individual', delivery: S().pickupEnabled !== false ? 'pickup' : 'delivery', ...draft() };
  const c = state.customer || {}; const u = state.user;
  const pays = Object.entries(PAYMENT_METHODS).filter(([k]) => S().payments?.[k] && (k !== 'bank' || S().iban));
  if (!d.payment || !pays.some(([k]) => k === d.payment)) d.payment = pays[0]?.[0];
  const addrs = c.addresses || [];
  return `${appbar('إتمام الطلب', '<span class="w-11"></span>')}
  <form id="coForm" class="px-4 pb-8" novalidate>
    ${steps(2)}
    ${!u ? `<div class="flex items-center gap-2.5 bg-tint rounded-2xl p-3 mb-3"><span class="flex-1 text-[12px] text-[#3E5873]">لديك حساب؟ سجّل الدخول لاستخدام عناوينك المحفوظة ومتابعة طلباتك.</span><button type="button" class="press h-8 px-3 rounded-full bg-white hair text-deep text-[12px] font-bold" data-act="go" data-v="login" data-id="checkout">دخول</button></div>` : ''}
    <section class="${card} p-3.5">
      <b class="flex items-center gap-2 text-[15px] font-extrabold text-deep"><span class="w-6 h-6 rounded-full bg-deep text-white text-[12px] grid place-items-center">1</span>بيانات العميل</b>
      <div class="mt-3">${seg('ctype', Object.entries(CUSTOMER_TYPES).map(([k, t]) => [k, t]), d.customerType)}</div>
      <div id="orgFields" class="${d.customerType === 'individual' ? 'hidden' : ''}">
        ${field('coCompany', 'اسم الجهة / الشركة', `maxlength="120" value="${esc(d.company || c.company || '')}"`, true)}
        ${field('coVat', 'الرقم الضريبي (اختياري — لإصدار فاتورة باسم الجهة)', `inputmode="numeric" maxlength="15" dir="ltr" style="text-align:right" value="${esc(d.vatNumber || c.vatNumber || '')}"`)}
      </div>
      ${field('coName', 'الاسم الكامل', `autocomplete="name" maxlength="100" value="${esc(d.name || c.name || '')}"`, true)}
      ${label('coPhone', 'رقم الجوال', true)}<div class="relative"><input id="coPhone" class="field pl-16" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX" value="${esc(d.phone || c.phone || '')}"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted border-r border-deep/10 pr-2.5" dir="ltr">+966</span></div>
      ${field('coEmail', 'البريد الإلكتروني', `type="email" autocomplete="email" maxlength="120" dir="ltr" style="text-align:right" value="${esc(d.email || c.email || u?.email || '')}"`)}
    </section>
    <section class="${card} p-3.5 mt-3">
      <b class="flex items-center gap-2 text-[15px] font-extrabold text-deep"><span class="w-6 h-6 rounded-full bg-deep text-white text-[12px] grid place-items-center">2</span>الاستلام والتوصيل</b>
      <div class="mt-3">${seg('delivery', [...(S().pickupEnabled !== false ? [['pickup', DELIVERY.pickup, esc(S().branchName)]] : []), ...(S().deliveryEnabled !== false ? [['delivery', DELIVERY.delivery, S().deliveryFee != null ? `الرسوم ${fmtSAR(S().deliveryFee)}` : 'الرسوم حسب المدينة']] : [])], d.delivery)}</div>
      <div id="addrFields" class="${d.delivery === 'delivery' ? '' : 'hidden'}">
        ${addrs.length ? `${label('coAddrSel', 'عنوان محفوظ')}<select id="coAddrSel" class="field"><option value="">عنوان جديد</option>${addrs.map((a, i) => `<option value="${i}" ${a.isDefault ? 'selected' : ''}>${esc(a.label || a.city)} — ${esc(a.city)}، ${esc(a.district || '')}</option>`).join('')}</select>` : ''}
        <div class="grid grid-cols-2 gap-2">
          <div>${field('coCity', 'المدينة', `maxlength="60" value="${esc(d.city || '')}"`, true)}</div>
          <div>${field('coDistrict', 'الحي', `maxlength="60" value="${esc(d.district || '')}"`)}</div>
        </div>
        ${field('coStreet', 'الشارع / العنوان الوطني المختصر', `maxlength="160" value="${esc(d.street || '')}"`, true)}
        ${field('coAddrNote', 'تفاصيل إضافية (مبنى، علامة مميزة)', `maxlength="200" value="${esc(d.addrNote || '')}"`)}
      </div>
    </section>
    <section class="${card} p-3.5 mt-3">
      <b class="flex items-center gap-2 text-[15px] font-extrabold text-deep"><span class="w-6 h-6 rounded-full bg-deep text-white text-[12px] grid place-items-center">3</span>طريقة الدفع</b>
      <div class="grid gap-1.5 mt-3">${pays.map(([k, m]) => `<label class="flex items-start gap-2.5 bg-surface hair rounded-2xl px-3 py-2.5"><input type="radio" name="payment" value="${k}" class="w-5 h-5 mt-0.5 accent-[#075A9F]" ${d.payment === k ? 'checked' : ''}><span><b class="block text-[13.5px]">${m.t}</b><span class="block text-[11.5px] text-muted">${m.d}</span></span></label>`).join('') || '<p class="text-[12.5px] text-[#B4232A]">لا توجد طرق دفع مفعّلة حاليًا — تواصل معنا لإتمام الطلب.</p>'}</div>
      <p class="text-[11px] text-muted mt-2">الدفع الإلكتروني بالبطاقات غير مفعّل حاليًا. <button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="payment">سياسة الدفع</button></p>
    </section>
    <section class="${card} p-3.5 mt-3">
      <b class="flex items-center gap-2 text-[15px] font-extrabold text-deep">${ic(P.layers, 18)}مراجعة الطلب</b>
      <div class="grid gap-2 mt-2.5">${lines.map((l) => `<div class="flex gap-2.5 text-[12.5px]">${imgTag(l.p.image, 'w-12 h-12 rounded-xl object-cover flex-none', l.p.name)}<span class="flex-1 min-w-0"><b class="block truncate">${esc(l.p.name)} × ${l.qty}</b><span class="block text-[11px] text-muted truncate">${esc(selText(l.p, l.sel))}</span></span><b class="text-deep" dir="ltr">${fmtSAR(l.lineTotal)}</b></div>`).join('')}</div>
      <div id="coSummary" class="mt-3 border-t border-deep/5 pt-3"></div>
      ${label('coNotes', 'ملاحظات على الطلب')}<textarea id="coNotes" class="field !h-20" maxlength="500" placeholder="أي تفاصيل إضافية تخص التنفيذ أو التسليم">${esc(d.notes || '')}</textarea>
      <label class="flex items-start gap-2 text-[12px] text-[#4A6580] mt-3"><input id="coOk" type="checkbox" class="w-5 h-5 mt-0.5 accent-[#075A9F] flex-none"><span>أوافق على <button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="terms">الشروط والأحكام</button> و<button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="returns">سياسة الاستبدال والاسترجاع</button> و<button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="privacy">سياسة الخصوصية</button>، وأعلم أن المنتجات المخصصة لا تُسترجع بعد اعتماد التصميم.</span></label>
    </section>
    <button id="coSend" class="${btnP} w-full mt-4" type="submit" ${pays.length ? '' : 'disabled'}>تأكيد الطلب</button>
    <p class="text-[11px] text-muted text-center mt-2">سيُراجع فريقنا الطلب ويتواصل معك لتأكيده قبل التنفيذ.</p>
  </form>`;
};
TITLES.checkout = () => 'إتمام الطلب';
function readCheckout(el) {
  const g = (id) => el.querySelector('#' + id)?.value.trim() || '';
  const r = (n) => el.querySelector(`input[name="${n}"]:checked`)?.value;
  return { customerType: r('ctype') || 'individual', company: g('coCompany'), vatNumber: g('coVat'), name: g('coName'), phone: g('coPhone'), email: g('coEmail'), delivery: r('delivery') || 'pickup', city: g('coCity'), district: g('coDistrict'), street: g('coStreet'), addrNote: g('coAddrNote'), payment: r('payment'), notes: g('coNotes') };
}
AFTER.checkout = (el) => {
  const f = el.querySelector('#coForm'); if (!f) return;
  const upd = () => {
    const d = readCheckout(el); LS.set('checkout', d);
    el.querySelector('#orgFields').classList.toggle('hidden', d.customerType === 'individual');
    el.querySelector('#addrFields').classList.toggle('hidden', d.delivery !== 'delivery');
    el.querySelector('#coSummary').innerHTML = summaryHtml(totals(cartLines().filter((l) => !l.invalid), { ...S(), delivery: d.delivery }), d.delivery);
  };
  upd();
  f.addEventListener('change', upd); f.addEventListener('input', (e) => e.target.classList?.remove('err'));
  const sel = el.querySelector('#coAddrSel');
  const fill = () => { const a = (state.customer?.addresses || [])[sel.value]; if (!a) return; el.querySelector('#coCity').value = a.city || ''; el.querySelector('#coDistrict').value = a.district || ''; el.querySelector('#coStreet').value = a.street || ''; el.querySelector('#coAddrNote').value = a.details || ''; upd(); };
  if (sel) { sel.addEventListener('change', fill); if (sel.value !== '' && !draft().street) fill(); }
  f.addEventListener('submit', (e) => { e.preventDefault(); submitCheckout(el); });
};
async function submitCheckout(el) {
  const d = readCheckout(el); const btn = el.querySelector('#coSend'); if (btn.disabled) return;
  const phone = normPhone(d.phone);
  const checks = [['#coName', d.name.length >= 2], ['#coPhone', okPhone(phone)], ['#coEmail', !d.email || okEmail(d.email)]];
  if (d.customerType !== 'individual') checks.unshift(['#coCompany', d.company.length >= 2]);
  if (d.delivery === 'delivery') checks.push(['#coCity', d.city.length >= 2], ['#coStreet', d.street.length >= 3]);
  let bad = null;
  checks.forEach(([s, ok]) => { const i = el.querySelector(s); if (!i) return; i.classList.toggle('err', !ok); if (!ok && !bad) bad = i; });
  if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('أكمل البيانات المطلوبة', 'تحقق من الحقول المحددة باللون الأحمر', 'info'); return; }
  if (!d.payment) { toast('اختر طريقة الدفع', '', 'info'); return; }
  if (!el.querySelector('#coOk').checked) { toast('يلزم الموافقة على الشروط والسياسات', '', 'info'); return; }
  const lines = cartLines().filter((l) => !l.invalid);
  const t = totals(lines, { ...S(), delivery: d.delivery });
  const order = {
    type: 'purchase', customerType: d.customerType, company: d.customerType !== 'individual' ? d.company : '', vatNumber: d.customerType !== 'individual' ? d.vatNumber : '',
    name: d.name, phone, email: d.email, delivery: d.delivery,
    address: d.delivery === 'delivery' ? { city: d.city, district: d.district, street: d.street, details: d.addrNote } : null,
    paymentMethod: d.payment, notes: d.notes,
    items: lines.map((l) => ({ productId: l.productId, name: l.p.name, qty: l.qty, sel: l.sel, selText: selText(l.p, l.sel), unit: l.p.unit, unitPrice: l.unitPrice, unitCompare: l.unitCompare, lineTotal: l.lineTotal, priceApproved: l.p.priceApproved, notes: l.notes || '', files: (l.files || []).map(({ name, size, path }) => ({ name, size, path })) })),
    totals: { subtotal: t.subtotal, savings: t.savings, deliveryFee: d.delivery === 'delivery' ? S().deliveryFee ?? null : 0, vat: t.vat, vatRate: t.vatRate, vatIncluded: t.vatIncluded, total: t.total, currency: 'SAR' },
  };
  await placeOrder(order, btn, 'checkout');
}

/** إرسال الطلب أو عرض السعر إلى Firestore (أو واتساب إن لم تُضبط قاعدة البيانات) */
export async function placeOrder(order, btn, from) {
  if (!isConfigured) {
    window.open(waLink(orderText(order)), '_blank', 'noopener');
    finish({ ref: '', ...order, via: 'whatsapp' }); return;
  }
  busy(btn, true, order.type === 'purchase' ? 'جارٍ تأكيد الطلب…' : 'جارٍ إرسال الطلب…');
  try {
    const uid = state.user && !state.user.isAnonymous ? state.user.uid : null;
    const r = await createOrder(order, uid);
    finish({ ...order, ...r });
  } catch (err) {
    console.error('[emdad] order failed', err);
    busy(btn, false);
    state.failure = { order, from, reason: /timeout|network|offline|unavailable/i.test(String(err?.code || err?.message)) ? 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.' : /permission/i.test(String(err?.code)) ? 'لم تُقبل بيانات الطلب. راجع الحقول وحاول مجددًا.' : 'حدث خطأ غير متوقع أثناء إرسال الطلب.' };
    go('order-failed');
  }
}
function finish(o) {
  if (o.type === 'purchase') { state.cart = []; save.cart(); LS.del('checkout'); }
  else { state.quote = []; save.quote(); for (const k of Object.keys(state.uploads)) if (k.startsWith('q_')) state.uploads[k] = []; }
  if (o.ref) { state.myOrders.unshift({ ref: o.ref, tail: o.phone.slice(-4), type: o.type, at: Date.now(), total: o.totals?.total ?? null }); save.myOrders(); }
  state.lastOrder = o;
  state.stack = [['home'], ['order-success', o.ref || 'whatsapp']];
  history.replaceState({ d: 1 }, '', '#home'); history.pushState({ d: 2 }, '', '#order-success/' + encodeURIComponent(o.ref || 'whatsapp'));
  import('./core.js').then((m) => m.render('order-success', o.ref || 'whatsapp', 'fwd'));
}
const orderText = (o) => [
  `${o.type === 'purchase' ? 'طلب شراء' : `طلب ${QUOTE_KINDS[o.kind] || 'عرض سعر'}`}${o.ref ? ' رقم ' + o.ref : ''}`,
  o.company ? `الجهة: ${o.company}` : '', `الاسم: ${o.name}`, `الجوال: ${o.phone}`, o.email ? `البريد: ${o.email}` : '',
  ...(o.items || []).map((i) => `• ${i.name} × ${i.qty}${i.selText ? ` (${i.selText})` : ''}${i.lineTotal ? ` = ${fmtSARText(i.lineTotal)}` : ''}`),
  o.totals ? `الإجمالي: ${fmtSARText(o.totals.total)}` : '', o.description ? `التفاصيل: ${o.description}` : '', o.notes ? `ملاحظات: ${o.notes}` : '',
].filter(Boolean).join('\n');

/* ================================================================ success / failure */
V['order-success'] = (ref) => {
  const o = state.lastOrder && (state.lastOrder.ref || 'whatsapp') === ref ? state.lastOrder : null;
  const isP = o ? o.type === 'purchase' : true; const viaWa = ref === 'whatsapp';
  return `${appbar(viaWa ? 'تم تجهيز الطلب' : 'تم استلام طلبك', '<span class="w-11"></span>')}
  <div class="px-4 pb-8 text-center">
    <span class="mx-auto mt-2 w-20 h-20 rounded-full bg-[#E6F6EE] grid place-items-center pop">${ic(P.check, 38, '#12A150', 2.6)}</span>
    <h2 class="text-[21px] font-extrabold text-deep mt-3">${viaWa ? 'أكمل الإرسال عبر واتساب' : isP ? 'تم تأكيد استلام طلبك' : 'استلمنا طلب عرض السعر'}</h2>
    <p class="text-[13px] text-muted mt-1 leading-6">${viaWa ? 'فُتحت محادثة واتساب بتفاصيل طلبك، أرسلها لفريقنا لإتمامه.' : isP ? 'سيراجع فريقنا الطلب ويتواصل معك لتأكيده وتحديد موعد التنفيذ.' : 'سندرس طلبك ونرسل لك عرض السعر خلال يوم عمل.'}</p>
    ${!viaWa ? `<div class="mt-4 mx-auto w-fit ${card} px-6 py-3"><span class="block text-[11px] text-muted">رقم الطلب</span><b id="orderNo" class="block text-[24px] font-extrabold tracking-wider" dir="ltr">${esc(ref)}</b></div>` : ''}
    ${o?.totals ? `<div class="${card} p-3.5 mt-4 text-right">${summaryHtml(o.totals, o.delivery)}<div class="flex justify-between text-[12.5px] mt-2"><span class="text-muted">طريقة الدفع</span><b>${PAYMENT_METHODS[o.paymentMethod]?.t || ''}</b></div></div>` : ''}
    ${o?.paymentMethod === 'bank' && S().iban ? `<div class="${card} p-3.5 mt-3 text-right"><b class="block text-[14px] text-deep">بيانات التحويل البنكي</b><div class="text-[12.5px] mt-1.5 leading-7">البنك: ${esc(S().bankName)}<br>اسم المستفيد: ${esc(S().accountName)}<br>الآيبان: <b dir="ltr" class="select-all">${esc(S().iban)}</b></div><p class="text-[11.5px] text-muted mt-1">حوّل المبلغ بعد تأكيد الطلب من فريقنا، وأرسل الإيصال مع رقم الطلب عبر واتساب.</p></div>` : ''}
    <div class="${card} p-3.5 mt-3 text-right"><b class="block text-[14px] mb-2">الخطوات التالية</b>${(isP ? ['مراجعة الطلب وتأكيده معك', 'اعتماد التصميم والدفع', 'التنفيذ', 'الاستلام أو التوصيل'] : ['دراسة الطلب والمواصفات', 'إرسال عرض السعر', 'اعتماد العرض والتصميم', 'التنفيذ والتسليم']).map((s, i) => `<div class="flex items-center gap-2.5 text-[12.5px] py-1"><span class="w-6 h-6 rounded-full ${i ? 'bg-tint text-deep' : 'bg-deep text-white'} text-[11px] font-bold grid place-items-center">${i + 1}</span>${s}</div>`).join('')}</div>
    <div class="grid gap-2 mt-4">
      ${!viaWa ? `<button class="${btnP}" data-act="go" data-v="track" data-id="${esc(ref)}">${ic(P.truck, 18, '#fff', 2)}تتبع حالة الطلب</button>` : ''}
      <a class="${btnS}" href="${esc(waLink(o ? orderText(o) : `استفسار عن الطلب ${ref}`))}" target="_blank" rel="noopener">${WA(19)}${viaWa ? 'فتح واتساب مجددًا' : 'تواصل بخصوص الطلب عبر واتساب'}</a>
      <button class="${btnS}" data-act="go" data-v="shop">مواصلة التسوق</button>
    </div>
  </div>`;
};
TITLES['order-success'] = () => 'تم استلام الطلب';
V['order-failed'] = () => {
  const f = state.failure;
  return `${appbar('تعذّر إتمام الطلب', '<span class="w-11"></span>')}
  <div class="px-4 pb-8 text-center">
    <span class="mx-auto mt-2 w-20 h-20 rounded-full bg-[#FDECEC] grid place-items-center">${ic(P.x, 34, '#E5484D', 2.6)}</span>
    <h2 class="text-[21px] font-extrabold text-deep mt-3">لم يكتمل إرسال الطلب</h2>
    <p class="text-[13px] text-muted mt-1 leading-6">${esc(f?.reason || 'حدث خطأ أثناء إرسال الطلب.')} لم يُسجَّل الطلب ولم تُخصم أي مبالغ، ومحتويات سلتك محفوظة.</p>
    <div class="grid gap-2 mt-5">
      <button class="${btnP}" data-act="retry">إعادة المحاولة</button>
      ${f ? `<a class="${btnS}" href="${esc(waLink(orderText(f.order)))}" target="_blank" rel="noopener">${WA(19)}أرسل الطلب عبر واتساب بدلًا من ذلك</a>` : ''}
      <button class="${btnS}" data-act="go" data-v="contact">تواصل مع الدعم</button>
    </div>
  </div>`;
};
TITLES['order-failed'] = () => 'تعذّر إتمام الطلب';
ACT.retry = () => { const f = state.failure; replace(f?.from || 'cart', f?.arg); };

/* ================================================================ quote forms */
const KIND_META = {
  quote: { kind: 'rfq', title: 'طلب عرض سعر', h: 'طلب عرض سعر للشركات والجهات', sub: 'للشركات والمؤسسات والجهات الحكومية والأفراد: أرسل المنتجات والكميات والمواصفات، وسنرسل لك عرض سعر مفصّل خلال يوم عمل.' },
  project: { kind: 'project', title: 'طلب مشروع خاص', h: 'طلب مشروع خاص', sub: 'للمشاريع المتكاملة والكميات الكبيرة: تجهيز معارض، منظومات لوحات، هويات متكاملة، وتوريدات الجهات.' },
  custom: { kind: 'custom', title: 'طلب منتج مخصص', h: 'طلب منتج مخصص', sub: 'اختر المنتج وحدد المقاسات والخامات والتشطيبات، وأرفق تصميمك لنحسب لك السعر بدقة.' },
};
function quoteForm(view, arg) {
  const m = KIND_META[view]; const c = state.customer || {};
  const preCat = arg?.startsWith?.('cat:') ? arg.slice(4) : '';
  const preProduct = view === 'custom' && arg && productById(arg) ? arg : '';
  const items = view === 'quote' ? state.quote.map((l) => ({ ...l, p: productById(l.productId) })).filter((l) => l.p) : [];
  const org = view !== 'custom';
  const cp = preProduct ? productById(preProduct) : null;
  return `${appbar(m.title)}
  <form id="qForm" data-kind="${view}" class="px-4 pb-8" novalidate>
    <div class="no-sb flex gap-2 overflow-x-auto mb-3">${Object.entries(KIND_META).map(([k, x]) => `<button type="button" class="chip press ${k === view ? 'on' : ''}" data-act="go" data-v="${k}">${x.title}</button>`).join('')}</div>
    <h2 class="text-[22px] font-extrabold text-deep">${m.h}</h2>
    <p class="text-[12.5px] text-muted mb-1 leading-6">${m.sub} الحقول المشار إليها بـ <b class="text-orange">*</b> مطلوبة.</p>

    <section class="${card} p-3.5 mt-3">
      <b class="block text-[14.5px] font-extrabold text-deep">${org ? 'معلومات الجهة الطالبة' : 'بيانات التواصل'}</b>
      ${org ? `<div class="mt-2.5">${seg('ctype', Object.entries(CUSTOMER_TYPES).map(([k, t]) => [k, t]), c.company ? 'business' : 'business')}</div>
      ${field('qCompany', 'اسم الشركة / الجهة', `maxlength="120" value="${esc(c.company || '')}"`, false)}` : ''}
      ${field('qName', org ? 'اسم الشخص المسؤول' : 'الاسم الكامل', `autocomplete="name" maxlength="100" value="${esc(c.name || '')}"`, true)}
      ${org ? field('qRole', 'المسمى الوظيفي', 'maxlength="80"') : ''}
      ${label('qPhone', 'رقم التواصل', true)}<div class="relative"><input id="qPhone" class="field pl-16" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX" value="${esc(c.phone || '')}"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted border-r border-deep/10 pr-2.5" dir="ltr">+966</span></div>
      ${field('qMail', 'البريد الإلكتروني', `type="email" autocomplete="email" maxlength="120" dir="ltr" style="text-align:right" value="${esc(c.email || state.user?.email || '')}"`, org)}
      ${org ? `<div class="grid grid-cols-2 gap-2"><div>${field('qVat', 'الرقم الضريبي', `maxlength="15" inputmode="numeric" dir="ltr" style="text-align:right" value="${esc(c.vatNumber || '')}"`)}</div><div>${field('qCity', 'المدينة', 'maxlength="60"')}</div></div>` : field('qCity', 'المدينة', 'maxlength="60"')}
    </section>

    <section class="${card} p-3.5 mt-3">
      <b class="block text-[14.5px] font-extrabold text-deep">${view === 'project' ? 'تفاصيل المشروع' : view === 'custom' ? 'المنتج والمواصفات' : 'المنتجات المطلوبة'}</b>
      ${view === 'quote' ? `
        <div id="qItems" class="grid gap-1.5 mt-2.5">${items.map((l, i) => `<div class="flex items-center gap-2.5 bg-surface hair rounded-2xl p-2">${imgTag(l.p.image, 'w-12 h-12 rounded-xl object-cover flex-none', l.p.name)}<span class="flex-1 min-w-0"><b class="block text-[13px] truncate">${esc(l.p.name)}</b><span class="block text-[10.5px] text-muted truncate">${esc(selText(l.p, l.sel))}</span></span><label class="text-[11px] text-muted flex items-center gap-1">الكمية<input class="w-16 h-8 rounded-lg hair text-center text-[13px] bg-white" inputmode="numeric" data-qqty="${i}" value="${l.qty}" dir="ltr"></label><button type="button" class="w-7 h-7 grid place-items-center" data-act="rmquote" data-i="${i}" aria-label="حذف">${ic(P.x, 12, '#6B8299', 2.4)}</button></div>`).join('')}</div>
        <button type="button" class="press mt-2 w-full h-10 rounded-xl bg-white border border-dashed border-deep/30 text-deep text-[12.5px] font-bold" data-act="pickquote">+ إضافة منتج من المتجر</button>
        ${label('qSvc', 'التصنيف الرئيسي للطلب', true)}<select id="qSvc" class="field"><option value="">اختر التصنيف</option>${CATS().map((s) => `<option value="${esc(s.id)}" ${s.id === (preCat || items[0]?.p.categoryId) ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}<option value="other">مشروع متكامل / أخرى</option></select>
        ${field('qQty', 'الكميات الإجمالية التقديرية', 'maxlength="120" placeholder="مثال: 50 درعًا + 200 كوب"')}
        ${label('qSpecs', 'المواصفات المطلوبة')}<textarea id="qSpecs" class="field !h-24" maxlength="1500" placeholder="المقاسات، الخامات، الألوان، التشطيبات…"></textarea>` : ''}
      ${view === 'project' ? `
        ${label('qTypes', 'نوع المنتجات المطلوبة', true)}<div id="qTypes" class="flex flex-wrap gap-1.5">${CATS().map((s) => `<label class="opt"><input type="checkbox" class="sr-only" value="${esc(s.id)}" ${s.id === preCat ? 'checked' : ''}><span>${esc(s.name)}</span></label>`).join('')}</div>
        ${field('qTitle', 'اسم المشروع / المناسبة', 'maxlength="120"')}
        ${field('qQty', 'الكميات التقديرية', 'maxlength="160" placeholder="مثال: 40 لوحة إرشادية + 6 لوحات مداخل"', true)}
        ${label('qSpecs', 'المواصفات الفنية', true)}<textarea id="qSpecs" class="field !h-24" maxlength="1500" placeholder="المقاسات، الخامات، الإضاءة، معايير الجهة…"></textarea>` : ''}
      ${view === 'custom' ? `
        ${label('qProduct', 'المنتج', true)}<select id="qProduct" class="field"><option value="">اختر المنتج</option>${CATS().map((c) => `<optgroup label="${esc(c.name)}">${state.catalog.products.filter((p) => p.categoryId === c.id).map((p) => `<option value="${esc(p.id)}" ${p.id === preProduct ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}<option value="other">منتج غير موجود في القائمة</option></select>
        <div id="qCustomOpts">${customOpts(cp)}</div>
        <div class="grid grid-cols-2 gap-2"><div>${field('qSize', 'المقاس المطلوب', 'maxlength="80" placeholder="مثال: 120×60 سم"', true)}</div><div>${field('qQty', 'الكمية', 'maxlength="40" inputmode="numeric"', true)}</div></div>
        ${field('qMaterial', 'الخامة', 'maxlength="80" placeholder="مثال: أكريلك 5 مم"')}
        ${field('qFinish', 'التشطيب', 'maxlength="80" placeholder="مثال: ذهبي مرآة / مطفي"')}` : ''}
      ${label('qDesc', view === 'project' ? 'وصف المشروع' : view === 'custom' ? 'ملاحظات إضافية' : 'تفاصيل المشروع', view !== 'custom')}
      <div class="relative"><textarea id="qDesc" class="field" maxlength="2000" placeholder="${view === 'project' ? 'الهدف من المشروع، الموقع، المراحل، أي متطلبات خاصة…' : 'اشرح طلبك بالتفصيل…'}"></textarea><span id="qCount" class="absolute left-3 bottom-2 text-[10.5px] text-[#9AABBB]" dir="ltr">0 / 2000</span></div>
      <div class="grid grid-cols-2 gap-2"><div>${field('qDeadline', 'موعد التسليم المطلوب', 'type="date"')}</div><div>${label('qBudget', 'الميزانية التقديرية')}<select id="qBudget" class="field"><option value="">غير محددة</option><option>أقل من 5,000 ⃁</option><option>5,000 – 20,000 ⃁</option><option>20,000 – 100,000 ⃁</option><option>أكثر من 100,000 ⃁</option></select></div></div>
    </section>

    <section class="${card} p-3.5 mt-3">${uploadBox('q_' + view, view === 'project' ? 'الملفات والمخططات' : view === 'custom' ? 'رفع التصميم' : 'المرفقات وملفات التصميم')}</section>

    <label class="flex items-start gap-2 text-[12px] text-[#4A6580] mt-3"><input id="qOk" type="checkbox" class="w-5 h-5 mt-0.5 accent-[#075A9F] flex-none"><span>أوافق على استخدام بياناتي للرد على الطلب وفق <button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="privacy">سياسة الخصوصية</button> و<button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="ip">سياسة ملفات التصميم</button>.</span></label>
    <button id="qSend" class="${btnP} w-full mt-4" type="submit">إرسال الطلب</button>
  </form>${footer()}`;
}
function customOpts(p) {
  if (!p || !p.options.length) return '';
  return `<div class="mt-2 bg-tint rounded-2xl p-2.5"><b class="block text-[12px] mb-1.5">خيارات ${esc(p.name)}</b>${p.options.map((o, oi) => `<div class="mt-1.5"><span class="block text-[11.5px] text-muted mb-1">${esc(o.name)}</span><div class="flex flex-wrap gap-1.5">${o.values.map((v, vi) => `<label class="opt"><input type="radio" class="sr-only" name="co${oi}" data-copt="${esc(o.name)}" value="${esc(v.label)}" ${vi ? '' : 'checked'}><span>${esc(v.label)}</span></label>`).join('')}</div></div>`).join('')}</div>`;
}
for (const view of Object.keys(KIND_META)) {
  V[view] = (arg) => quoteForm(view, arg);
  TITLES[view] = () => KIND_META[view].title;
  AFTER[view] = (el) => bindQuote(el, view);
}
ACT.rmquote = (t) => { state.quote.splice(+t.dataset.i, 1); save.quote(); refresh(); };
ACT.pickquote = () => { toast('اختر المنتج', 'افتح المنتج واضغط «اطلب عرض سعر» أو «كميات كبيرة؟»', 'info'); go('shop'); };
function bindQuote(el, view) {
  const f = el.querySelector('#qForm'); const d = el.querySelector('#qDesc');
  bindUploads(el);
  d.addEventListener('input', () => { el.querySelector('#qCount').textContent = `${d.value.length} / 2000`; });
  f.addEventListener('input', (e) => e.target.classList?.remove('err'));
  el.querySelectorAll('[data-qqty]').forEach((i) => i.addEventListener('change', () => { const l = state.quote[+i.dataset.qqty]; l.qty = Math.max(1, parseInt(i.value, 10) || 1); i.value = l.qty; save.quote(); }));
  el.querySelector('#qProduct')?.addEventListener('change', (e) => { el.querySelector('#qCustomOpts').innerHTML = customOpts(productById(e.target.value)); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id)?.value.trim() || '';
    const phone = normPhone(g('qPhone')); const email = g('qMail');
    const types = [...el.querySelectorAll('#qTypes input:checked')].map((i) => i.value);
    const checks = [['#qName', g('qName').length >= 2], ['#qPhone', okPhone(phone)], ['#qMail', view === 'custom' ? (!email || okEmail(email)) : okEmail(email)]];
    if (view === 'quote') checks.push(['#qSvc', !!g('qSvc')], ['#qDesc', g('qDesc').length >= 3]);
    if (view === 'project') checks.push(['#qTypes', types.length > 0], ['#qQty', g('qQty').length >= 1], ['#qSpecs', g('qSpecs').length >= 3], ['#qDesc', g('qDesc').length >= 3]);
    if (view === 'custom') checks.push(['#qProduct', !!g('qProduct')], ['#qSize', g('qSize').length >= 1], ['#qQty', g('qQty').length >= 1]);
    let bad = null;
    checks.forEach(([s, ok]) => { const i = el.querySelector(s); i.classList.toggle('err', !ok); if (i.id === 'qTypes') i.classList.toggle('ring-2', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); bad.focus?.(); toast('أكمل الحقول المطلوبة', 'تحقق من الحقول المحددة', 'info'); return; }
    if (uploading('q_' + view)) { toast('انتظر اكتمال رفع الملفات', '', 'info'); return; }
    if (!el.querySelector('#qOk').checked) { toast('يلزم الموافقة على سياسة الخصوصية', '', 'info'); return; }
    const ctype = el.querySelector('input[name="ctype"]:checked')?.value || 'individual';
    let items = []; let serviceId = g('qSvc');
    if (view === 'quote') items = state.quote.map((l) => { const p = productById(l.productId); return p && { productId: p.id, name: p.name, qty: l.qty, sel: l.sel, selText: selText(p, l.sel), notes: l.notes || '', files: (l.files || []).map(({ name, size, path }) => ({ name, size, path })) }; }).filter(Boolean);
    if (view === 'custom') {
      const p = productById(g('qProduct')); serviceId = p?.categoryId || 'other';
      const opts = Object.fromEntries([...el.querySelectorAll('input[data-copt]:checked')].map((i) => [i.dataset.copt, i.value]));
      items = [{ productId: p?.id || 'other', name: p?.name || 'منتج مخصص', qty: parseInt(g('qQty'), 10) || 1, sel: { opts, addons: [] }, selText: [`المقاس: ${g('qSize')}`, g('qMaterial') && `الخامة: ${g('qMaterial')}`, g('qFinish') && `التشطيب: ${g('qFinish')}`, ...Object.entries(opts).map(([k, v]) => `${k}: ${v}`)].filter(Boolean).join(' · '), notes: '' }];
    }
    if (view === 'project') serviceId = types[0];
    const order = {
      type: 'quote', kind: KIND_META[view].kind, customerType: view === 'custom' ? 'individual' : ctype,
      company: g('qCompany'), role: g('qRole'), vatNumber: g('qVat'), city: g('qCity'),
      name: g('qName'), phone, email,
      serviceId: serviceId || 'other', serviceName: catById(serviceId)?.name || 'مشروع متكامل / أخرى',
      categories: view === 'project' ? types : [], title: g('qTitle'),
      items, quantity: g('qQty'), specs: g('qSpecs'), description: g('qDesc'),
      deadline: g('qDeadline'), budget: g('qBudget'),
      files: filesOf('q_' + view).map(({ name, size, path }) => ({ name, size, path })),
    };
    if (!order.description) order.description = order.specs || order.items.map((i) => i.selText).join(' / ') || '—';
    await placeOrder(order, el.querySelector('#qSend'), view);
  });
}

/* ================================================================ tracking */
const timeline = (type, status, history = []) => {
  if (status === 'cancelled') return `<div class="bg-[#FDECEC] text-[#B4232A] rounded-xl px-3 py-2 text-[13px] font-bold mt-3">تم إلغاء الطلب</div>`;
  const flow = FLOW[type] || FLOW.quote; const cur = Math.max(0, flow.indexOf(status));
  const when = (k) => history.filter((h) => h.status === k).map((h) => fmtDate(h.at)).pop();
  return `<ol class="mt-3 grid gap-0">${flow.map((k, i) => `<li class="flex gap-3"><span class="flex flex-col items-center"><span class="w-7 h-7 rounded-full grid place-items-center ${i <= cur ? 'bg-deep' : 'bg-white hair'}">${i <= cur ? ic(P.check, 14, '#fff', 2.8) : `<i class="w-2 h-2 rounded-full bg-deep/20"></i>`}</span>${i < flow.length - 1 ? `<i class="w-0.5 flex-1 min-h-[18px] ${i < cur ? 'bg-deep' : 'bg-deep/10'}"></i>` : ''}</span><span class="pb-3"><b class="block text-[13.5px] ${i <= cur ? 'text-deep' : 'text-muted'}">${STATUS[k].t}</b>${when(k) ? `<span class="block text-[11px] text-muted">${when(k)}</span>` : i === cur ? '<span class="block text-[11px] text-orange font-bold">المرحلة الحالية</span>' : ''}</span></li>`).join('')}</ol>`;
};
export { timeline };
V.track = (ref) => {
  const recent = state.myOrders.slice(0, 6);
  return `${appbar('تتبع الطلب')}
  <div class="px-4 pb-8">
    <form id="trForm" class="${card} p-3.5" novalidate>
      <b class="block text-[15px] font-extrabold text-deep">تابع حالة طلبك</b>
      <p class="text-[12px] text-muted">أدخل رقم الطلب ورقم الجوال المستخدم في الطلب.</p>
      ${field('trRef', 'رقم الطلب', `dir="ltr" style="text-align:right" placeholder="EM-XXXXXX" maxlength="9" value="${esc(ref && ref !== 'whatsapp' ? ref : '')}"`, true)}
      ${field('trPhone', 'رقم الجوال', `inputmode="tel" dir="ltr" style="text-align:right" placeholder="05X XXX XXXX" maxlength="16" value="${esc(ref ? '0500000000'.slice(0, 0) : '')}"`, true)}
      <button id="trBtn" class="${btnP} w-full mt-3" type="submit">${ic(P.search, 17, '#fff', 2)}عرض الحالة</button>
    </form>
    <div id="trResult"></div>
    ${recent.length ? `<b class="block text-[14px] font-extrabold mt-5 mb-2">طلباتك الأخيرة على هذا الجهاز</b>${recent.map((o) => `<button class="press w-full ${card} px-3 py-2.5 mb-2 flex items-center gap-3 text-right" data-act="trackrecent" data-ref="${esc(o.ref)}" data-tail="${esc(o.tail)}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(o.type === 'purchase' ? P.cart : P.msg, 17)}</span><span class="flex-1"><b class="block text-[13.5px]" dir="ltr" style="text-align:right">${esc(o.ref)}</b><span class="block text-[11px] text-muted">${o.type === 'purchase' ? 'طلب شراء' : 'طلب عرض سعر'} · ${fmtDate(o.at)}${o.total != null ? ` · ${fmtSAR(o.total)}` : ''}</span></span>${ic(P.chev, 14, '#6B8299', 2.2)}</button>`).join('')}` : ''}
    ${state.user ? `<button class="${btnS} w-full mt-2" data-act="go" data-v="orders">كل طلباتي في حسابي</button>` : `<p class="text-[12px] text-muted text-center mt-4">سجّل الدخول لمتابعة جميع طلباتك من أي جهاز. <button class="text-deep font-bold" data-act="go" data-v="login">تسجيل الدخول</button></p>`}
  </div>`;
};
TITLES.track = () => 'تتبع الطلب';
async function doTrack(el, refNo, phoneOrTail) {
  const box = el.querySelector('#trResult'); const btn = el.querySelector('#trBtn');
  if (!isConfigured) { box.innerHTML = `<p class="${card} p-3.5 mt-3 text-[13px] text-muted">التتبع غير متاح حاليًا — تواصل معنا عبر واتساب برقم الطلب.</p>`; return; }
  busy(btn, true, 'جارٍ البحث…');
  try {
    const t = await getTracking(refNo, phoneOrTail);
    box.innerHTML = t ? `<div class="${card} p-3.5 mt-3 fade-in">
      <div class="flex items-start justify-between"><span><span class="block text-[11px] text-muted">${t.type === 'purchase' ? 'طلب شراء' : 'طلب عرض سعر'}</span><b class="block text-[18px] font-extrabold" dir="ltr" style="text-align:right">${esc(t.ref)}</b><span class="block text-[11px] text-muted">${fmtDate(t.createdAt)}</span></span><span class="text-[11.5px] font-bold rounded-lg px-2.5 py-1 ${STATUS[t.status]?.c || ''}">${STATUS[t.status]?.t || t.status}</span></div>
      ${t.total != null ? `<div class="flex justify-between text-[13px] mt-2"><span class="text-muted">الإجمالي</span><b dir="ltr">${fmtSAR(t.total)}</b></div>` : ''}
      ${t.quotedAmount != null ? `<div class="flex justify-between text-[13px] mt-1"><span class="text-muted">قيمة عرض السعر</span><b class="text-deep" dir="ltr">${fmtSAR(t.quotedAmount)}</b></div>` : ''}
      ${t.customerMessage ? `<p class="mt-2 text-[12.5px] bg-tint rounded-xl px-3 py-2">${esc(t.customerMessage)}</p>` : ''}
      ${timeline(t.type, t.status, t.history)}
      <a class="${btnS} !h-11 mt-1" href="${esc(waLink(`استفسار عن الطلب ${t.ref}`))}" target="_blank" rel="noopener">${WA(18)}استفسار عن الطلب</a>
    </div>` : `<p class="${card} p-3.5 mt-3 text-[13px] text-[#B4232A]">لم نجد طلبًا بهذه البيانات. تأكد من رقم الطلب ورقم الجوال.</p>`;
  } catch (e) { console.error(e); box.innerHTML = `<p class="${card} p-3.5 mt-3 text-[13px] text-[#B4232A]">تعذّر الاتصال، حاول مجددًا.</p>`; }
  busy(btn, false);
}
AFTER.track = (el) => {
  el.querySelector('#trForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = el.querySelector('#trRef').value.trim().toUpperCase(); const ph = normPhone(el.querySelector('#trPhone').value);
    const ok1 = /^EM-[A-Z0-9]{6}$/.test(r); const ok2 = okPhone(ph);
    el.querySelector('#trRef').classList.toggle('err', !ok1); el.querySelector('#trPhone').classList.toggle('err', !ok2);
    if (ok1 && ok2) doTrack(el, r, ph);
  });
  const ref = state.stack.at(-1)[1]; const rec = state.myOrders.find((o) => o.ref === ref);
  if (rec) doTrack(el, rec.ref, rec.tail);
};
ACT.trackrecent = (t) => { const el = $('#views').lastElementChild; el.querySelector('#trRef').value = t.dataset.ref; doTrack(el, t.dataset.ref, t.dataset.tail); el.scrollTo({ top: 0, behavior: 'smooth' }); };
