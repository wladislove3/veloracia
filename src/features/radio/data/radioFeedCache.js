import AsyncStorage from '@react-native-async-storage/async-storage';
import { timestampToMillis } from '../../../shared/domain/geo';

const CACHE_KEY = 'veloracia.messages.v2';

export async function getCachedRadioMessages() {
  const serialized = await AsyncStorage.getItem(CACHE_KEY);
  if (!serialized) return [];

  try {
    const cached = JSON.parse(serialized);
    return Array.isArray(cached) ? cached.filter((message) => (
      message && typeof message.id === 'string'
      && typeof message.userId === 'string'
      && typeof message.audioUrl === 'string'
    )) : [];
  } catch {
    await AsyncStorage.removeItem(CACHE_KEY);
    return [];
  }
}

export function cacheRadioMessages(messages) {
  const compactCache = messages
    .filter((message) => message.audioUrl)
    .map((message) => ({
      id: message.id,
      userId: message.userId,
      nickname: message.nickname,
      avatar: message.avatar,
      audioUrl: message.audioUrl,
      mimeType: message.mimeType,
      location: message.location,
      createdAt: timestampToMillis(message.createdAt),
    }));
  return AsyncStorage.setItem(CACHE_KEY, JSON.stringify(compactCache));
}
