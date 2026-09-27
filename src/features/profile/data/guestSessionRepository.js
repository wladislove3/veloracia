import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../../../shared/infrastructure/firebase/firebaseAuth';
import { isFirebaseConfigured } from '../../../shared/infrastructure/firebase/firebaseApp';

function getCurrentUser() {
  return new Promise((resolve, reject) => {
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
}

export async function ensureGuestUser() {
  if (!isFirebaseConfigured || !auth) {
    const error = new Error('Не заданы переменные Firebase в окружении приложения.');
    error.code = 'veloracia/firebase-config-missing';
    throw error;
  }

  const currentUser = await getCurrentUser();
  const user = currentUser || (await signInAnonymously(auth)).user;
  return user.uid;
}
