import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../../shared/infrastructure/firebase/firebaseClient';

export function getRadioAudioPath(userId, messageId) {
  return `radioMessages/${userId}/${messageId}`;
}

export async function uploadRadioAudio({ userId, messageId, audioBytes, mimeType }) {
  const audioRef = ref(storage, getRadioAudioPath(userId, messageId));
  await uploadBytes(audioRef, audioBytes, { contentType: mimeType });
  const audioUrl = await getDownloadURL(audioRef);
  return { audioUrl, audioPath: audioRef.fullPath };
}

export function deleteRadioAudio(audioPath) {
  return deleteObject(ref(storage, audioPath));
}
