import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeProfile } from '../domain/profile';

const PROFILE_KEY = 'veloracia.userProfile';

export async function getSavedProfile() {
  const serialized = await AsyncStorage.getItem(PROFILE_KEY);
  if (!serialized) return null;

  try {
    const profile = normalizeProfile(JSON.parse(serialized));
    if (profile) return profile;
  } catch {
    // Invalid local data is discarded below and the user can set up a fresh profile.
  }

  await AsyncStorage.removeItem(PROFILE_KEY);
  return null;
}

export async function saveProfile(profile) {
  const normalized = normalizeProfile(profile);
  if (!normalized) throw new Error('Введите имя для эфира.');
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function removeSavedProfile() {
  return AsyncStorage.removeItem(PROFILE_KEY);
}
