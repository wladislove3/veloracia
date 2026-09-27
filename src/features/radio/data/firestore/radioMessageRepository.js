import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../../shared/infrastructure/firebase/firebaseClient';
import { MAX_MESSAGES_PER_HOUR, RADIO_RECENT_MESSAGES_LIMIT } from '../../domain/radioPolicy';

const getMessagesCollection = () => collection(db, 'radioMessages');

export function subscribeToRecentMessages(onMessages, onError) {
  const recentMessagesQuery = query(getMessagesCollection(), orderBy('createdAt', 'desc'), limit(RADIO_RECENT_MESSAGES_LIMIT));

  return onSnapshot(
    recentMessagesQuery,
    (snapshot) => onMessages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    onError
  );
}

export async function getRecentMessageTimestamps(userId, since) {
  const sentSinceQuery = query(
    getMessagesCollection(),
    where('userId', '==', userId),
    where('createdAt', '>', Timestamp.fromMillis(since)),
    orderBy('createdAt', 'asc'),
    limit(MAX_MESSAGES_PER_HOUR),
  );
  const snapshot = await getDocs(sentSinceQuery);
  return snapshot.docs
    .map((entry) => entry.data().createdAt?.toMillis?.())
    .filter(Number.isFinite);
}

export function createRadioMessageId() {
  return doc(getMessagesCollection()).id;
}

export function saveRadioMessage(messageId, message) {
  return setDoc(doc(getMessagesCollection(), messageId), {
    ...message,
    createdAt: serverTimestamp(),
  });
}
