/* نقطة دخول واجهة المتجر */
import { $, state, V, ACT, go, back, tabGo, render, refresh, closeSheet, menuSheet, toast, renderSideNav, S } from './core.js';
import './shop.js';
import './cart.js';
import './account.js';
import './home.js';
import { maintenanceHtml } from './pages.js';
import { cachedCatalog, fetchCatalog, seedCatalog } from '../lib/api.js';
import { isConfigured } from '../lib/firebase.js';
import { initAuth } from './account.js';

/* ================================================================ actions */
Object.assign(ACT, {
  go: (t, e) => { e.preventDefault(); go(t.dataset.v, t.dataset.id || t.dataset.anchor); },
  back: () => back(),
  tab: (t) => tabGo(t.dataset.t),
  close: () => closeSheet(),
  menu: () => menuSheet(),
  share: () => {
    const data = { title: document.title, text: 'الإمدادات الذكية الحديثة — نبتكر، نصمم، نلهم.', url: location.href };
    if (navigator.share) navigator.share(data).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(() => toast('تم نسخ الرابط', 'شاركه مع عملائك')).catch(() => toast('انسخ الرابط من شريط العنوان', '', 'info'));
    else toast('انسخ الرابط من شريط العنوان', '', 'info');
  },
  unfile: (t) => { const arr = state.uploads[t.dataset.up] || []; arr.splice(+t.dataset.i, 1); document.querySelectorAll(`[data-uplist="${CSS.escape(t.dataset.up)}"]`).forEach((ul) => ul.querySelectorAll('li')[+t.dataset.i]?.remove()); },
});
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const fn = ACT[t.dataset.act]; if (fn) fn(t, e);
});
$('#scrim').addEventListener('click', closeSheet);
(() => { let y0 = null; const s = $('#sheet');
  s.addEventListener('touchstart', (e) => { y0 = e.target.closest('.overflow-y-auto')?.scrollTop > 0 ? null : e.touches[0].clientY; }, { passive: true });
  s.addEventListener('touchend', (e) => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 80) closeSheet(); y0 = null; }, { passive: true });
})();
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('input', (e) => { e.target.closest?.('form')?.setAttribute('data-touched', ''); });
const parseHash = () => { const [name, ...rest] = location.hash.slice(1).split('/'); return [name || 'home', rest.length ? decodeURIComponent(rest.join('/')) : undefined]; };
const same = (a, b) => a && b && a[0] === b[0] && String(a[1] ?? '') === String(b[1] ?? '');
window.addEventListener('popstate', () => {
  closeSheet();
  const target = parseHash();
  if (same(state.stack[state.stack.length - 2], target)) { state.stack.pop(); render(target[0], target[1], 'back'); return; }
  if (same(state.stack[state.stack.length - 1], target)) return;
  // رابط مباشر أو تعديل يدوي للعنوان
  state.stack.push(target); render(V[target[0]] ? target[0] : 'notfound', target[1], 'fwd');
});

/* ================================================================ boot */
function route() {
  const [name, ...rest] = location.hash.slice(1).split('/');
  const arg = rest.length ? decodeURIComponent(rest.join('/')) : undefined;
  state.stack = [['home']];
  history.replaceState({ d: 1 }, '', '#home');
  render('home', null, 'none');
  if (name && name !== 'home') go(V[name] ? name : 'notfound', arg);
}
function start() {
  if (S().maintenance) { $('#screen').insertAdjacentHTML('beforeend', maintenanceHtml(S().maintenanceMessage || 'نعمل على تحديث المتجر وسنعود قريبًا.')); return; }
  route();
}
function refreshCurrent() {
  const [name] = state.stack[state.stack.length - 1];
  if (['checkout', 'quote', 'project', 'custom', 'contact', 'report', 'register', 'login', 'product'].includes(name) || $('#sheet').classList.contains('on')) return;
  refresh();
}

(async function boot() {
  initAuth().catch((e) => console.warn('[emdad] auth', e));
  const cached = cachedCatalog();
  if (cached) { state.catalog = cached; start(); }
  try {
    const fresh = await fetchCatalog();
    const changed = JSON.stringify(fresh) !== JSON.stringify(state.catalog && { ...state.catalog, source: fresh.source });
    const wasMaint = !!state.catalog?.settings?.maintenance;
    state.catalog = fresh;
    if (!cached) start();
    else if (!!fresh.settings.maintenance !== wasMaint) location.reload();
    else if (changed) refreshCurrent();
  } catch (err) {
    console.error('[emdad] تعذّر تحميل الكتالوج من Firebase', err);
    if (!cached) {
      state.catalog = seedCatalog();
      if (isConfigured) $('#screen').insertAdjacentHTML('beforeend', maintenanceHtml('تعذّر الاتصال بخادم المتجر حاليًا. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.', true));
      else start();
    } else toast('تعذّر تحديث البيانات', 'تحقق من اتصالك بالإنترنت', 'info');
  }
  document.documentElement.dataset.ready = state.catalog.source;
  renderSideNav();
  $('#splash')?.remove();
})();
