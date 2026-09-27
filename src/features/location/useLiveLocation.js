import { useCallback, useEffect, useState } from 'react';
import { getCurrentLocation, watchLocation } from './platform/location';

const INITIAL_CENTER = { latitude: 55.751244, longitude: 37.618423 };

export function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLocation(await getCurrentLocation());
    } catch (nextError) {
      setError(nextError?.code === 1
        ? 'Разрешите доступ к геопозиции в настройках браузера.'
        : nextError.message || 'Не удалось определить геопозицию.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location) return undefined;
    let active = true;
    let stopWatching = () => {};

    Promise.resolve()
      .then(() => watchLocation(setLocation))
      .then((unsubscribe) => {
        if (active) stopWatching = unsubscribe;
        else unsubscribe();
      })
      .catch((watchError) => {
        if (active) setError(watchError.message || 'Не удалось обновлять геопозицию.');
      });

    return () => {
      active = false;
      stopWatching();
    };
  }, [location !== null]);

  return { location, mapCenter: location || INITIAL_CENTER, isLoading, error, requestLocation };
}
