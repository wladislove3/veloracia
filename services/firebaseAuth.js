import { getAuth } from 'firebase/auth';
import { app } from './firebaseApp';

export const auth = app ? getAuth(app) : null;
