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
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, storage } from '../../../../../services/firebaseConfig';
import { RADIO_RECENT_MESSAGES_LIMIT } from '../../domain/radioPolicy';

const getMessagesCollection = () => collection(db, 'radioMessages');

export function subscribeToRecentMessages(onMessages, onError) {
  const recentMessagesQuery = query(getMessagesCollection(), orderBy('createdAt', 'desc'), limit(RADIO_RECENT_MESSAGES_LIMIT));

  return onSnapshot(
    recentMessagesQuery,
    (snapshot) => onMessages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
    onError
  );
}

export async function countMessagesSince(userId, since) {
  const sentSinceQuery = query(
    getMessagesCollection(),
    where('userId', '==', userId),
    where('createdAt', '>', Timestamp.fromMillis(since))
  );
  try {
    const snapshot = await getDocs(sentSinceQuery);
    return snapshot.docs.map((entry) => entry.data().createdAt?.toMillis?.() ?? since);
  } catch (error) {
    if (error?.code !== 'failed-precondition') throw error;
    const fallback = await getDocs(query(getMessagesCollection(), where('userId', '==', userId)));
    return fallback.docs
      .map((entry) => entry.data().createdAt?.toMillis?.())
      .filter((timestamp) => timestamp && timestamp > since);
  }
}

export async function publishVoiceMessage({ userId, profile, location, audioBase64, mimeType }) {
  const messageRef = doc(getMessagesCollection());
  const audioRef = ref(storage, `radioMessages/${userId}/${messageRef.id}`);

  try {
    await uploadString(audioRef, audioBase64, 'base64', { contentType: mimeType });
    const audioUrl = await getDownloadURL(audioRef);
    await setDoc(messageRef, {
      userId,
      nickname: profile?.nickname || '',
      avatar: profile?.avatar || '',
      audioUrl,
      audioPath: audioRef.fullPath,
      mimeType,
      location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    await deleteObject(audioRef).catch(() => undefined);
    throw error;
  }
}
