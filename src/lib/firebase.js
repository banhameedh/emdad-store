/* تهيئة Firebase لواجهة المتجر (Firestore Lite: قراءة الكتالوج وإنشاء الطلبات بحجم أصغر) */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';
import { cfg, isConfigured, useEmulators, emulatorHost } from './config.js';

export { isConfigured };

let app, db;
export function getDb() {
  if (!isConfigured) throw new Error('firebase-not-configured');
  if (!db) {
    app = initializeApp(cfg);
    db = getFirestore(app);
    if (useEmulators) connectFirestoreEmulator(db, emulatorHost, 8080);
  }
  return db;
}
