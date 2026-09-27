import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation, watchLocation } from './platform/location';

const INITIAL_CENTER = { latitude: 55.751244, longitude: 37.618423 };

export function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestingRef = useRef(false);

  const requestLocation = useCallback(async () => {
    if (requestingRef.current) return;
    requestingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      setLocation(await getCurrentLocation());
    } catch (nextError) {
      setError(nextError?.code === 1
        ? 'Разрешите доступ к геопозиции в настройках браузера.'
        : nextError.message || 'Не удалось определить геопозицию.');
    } finally {
      requestingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location) return undefined;
    let active = true;
    let stopWatching = () => {};

    Promise.resolve()
      .then(() => watchLocation((nextLocation) => {
        setLocation(nextLocation);
        setError(null);
      }))
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
