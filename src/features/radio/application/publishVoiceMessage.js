export function createPublishVoiceMessage({ createMessageId, getAudioPath, uploadAudio, saveMessage, deleteAudio }) {
  return async function publishVoiceMessage({ userId, profile, location, audioBytes, mimeType }) {
    const messageId = createMessageId();
    const audioPath = getAudioPath(userId, messageId);

    try {
      const audio = await uploadAudio({ userId, messageId, audioBytes, mimeType });
      await saveMessage(messageId, {
        userId,
        nickname: profile?.nickname || '',
        avatar: profile?.avatar || '',
        ...audio,
        mimeType,
        location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      });
    } catch (error) {
      await deleteAudio(audioPath).catch(() => undefined);
      throw error;
    }
  };
}
