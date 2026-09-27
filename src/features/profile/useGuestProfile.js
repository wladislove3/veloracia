import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureGuestUser } from '../../../services/firebaseConfig';

const PROFILE_KEY = 'veloracia.userProfile';

export function useGuestProfile() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextId, savedProfile] = await Promise.all([
        ensureGuestUser(),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);
      let restoredProfile = null;
      if (savedProfile) {
        try {
          restoredProfile = JSON.parse(savedProfile);
        } catch {
          await AsyncStorage.removeItem(PROFILE_KEY);
        }
      }
      setUserId(nextId);
      setProfile(restoredProfile);
    } catch (nextError) {
      setError('Не удалось подключить гостевой профиль. Проверьте настройки Firebase Anonymous sign-in и попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const saveProfile = useCallback(async (nextProfile) => {
    const normalized = {
      nickname: nextProfile.nickname.trim().slice(0, 20),
      avatar: nextProfile.avatar || '🚴',
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
    setProfile(normalized);
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  return { userId, profile, isLoading, error, restoreSession, saveProfile, clearProfile };
}
