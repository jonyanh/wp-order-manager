import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Firebase configuration for project: wp-order-manager
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBL5jeIBABPOgc-ogzUlGfWXiY3w7ElCdc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wp-order-manager.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wp-order-manager",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wp-order-manager.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "43697992310",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:43697992310:web:ead893606dafdba3806557",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1E0YMLMYEK",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.startsWith('AIzaSy')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialize Analytics if supported in the current environment
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
          console.log('[Firebase] Analytics initialized successfully.');
        }
      }).catch(() => {
        // Silently skip if analytics not supported (e.g. cookies disabled)
      });
    }

    console.log(`[Firebase] Connected successfully to project: "${firebaseConfig.projectId}" (Cloud Firestore, Auth & Storage).`);
  } catch (error) {
    console.warn('[Firebase] Initialization error, falling back to local simulated persistence:', error);
  }
} else {
  console.info('[Firebase] Using offline/demo local persistence mode.');
}

export { app, auth, db, storage, analytics };
