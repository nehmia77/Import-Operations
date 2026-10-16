import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 👇 Paste YOUR Firebase web-app config here (Firebase Console → Project settings → Your apps).
// These values are not secrets — your Firestore security rules are what protect the data.
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
};

// While the placeholders are still there, the app keeps working in "this device only" mode.
export const cloudEnabled = !firebaseConfig.apiKey.startsWith('PASTE');

const app = cloudEnabled ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
