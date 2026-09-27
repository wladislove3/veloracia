import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app } from './firebaseApp';
import { auth } from './firebaseAuth';

export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function ensureGuestUser() {
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
