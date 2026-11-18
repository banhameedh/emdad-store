/* واجهة المتجر — مطابقة لتصميم النموذج التفاعلي، والبيانات من Firestore */
import { $, esc, lines, oneLine, imgSrc, pad2, fmtNum, fmtPrice, ic, P, WA, APPLE_W, GOOGLE_W } from '../lib/ui.js';
import { isConfigured } from '../lib/firebase.js';
import { cachedCatalog, fetchCatalog, seedCatalog, createOrder } from '../lib/api.js';

const MARK = 'assets/logo/mark.svg';
const LOGO_WHITE = 'assets/logo/logo-white.svg';
const HERO_IMG = 'assets/images/facade-emdad-headquarters.jpg';
const ABOUT_IMG = 'assets/images/facade-emdad-building-and-fleet.jpg';
const DAY_NAMES = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

/* ================================================================ state */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('emdad.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('emdad.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const loyalty = LS.get('loyalty', { joined: false, points: 0, wallet: {} });
const state = {
  catalog: null,
  cart: new Set(LS.get('cart', [])), // product ids
  joined: loyalty.joined, points: loyalty.points, wallet: loyalty.wallet || {},
  pf: 'all', stack: [],
};
const saveCart = () => LS.set('cart', [...state.cart]);
const saveLoyalty = () => LS.set('loyalty', { joined: state.joined, points: state.points, wallet: state.wallet });

/* ================================================================ data accessors */
const S = () => state.catalog.settings;
const CATS = () => state.catalog.categories;
const catById = (id) => CATS().find((c) => c.id === id);
const productsOf = (id) => state.catalog.products.filter((p) => p.categoryId === id);
const productById = (id) => state.catalog.products.find((p) => p.id === id);
const cartProducts = () => [...state.cart].map(productById).filter(Boolean);
const waLink = (text) => `https://wa.me/${encodeURIComponent(S().whatsapp || '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const telLink = () => `tel:${esc(S().phone)}`;

function riyadhNow() {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday'));
  return { day, h: (+g('hour')) % 24, m: +g('minute') };
}
const fmtH = h => { h = +h; const hh = Math.floor(h) % 24; const mm = Math.round((h - Math.floor(h)) * 60); const ap = hh >= 12 ? 'م' : 'ص'; const x = hh % 12 === 0 ? 12 : hh % 12; return `${x}:${pad2(mm)} ${ap}`; };
const dayHours = d => { const x = S().hours?.[d]; return x && !x.closed && x.open != null && x.close != null ? x : null; };
function openStatus() {
  const { day, h, m } = riyadhNow(); const t = h + m / 60; const today = dayHours(day);
  if (today && t >= today.open && t < today.close) return { open: true, label: 'مفتوح الآن', sub: `حتى ${fmtH(today.close).replace('م', 'مساءً').replace('ص', 'صباحًا')}` };
  if (today && t < today.open) return { open: false, label: 'مغلق الآن', sub: `يفتح اليوم ${fmtH(today.open)}` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7; const x = dayHours(d);
    if (x) return { open: false, label: 'مغلق الآن', sub: `يفتح ${k === 1 ? 'غدًا' : DAY_NAMES[d]} ${fmtH(x.open)}` };
  }
  return { open: false, label: 'مغلق الآن', sub: 'تواصل معنا عبر واتساب' };
}

/* ================================================================ toast */
let toastT;
function toast(title, sub = '', kind = 'ok', ms = 2800) {
  const el = $('#toast');
  const lead = kind === 'apple' ? `<span class="flex-none">${APPLE_W}</span>` : kind === 'google' ? `<span class="flex-none w-8 h-8 rounded-full bg-white grid place-items-center">${GOOGLE_W}</span>`
    : `<span class="flex-none w-8 h-8 rounded-full ${kind === 'info' ? 'bg-primary' : kind === 'err' ? 'bg-[#E5484D]' : 'bg-orange'} grid place-items-center">${ic(kind === 'info' || kind === 'err' ? P.info : P.check, 16, '#fff', 2.6)}</span>`;
  const bg = kind === 'apple' ? 'bg-black' : 'bg-deep';
  el.innerHTML = `<div class="${bg} text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lift">${lead}<div class="min-w-0"><b class="block text-[14px]">${esc(title)}</b>${sub ? `<span class="block text-[12px] opacity-80">${esc(sub)}</span>` : ''}</div></div>`;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms);
}

/* ================================================================ shared bits */
const appbar = (title, action = '') => `
  <div class="sticky top-0 z-20 safe-top pb-2 px-4 bg-surface/90 backdrop-blur">
    <div class="h-12 flex items-center justify-between">
      <button class="press w-11 h-11 rounded-full bg-white hair grid place-items-center" data-act="back" aria-label="رجوع">${ic(P.back, 18, '#075A9F', 2.2)}</button>
      <h1 class="text-[16px] font-bold">${title}</h1>
      ${action || '<span class="w-11"></span>'}
    </div>
  </div>`;
const imgTag = (src, cls = '', alt = '') => `<img src="${imgSrc(src)}" alt="${esc(alt)}" class="${cls}" loading="lazy" decoding="async">`;

/* ================================================================ views */
const V = {};

V.home = () => {
  const st = openStatus();
  const S0 = S(); const cats = CATS();
  const social = (url, name, inner) => url
    ? `<a class="press w-12 h-12 rounded-2xl bg-white hair shadow-soft grid place-items-center" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${name}">${inner}</a>`
    : `<button class="press w-12 h-12 rounded-2xl bg-white hair shadow-soft grid place-items-center" data-act="soon" data-name="${name}" aria-label="${name}">${inner}</button>`;
  const cards = cats.map((s, i) => `
    <button class="cat-card press relative flex-none w-[124px] h-[158px] rounded-[22px] overflow-hidden text-right" data-act="sheet" data-id="${esc(s.id)}" aria-label="${esc(s.name)}">
      ${imgTag(s.image, 'absolute inset-0 w-full h-full object-cover')}
      <span class="absolute inset-0 shade"></span>
      <span class="absolute top-2.5 right-2.5 text-[10px] font-medium text-white bg-white/20 border border-white/35 rounded-full px-2 pb-px" dir="ltr">${pad2(i + 1)}</span>
      <span class="absolute bottom-3 right-3 left-2.5 flex items-end justify-between text-white">
        <b class="text-[14px] leading-tight font-bold">${lines(s.short || s.name)}</b>
        <span class="w-6 h-6 rounded-full bg-white grid place-items-center flex-none">${ic(P.chev, 12, '#075A9F', 2.6)}</span>
      </span>
    </button>`).join('');
  return `
  <div data-light="1">
    <section class="hero-card">
      ${imgTag(HERO_IMG, '', 'مقر مؤسسة الإمدادات')}
      <div class="hero-tint"></div><div class="hero-scrim"></div>
      <div class="absolute inset-0 rounded-[46px] border border-white/15 pointer-events-none"></div>
      <div class="absolute hero-top inset-x-4 flex justify-between">
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="menu" aria-label="القائمة">${ic(P.dots, 20, '#fff', 2.4)}</button>
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18, '#fff')}</button>
      </div>
      <div class="absolute right-6 left-5 bottom-[58px] flex flex-col items-start gap-3">
        <div class="text-white">
          <div class="flex items-center gap-2 text-[12px] text-white/80 mb-1"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>الإمدادات · القصيم</div>
          <h2 class="text-[24px] font-extrabold leading-tight whitespace-nowrap">نبتكر<span class="text-orange">،</span> نصمم<span class="text-orange">،</span> نلهم<span class="text-orange">.</span></h2>
        </div>
        <button class="press glass h-[34px] px-3.5 rounded-full text-white text-[12.5px] font-medium flex items-center gap-1.5 flex-none" data-act="go" data-v="categories">تصفح الأقسام ${ic(P.chev, 13, '#fff', 2.2)}</button>
      </div>
    </section>

    <div class="relative -mt-12 flex justify-center z-10">
      <div class="w-24 h-24 rounded-full bg-white grid place-items-center shadow-lift" style="box-shadow:0 18px 34px -16px rgba(7,90,159,.45),0 0 0 5px #F7FAFD">
        <div class="absolute w-[84px] h-[84px] rounded-full border border-deep/10"></div>
        <img src="${MARK}" alt="شعار الإمدادات" class="w-[62px] h-[62px]">
      </div>
    </div>

    <div class="text-center mt-2.5 px-4">
      <h1 class="text-[22px] font-extrabold text-deep flex items-center justify-center gap-1.5">الإمدادات الذكية الحديثة
        <svg width="18" height="18" viewBox="0 0 24 24" aria-label="حساب موثق"><path d="M12 1.8l2.4 1.9 3-.2.9 2.9 2.6 1.6-.9 2.9.9 2.9-2.6 1.6-.9 2.9-3-.2L12 22.2l-2.4-1.9-3 .2-.9-2.9-2.6-1.6.9-2.9-.9-2.9 2.6-1.6.9-2.9 3 .2z" fill="#2196D2"/><path d="M8.2 12.2l2.6 2.6 5-5.2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></h1>
      <p class="text-muted text-[13px] mt-1 flex items-center justify-center gap-2.5"><i class="block w-8 h-px bg-gradient-to-l from-deep/25 to-transparent"></i>دعاية وإعلان · حلول تسويقية · إنتاج وتنفيذ<i class="block w-8 h-px bg-gradient-to-r from-deep/25 to-transparent"></i></p>
    </div>

    <nav class="flex justify-center gap-3.5 mt-5" aria-label="حسابات التواصل">
      ${social(S0.instagram, 'إنستغرام', `<svg width="24" height="24" viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEC053"/><stop offset=".35" stop-color="#F2203E"/><stop offset=".7" stop-color="#B729A8"/><stop offset="1" stop-color="#5342D6"/></linearGradient></defs><rect x="2.5" y="2.5" width="19" height="19" rx="5.6" fill="none" stroke="url(#ig)" stroke-width="2"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="url(#ig)" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.25" fill="url(#ig)"/></svg>`)}
      ${social(S0.snapchat, 'سناب شات', `<svg width="26" height="26" viewBox="0 0 26 26"><rect x=".5" y=".5" width="25" height="25" rx="8" fill="#FFFC00"/><path d="M13 4.6c3 0 5.1 2.3 5.1 5.2v2.2c.5.2 1 .2 1.5 0 .5-.2 1.1.3.8.8-.4.6-1.3.9-2 1.1.2 1 1.6 3 3.5 3.5.4.1.4.6 0 .8-.6.3-1.4.4-2.1.6-.2.4-.1 1-.6 1.1-.6.1-1.3-.2-2.1 0-1.3.3-2.1 1.6-4.1 1.6s-2.8-1.3-4.1-1.6c-.8-.2-1.5.1-2.1 0-.5-.1-.4-.7-.6-1.1-.7-.2-1.5-.3-2.1-.6-.4-.2-.4-.7 0-.8 1.9-.5 3.3-2.5 3.5-3.5-.7-.2-1.6-.5-2-1.1-.3-.5.3-1 .8-.8.5.2 1 .2 1.5 0V9.8c0-2.9 2.1-5.2 5.1-5.2z" fill="#fff" stroke="#111" stroke-width="1.1" stroke-linejoin="round"/></svg>`)}
      ${social(S0.tiktok, 'تيك توك', `<svg width="24" height="24" viewBox="0 0 24 24"><path transform="translate(-.7 -.5)" d="M12.6 2.5h3.1c.3 2.5 1.9 4.1 4.4 4.3v3.2c-1.6 0-3.1-.5-4.4-1.4v6.7a5.6 5.6 0 11-5.6-5.6c.3 0 .6 0 .9.1V13a2.5 2.5 0 101.6 2.3z" fill="#25F4EE"/><path transform="translate(.7 .5)" d="M12.6 2.5h3.1c.3 2.5 1.9 4.1 4.4 4.3v3.2c-1.6 0-3.1-.5-4.4-1.4v6.7a5.6 5.6 0 11-5.6-5.6c.3 0 .6 0 .9.1V13a2.5 2.5 0 101.6 2.3z" fill="#FE2C55"/><path d="M12.6 2.5h3.1c.3 2.5 1.9 4.1 4.4 4.3v3.2c-1.6 0-3.1-.5-4.4-1.4v6.7a5.6 5.6 0 11-5.6-5.6c.3 0 .6 0 .9.1V13a2.5 2.5 0 101.6 2.3z" fill="#111"/></svg>`)}
      ${social(S0.youtube, 'يوتيوب', `<svg width="28" height="20" viewBox="0 0 28 20"><rect x=".5" y=".5" width="27" height="19" rx="5.5" fill="#FF0000"/><path d="M11.3 6v8l7-4z" fill="#fff"/></svg>`)}
    </nav>

    <div class="grid grid-cols-3 gap-2 px-4 mt-4">
      <button class="press text-right h-[86px] rounded-[18px] bg-white hair shadow-soft flex flex-col items-start justify-between p-2.5" data-act="go" data-v="location">
        <span class="w-8 h-8 rounded-xl bg-tint grid place-items-center flex-none">${ic(P.pin, 17)}</span>
        <span class="min-w-0 w-full"><b class="block text-[12.5px] font-bold truncate">${esc(S0.city)}</b><span class="block text-[11px] text-muted whitespace-nowrap">عرض الموقع ‹</span></span>
      </button>
      <button class="press text-right h-[86px] rounded-[18px] bg-white hair shadow-soft flex flex-col items-start justify-between p-2.5" data-act="go" data-v="location" data-anchor="hours">
        <span class="w-8 h-8 rounded-xl bg-tint grid place-items-center flex-none">${ic(P.clock, 17)}</span>
        <span class="min-w-0 w-full"><span class="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold ${st.open ? 'text-[#12804A] bg-[#E6F6EE]' : 'text-[#B4232A] bg-[#FDECEC]'} rounded-lg px-1.5 py-px"><i class="w-1.5 h-1.5 rounded-full ${st.open ? 'bg-[#12A150] pulse-dot' : 'bg-[#E5484D]'}"></i>${st.label}</span><span class="block text-[10.5px] text-muted mt-0.5 whitespace-nowrap">${st.sub}</span></span>
      </button>
      <button class="press text-right h-[86px] rounded-[18px] bg-white hair shadow-soft flex flex-col items-start justify-between p-2.5" data-act="google">
        <span class="w-8 h-8 rounded-xl bg-white hair grid place-items-center flex-none"><svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg></span>
        <span class="min-w-0 w-full"><b class="block text-[12.5px] font-bold whitespace-nowrap">تقييم جوجل</b><span class="flex items-center gap-1 text-[11px] text-muted justify-end whitespace-nowrap" dir="ltr"><b class="text-ink text-[12px]">${esc(S0.googleRating)}</b><span class="text-orange">★</span>(${fmtNum(S0.googleRatingCount)})</span></span>
      </button>
    </div>

    <div class="flex items-end justify-between px-[18px] mt-6">
      <h3 class="relative text-[17px] font-extrabold pb-2">أقسام المتجر <small class="text-[11px] font-normal text-muted">· ${cats.length} أقسام</small><i class="absolute right-0 bottom-0 w-7 h-[3px] rounded bg-orange"></i></h3>
      <button class="press flex items-center gap-1.5 text-[12.5px] font-bold text-deep pb-1.5" data-act="go" data-v="categories">عرض الكل <span class="w-6 h-6 rounded-full bg-white hair grid place-items-center">${ic(P.chev, 12, '#075A9F', 2.4)}</span></button>
    </div>
    <div id="catRow" class="no-sb flex gap-2.5 overflow-x-auto px-4 pt-3 pb-1 snap-x snap-mandatory scroll-px-4">${cards}</div>
    <div id="catDots" class="flex justify-center gap-1.5 mt-2.5" aria-hidden="true"><i class="block h-1.5 w-[18px] rounded bg-deep transition-all"></i><i class="block h-1.5 w-1.5 rounded bg-deep/20 transition-all"></i><i class="block h-1.5 w-1.5 rounded bg-deep/20 transition-all"></i></div>

    ${S0.showLoyalty === false ? '' : `<button class="press mx-4 mt-4 w-[calc(100%-2rem)] h-[70px] rounded-[20px] flex items-center gap-3 px-3.5 text-white text-right overflow-hidden" style="background:linear-gradient(115deg,#075A9F 0%,#075A9F 62%,#2196D2 90%,#69C9F0 115%)" data-act="loyalty-cta">
      <span class="w-[42px] h-[42px] rounded-2xl bg-white/10 border border-white/20 grid place-items-center flex-none">${ic(P.crown, 24, '#FFAD3F', 1.7)}</span>
      <span class="flex-1 min-w-0"><b class="block text-[15px] font-extrabold">برنامج ولاء <span class="text-orange-2">الإمدادات</span></b><span class="block text-[11px] text-white/80 truncate">${state.joined ? `رصيدك ${state.points.toLocaleString('en-US')} نقطة · اضغط لعرض بطاقتك` : 'اجمع النقاط مع كل طلب واستبدلها بمزايا حصرية'}</span></span>
      <span class="h-8 px-3.5 rounded-full bg-orange text-white text-[12.5px] font-extrabold flex items-center flex-none" id="joinBtn">${state.joined ? 'بطاقتي' : 'انضم الآن'}</span>
    </button>`}

    <div class="flex items-center gap-2.5 text-[11.5px] text-muted px-4 mt-5"><i class="flex-1 h-px bg-deep/10"></i>طرق الدفع المتاحة<i class="flex-1 h-px bg-deep/10"></i></div>
    <div class="flex justify-between px-4 mt-2.5 pb-10" dir="ltr" aria-label="طرق الدفع">${PAYMENTS}</div>
  </div>`;
};

const PAYMENTS = [
  `<svg width="40" height="14" viewBox="0 0 40 14"><rect y="2.5" width="9" height="3.6" fill="#84B740"/><rect y="7.6" width="9" height="3.6" fill="#259BD6"/><text x="11" y="11" font-family="Arial" font-weight="700" font-size="10.5" fill="#27292D">mada</text></svg>`,
  `<svg width="36" height="14" viewBox="0 0 36 14"><g transform="translate(0 -.6) scale(.58)" fill="#fff"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.7-4zM14.1 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></g><text x="13" y="11" font-family="Arial" font-weight="700" font-size="10.5" fill="#fff">Pay</text></svg>`,
  `<svg width="34" height="12" viewBox="0 0 34 12"><text x="17" y="10.5" text-anchor="middle" font-family="Arial" font-weight="900" font-style="italic" font-size="12.5" fill="#1A1F71">VISA</text></svg>`,
  `<svg width="28" height="17" viewBox="0 0 28 17"><defs><clipPath id="mcL"><circle cx="9" cy="8.5" r="7.5"/></clipPath></defs><circle cx="9" cy="8.5" r="7.5" fill="#EB001B"/><circle cx="19" cy="8.5" r="7.5" fill="#F79E1B"/><circle cx="19" cy="8.5" r="7.5" fill="#FF5F00" clip-path="url(#mcL)"/></svg>`,
  `<svg width="40" height="13" viewBox="0 0 40 13"><text x="20" y="10" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10.5" fill="#4F008C">stc pay</text></svg>`,
  `<svg width="38" height="14" viewBox="0 0 38 14"><text x="19" y="10.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="11.5" fill="#1A1A1A">tabby</text></svg>`,
  `<svg width="44" height="14" viewBox="0 0 44 14"><defs><linearGradient id="tmr" x1="0" x2="1"><stop offset="0" stop-color="#F7A55A"/><stop offset=".5" stop-color="#E5609B"/><stop offset="1" stop-color="#8F6CF4"/></linearGradient></defs><text x="22" y="10.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="11" fill="url(#tmr)">tamara</text></svg>`
].map((s, i) => `<span class="h-[26px] w-[46px] rounded-lg grid place-items-center overflow-hidden ${i === 1 ? 'bg-black' : i === 5 ? 'bg-[#3EEDBF]' : 'bg-white hair'}">${s}</span>`).join('');

V.categories = () => `
  ${appbar('أقسام المتجر')}
  <div class="px-4 pb-10">
    <label class="h-[46px] rounded-2xl bg-white hair flex items-center gap-2.5 px-3.5 mt-1">${ic(P.search, 17, '#6B8299')}
      <input id="catSearch" class="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[#9AABBB]" placeholder="ابحث عن خدمة… مثل: حروف بارزة" aria-label="بحث"></label>
    <div id="catGrid" class="grid grid-cols-2 gap-2.5 mt-3.5"></div>
    <div class="mt-3 flex items-center gap-2.5 bg-white border border-dashed border-deep/25 rounded-[20px] p-3">
      <span class="w-10 h-10 rounded-[13px] bg-[#FFF3E3] grid place-items-center flex-none">${ic(P.msg, 20, '#F7941E')}</span>
      <span class="flex-1"><b class="block text-[13.5px]">لم تجد ما تبحث عنه؟</b><span class="block text-[11px] text-muted">صف لنا فكرتك ونقترح الحل المناسب</span></span>
      <button class="press h-8 px-3 rounded-full bg-orange text-white text-[12px] font-extrabold" data-act="go" data-v="quote">اطلب عرض سعر</button>
    </div>
  </div>`;
function renderCatGrid(q = '') {
  const g = $('#catGrid'); if (!g) return;
  q = q.trim();
  const list = CATS().map((s, i) => ({ s, i, hits: q ? [...(s.items || []), ...productsOf(s.id).map(p => p.name)].filter(x => x.includes(q)) : [] }))
    .filter(o => !q || o.s.name.includes(q) || o.hits.length);
  g.innerHTML = list.length ? list.map(({ s, i, hits }) => `
    <button class="press fade-in text-right bg-white hair rounded-[22px] overflow-hidden shadow-soft" data-act="go" data-v="service" data-id="${esc(s.id)}">
      <span class="block relative h-[118px] m-1.5 mb-0 rounded-[17px] overflow-hidden">${imgTag(s.image, 'w-full h-full object-cover')}
        <span class="absolute top-2 right-2 text-[10px] text-white bg-[#03213F]/45 border border-white/30 rounded-full px-2" dir="ltr">${pad2(i + 1)}</span></span>
      <span class="flex items-center justify-between px-3 pt-2 pb-2.5">
        <span class="min-w-0"><b class="block text-[13.5px] font-bold truncate">${esc(oneLine(s.short || s.name))}</b><span class="block text-[11px] text-muted truncate">${hits.length ? esc(hits[0]) : (s.items || []).length + ' خدمة'}</span></span>
        <span class="w-6 h-6 rounded-full bg-tint grid place-items-center flex-none">${ic(P.chev, 12, '#075A9F', 2.4)}</span></span>
    </button>`).join('') : `<p class="col-span-2 text-center text-muted text-[13px] py-10">لا توجد نتائج لـ «${esc(q)}»</p>`;
}

V.service = (id) => {
  const s = catById(id) || CATS()[0]; const idx = CATS().indexOf(s);
  const items = s.items || []; const works = s.works || [];
  return `
  <div data-light="1">
    <section class="relative m-2 h-[290px] rounded-[46px] overflow-hidden">
      ${imgTag(s.image, 'w-full h-full object-cover', s.name)}
      <div class="absolute inset-0" style="background:linear-gradient(180deg,rgba(2,26,49,.55) 0%,rgba(2,26,49,0) 35%,rgba(2,26,49,0) 60%,rgba(3,33,63,.7) 100%)"></div>
      <div class="absolute hero-top inset-x-4 flex justify-between">
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="back" aria-label="رجوع">${ic(P.back, 18, '#fff', 2.2)}</button>
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18, '#fff')}</button>
      </div>
      <span class="absolute bottom-[18px] right-5 glass h-[30px] px-3 rounded-full text-white text-[12px] flex items-center gap-1"><b>${items.length}</b> خدمة</span>
    </section>
    <div class="px-4 pt-3">
      <div class="flex items-center gap-2 text-[12px] text-muted"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>خدماتنا · ${pad2(idx + 1)}</div>
      <h1 class="text-[22px] font-extrabold text-deep leading-snug mt-1">${esc(s.name)}</h1>
      <p class="text-[14.5px] font-bold text-orange">${esc(s.tag)}</p>
      <p class="text-[13.5px] text-[#4A6580] leading-7 mt-2">${esc(s.desc)}</p>
      ${productsOf(s.id).length ? `<button class="press mt-3 w-full flex items-center gap-3 bg-white hair rounded-2xl px-3 py-2.5 text-right" data-act="sheet" data-id="${esc(s.id)}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(P.layers, 18)}</span><span class="flex-1"><b class="block text-[14px]">منتجات القسم</b><span class="block text-[11px] text-muted">${productsOf(s.id).length} منتج · اختر ما يناسبك لطلب عرض السعر</span></span>${ic(P.chev, 14, '#6B8299', 2.2)}</button>` : ''}
      <h3 class="text-[14.5px] font-extrabold mt-4 mb-2.5">ما نقدمه لك</h3>
      <div class="flex flex-wrap gap-1.5">${items.map(x => `<button class="press h-[30px] px-3 rounded-[10px] bg-white hair text-[12px]" data-act="sheet" data-id="${esc(s.id)}">${esc(x)}</button>`).join('')}</div>
      ${works.length ? `<h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5 flex justify-between">من معرض أعمالنا <button class="text-[12.5px] font-bold text-deep" data-act="go" data-v="portfolio">عرض الكل</button></h3>
      <div class="grid grid-cols-3 gap-2">${works.map(w => `<button class="press h-[88px] rounded-2xl overflow-hidden" data-act="lightbox" data-img="${esc(w)}">${imgTag(w, 'w-full h-full object-cover')}</button>`).join('')}</div>` : ''}
    </div>
    <div class="sticky -bottom-3 z-20 flex gap-2.5 px-4 pt-3 pb-6 mt-4 bg-surface"><span class="absolute inset-x-0 -top-6 h-6 pointer-events-none" style="background:linear-gradient(180deg,rgba(247,250,253,0),#F7FAFD)"></span>
      <a class="press w-12 h-12 rounded-2xl bg-white hair grid place-items-center flex-none" href="${esc(waLink())}" target="_blank" rel="noopener" aria-label="واتساب">${WA(22)}</a>
      <button class="press flex-1 h-12 rounded-2xl bg-deep text-white text-[14.5px] font-extrabold" data-act="go" data-v="quote" data-id="${esc(s.id)}">اطلب عرض سعر لهذه الخدمة</button>
    </div>
  </div>`;
};

const pfGroups = () => [...new Set(state.catalog.portfolio.map(p => p.group).filter(Boolean))];
V.portfolio = () => `
  ${appbar('معرض الأعمال')}
  <div class="px-4 flex items-end justify-between mt-1">
    <h2 class="text-[24px] font-extrabold leading-tight">الفكرة تُرى.<br><span class="text-deep">والجودة تُلمس.</span></h2>
    <div class="flex items-center gap-2 bg-white hair rounded-2xl px-3 py-2"><b class="text-[24px] font-extrabold text-orange leading-none">${pfGroups().length}</b><span class="text-[10.5px] text-muted leading-tight">مجموعات<br>أعمال</span></div>
  </div>
  <div id="pfChips" class="no-sb flex gap-2 overflow-x-auto px-4 my-3.5">${['all', ...pfGroups()].map(k => `<button class="chip press ${state.pf === k ? 'on' : ''}" data-act="pf" data-k="${esc(k)}">${k === 'all' ? 'الكل' : esc(k)}</button>`).join('')}</div>
  <div id="pfGrid" class="masonry px-4 pb-10"></div>`;
function renderPf() {
  const g = $('#pfGrid'); if (!g) return;
  if (state.pf !== 'all' && !pfGroups().includes(state.pf)) state.pf = 'all';
  const list = state.catalog.portfolio.filter(p => state.pf === 'all' || p.group === state.pf);
  g.innerHTML = list.map(({ image, title, desc, height }) => `
    <button class="press fade-in relative block w-full rounded-[20px] overflow-hidden text-right" style="height:${Math.max(110, Math.min(260, +height || 160))}px" data-act="lightbox" data-img="${esc(image)}" data-cap="${esc(title)}">
      ${imgTag(image, 'absolute inset-0 w-full h-full object-cover', title)}
      <span class="absolute inset-0" style="background:linear-gradient(180deg,rgba(3,33,63,0) 45%,rgba(3,33,63,.85) 100%)"></span>
      <span class="absolute bottom-2.5 inset-x-3 text-white"><b class="block text-[12.5px] font-bold">${esc(title)}</b><span class="block text-[10.5px] opacity-80 truncate">${esc(desc)}</span></span>
    </button>`).join('') || '<p class="text-center text-muted text-[13px] py-10" style="column-span:all">لا توجد أعمال في هذا التصنيف بعد</p>';
  document.querySelectorAll('#pfChips .chip').forEach(c => c.classList.toggle('on', c.dataset.k === state.pf));
}

V.quote = (id) => {
  const items = cartProducts();
  const sel = id || (items.length ? items[0].categoryId : '');
  return `
  ${appbar('طلب عرض سعر')}
  <form id="qForm" class="px-4 pb-10" novalidate>
    <div class="flex items-center gap-1.5 mb-3.5" aria-hidden="true"><span class="w-[26px] h-[26px] rounded-full bg-deep text-white text-[12px] font-bold grid place-items-center">1</span><i class="flex-1 h-0.5 rounded" style="background:linear-gradient(270deg,#075A9F,rgba(7,90,159,.12))"></i><span class="w-[26px] h-[26px] rounded-full bg-white hair text-[12px] text-muted grid place-items-center">2</span><i class="flex-1 h-0.5 rounded bg-deep/10"></i><span class="w-[26px] h-[26px] rounded-full bg-white hair text-[12px] text-muted grid place-items-center">3</span></div>
    <h2 class="text-[22px] font-extrabold text-deep">حدثنا عن مشروعك.</h2>
    <p class="text-[12.5px] text-muted mb-1">الحقول المشار إليها بـ <b class="text-orange">*</b> مطلوبة، وسنعود إليك خلال يوم عمل.</p>
    ${items.length ? `<div id="qItems" class="mt-2 p-3 rounded-2xl bg-tint"><b class="text-[12.5px] text-deep">المنتجات المختارة (${items.length})</b><div class="flex flex-wrap gap-1.5 mt-2">${items.map(p => `<span class="h-7 pr-2.5 pl-1 rounded-lg bg-white text-[11.5px] flex items-center gap-1">${esc(p.name)}<button type="button" class="w-5 h-5 grid place-items-center rounded-md" data-act="uncart" data-pid="${esc(p.id)}" aria-label="إزالة ${esc(p.name)}">${ic(P.x, 11, '#6B8299', 2.4)}</button></span>`).join('')}</div></div>` : ''}
    <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="qName">الاسم الكامل *</label><input id="qName" class="field" autocomplete="name" maxlength="100" placeholder="الاسم الكامل">
    <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="qPhone">رقم الجوال *</label>
    <div class="relative"><input id="qPhone" class="field pl-16" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" maxlength="16" placeholder="05X XXX XXXX"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted border-r border-deep/10 pr-2.5" dir="ltr">+966</span></div>
    <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="qMail">البريد الإلكتروني</label><input id="qMail" class="field" type="email" autocomplete="email" maxlength="120" dir="ltr" style="text-align:right" placeholder="name@company.com">
    <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="qSvc">نوع الخدمة *</label>
    <div class="relative"><select id="qSvc" class="field appearance-none pl-10"><option value="">اختر الخدمة</option>${CATS().map(s => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}<option value="other">مشروع متكامل / استفسار آخر</option></select><span class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">${ic(P.down, 17, '#075A9F', 2)}</span></div>
    <label class="block text-[12.5px] font-bold mt-3 mb-1.5" for="qDesc">وصف المشروع *</label>
    <div class="relative"><textarea id="qDesc" class="field" maxlength="500" placeholder="مثال: لوحة واجهة بحروف بارزة مضيئة بعرض 6 أمتار لمحل تجاري…"></textarea><span id="qCount" class="absolute left-3 bottom-2 text-[10.5px] text-[#9AABBB]" dir="ltr">0 / 500</span></div>
    <a href="${esc(waLink())}" target="_blank" rel="noopener" class="press mt-3 flex items-center gap-2.5 bg-[#EEFBF3] border border-[#CBEFD8] rounded-2xl p-3">${WA(22)}<span class="flex-1"><b class="block text-[13px]">لديك مخططات أو ملفات؟</b><span class="block text-[11px] text-muted">شاركها مباشرة عبر واتساب</span></span>${ic(P.upload, 17)}</a>
    <label class="flex items-center gap-2 text-[12px] text-[#4A6580] mt-3"><input id="qOk" type="checkbox" class="w-5 h-5 accent-[#075A9F]"> أوافق على استخدام بياناتي للرد على الطلب وفق <u>سياسة الخصوصية</u>.</label>
    <button id="qSend" class="press mt-5 w-full h-12 rounded-2xl bg-deep text-white text-[15px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-70" type="submit">أرسل طلب عرض السعر</button>
  </form>`;
};

V.location = () => {
  const st = openStatus(); const today = riyadhNow().day;
  const order = [6, 0, 1, 2, 3, 4, 5];
  return `
  ${appbar('الموقع وساعات العمل', `<button class="press w-11 h-11 rounded-full bg-white hair grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18)}</button>`)}
  <div class="px-4 pb-10">
    <a href="${esc(S().mapsUrl)}" target="_blank" rel="noopener" class="block relative h-[200px] rounded-3xl overflow-hidden hair" aria-label="فتح الخريطة">
      <svg class="absolute inset-0" width="100%" height="100%" viewBox="0 0 410 200" preserveAspectRatio="xMidYMid slice"><rect width="410" height="200" fill="#E9F3FA"/><path d="M0 35 L410 -5 M0 155 L410 115 M80 -25 L130 225 M260 -25 L300 225" stroke="#fff" stroke-width="12" fill="none"/><path d="M0 95 C120 85 240 105 410 65" stroke="#fff" stroke-width="12" fill="none"/><path d="M0 95 C120 85 240 105 410 65" stroke="#F9D9A6" stroke-width="7" fill="none"/><rect x="150" y="15" width="80" height="60" rx="8" fill="#D9EAF5"/><rect x="310" y="135" width="70" height="60" rx="8" fill="#D9EAF5"/><rect x="20" y="165" width="60" height="45" rx="8" fill="#DCEFE3"/><rect x="175" y="125" width="60" height="50" rx="8" fill="#DCEFE3"/><circle cx="205" cy="93" r="38" fill="#2196D2" opacity=".12"/><circle cx="205" cy="93" r="20" fill="#2196D2" opacity=".18"/></svg>
      <span class="absolute top-[66px] left-1/2 -translate-x-1/2 w-[54px] h-[54px] rounded-full bg-white grid place-items-center border-[3px] border-white" style="outline:2px solid #075A9F;box-shadow:0 10px 20px -8px rgba(7,90,159,.5)"><img src="${MARK}" alt="" class="w-[34px] h-[34px]"></span>
      <span class="absolute bottom-3 right-3 h-[30px] px-3 rounded-full bg-white flex items-center gap-1.5 text-[11.5px] shadow-soft">${ic(P.nav, 13, '#075A9F', 2)}فتح في الخرائط</span>
    </a>
    <div class="mt-3 bg-white hair rounded-[22px] p-3.5">
      <div class="flex items-center justify-between"><span class="inline-flex items-center gap-1 text-[11px] font-bold ${st.open ? 'text-[#12804A] bg-[#E6F6EE]' : 'text-[#B4232A] bg-[#FDECEC]'} rounded-lg px-2 py-0.5"><i class="w-1.5 h-1.5 rounded-full ${st.open ? 'bg-[#12A150] pulse-dot' : 'bg-[#E5484D]'}"></i>${st.label} · ${st.sub}</span><span class="text-[11px] text-muted">الفروع: 1</span></div>
      <b class="block text-[15.5px] font-extrabold mt-2">${esc(S().branchName)}</b>
      <span class="block text-[12.5px] text-muted leading-6 mt-0.5">${esc(S().address)}</span>
      <div class="flex gap-2 mt-3">
        <a href="${esc(S().mapsUrl)}" target="_blank" rel="noopener" class="press flex-[1.3] h-[42px] rounded-[14px] bg-deep text-white text-[13px] font-bold flex items-center justify-center gap-1.5">${ic(P.nav, 15, '#fff', 2)}الاتجاهات</a>
        <a href="${telLink()}" class="press flex-1 h-[42px] rounded-[14px] bg-white hair text-deep text-[13px] font-bold flex items-center justify-center gap-1.5">${ic(P.phone, 16)}اتصال</a>
        <a href="${esc(waLink())}" target="_blank" rel="noopener" class="press flex-1 h-[42px] rounded-[14px] bg-white hair text-deep text-[13px] font-bold flex items-center justify-center gap-1.5">${WA(17)}واتساب</a>
      </div>
    </div>
    <div id="hours" class="mt-3 bg-white hair rounded-[22px] px-3.5 py-3">
      <div class="flex items-center gap-2 mb-1">${ic(P.clock, 17)}<b class="text-[14.5px] flex-1">ساعات العمل</b><span class="text-[10.5px] text-muted">بتوقيت السعودية</span></div>
      ${order.map(d => `<div class="flex justify-between items-center text-[13px] px-2 py-[7px] rounded-[10px] ${d === today ? 'bg-tint' : ''}"><span class="${d === today ? 'font-extrabold text-deep' : 'text-[#3E5873]'}">${DAY_NAMES[d]}${d === today ? '<em class="not-italic text-[10px] text-white bg-orange rounded-lg px-1.5 py-px mr-1.5">اليوم</em>' : ''}</span><b class="font-medium">${dayHours(d) ? `${fmtH(dayHours(d).open)} – ${fmtH(dayHours(d).close)}` : '<span class="text-[#B4232A]">مغلق</span>'}</b></div>`).join('')}
    </div>
  </div>`;
};

V.loyalty = () => `
  ${appbar('برنامج ولاء الإمدادات')}
  <div class="px-4 pb-10">
    <div id="mcard" class="press relative h-[220px] rounded-[28px] text-white overflow-hidden shadow-lift cursor-pointer" style="background:linear-gradient(135deg,#0A66B0,#075A9F 60%,#043E70)" data-act="qr">
      <span class="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-sky/10"></span><span class="absolute -bottom-24 -left-10 w-60 h-60 rounded-full bg-orange/10"></span>
      <div class="absolute top-5 inset-x-5 flex justify-between items-center"><img src="${LOGO_WHITE}" alt="الإمدادات" class="w-[118px]"><span class="flex items-center gap-1 text-[12px] font-bold text-[#FFD08A] bg-orange-2/15 border border-orange-2/40 rounded-full px-2.5 py-1">${ic(P.crown, 13, '#FFAD3F', 2)}${state.joined ? 'ذهبي' : 'زائر'}</span></div>
      <div class="absolute top-[92px] right-5"><span class="block text-[11px] opacity-75">رصيد النقاط</span><b id="pts" class="block text-[34px] font-extrabold leading-tight" dir="ltr" style="text-align:right">${state.points.toLocaleString('en-US')}</b></div>
      <div class="absolute bottom-4 inset-x-5 flex justify-between items-end"><span><span class="block text-[10.5px] opacity-70">${state.joined ? 'عضو الإمدادات' : 'انضم لتفعيل بطاقتك'}</span><b class="block text-[14px]">${state.joined ? 'EM-' + (100000 + state.points * 7 % 899999) : '— — — —'}</b></span><span class="w-[52px] h-[52px] rounded-xl bg-white grid place-items-center ${state.joined ? '' : 'opacity-40'}">${ic(P.qr, 30, '#075A9F', 1.6)}</span></div>
    </div>
    ${state.joined ? '' : `<button class="press mt-3 w-full h-12 rounded-2xl bg-orange text-white text-[15px] font-extrabold flex items-center justify-center gap-2" data-act="join">${ic(P.gift, 18, '#fff', 2)}انضم الآن واحصل على 200 نقطة</button>`}
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button class="press h-[46px] rounded-[14px] bg-black text-white flex items-center justify-center gap-2" dir="ltr" data-act="wallet" data-w="apple">${APPLE_W}<span class="text-left leading-tight"><small class="block text-[9px] opacity-75">${state.wallet.apple ? 'تمت الإضافة' : 'إضافة إلى'}</small><b class="text-[13px]">Apple Wallet</b></span></button>
      <button class="press h-[46px] rounded-[14px] bg-white hair text-[#1F1F1F] flex items-center justify-center gap-2" dir="ltr" data-act="wallet" data-w="google">${GOOGLE_W}<span class="text-left leading-tight"><small class="block text-[9px] opacity-75">${state.wallet.google ? 'تمت الإضافة' : 'إضافة إلى'}</small><b class="text-[13px]">Google Wallet</b></span></button>
    </div>
    <div class="mt-3 bg-white hair rounded-[20px] px-3.5 py-3">
      <div class="text-[12.5px] text-muted"><b class="text-deep">${Math.max(0, 2000 - state.points).toLocaleString('en-US')} نقطة</b> تفصلك عن العضوية البلاتينية</div>
      <div class="h-2 rounded bg-tint my-2.5 overflow-hidden"><i class="block h-full rounded transition-all duration-700" style="width:${Math.min(100, state.points / 20)}%;background:linear-gradient(270deg,#075A9F,#2196D2 70%,#F7941E)"></i></div>
      <div class="flex justify-between text-[11.5px] text-[#9AABBB]"><span class="${state.joined ? 'text-ink' : ''}">فضي</span><span class="${state.points >= 1000 ? 'text-orange font-bold' : ''}">ذهبي</span><span>بلاتيني</span></div>
    </div>
    <h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5">كيف تكسب النقاط؟</h3>
    ${[[P.layers, 'مع كل طلب', '10 نقاط لكل 100 ريال'], [P.gift, 'هدية الانضمام', '200 نقطة ترحيبية'], [P.user, 'ادعُ صديقًا', '150 نقطة لكل إحالة']].map(([d, t, s]) => `<div class="flex items-center gap-2.5 bg-white hair rounded-2xl px-3 py-2.5 mb-2"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><span><b class="block text-[13.5px]">${t}</b><span class="block text-[11.5px] text-muted">${s}</span></span></div>`).join('')}
    <p class="text-[11px] text-muted text-center mt-2">* قواعد البرنامج مقترحة لأغراض العرض</p>
  </div>`;

V.about = () => `
  ${appbar('من نحن', `<button class="press w-11 h-11 rounded-full bg-white hair grid place-items-center" data-act="share" aria-label="مشاركة">${ic(P.share, 18)}</button>`)}
  <div class="px-4 pb-10">
    <div class="relative h-[200px] rounded-[28px] overflow-hidden">${imgTag(ABOUT_IMG, 'w-full h-full object-cover', 'مقر الإمدادات')}
      <span class="absolute inset-0" style="background:linear-gradient(270deg,rgba(3,33,63,.88),rgba(3,33,63,.35) 65%,rgba(3,33,63,.1))"></span>
      <span class="absolute right-5 bottom-5 text-white"><span class="text-[12px] opacity-80">عن الإمدادات</span><b class="block text-[22px] font-extrabold leading-snug">إبداع الفكرة.<br>وخبرة التنفيذ.</b></span></div>
    <p class="text-[13.5px] text-[#4A6580] leading-7 mt-3.5">مؤسسة متخصصة في تقديم الحلول الإبداعية المتكاملة في مجالات التصميم والطباعة والتنفيذ والإنتاج المرئي، نخدم الشركات والجهات الحكومية والقطاع غير الربحي ورواد الأعمال.</p>
    <div class="grid grid-cols-2 gap-2 mt-3">
      ${[[P.eye, 'رؤيتنا', 'أن نكون من المؤسسات الرائدة في تقديم الحلول الإبداعية المتكاملة في مجال الدعاية والإعلان.'], [P.target, 'رسالتنا', 'تقديم خدمات دعاية وإعلان باحترافية عالية تعزز هوية عملائنا وتحقق أهدافهم التسويقية.']].map(([d, t, s]) => `<div class="bg-white hair rounded-[20px] p-3"><span class="w-[34px] h-[34px] rounded-[11px] bg-tint grid place-items-center">${ic(d, 18)}</span><b class="block text-[14.5px] mt-2">${t}</b><span class="block text-[11.5px] text-muted leading-6 mt-0.5">${s}</span></div>`).join('')}
    </div>
    <h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5">قيم تظهر في النتيجة</h3>
    <div class="flex flex-wrap gap-1.5">${['الجودة','الإبداع','الاحترافية','الالتزام','الابتكار','سرعة الإنجاز'].map(v => `<span class="h-[30px] px-3 rounded-[10px] bg-white hair text-[12.5px] flex items-center">${v}</span>`).join('')}</div>
    <h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5">كيف نعمل</h3>
    <div class="grid grid-cols-3 gap-2">${[['نفهم احتياجك','ندرس احتياجات المشروع ونحدد المتطلبات.'],['نرسم التصور','نعد تصورًا مبدئيًا يتضمن الحلول المناسبة.'],['نراجع ونعتمد','نراجع التصميم أو المنتج معك قبل التنفيذ.'],['ننتج وننفذ','ننطلق بالتنفيذ وفق معايير الجودة.'],['نفحص الجودة','نتأكد من مطابقة المخرجات للمواصفات.'],['نسلم مشروعك','نسلم المخرجات في الوقت المحدد.']].map(([t, d], i) => `<button class="press text-right bg-white hair rounded-2xl p-2.5" data-act="step" data-t="${t}" data-d="${d}"><em class="not-italic block text-[11px] font-extrabold text-orange" dir="ltr" style="text-align:right">0${i + 1}</em><b class="block text-[12.5px] mt-0.5">${t}</b></button>`).join('')}</div>
    <div class="mt-5 grid grid-cols-2 gap-2">
      <a href="${telLink()}" class="press h-12 rounded-2xl bg-deep text-white text-[14px] font-bold flex items-center justify-center gap-2">${ic(P.phone, 17, '#fff')}<span dir="ltr">${esc(S().phone)}</span></a>
      <a href="${esc(waLink())}" target="_blank" rel="noopener" class="press h-12 rounded-2xl bg-white hair text-deep text-[14px] font-bold flex items-center justify-center gap-2">${WA(19)}واتساب</a>
    </div>
  </div>`;

/* ================================================================ sheets */
function openSheet(html) {
  $('#sheet').innerHTML = `<div class="pt-2.5 pb-1 flex-none"><div class="w-11 h-[5px] rounded bg-deep/20 mx-auto"></div></div>${html}`;
  $('#scrim').classList.add('on'); $('#sheet').classList.add('on');
}
function closeSheet() { $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on'); const s = state.stack && state.stack[state.stack.length - 1]; if (s && $('#tabbar')) renderTabs(TAB_OF[s[0]] || 'home'); }

function productSheet(id) {
  const s = catById(id); if (!s) return; const idx = CATS().indexOf(s);
  const prods = productsOf(s.id);
  const rows = prods.map((p) => {
    const on = state.cart.has(p.id); const price = fmtPrice(p.price);
    return `<div class="fade-in flex items-center gap-3 bg-white hair rounded-[20px] p-2 mt-2">
      ${imgTag(p.image, 'w-[68px] h-[68px] rounded-[15px] object-cover flex-none', p.name)}
      <div class="flex-1 min-w-0"><b class="block text-[14px]">${esc(p.name)}</b><span class="block text-[11.5px] text-muted truncate">${esc(p.desc)}</span><em class="not-italic inline-block text-[10.5px] ${price ? 'text-orange font-bold' : 'text-deep'} bg-tint rounded-lg px-2 mt-1">${price ? `يبدأ من ${price}` : 'السعر عند الطلب'}</em></div>
      <button class="press w-9 h-9 rounded-full grid place-items-center ml-1 flex-none transition-colors ${on ? 'bg-deep' : 'border-[1.5px] border-deep/25'}" data-act="cart" data-pid="${esc(p.id)}" data-id="${esc(s.id)}" aria-pressed="${on}" aria-label="${on ? 'إزالة' : 'إضافة'} ${esc(p.name)}">${ic(on ? P.check : P.plus, 15, on ? '#fff' : '#075A9F', 2.4)}</button>
    </div>`; }).join('') || `<p class="text-center text-muted text-[13px] py-8">لا توجد منتجات معروضة في هذا القسم حاليًا — اطلب عرض سعر ونخدمك بما تحتاج.</p>`;
  const n = prods.filter(p => state.cart.has(p.id)).length;
  openSheet(`
    <div class="px-4 flex items-start justify-between flex-none">
      <div><span class="flex items-center gap-2 text-[12px] text-muted"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>القسم ${pad2(idx + 1)} · ${(s.items || []).length} خدمة</span><b class="block text-[20px] font-extrabold text-deep mt-0.5">${esc(s.name)}</b></div>
      <button class="press w-9 h-9 rounded-full bg-white hair grid place-items-center flex-none" data-act="close" aria-label="إغلاق">${ic(P.x, 16, '#0B2A45', 2)}</button>
    </div>
    <div class="overflow-y-auto px-4 pb-3 flex-1">${rows}
      <button class="press mt-3 w-full text-[12.5px] font-bold text-deep py-2" data-act="go" data-v="service" data-id="${esc(s.id)}">عرض كل خدمات القسم ‹</button></div>
    <div class="px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] flex-none border-t border-deep/5">
      <button class="press w-full h-12 rounded-2xl bg-deep text-white text-[14.5px] font-extrabold flex items-center justify-between px-[18px]" data-act="go" data-v="quote" data-id="${esc(s.id)}"><span>اطلب عرض سعر</span><span class="text-[12px] font-medium bg-white/20 rounded-lg px-2.5 py-0.5">${n} منتج</span></button>
    </div>`);
  state.sheetId = id;
}

function menuSheet() {
  const items = [['loyalty', P.crown, 'برنامج الولاء'], ['location', P.pin, 'الموقع وساعات العمل'], ['about', P.info, 'من نحن'], ['categories', P.layers, 'أقسام المتجر'], ['portfolio', P.image, 'معرض الأعمال']]
    .filter(([v]) => v !== 'loyalty' || S().showLoyalty !== false);
  openSheet(`<div class="px-4 pb-[max(22px,env(safe-area-inset-bottom))]">
    <b class="block text-[18px] font-extrabold text-deep mb-2">المزيد</b>
    ${items.map(([v, d, t]) => `<button class="press w-full flex items-center gap-3 bg-white hair rounded-2xl px-3 py-2.5 mb-2 text-right" data-act="go" data-v="${v}"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><b class="flex-1 text-[14px]">${t}</b>${ic(P.chev, 14, '#6B8299', 2.2)}</button>`).join('')}
    <div class="grid grid-cols-2 gap-2 mt-1"><a href="${telLink()}" class="press h-11 rounded-2xl bg-deep text-white text-[13.5px] font-bold flex items-center justify-center gap-2">${ic(P.phone, 16, '#fff')}اتصل بنا</a><a href="${esc(waLink())}" target="_blank" rel="noopener" class="press h-11 rounded-2xl bg-white hair text-deep text-[13.5px] font-bold flex items-center justify-center gap-2">${WA(18)}واتساب</a></div>
  </div>`);
}

function lightbox(k, cap = '') {
  openSheet(`<div class="px-4 pb-[max(22px,env(safe-area-inset-bottom))]">${imgTag(k, 'w-full max-h-[56vh] object-cover rounded-3xl', cap)}${cap ? `<b class="block text-[15px] mt-3">${esc(cap)}</b>` : ''}
    <button class="press mt-3 w-full h-12 rounded-2xl bg-deep text-white text-[14px] font-bold" data-act="go" data-v="quote">أريد عملًا مشابهًا</button></div>`);
}

/* ================================================================ tab bar */
const TABS = [
  ['home', 'الرئيسية', '<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 014 19.5z"/>'],
  ['categories', 'الأقسام', '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'],
  ['quote', 'اطلب سعر', ''],
  ['portfolio', 'أعمالنا', '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4.5 4"/>'],
  ['more', 'المزيد', '<circle cx="12" cy="12" r="8.5"/><circle cx="8" cy="12" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="16" cy="12" r=".9"/>'],
];
const TAB_OF = { home: 'home', categories: 'categories', service: 'categories', quote: 'quote', portfolio: 'portfolio', location: 'more', loyalty: 'more', about: 'more' };
function renderTabs(active) {
  $('#tabbar').innerHTML = TABS.map(([k, t, d]) => k === 'quote'
    ? `<button class="tab press" data-act="tab" data-t="quote" aria-label="${t}"><span class="tab-fab">${ic('<path d="M12 5v14M5 12h14"/>', 24, '#fff', 2.4)}</span><span class="${active === 'quote' ? 'text-deep font-bold' : ''}">${t}</span></button>`
    : `<button class="tab press ${active === k ? 'on' : ''}" data-act="tab" data-t="${k}" aria-label="${t}" ${active === k ? 'aria-current="page"' : ''}>${ic(d, 22, 'currentColor', active === k ? 2 : 1.7)}<span>${t}</span></button>`).join('');
}
function tabGo(k) {
  if (k === 'more') { menuSheet(); renderTabs('more'); return; }
  closeSheet();
  const cur = state.stack[state.stack.length - 1][0];
  if (cur === k && state.stack.length === 1) { const v = $('#views').lastElementChild; v && v.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  state.stack = [[k]];
  history.replaceState({ d: 1 }, '', '#' + k);
  render(k, null, k === 'home' ? 'back' : 'fwd');
}

/* ================================================================ router */
function render(name, arg, dir = 'fwd') {
  const host = $('#views');
  const old = host.lastElementChild;
  const el = document.createElement('section');
  el.className = 'view no-sb ' + (old ? (dir === 'fwd' ? 'off-r' : dir === 'back' ? 'off-l' : '') : '');
  el.innerHTML = V[name](arg);
  el.dataset.view = name;
  host.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.remove('off-r', 'off-l');
    if (old) { if (dir === 'none') old.remove(); else { old.classList.add(dir === 'fwd' ? 'off-l' : 'off-r'); setTimeout(() => old.remove(), 340); } }
  }));
  renderTabs(TAB_OF[name] || 'home');
  afterRender(name, el, arg);
}
function go(name, arg) {
  closeSheet();
  state.stack.push([name, arg]);
  history.pushState({ d: state.stack.length }, '', '#' + name + (arg ? '/' + arg : ''));
  render(name, arg, 'fwd');
}
function back() { if (state.stack.length > 1) history.back(); else { state.stack = [['home']]; history.replaceState({ d: 1 }, '', '#home'); render('home', null, 'back'); } }
window.addEventListener('popstate', () => {
  closeSheet();
  if (state.stack.length > 1) { state.stack.pop(); const [n, a] = state.stack[state.stack.length - 1]; render(n, a, 'back'); }
});

function afterRender(name, el, arg) {
  if (name === 'home') {
    const row = el.querySelector('#catRow'); const dots = el.querySelectorAll('#catDots i');
    row.addEventListener('scroll', () => {
      const max = row.scrollWidth - row.clientWidth; const r = max ? Math.abs(row.scrollLeft) / max : 0;
      const a = Math.min(2, Math.round(r * 2));
      dots.forEach((d, i) => { d.style.width = i === a ? '18px' : '6px'; d.classList.toggle('bg-deep', i === a); d.classList.toggle('bg-deep/20', i !== a); });
    }, { passive: true });
  }
  if (name === 'categories') { renderCatGrid(); el.querySelector('#catSearch').addEventListener('input', e => renderCatGrid(e.target.value)); }
  if (name === 'portfolio') renderPf();
  if (name === 'location' && arg === 'hours') setTimeout(() => el.querySelector('#hours').scrollIntoView({ behavior: 'smooth', block: 'center' }), 380);
  if (name === 'quote') bindQuote(el);
}

/* ================================================================ quote → Firestore orders */
const toLatin = (v) => String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
/** يوحّد رقم الجوال السعودي إلى الصيغة 05XXXXXXXX */
export function normPhone(v) {
  let x = toLatin(v).replace(/[\s\-()]/g, '');
  x = x.replace(/^(\+|00)?966/, '');
  if (/^5\d{8}$/.test(x)) x = '0' + x;
  return x;
}
const orderText = (o, no = '') => [
  `طلب عرض سعر${no ? ' رقم ' + no : ''}`,
  `الاسم: ${o.name}`, `الجوال: ${o.phone}`, o.email ? `البريد: ${o.email}` : '',
  `الخدمة: ${o.serviceName}`,
  o.items.length ? `المنتجات: ${o.items.map(i => i.name).join('، ')}` : '',
  `الوصف: ${o.description}`,
].filter(Boolean).join('\n');

function orderDone(no, order) {
  if (state.joined) { state.points += 50; saveLoyalty(); }
  state.cart.clear(); saveCart();
  toast(no ? `تم إرسال طلبك رقم ${no}` : 'تم تجهيز طلبك', 'سنتواصل معك خلال يوم عمل' + (state.joined ? ' · +50 نقطة' : ''));
  state.stack = [['home']]; history.replaceState({ d: 1 }, '', '#home'); render('home', null, 'back');
  if (no) setTimeout(() => openSheet(`<div class="px-4 pb-[max(22px,env(safe-area-inset-bottom))] text-center">
    <span class="mx-auto mt-2 w-16 h-16 rounded-full bg-[#E6F6EE] grid place-items-center">${ic(P.check, 30, '#12A150', 2.6)}</span>
    <b class="block text-[19px] font-extrabold text-deep mt-3">استلمنا طلبك بنجاح</b>
    <span class="block text-[12.5px] text-muted mt-1">احتفظ برقم الطلب للمتابعة، وسيتواصل معك فريقنا خلال يوم عمل.</span>
    <div class="mt-4 mx-auto w-fit bg-white hair rounded-2xl px-5 py-2.5"><span class="block text-[11px] text-muted">رقم الطلب</span><b id="orderNo" class="block text-[22px] font-extrabold tracking-wider" dir="ltr">${esc(no)}</b></div>
    <a href="${esc(waLink(orderText(order, no)))}" target="_blank" rel="noopener" class="press mt-4 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white hair text-deep text-[14px] font-bold">${WA(19)}تابع طلبك عبر واتساب</a>
    <button class="press mt-2 w-full h-12 rounded-2xl bg-deep text-white text-[14px] font-bold" data-act="close">تم</button></div>`), 450);
}

function bindQuote(el) {
  const f = el.querySelector('#qForm'); const d = el.querySelector('#qDesc'); const btn = el.querySelector('#qSend');
  const label = btn.innerHTML; let sending = false;
  d.addEventListener('input', () => el.querySelector('#qCount').textContent = `${d.value.length} / 500`);
  f.addEventListener('input', e => e.target.classList && e.target.classList.remove('err'));
  f.addEventListener('submit', async e => {
    e.preventDefault(); if (sending) return;
    const val = s => el.querySelector(s).value.trim();
    const phone = normPhone(val('#qPhone')); const email = val('#qMail');
    const checks = [['#qName', val('#qName').length >= 2], ['#qPhone', /^05\d{8}$/.test(phone)], ['#qMail', !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)], ['#qSvc', !!val('#qSvc')], ['#qDesc', val('#qDesc').length >= 3]];
    let bad = null;
    checks.forEach(([s, ok]) => { const i = el.querySelector(s); i.classList.toggle('err', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.focus(); toast('أكمل الحقول المطلوبة', 'تحقق من الاسم ورقم الجوال ونوع الخدمة والوصف', 'info'); return; }
    if (!el.querySelector('#qOk').checked) { toast('يلزم الموافقة على سياسة الخصوصية', '', 'info'); return; }
    const svc = val('#qSvc'); const cat = catById(svc);
    const order = {
      name: val('#qName'), phone, email, serviceId: svc, serviceName: cat ? cat.name : 'مشروع متكامل / استفسار آخر',
      description: val('#qDesc'), items: cartProducts().slice(0, 30).map(p => ({ productId: p.id, name: p.name, categoryId: p.categoryId })),
    };
    if (!isConfigured) { // لا توجد قاعدة بيانات بعد: نرسل الطلب عبر واتساب
      window.open(waLink(orderText(order)), '_blank', 'noopener');
      orderDone('', order); return;
    }
    sending = true; btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" aria-hidden="true"><path d="M21 12a9 9 0 11-6.2-8.6" stroke-linecap="round"/></svg>جارٍ إرسال الطلب…`;
    try {
      const no = await createOrder(order);
      orderDone(no, order);
    } catch (err) {
      console.error('[emdad] order failed', err);
      sending = false; btn.disabled = false; btn.innerHTML = label;
      toast('تعذّر إرسال الطلب', 'تحقق من الاتصال وحاول مجددًا، أو أرسله عبر واتساب', 'err', 5000);
      if (!el.querySelector('#qWaFallback')) btn.insertAdjacentHTML('afterend', `<a id="qWaFallback" href="${esc(waLink(orderText(order)))}" target="_blank" rel="noopener" class="press mt-2 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white hair text-deep text-[14px] font-bold">${WA(19)}أرسل الطلب عبر واتساب</a>`);
    }
  });
}

/* ================================================================ actions */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'go') { e.preventDefault(); go(t.dataset.v, t.dataset.id || t.dataset.anchor); }
  else if (a === 'back') back();
  else if (a === 'tab') tabGo(t.dataset.t);
  else if (a === 'sheet') productSheet(t.dataset.id);
  else if (a === 'close') closeSheet();
  else if (a === 'menu') menuSheet();
  else if (a === 'lightbox') lightbox(t.dataset.img, t.dataset.cap);
  else if (a === 'pf') { state.pf = t.dataset.k; renderPf(); }
  else if (a === 'cart') {
    const k = t.dataset.pid; state.cart.has(k) ? state.cart.delete(k) : state.cart.add(k); saveCart();
    const sc = $('#sheet .overflow-y-auto').scrollTop; productSheet(t.dataset.id); $('#sheet .overflow-y-auto').scrollTop = sc;
    if (state.cart.has(k)) toast('أُضيف إلى طلب عرض السعر', productById(k)?.name || '');
  }
  else if (a === 'uncart') {
    state.cart.delete(t.dataset.pid); saveCart();
    const chip = t.closest('span'); const box = $('#qItems'); chip && chip.remove();
    if (box) { const n = box.querySelectorAll('[data-act="uncart"]').length; n ? box.querySelector('b').textContent = `المنتجات المختارة (${n})` : box.remove(); }
  }
  else if (a === 'soon') toast(`حساب ${t.dataset.name} قريبًا`, 'تابعنا على سناب شات وتيك توك: emdad_ads@', 'info');
  else if (a === 'google') {
    if (S().googleUrl) window.open(S().googleUrl, '_blank', 'noopener');
    else toast(`تقييمنا ${S().googleRating} من 5`, `بناءً على ${fmtNum(S().googleRatingCount)} تقييمًا على Google`, 'info');
  }
  else if (a === 'share') {
    const data = { title: 'الإمدادات الذكية الحديثة', text: 'نبتكر، نصمم، نلهم.', url: location.href.split('#')[0] };
    if (navigator.share) navigator.share(data).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(() => toast('تم نسخ الرابط', 'شاركه مع عملائك')).catch(() => toast('انسخ الرابط من شريط العنوان', '', 'info'));
    else toast('انسخ الرابط من شريط العنوان', '', 'info');
  }
  else if (a === 'loyalty-cta') {
    if (!state.joined) { joinProgram(); const b = $('#joinBtn'); if (b) b.textContent = 'بطاقتي'; setTimeout(() => go('loyalty'), 700); }
    else go('loyalty');
  }
  else if (a === 'join') { joinProgram(); render('loyalty', null, 'none'); }
  else if (a === 'wallet') {
    if (!state.joined) { toast('انضم لبرنامج الولاء أولًا', 'لإصدار بطاقتك الرقمية', 'info'); return; }
    const w = t.dataset.w; state.wallet[w] = true; saveLoyalty();
    toast(`أُضيفت البطاقة إلى ${w === 'apple' ? 'Apple Wallet' : 'Google Wallet'}`, 'ستصلك العروض والتحديثات مباشرة', w);
    const small = t.querySelector('small'); if (small) small.textContent = 'تمت الإضافة';
  }
  else if (a === 'qr') {
    if (!state.joined) { toast('انضم لتفعيل بطاقتك', '', 'info'); return; }
    openSheet(`<div class="px-4 pb-8 text-center"><b class="block text-[17px] font-extrabold text-deep">امسح البطاقة عند الكاشير</b><div class="mx-auto mt-4 w-48 h-48 rounded-3xl bg-white hair grid place-items-center">${ic(P.qr, 150, '#075A9F', 1.3)}</div><span class="block text-[12px] text-muted mt-3" dir="ltr">${$('#mcard b:last-of-type') ? '' : ''}EMDAD · LOYALTY</span></div>`);
  }
  else if (a === 'step') toast(t.dataset.t, t.dataset.d, 'info');
});
$('#scrim').addEventListener('click', closeSheet);
// swipe the sheet down to close
(() => { let y0 = null; const s = $('#sheet');
  s.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  s.addEventListener('touchend', e => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 80) closeSheet(); y0 = null; }, { passive: true });
})();
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function joinProgram() {
  if (state.joined) return;
  state.joined = true; state.points += 200;  // welcome points
  saveLoyalty();
  toast('مرحبًا بك في برنامج الولاء!', 'أُضيفت 200 نقطة ترحيبية إلى رصيدك');
}

/* ================================================================ boot */
const VIEWS_OK = new Set(['home', 'categories', 'service', 'portfolio', 'quote', 'location', 'loyalty', 'about']);
function start() {
  // deep links: #service/signage, #portfolio …
  const [name, arg] = location.hash.slice(1).split('/');
  state.stack = [['home']];
  history.replaceState({ d: 1 }, '', '#home');
  render('home', null, 'none');
  if (VIEWS_OK.has(name) && name !== 'home' && !(name === 'loyalty' && S().showLoyalty === false)) go(name, arg ? decodeURIComponent(arg) : undefined);
}
/** عند وصول بيانات أحدث من Firestore: نحدّث الشاشة الحالية دون فقدان مدخلات المستخدم */
function refreshCurrent() {
  const [name, arg] = state.stack[state.stack.length - 1];
  if (name === 'quote' || $('#sheet').classList.contains('on')) return;
  const v = $('#views').lastElementChild; const top = v ? v.scrollTop : 0;
  render(name, arg, 'none');
  const nv = $('#views').lastElementChild; if (nv) nv.scrollTop = top;
}

(async function boot() {
  const cached = cachedCatalog();
  if (cached) { state.catalog = cached; start(); }
  try {
    const fresh = await fetchCatalog();
    const changed = JSON.stringify(fresh) !== JSON.stringify(state.catalog && { ...state.catalog, source: fresh.source });
    state.catalog = fresh;
    if (!cached) start(); else if (changed) refreshCurrent();
  } catch (err) {
    console.error('[emdad] تعذّر تحميل الكتالوج من Firebase', err);
    if (!cached) { state.catalog = seedCatalog(); start(); }
    toast('تعذّر تحديث البيانات', 'تحقق من اتصالك بالإنترنت', 'info');
  }
  document.documentElement.dataset.ready = state.catalog.source;
  $('#splash')?.remove();
})();
