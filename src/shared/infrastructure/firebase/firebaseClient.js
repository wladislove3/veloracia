import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app } from './firebaseApp';

export { app };
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
