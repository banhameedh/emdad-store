/* تهيئة Firebase لواجهة المتجر (Firestore Lite: قراءة الكتالوج وإنشاء الطلبات بحجم أصغر).
 * Auth وStorage تُحمَّلان عند الحاجة فقط (تسجيل الدخول / رفع الملفات). */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';
import { cfg, isConfigured, useEmulators, hasStorage, emulatorHost } from './config.js';

export { isConfigured, hasStorage, useEmulators, emulatorHost };

let app, db;
export function getFbApp() {
  if (!isConfigured) throw new Error('firebase-not-configured');
  if (!app) app = initializeApp(cfg);
  return app;
}
export function getDb() {
  if (!db) {
    db = getFirestore(getFbApp());
    if (useEmulators) connectFirestoreEmulator(db, emulatorHost, 8080);
  }
  return db;
}

/* ---------------------------------------------------------------- Auth (تحميل مؤجل) */
let authP;
export function loadAuth() {
  if (!authP) {
    authP = import('firebase/auth').then((m) => {
      // initializeAuth دون popupRedirectResolver: لا تحميل لسكربتات Google الخارجية (نستخدم البريد/كلمة المرور فقط)
      const auth = m.initializeAuth(getFbApp(), { persistence: [m.indexedDBLocalPersistence, m.browserLocalPersistence] });
      if (useEmulators) m.connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      return { auth, m };
    });
  }
  return authP;
}

/* ---------------------------------------------------------------- Storage (تحميل مؤجل) */
let storP;
export function loadStorage() {
  if (!hasStorage) return Promise.reject(new Error('storage-not-configured'));
  if (!storP) {
    storP = import('firebase/storage').then((m) => {
      const storage = m.getStorage(getFbApp());
      if (useEmulators) m.connectStorageEmulator(storage, emulatorHost, 9199);
      return { storage, m };
    });
  }
  return storP;
}
