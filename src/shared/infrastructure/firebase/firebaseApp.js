import { getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD28QyWqKvrnRtfpis1heYR1Lrr8nQf0Hk',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'veloracia-e93c7.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'veloracia-e93c7',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'veloracia-e93c7.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '38012445758',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:38012445758:web:0fdc14ce77c5fb8bb4dd6f',
};

export const requiredFirebaseConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
export const missingFirebaseConfigKeys = requiredFirebaseConfigKeys.filter((key) => !firebaseConfig[key]);
export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

export const app = isFirebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
