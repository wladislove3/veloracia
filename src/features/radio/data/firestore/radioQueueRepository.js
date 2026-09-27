import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '../../../../shared/infrastructure/firebase/firebaseClient';

const getQueueCollection = () => collection(db, 'radioQueue');

export function subscribeToQueue(joinedAfter, onUsers, onError) {
  return onSnapshot(
    query(
      getQueueCollection(),
      where('joinedAt', '>=', Timestamp.fromMillis(joinedAfter)),
      orderBy('joinedAt', 'asc')
    ),
    (snapshot) => onUsers(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    onError
  );
}

export function joinRadioQueue({ userId, profile, location }) {
  return setDoc(doc(getQueueCollection(), userId), {
    userId,
    nickname: profile?.nickname || '',
    avatar: profile?.avatar || '',
    location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    joinedAt: serverTimestamp(),
  });
}

export function leaveRadioQueue(userId) {
  return deleteDoc(doc(getQueueCollection(), userId));
}
