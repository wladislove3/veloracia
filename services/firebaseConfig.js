import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app, isFirebaseConfigured } from './firebaseApp';
import { auth } from './firebaseAuth';

export { app, auth };
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export async function ensureGuestUser() {
  if (!isFirebaseConfigured) {
    const error = new Error('Не заданы переменные Firebase в окружении приложения.');
    error.code = 'veloracia/firebase-config-missing';
    throw error;
  }

  const currentUser = await new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });

  const user = currentUser || (await signInAnonymously(auth)).user;
  return user.uid;
}
