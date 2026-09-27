import { createRadioMessageId, saveRadioMessage } from '../data/firestore/radioMessageRepository';
import { deleteRadioAudio, getRadioAudioPath, uploadRadioAudio } from '../data/storage/radioAudioRepository';

export async function publishVoiceMessage({ userId, profile, location, audioBytes, mimeType }) {
  const messageId = createRadioMessageId();
  const audioPath = getRadioAudioPath(userId, messageId);

  try {
    const audio = await uploadRadioAudio({ userId, messageId, audioBytes, mimeType });
    await saveRadioMessage(messageId, {
      userId,
      nickname: profile?.nickname || '',
      avatar: profile?.avatar || '',
      ...audio,
      mimeType,
      location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    });
  } catch (error) {
    await deleteRadioAudio(audioPath).catch(() => undefined);
    throw error;
  }
}
