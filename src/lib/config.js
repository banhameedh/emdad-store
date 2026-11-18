/* قراءة إعدادات Firebase من firebase-config.js (ملف عادي في جذر الموقع) */
export const cfg = (typeof window !== 'undefined' && window.EMDAD_FIREBASE_CONFIG) || {};
/** هل أُدخلت إعدادات مشروع Firebase؟ */
export const isConfigured = !!(cfg.apiKey && cfg.projectId);
/** مشاريع demo-* تعمل على محاكيات Firebase المحلية (للتطوير والاختبار) */
export const useEmulators = isConfigured && cfg.projectId.startsWith('demo-');
export const hasStorage = isConfigured && !!cfg.storageBucket;
export const emulatorHost = (typeof location !== 'undefined' && location.hostname) || '127.0.0.1';
