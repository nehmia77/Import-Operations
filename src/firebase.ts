import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 👇 Paste YOUR Firebase web-app config here (Firebase Console → Project settings → Your apps).
// These values are not secrets — your Firestore security rules are what protect the data.
export const firebaseConfig = {
    apiKey: "AIzaSyAtudaoYYrBic-FVh4u_j7elvf1zvwVS5Q",
    authDomain: "import-operations.firebaseapp.com",
    projectId: "import-operations",
    storageBucket: "import-operations.firebasestorage.app",
    messagingSenderId: "861923565567",
    appId: "1:861923565567:web:4ca57663370a642f6551ca"
  };

// While the placeholders are still there, the app keeps working in "this device only" mode.
export const cloudEnabled = !firebaseConfig.apiKey.startsWith('PASTE');

const app = cloudEnabled ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
