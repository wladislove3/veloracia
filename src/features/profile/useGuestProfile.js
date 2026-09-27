import { useCallback, useEffect, useState } from 'react';
import { ensureGuestUser } from '../../../services/firebaseConfig';
import { getSavedProfile, removeSavedProfile, saveProfile as persistProfile } from './data/profileRepository';

export function useGuestProfile() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextId, restoredProfile] = await Promise.all([
        ensureGuestUser(),
        getSavedProfile(),
      ]);
      setUserId(nextId);
      setProfile(restoredProfile);
    } catch (nextError) {
      setError(nextError?.code === 'veloracia/firebase-config-missing'
        ? 'Не настроено подключение Firebase. Проверьте параметры проекта и перезапустите приложение.'
        : 'Не удалось подключить гостевой профиль. Проверьте Firebase Anonymous sign-in и попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const saveProfile = useCallback(async (nextProfile) => {
    const normalized = await persistProfile(nextProfile);
    setProfile(normalized);
  }, []);

  const clearProfile = useCallback(async () => {
    await removeSavedProfile();
    setProfile(null);
  }, []);

  return { userId, profile, isLoading, error, restoreSession, saveProfile, clearProfile };
}
