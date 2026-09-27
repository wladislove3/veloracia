import { getApps, initializeApp } from 'firebase/app';

const defaultFirebaseConfig = Object.freeze({
  apiKey: 'AIzaSyD28QyWqKvrnRtfpis1heYR1Lrr8nQf0Hk',
  authDomain: 'veloracia-e93c7.firebaseapp.com',
  projectId: 'veloracia-e93c7',
  storageBucket: 'veloracia-e93c7.firebasestorage.app',
  messagingSenderId: '38012445758',
  appId: '1:38012445758:web:0fdc14ce77c5fb8bb4dd6f',
});

const environmentFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const useEnvironmentConfig = process.env.EXPO_PUBLIC_FIREBASE_USE_ENV_CONFIG === 'true';
const firebaseConfig = useEnvironmentConfig ? environmentFirebaseConfig : defaultFirebaseConfig;

export const requiredFirebaseConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
export const missingFirebaseConfigKeys = useEnvironmentConfig
  ? requiredFirebaseConfigKeys.filter((key) => !firebaseConfig[key])
  : [];
export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

export const app = isFirebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
