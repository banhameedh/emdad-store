/* الصفحات التعريفية والقانونية والدعم: من نحن، خدماتنا، اتصل بنا، الأسئلة الشائعة، السياسات، المساعدة، الإبلاغ، 404، الصيانة */
import {
  $, esc, ic, P, WA, state, S, CATS, productsOf, waLink, telLink, appbar, imgTag, V, AFTER, TITLES, ACT, go, toast, empty, btnP, btnS, btnO, card,
  label, field, normPhone, okPhone, okEmail, busy, footer, md, page, pending, val, openStatus, dayHours, fmtH, DAY_NAMES, riyadhNow, LS, MARK,
} from './core.js';
import { lines } from '../lib/ui.js';
import { PAYMENT_METHODS } from '../lib/pricing.js';
import { POLICY_PAGES } from '../lib/seed.js';
import { isConfigured } from '../lib/firebase.js';
import { sendMessage } from '../lib/api.js';
import { uploadBox, bindUploads, filesOf, uploading } from './uploads.js';
import { ABOUT_IMG } from './home.js';

const draftBadge = (pg) => (pg && pg.approved === false ? `<div class="mb-3 flex items-start gap-2 bg-[#FFF3E3] border border-dashed border-orange/50 rounded-2xl px-3 py-2.5 text-[12px] text-[#7A4A00] leading-6">${ic(P.info, 16, '#F7941E', 2)}<span><b>مسودة أولية بانتظار المراجعة والاعتماد.</b> قد يتغير المحتوى بعد اعتماده من إدارة المؤسسة والمراجعة النظامية.</span></div>` : '');
const payList = () => `<ul class="mt-1.5 grid gap-1.5">${Object.entries(PAYMENT_METHODS).filter(([k]) => S().payments?.[k] && (k !== 'bank' || S().iban)).map(([, m]) => `<li class="flex gap-2 text-[13px] text-[#4A6580] leading-7"><i class="block flex-none w-1.5 h-1.5 rounded-full bg-orange mt-3"></i><span><b class="text-ink">${m.t}:</b> ${m.d}</span></li>`).join('')}</ul>`;
const shareBtn = `<button class="press w-11 h-11 rounded-full bg-white hair grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18)}</button>`;

/* ================================================================ about */
V.about = () => {
  const pg = page('about');
  return `${appbar('من نحن', shareBtn)}
  <div class="px-4 pb-4">
    <div class="relative h-[200px] rounded-[28px] overflow-hidden">${imgTag(ABOUT_IMG, 'w-full h-full object-cover', 'مقر الإمدادات')}
      <span class="absolute inset-0" style="background:linear-gradient(270deg,rgba(3,33,63,.88),rgba(3,33,63,.35) 65%,rgba(3,33,63,.1))"></span>
      <span class="absolute right-5 bottom-5 text-white"><span class="text-[12px] opacity-80">عن الإمدادات</span><b class="block text-[22px] font-extrabold leading-snug">إبداع الفكرة.<br>وخبرة التنفيذ.</b></span></div>
    ${draftBadge(pg)}
    <div class="mt-2">${md(pg?.body)}</div>
    <h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5">قيم تظهر في النتيجة</h3>
    <div class="flex flex-wrap gap-1.5">${['الجودة', 'الإبداع', 'الاحترافية', 'الالتزام', 'الابتكار', 'سرعة الإنجاز'].map((v) => `<span class="h-[30px] px-3 rounded-[10px] bg-white hair text-[12.5px] flex items-center">${v}</span>`).join('')}</div>
    <h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5">كيف نعمل</h3>
    <div class="grid grid-cols-2 gap-2">${[['نفهم احتياجك', 'ندرس احتياجات المشروع ونحدد المتطلبات.'], ['نرسم التصور', 'نعد تصورًا مبدئيًا يتضمن الحلول المناسبة.'], ['نراجع ونعتمد', 'نراجع التصميم أو المنتج معك قبل التنفيذ.'], ['ننتج وننفذ', 'ننطلق بالتنفيذ والتسليم وفق ما اعتمدته.']].map(([t, d], i) => `<div class="reveal ${card} p-3"><span class="w-7 h-7 rounded-full bg-deep text-white text-[12px] font-bold grid place-items-center">${i + 1}</span><b class="block text-[13px] mt-2">${t}</b><span class="block text-[11px] text-muted leading-5 mt-0.5">${d}</span></div>`).join('')}</div>
    <div class="mt-5 grid grid-cols-2 gap-2">
      <button class="${btnP}" data-act="go" data-v="services">خدماتنا</button>
      <button class="${btnS}" data-act="go" data-v="portfolio">معرض الأعمال</button>
      <a href="${telLink()}" class="${btnS}">${ic(P.phone, 17)}<span dir="ltr">${esc(S().phone)}</span></a>
      <a href="${esc(waLink())}" target="_blank" rel="noopener" class="${btnS}">${WA(19)}واتساب</a>
    </div>
  </div>${footer()}`;
};
TITLES.about = () => 'من نحن';

/* ================================================================ services */
V.services = () => `${appbar('خدماتنا')}
  <div class="px-4 pb-4">
    <h2 class="text-[24px] font-extrabold leading-tight">حلول دعاية وإعلان<br><span class="text-deep">من الفكرة إلى التنفيذ.</span></h2>
    <p class="text-[13px] text-muted leading-6 mt-1.5">ست مجالات خدمة متكاملة للأفراد والشركات والجهات الحكومية. تصفح منتجات كل خدمة أو اطلب عرض سعر مخصص.</p>
    <div class="no-sb flex gap-2 overflow-x-auto my-3.5">${CATS().map((c) => `<a class="chip press" href="#svc-${esc(c.id)}" data-act="jump" data-id="svc-${esc(c.id)}">${esc(c.name)}</a>`).join('')}</div>
    ${CATS().map((c, i) => `<section id="svc-${esc(c.id)}" class="reveal ${card} overflow-hidden mb-3 shadow-soft">
      <div class="relative h-[150px]">${imgTag(c.image, 'w-full h-full object-cover', c.name)}<span class="absolute inset-0 shade"></span>
        <span class="absolute top-2.5 right-2.5 text-[10px] text-white bg-white/20 border border-white/35 rounded-full px-2" dir="ltr">0${i + 1}</span>
        <b class="absolute bottom-3 right-3.5 left-3 text-white text-[17px] font-extrabold leading-snug">${esc(c.name)}</b></div>
      <div class="p-3.5">
        <p class="text-[13.5px] font-bold text-orange">${esc(c.tag || '')}</p>
        <p class="text-[13px] text-[#4A6580] leading-7 mt-1">${esc(c.desc || '')}</p>
        ${c.uses?.length ? `<b class="block text-[13px] mt-3 mb-1">الاستخدامات</b><ul class="grid gap-1">${c.uses.map((u) => `<li class="flex gap-2 text-[12.5px] text-[#4A6580]"><i class="block flex-none w-1.5 h-1.5 rounded-full bg-primary mt-2"></i>${esc(u)}</li>`).join('')}</ul>` : ''}
        ${c.benefits?.length ? `<b class="block text-[13px] mt-3 mb-1">المميزات</b><ul class="grid gap-1">${c.benefits.map((u) => `<li class="flex gap-2 text-[12.5px] text-[#4A6580]">${ic(P.check, 14, '#12A150', 2.4)}${esc(u)}</li>`).join('')}</ul>` : ''}
        <b class="block text-[13px] mt-3 mb-1.5">ما نقدمه</b>
        <div class="flex flex-wrap gap-1.5">${(c.items || []).slice(0, 10).map((x) => `<span class="h-[28px] px-2.5 rounded-[9px] bg-tint text-[11.5px] flex items-center">${esc(x)}</span>`).join('')}${(c.items || []).length > 10 ? `<span class="h-[28px] px-2.5 text-[11.5px] text-muted flex items-center">+${c.items.length - 10}</span>` : ''}</div>
        <div class="grid grid-cols-2 gap-2 mt-3.5"><button class="press h-11 rounded-2xl bg-white hair text-deep text-[13px] font-bold" data-act="go" data-v="category" data-id="${esc(c.id)}">المنتجات (${productsOf(c.id).length})</button><button class="press h-11 rounded-2xl bg-deep text-white text-[13px] font-extrabold" data-act="go" data-v="quote" data-id="cat:${esc(c.id)}">اطلب الخدمة</button></div>
      </div></section>`).join('')}
    <div class="mt-1 flex items-center gap-2.5 bg-white border border-dashed border-deep/25 rounded-[20px] p-3">
      <span class="w-10 h-10 rounded-[13px] bg-[#FFF3E3] grid place-items-center flex-none">${ic(P.building, 20, '#F7941E')}</span>
      <span class="flex-1"><b class="block text-[13.5px]">مشروع متكامل أو كميات كبيرة؟</b><span class="block text-[11px] text-muted">أرسل تفاصيل المشروع والمخططات وسنجهز لك عرضًا شاملًا</span></span>
      <button class="press h-8 px-3 rounded-full bg-orange text-white text-[12px] font-extrabold" data-act="go" data-v="project">طلب مشروع</button>
    </div>
  </div>${footer()}`;
TITLES.services = () => 'خدماتنا';
ACT.jump = (t, e) => { e.preventDefault(); document.getElementById(t.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

/* ================================================================ contact */
V.contact = () => {
  const st = openStatus(); const s = S();
  const row = (icon, t, v, href, attrs = '') => `<${href ? `a href="${href}" ${attrs}` : 'div'} class="flex items-center gap-3 ${card} px-3 py-2.5"><span class="w-10 h-10 rounded-xl bg-tint grid place-items-center flex-none">${icon}</span><span class="flex-1 min-w-0"><span class="block text-[11.5px] text-muted">${t}</span><b class="block text-[13.5px] truncate">${v}</b></span>${href ? ic(P.chev, 14, '#6B8299', 2.2) : ''}</${href ? 'a' : 'div'}>`;
  return `${appbar('اتصل بنا')}
  <div class="px-4 pb-4">
    <h2 class="text-[22px] font-extrabold text-deep">يسعدنا تواصلك.</h2>
    <p class="text-[12.5px] text-muted mb-3">للاستفسارات والطلبات والشراكات، نرد عليك خلال ساعات العمل.</p>
    <div class="grid gap-2">
      ${row(ic(P.phone, 18), 'الهاتف', `<span dir="ltr">${esc(s.phone)}</span>`, `tel:${esc(s.phone)}`)}
      ${row(WA(20), 'واتساب', `<span dir="ltr">+${esc(s.whatsapp)}</span>`, esc(waLink()), 'target="_blank" rel="noopener"')}
      ${s.email ? row(ic(P.mail, 18), 'البريد الإلكتروني', `<span dir="ltr">${esc(s.email)}</span>`, `mailto:${esc(s.email)}`) : row(ic(P.mail, 18), 'البريد الإلكتروني', pending('البريد الرسمي بانتظار الإدخال'), '')}
      ${row(ic(P.pin, 18), esc(s.branchName), esc(s.address), esc(s.mapsUrl), 'target="_blank" rel="noopener"')}
      <button class="flex items-center gap-3 ${card} px-3 py-2.5 text-right" data-act="go" data-v="location" data-id="hours"><span class="w-10 h-10 rounded-xl bg-tint grid place-items-center flex-none">${ic(P.clock, 18)}</span><span class="flex-1"><span class="block text-[11.5px] text-muted">ساعات العمل</span><b class="block text-[13.5px]"><span class="${st.open ? 'text-[#12804A]' : 'text-[#B4232A]'}">${st.label}</span> · <span class="font-normal text-[12px]">${st.sub}</span></b></span>${ic(P.chev, 14, '#6B8299', 2.2)}</button>
    </div>
    <div class="flex gap-2 mt-3">${[['snapchat', 'سناب شات'], ['tiktok', 'تيك توك'], ['instagram', 'إنستغرام'], ['youtube', 'يوتيوب']].filter(([k]) => s[k]).map(([k, t]) => `<a class="press flex-1 h-10 rounded-xl bg-white hair text-[12px] font-bold text-deep grid place-items-center" href="${esc(s[k])}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>

    <form id="ctForm" class="${card} p-3.5 mt-4" novalidate>
      <b class="block text-[15px] font-extrabold text-deep">نموذج التواصل</b>
      ${field('ctName', 'الاسم', 'autocomplete="name" maxlength="100"', true)}
      ${label('ctPhone', 'رقم الجوال', true)}<input id="ctPhone" class="field" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX">
      ${field('ctEmail', 'البريد الإلكتروني', 'type="email" autocomplete="email" dir="ltr" style="text-align:right" maxlength="120"')}
      ${label('ctSubject', 'الموضوع', true)}<select id="ctSubject" class="field"><option value="">اختر الموضوع</option><option>استفسار عام</option><option>استفسار عن منتج أو خدمة</option><option>متابعة طلب قائم</option><option>طلبات الشركات والجهات الحكومية</option><option>شراكة أو توريد</option><option>اقتراح أو شكوى</option></select>
      ${label('ctMsg', 'الرسالة', true)}<textarea id="ctMsg" class="field !h-28" maxlength="2000"></textarea>
      <button id="ctBtn" class="${btnP} w-full mt-4" type="submit">إرسال الرسالة</button>
    </form>
  </div>${footer()}`;
};
TITLES.contact = () => 'اتصل بنا';
async function submitMessage(el, data, btn, done) {
  if (!isConfigured) { window.open(waLink(Object.values(data).filter(Boolean).join('\n')), '_blank', 'noopener'); done(); return; }
  busy(btn, true);
  try { await sendMessage(data); done(); }
  catch (e) { console.error(e); busy(btn, false); toast('تعذّر الإرسال', 'حاول مجددًا أو تواصل عبر واتساب', 'err', 4500); }
}
const sentBox = (title, sub) => `<div class="${card} p-5 text-center fade-in"><span class="mx-auto w-16 h-16 rounded-full bg-[#E6F6EE] grid place-items-center">${ic(P.check, 30, '#12A150', 2.6)}</span><b class="block text-[17px] font-extrabold text-deep mt-3">${title}</b><span class="block text-[12.5px] text-muted mt-1 leading-6">${sub}</span><button class="${btnS} w-full mt-4" data-act="go" data-v="home">العودة للرئيسية</button></div>`;
AFTER.contact = (el) => {
  const f = el.querySelector('#ctForm'); f.addEventListener('input', (e) => e.target.classList?.remove('err'));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id).value.trim(); const phone = normPhone(g('ctPhone'));
    const checks = [['#ctName', g('ctName').length >= 2], ['#ctPhone', okPhone(phone)], ['#ctEmail', !g('ctEmail') || okEmail(g('ctEmail'))], ['#ctSubject', !!g('ctSubject')], ['#ctMsg', g('ctMsg').length >= 5]];
    let bad = null; checks.forEach(([s, ok]) => { const i = el.querySelector(s); i.classList.toggle('err', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.focus(); toast('أكمل الحقول المطلوبة', '', 'info'); return; }
    submitMessage(el, { kind: 'contact', name: g('ctName'), phone, email: g('ctEmail'), subject: g('ctSubject'), message: g('ctMsg') }, el.querySelector('#ctBtn'), () => { f.outerHTML = sentBox('وصلتنا رسالتك', 'شكرًا لتواصلك، سيرد عليك فريقنا في أقرب وقت خلال ساعات العمل.'); });
  });
};

/* ================================================================ FAQ + policies + generic pages */
V.faq = () => {
  const pg = page('faq');
  return `${appbar('الأسئلة الشائعة')}<div class="px-4 pb-4">${draftBadge(pg)}${md(pg?.body, { faq: true })}
    <div class="${card} p-3.5 mt-4 text-center"><b class="block text-[14px]">لم تجد إجابتك؟</b><div class="grid grid-cols-2 gap-2 mt-3"><button class="${btnS} !h-11" data-act="go" data-v="contact">اتصل بنا</button><a class="${btnS} !h-11" href="${esc(waLink())}" target="_blank" rel="noopener">${WA(18)}واتساب</a></div></div>
  </div>${footer()}`;
};
TITLES.faq = () => 'الأسئلة الشائعة';
V.policies = () => `${appbar('السياسات والشروط')}<div class="px-4 pb-4">
  <p class="text-[12.5px] text-muted mb-3 leading-6">السياسات المنظمة للتعامل مع المتجر وفق الأنظمة المعمول بها في المملكة العربية السعودية.</p>
  ${POLICY_PAGES.map((id) => { const pg = page(id); return `<button class="press w-full flex items-center gap-3 ${card} px-3 py-3 mb-2 text-right" data-act="go" data-v="page" data-id="${id}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(P.doc, 18)}</span><b class="flex-1 text-[14px]">${esc(pg?.title || id)}</b>${pg?.approved === false ? '<span class="text-[10px] font-bold text-[#9A5B00] bg-[#FFF3E3] rounded-md px-1.5 py-px">مسودة</span>' : ''}${ic(P.chev, 14, '#6B8299', 2.2)}</button>`; }).join('')}
</div>${footer()}`;
TITLES.policies = () => 'السياسات والشروط';
V.page = (id) => {
  const pg = page(id); if (!pg) return null;
  const extra = id === 'cookies' ? `<button class="${btnS} w-full mt-4" data-act="clearlocal">${ic(P.trash, 17)}حذف البيانات المحفوظة في هذا المتصفح</button>` : '';
  return `${appbar(esc(pg.title), shareBtn)}<div class="px-4 pb-4">
    ${draftBadge(pg)}<h2 class="text-[22px] font-extrabold text-deep">${esc(pg.title)}</h2>
    ${pg.updatedAtText ? `<span class="block text-[11px] text-muted">آخر تحديث: ${esc(pg.updatedAtText)}</span>` : ''}
    ${md(pg.body, { extra: { paymentMethods: payList() } })}${extra}
    <div class="${card} p-3 mt-5 flex items-center gap-2.5"><span class="flex-1 text-[12px] text-muted">لديك سؤال حول هذه السياسة؟</span><button class="press h-9 px-3 rounded-xl bg-deep text-white text-[12px] font-bold" data-act="go" data-v="contact">تواصل معنا</button></div>
  </div>${footer()}`;
};
TITLES.page = (id) => page(id)?.title;
ACT.clearlocal = () => { ['cart2', 'quote', 'favs', 'compare', 'myOrders', 'checkout', 'loyalty', 'catalog.v2', 'notifSeen'].forEach((k) => LS.del(k)); Object.assign(state, { cart: [], quote: [], favs: [], compare: [], myOrders: [] }); toast('تم حذف البيانات المحفوظة', 'أُفرغت السلة والمفضلة والمقارنة'); };

/* ================================================================ help + report */
V.help = () => {
  const pg = page('help');
  return `${appbar('المساعدة والدعم')}<div class="px-4 pb-4">
    <div class="grid grid-cols-2 gap-2">${[['faq', P.help, 'الأسئلة الشائعة'], ['track', P.truck, 'تتبع الطلب'], ['report', P.flag, 'الإبلاغ عن مشكلة'], ['contact', P.phone, 'اتصل بنا'], ['policies', P.doc, 'السياسات'], ['quote', P.msg, 'طلب عرض سعر']].map(([v, d, t]) => `<button class="press ${card} p-3 text-right" data-act="go" data-v="${v}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><b class="block text-[13px] mt-2">${t}</b></button>`).join('')}</div>
    ${draftBadge(pg)}${md(pg?.body, { faq: true })}
    <a class="${btnO} w-full mt-4" href="${esc(waLink('أحتاج مساعدة'))}" target="_blank" rel="noopener">${WA(19)}تحدث مع الدعم عبر واتساب</a>
  </div>${footer()}`;
};
TITLES.help = () => 'المساعدة والدعم';
V.report = (ref) => `${appbar('الإبلاغ عن مشكلة')}
  <form id="rpForm" class="px-4 pb-6" novalidate>
    <h2 class="text-[22px] font-extrabold text-deep">أخبرنا بما حدث.</h2>
    <p class="text-[12.5px] text-muted mb-1">نتابع البلاغات ونتواصل معك لحلها في أقرب وقت.</p>
    <div class="${card} p-3.5 mt-2">
      ${label('rpType', 'نوع المشكلة', true)}<select id="rpType" class="field"><option value="">اختر النوع</option><option>مشكلة في طلب أو منتج مستلم</option><option>مشكلة في الدفع أو الفاتورة</option><option>خطأ تقني في الموقع</option><option>تأخر في التنفيذ أو التوصيل</option><option>أخرى</option></select>
      ${field('rpRef', 'رقم الطلب (إن وجد)', `dir="ltr" style="text-align:right" placeholder="EM-XXXXXX" maxlength="9" value="${esc(ref || '')}"`)}
      ${label('rpDesc', 'وصف المشكلة', true)}<textarea id="rpDesc" class="field !h-28" maxlength="2000" placeholder="اذكر ما حدث، ومتى، والخطوات التي قمت بها…"></textarea>
      ${field('rpName', 'الاسم', 'autocomplete="name" maxlength="100"', true)}
      ${label('rpPhone', 'رقم الجوال', true)}<input id="rpPhone" class="field" inputmode="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX">
      ${field('rpEmail', 'البريد الإلكتروني', 'type="email" dir="ltr" style="text-align:right" maxlength="120"')}
    </div>
    <div class="${card} p-3.5 mt-3">${uploadBox('r_report', 'صور أو مرفقات توضيحية (اختياري)')}</div>
    <button id="rpBtn" class="${btnP} w-full mt-4" type="submit">إرسال البلاغ</button>
  </form>`;
TITLES.report = () => 'الإبلاغ عن مشكلة';
AFTER.report = (el) => {
  bindUploads(el);
  const f = el.querySelector('#rpForm'); f.addEventListener('input', (e) => e.target.classList?.remove('err'));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id).value.trim(); const phone = normPhone(g('rpPhone'));
    const checks = [['#rpType', !!g('rpType')], ['#rpDesc', g('rpDesc').length >= 5], ['#rpName', g('rpName').length >= 2], ['#rpPhone', okPhone(phone)], ['#rpEmail', !g('rpEmail') || okEmail(g('rpEmail'))]];
    let bad = null; checks.forEach(([s, ok]) => { const i = el.querySelector(s); i.classList.toggle('err', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.focus(); toast('أكمل الحقول المطلوبة', '', 'info'); return; }
    if (uploading('r_report')) { toast('انتظر اكتمال رفع الملفات', '', 'info'); return; }
    submitMessage(el, { kind: 'issue', subject: g('rpType'), orderRef: g('rpRef').toUpperCase(), message: g('rpDesc'), name: g('rpName'), phone, email: g('rpEmail'), files: filesOf('r_report').map(({ name, size, path }) => ({ name, size, path })) }, el.querySelector('#rpBtn'), () => { state.uploads.r_report = []; f.outerHTML = `<div class="px-4">${sentBox('تم استلام البلاغ', 'سنراجع البلاغ ونتواصل معك قريبًا. شكرًا لمساعدتنا على التحسين.')}</div>`; });
  });
};

/* ================================================================ 404 / maintenance / unavailable */
V.notfound = () => `${appbar('الصفحة غير موجودة')}
  <div class="px-4 pb-8 text-center">
    <b class="block text-[64px] font-extrabold text-deep leading-none mt-6" dir="ltr">404</b>
    <h2 class="text-[19px] font-extrabold mt-2">لم نعثر على هذه الصفحة</h2>
    <p class="text-[13px] text-muted mt-1 leading-6">ربما تغيّر الرابط أو لم يعد المنتج متاحًا. جرّب البحث أو تصفح الأقسام.</p>
    <div class="grid gap-2 mt-5"><button class="${btnP}" data-act="go" data-v="home">العودة للرئيسية</button><button class="${btnS}" data-act="go" data-v="search">${ic(P.search, 17)}البحث في المتجر</button><button class="${btnS}" data-act="go" data-v="categories">تصفح التصنيفات</button></div>
  </div>`;
TITLES.notfound = () => 'الصفحة غير موجودة';
export const maintenanceHtml = (msg, retry = false) => `<div class="absolute inset-0 z-[96] bg-surface grid place-items-center p-6 text-center">
  <div><img src="${MARK}" alt="" class="w-20 h-20 mx-auto">
    <h1 class="text-[21px] font-extrabold text-deep mt-4">${retry ? 'الخدمة غير متوفرة مؤقتًا' : 'المتجر قيد الصيانة'}</h1>
    <p class="text-[13px] text-muted mt-2 leading-7 max-w-[300px] mx-auto">${esc(msg)}</p>
    <div class="grid gap-2 mt-5 max-w-[280px] mx-auto">${retry ? `<button class="${btnP}" onclick="location.reload()">إعادة المحاولة</button>` : ''}
      <a class="${btnS}" href="https://wa.me/${esc(state.catalog?.settings?.whatsapp || '966573838818')}" target="_blank" rel="noopener">${WA(19)}تواصل عبر واتساب</a></div>
  </div></div>`;
