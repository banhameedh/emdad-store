/* حساب العميل: الدخول، التسجيل، استعادة كلمة المرور، الملف الشخصي، العناوين، الطلبات، الإشعارات */
import {
  $, esc, ic, P, WA, state, save, S, waLink, appbar, V, AFTER, TITLES, ACT, go, replace, refresh, toast, empty, btnP, btnS, card,
  label, field, normPhone, okPhone, okEmail, busy, fmtDate, loadingBlock, imgTag, productById, LS, renderSideNav,
} from './core.js';
import { fmtSAR, STATUS, ORDER_TYPES, QUOTE_KINDS, PAYMENT_METHODS, DELIVERY } from '../lib/pricing.js';
import { isConfigured, loadAuth } from '../lib/firebase.js';
import { getCustomer, saveCustomer, myOrders, getOrder, getTracking } from '../lib/api.js';
import { timeline } from './cart.js';

const realUser = () => (state.user && !state.user.isAnonymous ? state.user : null);
const AUTH_ERR = (e) => {
  const c = e?.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (c.includes('email-already-in-use')) return 'هذا البريد مسجل مسبقًا — سجّل الدخول أو استعد كلمة المرور';
  if (c.includes('weak-password')) return 'كلمة المرور ضعيفة (6 أحرف على الأقل)';
  if (c.includes('invalid-email')) return 'البريد الإلكتروني غير صحيح';
  if (c.includes('too-many-requests')) return 'محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة';
  if (c.includes('network')) return 'تحقق من الاتصال بالإنترنت';
  if (c.includes('operation-not-allowed')) return 'تسجيل الحسابات غير مفعّل حاليًا';
  return 'تعذّر تنفيذ العملية، حاول مجددًا';
};

/* ================================================================ auth state */
export async function initAuth() {
  if (!isConfigured) { state.authReady = true; return; }
  const { auth, m } = await loadAuth();
  m.onAuthStateChanged(auth, async (u) => {
    state.user = u; state.customer = null;
    if (u && !u.isAnonymous) {
      try { state.customer = await getCustomer(u.uid); } catch (e) { console.warn(e); }
      mergeFavs();
    }
    state.authReady = true;
    renderSideNav();
    const cur = state.stack.at(-1)?.[0];
    const touched = !!$('#views').lastElementChild?.querySelector('form[data-touched]');
    if (['login', 'register', 'reset'].includes(cur)) { if (realUser()) refresh(); } // إعادة التوجيه بعد الدخول فقط
    else if (['account', 'addresses', 'orders', 'order', 'notifications'].includes(cur) && !touched) refresh();
    else if (['checkout', 'quote', 'project', 'custom'].includes(cur) && !touched) refresh();
  });
}
/** دمج المفضلة المحلية مع المحفوظة في الحساب */
function mergeFavs() {
  const remote = state.customer?.favorites || [];
  const merged = [...new Set([...remote, ...state.favs])].slice(0, 200);
  state.favs = merged; save.favs();
  if (merged.length !== remote.length) saveCustomer(state.user.uid, { favorites: merged }).catch(() => {});
}
export function syncFavs() { if (realUser()) saveCustomer(state.user.uid, { favorites: state.favs.slice(0, 200) }).catch(() => {}); }
const needAuth = (name, arg) => {
  if (!isConfigured) return `${appbar('حسابي')}${empty(P.user, 'الحسابات غير مفعّلة بعد', 'سيتاح إنشاء الحسابات بعد ربط المتجر بقاعدة البيانات. يمكنك الطلب كزائر الآن.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="shop">تصفح المنتجات</button>`)}`;
  if (!state.authReady) return `${appbar('حسابي')}${loadingBlock()}`;
  if (!realUser()) { state.afterLogin = [name, arg]; return null; }
  return '';
};
const guard = (name, arg, fn) => { const g = needAuth(name, arg); if (g === null) { setTimeout(() => replace('login', name), 0); return `${appbar('حسابي')}${loadingBlock()}`; } return g || fn(); };

/* ================================================================ login / register / reset */
const authShell = (title, sub, body) => `${appbar(title)}
  <div class="px-4 pb-8">
    <div class="text-center mt-1"><img src="assets/logo/mark.svg" alt="" class="w-16 h-16 mx-auto"><h2 class="text-[21px] font-extrabold text-deep mt-2">${title}</h2><p class="text-[12.5px] text-muted mt-0.5">${sub}</p></div>
    ${body}
  </div>`;
const passField = (id, t, ac) => `${label(id, t, true)}<div class="relative"><input id="${id}" class="field pl-12" type="password" autocomplete="${ac}" dir="ltr" style="text-align:right" minlength="6" maxlength="64"><button type="button" class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center" data-act="showpass" data-for="${id}" aria-label="إظهار كلمة المرور">${ic(P.eye, 17, '#6B8299')}</button></div>`;
ACT.showpass = (t) => { const i = $('#' + t.dataset.for); i.type = i.type === 'password' ? 'text' : 'password'; };

V.login = (next) => {
  if (!isConfigured) return needAuth('login');
  if (realUser()) { setTimeout(() => replace(next || 'account'), 0); return `${appbar('تسجيل الدخول')}${loadingBlock()}`; }
  return authShell('تسجيل الدخول', 'ادخل لمتابعة طلباتك وعناوينك ومفضلتك', `
    <form id="lgForm" class="${card} p-4 mt-4" novalidate>
      ${field('lgEmail', 'البريد الإلكتروني', 'type="email" autocomplete="username" dir="ltr" style="text-align:right"', true)}
      ${passField('lgPass', 'كلمة المرور', 'current-password')}
      <div id="lgErr"></div>
      <button id="lgBtn" class="${btnP} w-full mt-4" type="submit">دخول</button>
      <button type="button" class="w-full mt-2 text-[12.5px] text-deep font-bold py-1.5" data-act="go" data-v="reset">نسيت كلمة المرور؟</button>
    </form>
    <div class="${card} p-4 mt-3 text-center"><b class="block text-[14px]">ليس لديك حساب؟</b><span class="block text-[12px] text-muted mt-0.5">أنشئ حسابًا لحفظ عناوينك ومتابعة طلباتك وعروض الأسعار.</span><button class="${btnS} w-full mt-3" data-act="go" data-v="register" data-id="${esc(next || '')}">إنشاء حساب جديد</button></div>
    <p class="text-[11.5px] text-muted text-center mt-3">يمكنك أيضًا الشراء وطلب عروض الأسعار كزائر دون حساب.</p>`);
};
TITLES.login = () => 'تسجيل الدخول';
const errBox = (msg) => `<div class="mt-3 text-[12.5px] text-[#B4232A] bg-[#FDECEC] rounded-xl px-3 py-2">${esc(msg)}</div>`;
const afterAuth = (next) => { const a = state.afterLogin; state.afterLogin = null; replace(a?.[0] || next || 'account', a?.[1]); };
AFTER.login = (el, next) => {
  el.querySelector('#lgForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el.querySelector('#lgEmail').value.trim(); const pass = el.querySelector('#lgPass').value; const btn = el.querySelector('#lgBtn');
    if (!okEmail(email) || pass.length < 6) { el.querySelector('#lgErr').innerHTML = errBox('أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل'); return; }
    busy(btn, true, 'جارٍ الدخول…');
    try {
      const { auth, m } = await loadAuth();
      await m.signInWithEmailAndPassword(auth, email, pass);
      toast('مرحبًا بعودتك', email); afterAuth(next);
    } catch (err) { busy(btn, false); el.querySelector('#lgErr').innerHTML = errBox(AUTH_ERR(err)); }
  });
};

V.register = (next) => {
  if (!isConfigured) return needAuth('register');
  if (realUser()) { setTimeout(() => replace('account'), 0); return `${appbar('إنشاء حساب')}${loadingBlock()}`; }
  return authShell('إنشاء حساب جديد', 'للأفراد والشركات والجهات الحكومية', `
    <form id="rgForm" class="${card} p-4 mt-4" novalidate>
      ${field('rgName', 'الاسم الكامل', 'autocomplete="name" maxlength="100"', true)}
      ${label('rgPhone', 'رقم الجوال', true)}<input id="rgPhone" class="field" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX">
      ${field('rgCompany', 'اسم الجهة / الشركة (اختياري)', 'maxlength="120"')}
      ${field('rgEmail', 'البريد الإلكتروني', 'type="email" autocomplete="email" dir="ltr" style="text-align:right"', true)}
      ${passField('rgPass', 'كلمة المرور (6 أحرف على الأقل)', 'new-password')}
      ${passField('rgPass2', 'تأكيد كلمة المرور', 'new-password')}
      <label class="flex items-start gap-2 text-[12px] text-[#4A6580] mt-3"><input id="rgOk" type="checkbox" class="w-5 h-5 mt-0.5 accent-[#075A9F] flex-none"><span>أوافق على <button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="terms">الشروط والأحكام</button> و<button type="button" class="text-deep font-bold underline" data-act="go" data-v="page" data-id="privacy">سياسة الخصوصية</button>.</span></label>
      <div id="rgErr"></div>
      <button id="rgBtn" class="${btnP} w-full mt-4" type="submit">إنشاء الحساب</button>
    </form>
    <p class="text-[12.5px] text-center mt-3">لديك حساب؟ <button class="text-deep font-bold" data-act="go" data-v="login">تسجيل الدخول</button></p>`);
};
TITLES.register = () => 'إنشاء حساب جديد';
AFTER.register = (el, next) => {
  const f = el.querySelector('#rgForm'); if (!f) return;
  f.addEventListener('input', (e) => e.target.classList?.remove('err'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id).value.trim();
    const phone = normPhone(g('rgPhone')); const pass = el.querySelector('#rgPass').value;
    const checks = [['#rgName', g('rgName').length >= 2], ['#rgPhone', okPhone(phone)], ['#rgEmail', okEmail(g('rgEmail'))], ['#rgPass', pass.length >= 6], ['#rgPass2', pass === el.querySelector('#rgPass2').value]];
    let bad = null; checks.forEach(([s, ok]) => { const i = el.querySelector(s); i.classList.toggle('err', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.focus(); el.querySelector('#rgErr').innerHTML = errBox(bad.id === 'rgPass2' ? 'كلمتا المرور غير متطابقتين' : 'تحقق من الحقول المحددة'); return; }
    if (!el.querySelector('#rgOk').checked) { el.querySelector('#rgErr').innerHTML = errBox('يلزم الموافقة على الشروط وسياسة الخصوصية'); return; }
    const btn = el.querySelector('#rgBtn'); busy(btn, true, 'جارٍ إنشاء الحساب…');
    try {
      const { auth, m } = await loadAuth();
      const cred = await m.createUserWithEmailAndPassword(auth, g('rgEmail'), pass);
      await m.updateProfile(cred.user, { displayName: g('rgName') }).catch(() => {});
      const data = { name: g('rgName'), phone, email: g('rgEmail'), company: g('rgCompany'), addresses: [], favorites: state.favs.slice(0, 200), createdAt: Date.now() };
      await saveCustomer(cred.user.uid, data);
      state.customer = data;
      toast('تم إنشاء حسابك بنجاح', 'مرحبًا بك في الإمدادات'); afterAuth(next);
    } catch (err) { console.error(err); busy(btn, false); el.querySelector('#rgErr').innerHTML = errBox(AUTH_ERR(err)); }
  });
};

V.reset = () => {
  if (!isConfigured) return needAuth('reset');
  return authShell('استعادة كلمة المرور', 'أدخل بريدك المسجل وسنرسل لك رابط إعادة التعيين', `
    <form id="rsForm" class="${card} p-4 mt-4" novalidate>
      ${field('rsEmail', 'البريد الإلكتروني', 'type="email" autocomplete="email" dir="ltr" style="text-align:right"', true)}
      <div id="rsMsg"></div>
      <button id="rsBtn" class="${btnP} w-full mt-4" type="submit">إرسال رابط الاستعادة</button>
      <button type="button" class="w-full mt-2 text-[12.5px] text-deep font-bold py-1.5" data-act="go" data-v="login">العودة لتسجيل الدخول</button>
    </form>`);
};
TITLES.reset = () => 'استعادة كلمة المرور';
AFTER.reset = (el) => {
  el.querySelector('#rsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el.querySelector('#rsEmail').value.trim(); const msg = el.querySelector('#rsMsg');
    if (!okEmail(email)) { msg.innerHTML = errBox('أدخل بريدًا إلكترونيًا صحيحًا'); return; }
    const btn = el.querySelector('#rsBtn'); busy(btn, true, 'جارٍ الإرسال…');
    try {
      const { auth, m } = await loadAuth(); auth.languageCode = 'ar';
      await m.sendPasswordResetEmail(auth, email);
      msg.innerHTML = `<div class="mt-3 text-[12.5px] text-[#12804A] bg-[#E6F6EE] rounded-xl px-3 py-2">إن كان البريد مسجلًا لدينا فستصلك رسالة بها رابط إعادة التعيين. تحقق من الرسائل غير المرغوب فيها أيضًا.</div>`;
    } catch (err) { msg.innerHTML = errBox(AUTH_ERR(err)); }
    busy(btn, false);
  });
};

/* ================================================================ profile */
V.account = () => guard('account', null, () => {
  const c = state.customer || {}; const u = realUser();
  const links = [['orders', 'طلباتي وعروض الأسعار', P.layers], ['addresses', 'عناوين الشحن', P.pin], ['favorites', `المفضلة (${state.favs.length})`, P.heart], ['notifications', 'الإشعارات', P.bell], ['track', 'تتبع طلب', P.truck], ['help', 'المساعدة والدعم', P.help]];
  return `${appbar('حسابي')}
  <div class="px-4 pb-8">
    <div class="relative rounded-[26px] text-white overflow-hidden p-4 shadow-lift" style="background:linear-gradient(135deg,#0A66B0,#075A9F 60%,#043E70)">
      <span class="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-sky/10"></span>
      <span class="block text-[12px] opacity-80">مرحبًا</span><b class="block text-[20px] font-extrabold">${esc(c.name || u.displayName || '')}</b>
      <span class="block text-[12px] opacity-80 mt-0.5" dir="ltr" style="text-align:right">${esc(u.email)}</span>
      ${c.company ? `<span class="inline-block mt-2 text-[11.5px] bg-white/15 rounded-full px-2.5 py-0.5">${esc(c.company)}</span>` : ''}
    </div>
    <div class="grid grid-cols-2 gap-2 mt-3">${links.map(([v, t, d]) => `<button class="press ${card} p-3 text-right" data-act="go" data-v="${v}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><b class="block text-[13px] mt-2">${t}</b></button>`).join('')}</div>
    <form id="pfForm" class="${card} p-3.5 mt-3" novalidate>
      <b class="block text-[15px] font-extrabold text-deep">بياناتي</b>
      ${field('pfName', 'الاسم الكامل', `maxlength="100" value="${esc(c.name || '')}"`, true)}
      ${field('pfPhone', 'رقم الجوال', `inputmode="tel" dir="ltr" style="text-align:right" maxlength="16" value="${esc(c.phone || '')}"`, true)}
      ${field('pfCompany', 'الجهة / الشركة', `maxlength="120" value="${esc(c.company || '')}"`)}
      ${field('pfVat', 'الرقم الضريبي للجهة', `maxlength="15" inputmode="numeric" dir="ltr" style="text-align:right" value="${esc(c.vatNumber || '')}"`)}
      <button id="pfBtn" class="${btnP} w-full mt-3" type="submit">حفظ التعديلات</button>
    </form>
    <button class="${btnS} w-full mt-3" data-act="resetme">تغيير كلمة المرور</button>
    <button class="${btnS} w-full mt-2 !text-[#B4232A]" data-act="logout">${ic(P.logout, 17, '#B4232A')}تسجيل الخروج</button>
  </div>`;
});
TITLES.account = () => 'حسابي';
AFTER.account = (el) => {
  el.querySelector('#pfForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id).value.trim(); const phone = normPhone(g('pfPhone'));
    const ok1 = g('pfName').length >= 2; const ok2 = okPhone(phone);
    el.querySelector('#pfName').classList.toggle('err', !ok1); el.querySelector('#pfPhone').classList.toggle('err', !ok2);
    if (!ok1 || !ok2) return;
    const btn = el.querySelector('#pfBtn'); busy(btn, true, 'جارٍ الحفظ…');
    const data = { name: g('pfName'), phone, company: g('pfCompany'), vatNumber: g('pfVat'), email: realUser().email };
    try { await saveCustomer(realUser().uid, data); state.customer = { ...(state.customer || {}), ...data }; toast('تم حفظ بياناتك'); }
    catch (err) { console.error(err); toast('تعذّر الحفظ', 'حاول مجددًا', 'err'); }
    busy(btn, false);
  });
};
ACT.logout = async () => { const { auth, m } = await loadAuth(); await m.signOut(auth); state.user = null; state.customer = null; toast('تم تسجيل الخروج'); replace('home'); };
ACT.resetme = async () => { try { const { auth, m } = await loadAuth(); auth.languageCode = 'ar'; await m.sendPasswordResetEmail(auth, realUser().email); toast('أُرسل رابط تغيير كلمة المرور', realUser().email); } catch (e) { toast('تعذّر الإرسال', AUTH_ERR(e), 'err'); } };

/* ================================================================ addresses */
V.addresses = (edit) => guard('addresses', edit, () => {
  const list = state.customer?.addresses || [];
  const a = edit !== undefined && edit !== null && edit !== '' ? (edit === 'new' ? {} : list[+edit]) : null;
  if (a) {
    return `${appbar(edit === 'new' ? 'إضافة عنوان' : 'تعديل العنوان')}
    <form id="adForm" class="px-4 pb-8" novalidate><div class="${card} p-3.5">
      ${field('adLabel', 'اسم العنوان', `maxlength="40" placeholder="مثال: المكتب، المنزل، الفرع" value="${esc(a.label || '')}"`)}
      <div class="grid grid-cols-2 gap-2"><div>${field('adCity', 'المدينة', `maxlength="60" value="${esc(a.city || '')}"`, true)}</div><div>${field('adDistrict', 'الحي', `maxlength="60" value="${esc(a.district || '')}"`)}</div></div>
      ${field('adStreet', 'الشارع / العنوان الوطني المختصر', `maxlength="160" value="${esc(a.street || '')}"`, true)}
      ${field('adDetails', 'تفاصيل إضافية', `maxlength="200" value="${esc(a.details || '')}"`)}
      ${field('adPhone', 'جوال المستلم', `inputmode="tel" dir="ltr" style="text-align:right" maxlength="16" value="${esc(a.phone || state.customer?.phone || '')}"`)}
      <label class="flex items-center gap-2 text-[13px] mt-3"><input id="adDef" type="checkbox" class="w-5 h-5 accent-[#075A9F]" ${a.isDefault || !list.length ? 'checked' : ''}>العنوان الافتراضي</label>
    </div><button id="adBtn" class="${btnP} w-full mt-3" type="submit">حفظ العنوان</button></form>`;
  }
  return `${appbar('عناوين الشحن', `<button class="press w-11 h-11 rounded-full bg-deep grid place-items-center" data-act="go" data-v="addresses" data-id="new" aria-label="إضافة عنوان">${ic(P.plus, 18, '#fff', 2.4)}</button>`)}
  <div class="px-4 pb-8">${list.length ? list.map((x, i) => `<div class="${card} p-3.5 mb-2"><div class="flex items-start gap-2"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center flex-none">${ic(P.pin, 18)}</span><span class="flex-1"><b class="block text-[14px]">${esc(x.label || 'عنوان')} ${x.isDefault ? '<em class="not-italic text-[10px] text-white bg-orange rounded-lg px-1.5 py-px mr-1">افتراضي</em>' : ''}</b><span class="block text-[12.5px] text-muted leading-6">${esc([x.city, x.district, x.street, x.details].filter(Boolean).join('، '))}</span>${x.phone ? `<span class="block text-[12px] text-muted" dir="ltr" style="text-align:right">${esc(x.phone)}</span>` : ''}</span></div>
    <div class="flex gap-2 mt-2"><button class="press h-9 px-3 rounded-xl bg-tint text-deep text-[12px] font-bold flex items-center gap-1" data-act="go" data-v="addresses" data-id="${i}">${ic(P.edit, 14)}تعديل</button><button class="press h-9 px-3 rounded-xl bg-[#FDECEC] text-[#B4232A] text-[12px] font-bold flex items-center gap-1" data-act="deladdr" data-i="${i}">${ic(P.trash, 14, '#B4232A')}حذف</button></div></div>`).join('')
    : empty(P.pin, 'لا توجد عناوين محفوظة', 'أضف عنوان التوصيل لاستخدامه بسرعة عند إتمام الطلب.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="addresses" data-id="new">إضافة عنوان</button>`)}</div>`;
});
TITLES.addresses = () => 'عناوين الشحن';
async function saveAddresses(list) { await saveCustomer(realUser().uid, { addresses: list }); state.customer = { ...(state.customer || {}), addresses: list }; }
AFTER.addresses = (el, edit) => {
  el.querySelector('#adForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (id) => el.querySelector('#' + id).value.trim();
    const ok1 = g('adCity').length >= 2; const ok2 = g('adStreet').length >= 3; const ph = g('adPhone') ? normPhone(g('adPhone')) : '';
    el.querySelector('#adCity').classList.toggle('err', !ok1); el.querySelector('#adStreet').classList.toggle('err', !ok2);
    if (!ok1 || !ok2 || (ph && !okPhone(ph))) { el.querySelector('#adPhone').classList.toggle('err', !!ph && !okPhone(ph)); return; }
    let list = [...(state.customer?.addresses || [])];
    const a = { label: g('adLabel'), city: g('adCity'), district: g('adDistrict'), street: g('adStreet'), details: g('adDetails'), phone: ph, isDefault: el.querySelector('#adDef').checked };
    if (a.isDefault) list = list.map((x) => ({ ...x, isDefault: false }));
    if (edit === 'new') list.push(a); else list[+edit] = a;
    if (!list.some((x) => x.isDefault)) list[0].isDefault = true;
    const btn = el.querySelector('#adBtn'); busy(btn, true, 'جارٍ الحفظ…');
    try { await saveAddresses(list.slice(0, 10)); toast('تم حفظ العنوان'); replace('addresses'); }
    catch (err) { console.error(err); busy(btn, false); toast('تعذّر الحفظ', '', 'err'); }
  });
};
ACT.deladdr = async (t) => {
  const list = [...(state.customer?.addresses || [])]; list.splice(+t.dataset.i, 1);
  if (list.length && !list.some((x) => x.isDefault)) list[0].isDefault = true;
  try { await saveAddresses(list); toast('تم حذف العنوان'); refresh(); } catch { toast('تعذّر الحذف', '', 'err'); }
};

/* ================================================================ orders */
let ordersCache = null;
async function loadMyOrders(force) { if (!ordersCache || force) ordersCache = await myOrders(realUser().uid); return ordersCache; }
const orderRow = (o) => `<button class="press w-full ${card} px-3 py-3 mb-2 text-right" data-act="go" data-v="order" data-id="${esc(o.coll + ':' + o.id)}">
  <span class="flex items-start justify-between gap-2"><span><b class="block text-[15px] font-extrabold" dir="ltr" style="text-align:right">${esc(o.ref)}</b><span class="block text-[11.5px] text-muted">${o.type === 'purchase' ? ORDER_TYPES.purchase : `طلب ${QUOTE_KINDS[o.kind] || 'عرض سعر'}`} · ${fmtDate(o.createdAt)}</span></span><span class="text-[11px] font-bold rounded-lg px-2 py-0.5 flex-none ${STATUS[o.status]?.c || ''}">${STATUS[o.status]?.t || o.status}</span></span>
  <span class="flex justify-between items-center mt-2 text-[12.5px]"><span class="text-muted truncate">${esc((o.items || []).map((i) => i.name).join('، ') || o.serviceName || '')}</span><b class="text-deep flex-none" dir="ltr">${o.totals ? fmtSAR(o.totals.total) : o.quotedAmount != null ? fmtSAR(o.quotedAmount) : ''}</b></span>
</button>`;
V.orders = () => guard('orders', null, () => `${appbar('طلباتي')}<div class="px-4 pb-8"><div id="ordList">${loadingBlock()}</div></div>`);
TITLES.orders = () => 'طلباتي';
AFTER.orders = async (el) => {
  const box = el.querySelector('#ordList'); if (!box || !realUser()) return;
  try {
    const list = await loadMyOrders(true);
    box.innerHTML = list.length ? list.map(orderRow).join('') : empty(P.layers, 'لا توجد طلبات بعد', 'ستظهر هنا طلبات الشراء وعروض الأسعار المرتبطة بحسابك.', `<div class="flex gap-2 justify-center mt-4"><button class="${btnP} px-5 !h-11" data-act="go" data-v="shop">تسوق الآن</button><button class="${btnS} px-5 !h-11" data-act="go" data-v="quote">اطلب عرض سعر</button></div>`);
  } catch (e) { console.error(e); box.innerHTML = `<p class="text-center text-[#B4232A] text-[13px] py-8">تعذّر تحميل الطلبات</p>`; }
};

V.order = (key) => guard('order', key, () => `${appbar('تفاصيل الطلب')}<div class="px-4 pb-8"><div id="ordDetail">${loadingBlock()}</div></div>`);
TITLES.order = () => 'تفاصيل الطلب';
AFTER.order = async (el, key) => {
  const box = el.querySelector('#ordDetail'); if (!box || !realUser()) return;
  const [coll, id] = String(key).split(':');
  try {
    const o = await getOrder(coll, id);
    if (!o) { box.innerHTML = empty(P.layers, 'الطلب غير موجود', 'تأكد من الرابط أو راجع قائمة طلباتك.'); return; }
    let tr = null; try { tr = await getTracking(o.ref, o.phone); } catch { /* history optional */ }
    const t = o.totals;
    box.innerHTML = `<div class="${card} p-3.5">
      <div class="flex items-start justify-between"><span><span class="block text-[11px] text-muted">${o.type === 'purchase' ? ORDER_TYPES.purchase : `طلب ${QUOTE_KINDS[o.kind] || 'عرض سعر'}`}</span><b class="block text-[20px] font-extrabold" dir="ltr" style="text-align:right">${esc(o.ref)}</b><span class="block text-[11.5px] text-muted">${fmtDate(o.createdAt)}</span></span><span class="text-[11.5px] font-bold rounded-lg px-2.5 py-1 ${STATUS[o.status]?.c || ''}">${STATUS[o.status]?.t || ''}</span></div>
      ${tr?.customerMessage ? `<p class="mt-2 text-[12.5px] bg-tint rounded-xl px-3 py-2">${esc(tr.customerMessage)}</p>` : ''}
      ${timeline(o.type, o.status, tr?.history || [])}
    </div>
    <div class="${card} p-3.5 mt-3"><b class="block text-[14.5px] font-extrabold mb-2">${o.type === 'purchase' ? 'المنتجات' : 'البنود المطلوبة'}</b>
      ${(o.items || []).map((i) => { const p = productById(i.productId); return `<div class="flex gap-2.5 py-2 border-t border-deep/5 first:border-0">${p ? imgTag(p.image, 'w-12 h-12 rounded-xl object-cover flex-none', i.name) : ''}<span class="flex-1 min-w-0"><b class="block text-[13px]">${esc(i.name)} × ${esc(i.qty)}</b><span class="block text-[11px] text-muted">${esc(i.selText || '')}</span>${i.files?.length ? `<span class="block text-[11px] text-deep">${i.files.length} ملف مرفق</span>` : ''}</span>${i.lineTotal != null ? `<b class="text-deep text-[13px]" dir="ltr">${fmtSAR(i.lineTotal)}</b>` : ''}</div>`; }).join('') || `<p class="text-[13px] text-muted">${esc(o.serviceName || '')}</p>`}
      ${o.description ? `<p class="text-[12.5px] text-[#4A6580] leading-6 mt-2 whitespace-pre-line">${esc(o.description)}</p>` : ''}
      ${o.files?.length ? `<p class="text-[12px] text-deep mt-2">${ic(P.attach, 13, '#075A9F', 2)} ${o.files.length} ملف مرفق</p>` : ''}
    </div>
    ${t ? `<div class="${card} p-3.5 mt-3 grid gap-1.5 text-[13px]">
      <div class="flex justify-between"><span>المجموع الفرعي</span><span dir="ltr">${fmtSAR(t.subtotal)}</span></div>
      ${t.savings ? `<div class="flex justify-between text-[#12804A]"><span>الخصم</span><span dir="ltr">-${fmtSAR(t.savings)}</span></div>` : ''}
      <div class="flex justify-between"><span>التوصيل</span><span>${o.delivery === 'delivery' ? (t.deliveryFee != null ? fmtSAR(t.deliveryFee) : 'يُحدد لاحقًا') : 'استلام من المقر'}</span></div>
      <div class="flex justify-between text-muted text-[12px]"><span>ضريبة القيمة المضافة (${t.vatRate}%)${t.vatIncluded ? ' — مشمولة' : ''}</span><span dir="ltr">${fmtSAR(t.vat)}</span></div>
      <div class="flex justify-between font-extrabold text-deep text-[16px] border-t border-deep/10 pt-2"><span>الإجمالي</span><span dir="ltr">${fmtSAR(t.total)}</span></div>
      <div class="flex justify-between text-[12.5px] mt-1"><span class="text-muted">الدفع</span><b>${PAYMENT_METHODS[o.paymentMethod]?.t || ''}</b></div>
      <div class="flex justify-between text-[12.5px]"><span class="text-muted">الاستلام</span><b>${DELIVERY[o.delivery] || ''}${o.address ? ` — ${esc(o.address.city)}` : ''}</b></div>
    </div>` : ''}
    ${tr?.quotedAmount != null ? `<div class="${card} p-3.5 mt-3 flex justify-between text-[14px]"><span>قيمة عرض السعر</span><b class="text-deep" dir="ltr">${fmtSAR(tr.quotedAmount)}</b></div>` : ''}
    <div class="grid grid-cols-2 gap-2 mt-3"><a class="${btnS}" href="${esc(waLink(`استفسار عن الطلب ${o.ref}`))}" target="_blank" rel="noopener">${WA(18)}واتساب</a><button class="${btnS}" data-act="go" data-v="report" data-id="${esc(o.ref)}">${ic(P.flag, 16)}الإبلاغ عن مشكلة</button></div>`;
  } catch (e) { console.error(e); box.innerHTML = `<p class="text-center text-[#B4232A] text-[13px] py-8">تعذّر تحميل الطلب</p>`; }
};

/* ================================================================ notifications */
const SEEN = 'notifSeen';
export async function collectNotifications() {
  const out = [];
  const push = (o, h) => out.push({ ref: o.ref, type: o.type, status: h.status, at: h.at?.seconds ? h.at.seconds * 1000 : h.at || 0, msg: h.message || '' });
  if (realUser()) {
    const list = await loadMyOrders();
    for (const o of list) {
      push(o, { status: 'new', at: o.createdAt });
      try { const tr = await getTracking(o.ref, o.phone); (tr?.history || []).forEach((h) => push(o, h)); } catch { /* ignore */ }
    }
  } else {
    for (const r of state.myOrders.slice(0, 10)) {
      push(r, { status: 'new', at: r.at });
      try { const tr = await getTracking(r.ref, r.tail); (tr?.history || []).forEach((h) => push(r, h)); } catch { /* ignore */ }
    }
  }
  return out.sort((a, b) => b.at - a.at);
}
const NOTE_TEXT = { new: 'تم استلام طلبك', contacted: 'تواصل فريقنا بخصوص طلبك', quoted: 'تم إرسال عرض السعر', confirmed: 'تم تأكيد طلبك', paid: 'تم تأكيد الدفع', in_progress: 'بدأ تنفيذ طلبك', ready: 'طلبك جاهز للاستلام / الشحن', shipped: 'تم شحن طلبك', done: 'اكتمل طلبك', cancelled: 'تم إلغاء الطلب' };
V.notifications = () => `${appbar('الإشعارات')}<div class="px-4 pb-8"><div id="ntList">${loadingBlock()}</div></div>`;
TITLES.notifications = () => 'الإشعارات';
AFTER.notifications = async (el) => {
  const box = el.querySelector('#ntList');
  if (!isConfigured) { box.innerHTML = empty(P.bell, 'لا توجد إشعارات', 'ستظهر هنا تحديثات حالة طلباتك.'); return; }
  try {
    const seen = LS.get(SEEN, 0); const list = await collectNotifications();
    box.innerHTML = list.length ? list.map((n) => `<button class="press w-full ${card} px-3 py-2.5 mb-2 flex items-start gap-3 text-right ${n.at > seen ? 'ring-2 ring-orange/40' : ''}" data-act="go" data-v="track" data-id="${esc(n.ref)}"><span class="w-9 h-9 rounded-xl ${n.at > seen ? 'bg-[#FFF3E3]' : 'bg-tint'} grid place-items-center flex-none">${ic(P.bell, 17, n.at > seen ? '#F7941E' : '#075A9F')}</span><span class="flex-1"><b class="block text-[13.5px]">${NOTE_TEXT[n.status] || STATUS[n.status]?.t}</b><span class="block text-[11.5px] text-muted"><span dir="ltr">${esc(n.ref)}</span> · ${fmtDate(n.at)}</span>${n.msg ? `<span class="block text-[12px] text-[#3E5873] mt-0.5">${esc(n.msg)}</span>` : ''}</span></button>`).join('')
      : empty(P.bell, 'لا توجد إشعارات', 'ستظهر هنا تحديثات حالة طلباتك وعروض الأسعار.', `<button class="${btnP} px-5 mx-auto mt-4" data-act="go" data-v="shop">تصفح المنتجات</button>`);
    LS.set(SEEN, Date.now());
  } catch (e) { console.error(e); box.innerHTML = '<p class="text-center text-[#B4232A] text-[13px] py-8">تعذّر تحميل الإشعارات</p>'; }
};
