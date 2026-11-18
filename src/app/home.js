/* الرئيسية، التصنيفات، صفحة القسم، معرض الأعمال، الموقع، برنامج الولاء — بتصميم المتجر الأصلي */
import {
  $, esc, ic, P, WA, state, S, CATS, catById, productsOf, waLink, telLink, appbar, imgTag, V, AFTER, TITLES, ACT, go, refresh, toast,
  openSheet, MARK, LOGO_WHITE, DAY_NAMES, riyadhNow, fmtH, dayHours, openStatus, pad2, footer, pending, sectionHead, allLink, card, btnP, btnS, LS,
} from './core.js';
import { lines, oneLine, fmtNum, imgSrc } from '../lib/ui.js';
import { PAYMENT_METHODS } from '../lib/pricing.js';
import { grid, rail, featured, offers, popular, newest } from './shop.js';

const HERO_IMG = 'assets/images/facade-emdad-headquarters.jpg';
export const ABOUT_IMG = 'assets/images/facade-emdad-building-and-fleet.jpg';
const loyalty = LS.get('loyalty', { joined: false, points: 0, wallet: {} });
Object.assign(state, { joined: loyalty.joined, points: loyalty.points, wallet: loyalty.wallet || {} });
const saveLoyalty = () => LS.set('loyalty', { joined: state.joined, points: state.points, wallet: state.wallet });

function homeSections() {
  const f = featured(); const o = offers(); const pop = popular();
  return `
    ${f.length ? `${sectionHead('منتجات مميزة', `${f.length} منتجات`, allLink('data-v="shop" data-id="all"'))}${rail(f)}` : ''}
    ${o.length ? `${sectionHead('العروض والباقات', 'خصومات لفترة محدودة', allLink('data-v="shop" data-id="offers"'))}${rail(o)}` : ''}
    ${sectionHead(pop.length ? 'الأكثر طلبًا' : 'وصل حديثًا', pop.length ? 'حسب الطلبات' : 'أحدث المنتجات', allLink(`data-v="shop" data-id="${pop.length ? 'popular' : 'new'}"`))}${rail((pop.length ? pop : newest()).slice(0, 8))}

    <div class="grid grid-cols-2 gap-2 px-4 mt-6">
      <button class="press reveal text-right rounded-[22px] p-3.5 text-white overflow-hidden relative min-h-[150px] flex flex-col" style="background:linear-gradient(135deg,#0A66B0,#075A9F 60%,#043E70)" data-act="go" data-v="quote">
        <span class="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-sky/15"></span>
        <span class="w-9 h-9 rounded-xl bg-white/15 grid place-items-center">${ic(P.building, 19, '#fff')}</span>
        <b class="block text-[14.5px] font-extrabold mt-2 leading-snug">للشركات والجهات الحكومية</b>
        <span class="block text-[11px] text-white/80 mt-1 leading-5">عروض أسعار للكميات والمشاريع مع رفع المخططات</span>
        <span class="mt-auto pt-2 text-[12px] font-bold text-orange-2">اطلب عرض سعر ‹</span>
      </button>
      <button class="press reveal text-right rounded-[22px] p-3.5 bg-white hair shadow-soft min-h-[150px] flex flex-col" data-act="go" data-v="shop" data-id="all">
        <span class="w-9 h-9 rounded-xl bg-[#FFF3E3] grid place-items-center">${ic(P.cart, 19, '#F7941E')}</span>
        <b class="block text-[14.5px] font-extrabold mt-2 leading-snug text-deep">للأفراد والمشاريع الصغيرة</b>
        <span class="block text-[11px] text-muted mt-1 leading-5">منتجات جاهزة بأسعار واضحة وخيارات تخصيص</span>
        <span class="mt-auto pt-2 text-[12px] font-bold text-deep">تسوق الآن ‹</span>
      </button>
    </div>

    ${sectionHead('لماذا الإمدادات؟')}
    <div class="grid grid-cols-2 gap-2 px-4 mt-3">${[[P.layers, 'حلول متكاملة', 'تصميم وطباعة وتصنيع وتركيب من جهة واحدة'], [P.edit, 'تخصيص كامل', 'مقاسات وخامات وتشطيبات حسب احتياجك'], [P.shield, 'مراجعة قبل التنفيذ', 'نعتمد التصميم معك قبل بدء الإنتاج'], [P.truck, 'متابعة الطلب', 'رقم لكل طلب ومراحل تنفيذ واضحة']].map(([d, t, s]) => `<div class="reveal ${card} p-3"><span class="w-9 h-9 rounded-xl bg-tint grid place-items-center">${ic(d, 18)}</span><b class="block text-[13px] mt-2">${t}</b><span class="block text-[11px] text-muted leading-5 mt-0.5">${s}</span></div>`).join('')}</div>

    <div class="reveal mx-4 mt-6 ${card} p-4">
      <span class="flex items-center gap-2 text-[12px] text-muted"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>عن المؤسسة</span>
      <p class="text-[13px] text-[#4A6580] leading-7 mt-1.5">مؤسسة متخصصة في الحلول الإبداعية المتكاملة في التصميم والطباعة والتنفيذ والإنتاج، نخدم الشركات والجهات الحكومية والقطاع غير الربحي ورواد الأعمال والأفراد.</p>
      <div class="flex gap-2 mt-3"><button class="press h-10 px-4 rounded-xl bg-deep text-white text-[12.5px] font-bold" data-act="go" data-v="about">من نحن</button><button class="press h-10 px-4 rounded-xl bg-white hair text-deep text-[12.5px] font-bold" data-act="go" data-v="services">خدماتنا</button></div>
    </div>

    ${state.catalog.portfolio.length ? `${sectionHead('من معرض أعمالنا', '', allLink('data-v="portfolio"'))}<div class="grid grid-cols-3 gap-2 px-4 mt-3">${state.catalog.portfolio.slice(0, 3).map((w) => `<button class="press reveal h-[96px] rounded-2xl overflow-hidden" data-act="lightbox" data-img="${esc(w.image)}" data-cap="${esc(w.title)}">${imgTag(w.image, 'w-full h-full object-cover', w.title)}</button>`).join('')}</div>` : ''}
`;
}
const heroSlides = () => (S().heroSlides || []).filter((x) => x && x.title && x.image).slice(0, 8);
V.home = () => {
  const slides = heroSlides().length ? heroSlides() : [{ title: 'نبتكر، نصمم، نلهم', desc: 'حلول دعاية وإعلان متكاملة', cta: 'تصفح الأقسام', link: 'categories', image: HERO_IMG }];
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
    <section class="hero-card" id="hero" aria-roledescription="carousel" aria-label="العروض الترويجية">
      <div class="hero-track">${slides.map((sl, i) => `<div class="hero-slide ${i ? '' : 'on'}" role="group" aria-roledescription="slide" aria-label="${i + 1} من ${slides.length}" ${i ? 'aria-hidden="true"' : ''}>
        <img src="${imgSrc(sl.image)}" alt="${esc(sl.title)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
      </div>`).join('')}</div>
      <div class="hero-tint"></div><div class="hero-scrim"></div>
      <div class="absolute inset-0 rounded-[46px] border border-white/15 pointer-events-none"></div>
      <div class="absolute hero-top inset-x-4 flex justify-between z-[3]">
        <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="menu" aria-label="القائمة">${ic(P.dots, 20, '#fff', 2.4)}</button>
        <span class="flex gap-2">
          <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="go" data-v="search" aria-label="بحث">${ic(P.search, 18, '#fff', 2)}</button>
          <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="go" data-v="favorites" aria-label="المفضلة">${ic(P.heart, 18, '#fff', 2)}</button>
          <button class="press glass w-10 h-10 rounded-full grid place-items-center" data-act="go" data-v="${state.user && !state.user.isAnonymous ? 'account' : 'login'}" aria-label="حسابي">${ic(P.user, 18, '#fff', 2)}</button>
        </span>
      </div>
      <div class="hero-texts z-[2]" aria-live="polite">${slides.map((sl, i) => { const [v, ...r] = String(sl.link || 'shop').split('/'); return `<div class="hero-text ${i ? '' : 'on'}" ${i ? 'aria-hidden="true"' : ''}>
        <div class="flex items-center gap-2 text-[12px] text-white/80 mb-1"><i class="block w-[18px] h-[2px] rounded bg-orange"></i>الإمدادات · ${String(i + 1).padStart(2, '0')}</div>
        <h2 class="text-[21px] font-extrabold leading-snug text-white">${esc(sl.title)}<span class="text-orange">.</span></h2>
        <p class="text-[12.5px] text-white/85 mt-0.5 leading-5">${esc(sl.desc)}</p>
        <button class="press glass h-[34px] px-3.5 mt-2.5 rounded-full text-white text-[12.5px] font-medium inline-flex items-center gap-1.5" data-act="go" data-v="${esc(v)}" ${r.length ? `data-id="${esc(r.join('/'))}"` : ''} ${i ? 'tabindex="-1"' : ''}>${esc(sl.cta || 'اكتشف المزيد')} ${ic(P.chev, 13, '#fff', 2.2)}</button>
      </div>`; }).join('')}</div>
      ${slides.length > 1 ? `<div class="absolute bottom-[18px] right-6 z-[3] flex gap-1.5" role="tablist" aria-label="اختر الشريحة">${slides.map((_, i) => `<button class="hero-dot ${i ? '' : 'on'}" role="tab" aria-selected="${!i}" aria-label="الشريحة ${i + 1}" data-hs="${i}"></button>`).join('')}</div>
      <div class="absolute bottom-[12px] left-5 z-[3] flex gap-1.5">
        <button class="press glass w-8 h-8 rounded-full grid place-items-center" data-hnav="-1" aria-label="الشريحة السابقة">${ic(P.back, 14, '#fff', 2.4)}</button>
        <button class="press glass w-8 h-8 rounded-full grid place-items-center" data-hnav="1" aria-label="الشريحة التالية">${ic(P.chev, 14, '#fff', 2.4)}</button>
      </div>` : ''}
    </section>

    <div class="relative -mt-12 flex justify-center z-10 pointer-events-none">
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

    <button class="press mx-4 mt-4 w-[calc(100%-2rem)] h-[46px] rounded-2xl bg-white hair shadow-soft flex items-center gap-2.5 px-3.5 text-right text-[13.5px] text-[#9AABBB]" data-act="go" data-v="search">${ic(P.search, 17, '#6B8299')}ابحث عن منتج أو خدمة… مثل: رول أب، دروع، حروف بارزة</button>

    <div class="grid grid-cols-3 gap-2 px-4 mt-3">
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
        <span class="min-w-0 w-full"><b class="block text-[12.5px] font-bold whitespace-nowrap">تقييم جوجل</b>${S0.googleRating ? `<span class="flex items-center gap-1 text-[11px] text-muted justify-end whitespace-nowrap" dir="ltr"><b class="text-ink text-[12px]">${esc(S0.googleRating)}</b><span class="text-orange">★</span>(${fmtNum(S0.googleRatingCount)})</span>` : '<span class="block text-[11px] text-muted whitespace-nowrap">شاركنا تقييمك ‹</span>'}</span>
      </button>
    </div>

    <div class="flex items-end justify-between px-[18px] mt-6">
      <h3 class="relative text-[17px] font-extrabold pb-2">أقسام المتجر <small class="text-[11px] font-normal text-muted">· ${cats.length} أقسام</small><i class="absolute right-0 bottom-0 w-7 h-[3px] rounded bg-orange"></i></h3>
      <button class="press flex items-center gap-1.5 text-[12.5px] font-bold text-deep pb-1.5" data-act="go" data-v="categories">عرض الكل <span class="w-6 h-6 rounded-full bg-white hair grid place-items-center">${ic(P.chev, 12, '#075A9F', 2.4)}</span></button>
    </div>
    <div id="catRow" class="no-sb flex gap-2.5 overflow-x-auto px-4 pt-3 pb-1 snap-x snap-mandatory scroll-px-4">${cards}</div>
    <div id="catDots" class="flex justify-center gap-1.5 mt-2.5" aria-hidden="true"><i class="block h-1.5 w-[18px] rounded bg-deep transition-all"></i><i class="block h-1.5 w-1.5 rounded bg-deep/20 transition-all"></i><i class="block h-1.5 w-1.5 rounded bg-deep/20 transition-all"></i></div>

${homeSections()}
    ${S0.showLoyalty === false ? '' : `<button class="press mx-4 mt-4 w-[calc(100%-2rem)] h-[70px] rounded-[20px] flex items-center gap-3 px-3.5 text-white text-right overflow-hidden" style="background:linear-gradient(115deg,#075A9F 0%,#075A9F 62%,#2196D2 90%,#69C9F0 115%)" data-act="loyalty-cta">
      <span class="w-[42px] h-[42px] rounded-2xl bg-white/10 border border-white/20 grid place-items-center flex-none">${ic(P.crown, 24, '#FFAD3F', 1.7)}</span>
      <span class="flex-1 min-w-0"><b class="block text-[15px] font-extrabold">برنامج ولاء <span class="text-orange-2">الإمدادات</span></b><span class="block text-[11px] text-white/80 truncate">${state.joined ? `رصيدك ${state.points.toLocaleString('en-US')} نقطة · اضغط لعرض بطاقتك` : 'اجمع النقاط مع كل طلب واستبدلها بمزايا حصرية'}</span></span>
      <span class="h-8 px-3.5 rounded-full bg-orange text-white text-[12.5px] font-extrabold flex items-center flex-none" id="joinBtn">${state.joined ? 'بطاقتي' : 'انضم الآن'}</span>
    </button>`}

    <div class="flex items-center gap-2.5 text-[11.5px] text-muted px-4 mt-5"><i class="flex-1 h-px bg-deep/10"></i>طرق الدفع المتاحة<i class="flex-1 h-px bg-deep/10"></i></div>
    ${S0.showPaymentLogos ? `<div class="flex justify-between px-4 mt-2.5" dir="ltr" aria-label="طرق الدفع">${PAYMENTS}</div>` : `<div class="flex flex-wrap justify-center gap-1.5 px-4 mt-2.5" aria-label="طرق الدفع">${Object.entries(PAYMENT_METHODS).filter(([k]) => S0.payments?.[k] && (k !== 'bank' || S0.iban)).map(([, m]) => `<span class="h-[30px] px-3 rounded-[10px] bg-white hair text-[12px] flex items-center gap-1.5">${ic(P.check, 13, '#12A150', 2.4)}${m.t}</span>`).join('')}</div>`}
    ${footer()}
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
    <button class="press fade-in text-right bg-white hair rounded-[22px] overflow-hidden shadow-soft" data-act="go" data-v="category" data-id="${esc(s.id)}">
      <span class="block relative h-[118px] m-1.5 mb-0 rounded-[17px] overflow-hidden">${imgTag(s.image, 'w-full h-full object-cover')}
        <span class="absolute top-2 right-2 text-[10px] text-white bg-[#03213F]/45 border border-white/30 rounded-full px-2" dir="ltr">${pad2(i + 1)}</span></span>
      <span class="flex items-center justify-between px-3 pt-2 pb-2.5">
        <span class="min-w-0"><b class="block text-[13.5px] font-bold truncate">${esc(oneLine(s.short || s.name))}</b><span class="block text-[11px] text-muted truncate">${hits.length ? esc(hits[0]) : (s.items || []).length + ' خدمة'}</span></span>
        <span class="w-6 h-6 rounded-full bg-tint grid place-items-center flex-none">${ic(P.chev, 12, '#075A9F', 2.4)}</span></span>
    </button>`).join('') : `<p class="col-span-2 text-center text-muted text-[13px] py-10">لا توجد نتائج لـ «${esc(q)}»</p>`;
}

V.category = (id) => {
  const s = catById(id); if (!s) return null; const idx = CATS().indexOf(s);
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
      ${productsOf(s.id).length ? `<h3 class="text-[14.5px] font-extrabold mt-4 mb-2.5 flex justify-between">منتجات القسم <button class="text-[12.5px] font-bold text-deep" data-act="go" data-v="shop" data-id="cat:${esc(s.id)}">فرز وفلترة</button></h3>${grid(productsOf(s.id))}` : ''}
      <h3 class="text-[14.5px] font-extrabold mt-4 mb-2.5">ما نقدمه لك</h3>
      <div class="flex flex-wrap gap-1.5">${items.map(x => `<button class="press h-[30px] px-3 rounded-[10px] bg-white hair text-[12px]" data-act="go" data-v="shop" data-id="q:${esc(x)}">${esc(x)}</button>`).join('')}</div>
      ${works.length ? `<h3 class="text-[14.5px] font-extrabold mt-5 mb-2.5 flex justify-between">من معرض أعمالنا <button class="text-[12.5px] font-bold text-deep" data-act="go" data-v="portfolio">عرض الكل</button></h3>
      <div class="grid grid-cols-3 gap-2">${works.map(w => `<button class="press h-[88px] rounded-2xl overflow-hidden" data-act="lightbox" data-img="${esc(w)}">${imgTag(w, 'w-full h-full object-cover')}</button>`).join('')}</div>` : ''}
    </div>
    <div class="sticky -bottom-3 z-20 flex gap-2.5 px-4 pt-3 pb-6 mt-4 bg-surface"><span class="absolute inset-x-0 -top-6 h-6 pointer-events-none" style="background:linear-gradient(180deg,rgba(247,250,253,0),#F7FAFD)"></span>
      <a class="press w-12 h-12 rounded-2xl bg-white hair grid place-items-center flex-none" href="${esc(waLink())}" target="_blank" rel="noopener" aria-label="واتساب">${WA(22)}</a>
      <button class="press flex-1 h-12 rounded-2xl bg-deep text-white text-[14.5px] font-extrabold" data-act="go" data-v="quote" data-id="cat:${esc(s.id)}">اطلب عرض سعر لهذه الخدمة</button>
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
      ${S().hoursApproved ? '' : `<div class="mb-1.5">${pending('ساعات العمل أولية بانتظار اعتماد الإدارة')}</div>`}
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


TITLES.categories = () => 'التصنيفات';
TITLES.category = (id) => catById(id)?.name;
V.service = V.category; AFTER.service = (...a) => AFTER.category?.(...a); TITLES.service = TITLES.category;
TITLES.portfolio = () => 'معرض الأعمال';
TITLES.location = () => 'الموقع وساعات العمل';
TITLES.loyalty = () => 'برنامج الولاء';
/* ---------------- سلايدر الرئيسية: تشغيل تلقائي، مؤشرات، أسهم، سحب باللمس، إيقاف عند التفاعل ---------------- */
function heroSlider(el) {
  const hero = el.querySelector('#hero'); if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero-slide')]; const texts = [...hero.querySelectorAll('.hero-text')]; const dots = [...hero.querySelectorAll('.hero-dot')];
  if (slides.length < 2) return;
  let cur = 0; let timer = null; let pausedUntil = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ms = Math.max(3, Math.min(10, Number(S().heroInterval) || 4.5)) * 1000;
  const show = (i) => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('on', k === cur); s.setAttribute('aria-hidden', k !== cur); });
    texts.forEach((t, k) => { t.classList.toggle('on', k === cur); t.setAttribute('aria-hidden', k !== cur); t.querySelector('button')?.setAttribute('tabindex', k === cur ? '0' : '-1'); });
    dots.forEach((d, k) => { d.classList.toggle('on', k === cur); d.setAttribute('aria-selected', k === cur); });
  };
  const tick = () => {
    if (!hero.isConnected) { clearInterval(timer); return; }
    if (document.hidden || Date.now() < pausedUntil) return;
    show(cur + 1);
  };
  const pause = (t = 8000) => { pausedUntil = Date.now() + t; };
  if (!reduce) timer = setInterval(tick, ms);
  hero.addEventListener('click', (e) => {
    const d = e.target.closest('[data-hs]'); const n = e.target.closest('[data-hnav]');
    if (d) { show(+d.dataset.hs); pause(); }
    if (n) { show(cur + Number(n.dataset.hnav)); pause(); }
  });
  hero.addEventListener('mouseenter', () => pause(60 * 60 * 1000)); hero.addEventListener('mouseleave', () => pause(1500));
  hero.addEventListener('focusin', () => pause(10000));
  let x0 = null; let y0 = null;
  hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; pause(); }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; const dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx > 0 ? 1 : -1)); // RTL: السحب لليمين = التالية
  }, { passive: true });
  // تحميل مسبق للشريحة التالية لتسريع الانتقال
  slides.forEach((s) => { const im = s.querySelector('img'); if (im.loading === 'lazy') setTimeout(() => { im.loading = 'eager'; }, 1200); });
}
AFTER.home = (el) => {
  heroSlider(el);
  const row = el.querySelector('#catRow'); const dots = el.querySelectorAll('#catDots i');
  row.addEventListener('scroll', () => {
    const max = row.scrollWidth - row.clientWidth; const r = max ? Math.abs(row.scrollLeft) / max : 0;
    const a = Math.min(2, Math.round(r * 2));
    dots.forEach((d, i) => { d.style.width = i === a ? '18px' : '6px'; d.classList.toggle('bg-deep', i === a); d.classList.toggle('bg-deep/20', i !== a); });
  }, { passive: true });
};
AFTER.categories = (el) => { renderCatGrid(); el.querySelector('#catSearch').addEventListener('input', (e) => renderCatGrid(e.target.value)); };
AFTER.portfolio = () => renderPf();
AFTER.location = (el, arg) => { if (arg === 'hours') setTimeout(() => el.querySelector('#hours').scrollIntoView({ behavior: 'smooth', block: 'center' }), 380); };
ACT.pf = (t) => { state.pf = t.dataset.k; renderPf(); };
ACT.lightbox = (t) => openSheet(`<div class="px-4 pb-[max(22px,env(safe-area-inset-bottom))]">${imgTag(t.dataset.img, 'w-full max-h-[56vh] object-cover rounded-3xl', t.dataset.cap || '')}${t.dataset.cap ? `<b class="block text-[15px] mt-3">${esc(t.dataset.cap)}</b>` : ''}
    <button class="press mt-3 w-full h-12 rounded-2xl bg-deep text-white text-[14px] font-bold" data-act="go" data-v="quote">أريد عملًا مشابهًا</button></div>`);
ACT.google = () => {
  if (S().googleUrl) window.open(S().googleUrl, '_blank', 'noopener');
  else if (S().googleRating) toast(`تقييمنا ${S().googleRating} من 5`, `بناءً على ${fmtNum(S().googleRatingCount)} تقييمًا على Google`, 'info');
  else toast('سعداء بتقييمك', 'رابط التقييم على Google سيُضاف قريبًا', 'info');
};
ACT.soon = (t) => toast(`حساب ${t.dataset.name} قريبًا`, 'تابعنا على سناب شات وتيك توك: emdad_ads@', 'info');
function joinProgram() {
  if (state.joined) return;
  state.joined = true; state.points += 200; saveLoyalty();
  toast('مرحبًا بك في برنامج الولاء!', 'أُضيفت 200 نقطة ترحيبية إلى رصيدك');
}
ACT['loyalty-cta'] = () => { if (!state.joined) { joinProgram(); setTimeout(() => go('loyalty'), 700); } else go('loyalty'); };
ACT.join = () => { joinProgram(); refresh(); };
ACT.wallet = (t) => {
  if (!state.joined) { toast('انضم لبرنامج الولاء أولًا', 'لإصدار بطاقتك الرقمية', 'info'); return; }
  toast('إضافة البطاقة إلى المحفظة قيد التفعيل', 'سيتاح إصدار بطاقة المحفظة الرقمية عند تفعيل البرنامج رسميًا', 'info');
};
ACT.qr = () => {
  if (!state.joined) { toast('انضم لتفعيل بطاقتك', '', 'info'); return; }
  openSheet(`<div class="px-4 pb-8 text-center"><b class="block text-[17px] font-extrabold text-deep">بطاقة العضوية</b><div class="mx-auto mt-4 w-48 h-48 rounded-3xl bg-white hair grid place-items-center">${ic(P.qr, 150, '#075A9F', 1.3)}</div><span class="block text-[12px] text-muted mt-3">برنامج الولاء تجريبي — سيُفعَّل المسح عند الكاشير عند اعتماد البرنامج</span></div>`);
};
