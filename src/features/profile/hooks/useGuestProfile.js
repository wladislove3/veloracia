import { useCallback, useEffect, useState } from 'react';
import { ensureGuestUser } from '../../../shared/infrastructure/firebase/firebaseClient';
import { getSavedProfile, removeSavedProfile, saveProfile as persistProfile } from '../data/profileRepository';

function getSessionErrorMessage(error) {
  switch (error?.code) {
    case 'veloracia/firebase-config-missing':
      return 'Не настроено подключение Firebase. Проверьте параметры проекта и перезапустите приложение.';
    case 'auth/operation-not-allowed':
      return 'В Firebase не включён анонимный вход. Включите Anonymous в Authentication → Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'Добавьте veloracia.vercel.app в Firebase Authentication → Settings → Authorized domains.';
    case 'auth/invalid-api-key':
      return 'Ключ Firebase не подходит к приложению. Проверьте настройки Web App в Firebase.';
    case 'auth/network-request-failed':
      return 'Нет связи с Firebase. Проверьте интернет и попробуйте снова.';
    default:
      return 'Не удалось подключить гостевой профиль. Проверьте Firebase Anonymous sign-in и попробуйте ещё раз.';
  }
}

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
      setError(getSessionErrorMessage(nextError));
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
