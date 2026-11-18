/* تهيئة Firebase للوحة التحكم: Auth + Firestore (لحظي) + Storage */
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { cfg, isConfigured, useEmulators, hasStorage, emulatorHost } from '../lib/config.js';

export { isConfigured, hasStorage, useEmulators };

let inst;
export function fb() {
  if (inst) return inst;
  const app = initializeApp(cfg);
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  const db = getFirestore(app);
  const storage = hasStorage ? getStorage(app) : null;
  if (useEmulators) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    if (storage) connectStorageEmulator(storage, emulatorHost, 9199);
  }
  inst = { app, auth, db, storage };
  return inst;
}
