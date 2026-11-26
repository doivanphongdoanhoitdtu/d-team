import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const CONFIG_STORAGE_KEY = 'firebase_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB8jLfFekVckhfzP0WtRp3j0lkk9K7-2dU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sctdt-a6bf9.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sctdt-a6bf9',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sctdt-a6bf9.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '714742650479',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:714742650479:web:682395660baa0cf6ebdf9a'
};

let appInstance = null;
let dbInstance = null;
let authInstance = null;
let appCounter = 0;

export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default config
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
}

export function saveCustomFirebaseConfig(cfg) {
  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    throw new Error('Cấu hình Firebase thiếu apiKey hoặc projectId.');
  }
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
}

export function resetSavedFirebaseConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  return { ...DEFAULT_FIREBASE_CONFIG };
}

export async function initFirebase(customConfig = null, forceReinit = false) {
  if (dbInstance && authInstance && !forceReinit) {
    return { app: appInstance, db: dbInstance, auth: authInstance };
  }

  const config = customConfig || getSavedFirebaseConfig();

  if (forceReinit && appInstance) {
    try {
      await deleteApp(appInstance);
    } catch {
      // Ignore cleanup errors
    }
    appInstance = null;
    dbInstance = null;
    authInstance = null;
  }

  const existing = getApps();
  if (!forceReinit && existing.length > 0) {
    appInstance = existing[0];
  } else {
    const appName = appCounter === 0 ? '[DEFAULT]' : `dvp-app-${appCounter}`;
    appCounter += 1;
    appInstance = appName === '[DEFAULT]'
      ? initializeApp(config)
      : initializeApp(config, appName);
  }

  try {
    dbInstance = initializeFirestore(appInstance, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    dbInstance = getFirestore(appInstance);
  }

  authInstance = getAuth(appInstance);
  return { app: appInstance, db: dbInstance, auth: authInstance };
}

export function getDb() {
  return dbInstance;
}

export function getFirebaseAuth() {
  return authInstance;
}

export async function ensureAnonymousAuth() {
  if (!authInstance) {
    await initFirebase();
  }
  if (!authInstance) return null;
  if (authInstance.currentUser) {
    return authInstance.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(authInstance);
    return cred.user?.uid || null;
  } catch (err) {
    console.warn('[Firebase Auth] Anonymous sign-in skipped:', err?.message || err);
    return null;
  }
}
