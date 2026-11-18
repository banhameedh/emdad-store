/* أدوات مشتركة بين واجهة المتجر ولوحة التحكم */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** يهرّب النص قبل إدراجه في HTML (البيانات قادمة من قاعدة البيانات) */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
/** نص متعدد الأسطر → <br> */
export const lines = (v) => esc(v).replace(/\n/g, '<br>');
export const oneLine = (v) => String(v ?? '').replace(/\s*\n\s*/g, ' ');
/** مسار صورة: رابط كامل (Firebase Storage) أو مسار نسبي داخل الموقع */
export const imgSrc = (p) => esc(p || 'assets/images/facade-emdad-headquarters.jpg');
export const pad2 = (n) => String(n).padStart(2, '0');
export const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');

export const ic = (d, s = 18, c = '#075A9F', w = 1.8, f = 'none') =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${f}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const P = {
  back: '<path d="M9 6l6 6-6 6"/>', chev: '<path d="M15 6l-6 6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  share: '<path d="M12 15V3"/><path d="M7.5 7.5L12 3l4.5 4.5"/><path d="M8 11H6.5A1.5 1.5 0 005 12.5v7A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5v-7a1.5 1.5 0 00-1.5-1.5H16"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', phone: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 005.5 5.5l1.5-2 4 1.5V18a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>',
  nav: '<path d="M3.5 11l17-7.5-7.5 17-2-7.5z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', crown: '<path d="M3.5 8l4.3 3.6L12 5l4.2 6.6L20.5 8l-1.6 9.5H5.1z"/><path d="M5.5 20.5h13"/>',
  gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5S10.5 4 8 4.5 7.5 8.5 12 8.5zM12 8.5S13.5 4 16 4.5s.5 4-4 4z"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>', layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12.5l8.5 4.5 8.5-4.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>', image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4.5 4"/>',
  msg: '<path d="M4 5.5h16v10H9l-5 4z"/>', upload: '<path d="M12 16V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4.5 15v3a2 2 0 002 2h11a2 2 0 002-2v-3"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>'
};
export const WA = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8a9.2 9.2 0 00-7.9 13.9L2.8 21.2l4.6-1.2A9.2 9.2 0 1012 2.8z" fill="#25D366"/><path d="M8.9 7.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2 0 .5-.1.7l-.6.7c.5 1 1.4 1.9 2.4 2.4l.7-.6c.2-.2.5-.2.7-.1l1.8.8c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.7.4-1.6.5-2.5.2-2.2-.8-4-2.6-4.8-4.8-.3-.9-.2-1.8.2-2.5z" fill="#fff"/></svg>`;
export const APPLE_W = `<svg width="24" height="18" viewBox="0 0 26 20" aria-hidden="true"><rect x="1" y="1" width="24" height="18" rx="3.5" fill="#E8E8E8"/><rect x="1" y="1" width="24" height="5" rx="2" fill="#2BA9E0"/><rect x="1" y="4" width="24" height="4" fill="#F5B53F"/><rect x="1" y="7" width="24" height="4" fill="#7ECB4E"/><rect x="1" y="10" width="24" height="4" fill="#F1543F"/><path d="M1 12.5h7.5c1.2 0 1.6 2.6 4.5 2.6s3.3-2.6 4.5-2.6H25V16a3 3 0 01-3 3H4a3 3 0 01-3-3z" fill="#D9D9D9"/></svg>`;
export const GOOGLE_W = `<svg width="22" height="18" viewBox="0 0 24 20" aria-hidden="true"><rect x="2" y="1" width="20" height="8" rx="2.5" fill="#EA4335"/><rect x="2" y="4" width="20" height="8" rx="2.5" fill="#FBBC04"/><rect x="2" y="7" width="20" height="8" rx="2.5" fill="#34A853"/><path d="M2 12.5a2.5 2.5 0 012.5-2.5H8c1 2.8 6.6 2.8 8 0h3.5A2.5 2.5 0 0122 12.5V16.5A2.5 2.5 0 0119.5 19h-15A2.5 2.5 0 012 16.5z" fill="#4285F4"/></svg>`;
