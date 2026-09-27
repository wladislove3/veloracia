import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';

const queueCollection = collection(db, 'radioQueue');

export function subscribeToQueue(onUsers, onError) {
  return onSnapshot(
    query(queueCollection, orderBy('joinedAt', 'asc')),
    (snapshot) => onUsers(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    onError
  );
}

export function joinRadioQueue({ userId, profile, location }) {
  return setDoc(doc(queueCollection, userId), {
    userId,
    nickname: profile?.nickname || '',
    avatar: profile?.avatar || '',
    location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    joinedAt: serverTimestamp(),
  });
}

export function leaveRadioQueue(userId) {
  return deleteDoc(doc(queueCollection, userId));
}
