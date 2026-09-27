import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { app } from './firebaseApp';

function createPersistentAuth() {
  if (!app) return null;
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}

export const auth = createPersistentAuth();
