/*
 * يولّد firebase-config.js من متغيرات البيئة (ملف .env أو متغيرات النظام).
 * الأسماء المدعومة: VITE_FIREBASE_* (كما طُلب) أو FIREBASE_*.
 * إن لم توجد المتغيرات يُترك firebase-config.js كما هو.
 */
import fs from 'node:fs';

const env = { ...process.env };
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/); if (!m || line.trim().startsWith('#')) continue;
    env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
}
const get = (k) => env[`VITE_FIREBASE_${k}`] || env[`FIREBASE_${k}`] || '';
const cfg = {
  apiKey: get('API_KEY'), authDomain: get('AUTH_DOMAIN'), projectId: get('PROJECT_ID'),
  storageBucket: get('STORAGE_BUCKET'), messagingSenderId: get('MESSAGING_SENDER_ID'), appId: get('APP_ID'),
};
if (!cfg.apiKey || !cfg.projectId) { console.log('[config] لا توجد متغيرات VITE_FIREBASE_* — تم الإبقاء على firebase-config.js الحالي'); process.exit(0); }
const out = `/* مولَّد تلقائيًا من .env بواسطة scripts/gen-config.mjs — مشروع Firebase: ${cfg.projectId}
 * هذه القيم ليست سرية؛ الحماية تتم عبر قواعد الأمان. لا تضع هنا أي مفاتيح خدمة (Service Account). */
window.EMDAD_FIREBASE_CONFIG = ${JSON.stringify(cfg, null, 2)};
`;
fs.writeFileSync('firebase-config.js', out);
console.log(`[config] firebase-config.js ← ${cfg.projectId}`);
