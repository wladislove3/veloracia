import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation, watchLocation } from '../platform/location';
import { normalizeLocationError } from '../domain/locationErrors';
import { getLocationErrorMessage } from '../presentation/locationErrorMessage';

const INITIAL_CENTER = { latitude: 55.751244, longitude: 37.618423 };

export function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const hasLocation = location !== null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const requestLocation = useCallback(async () => {
    if (requestingRef.current) return;
    requestingRef.current = true;
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const nextLocation = await getCurrentLocation();
      if (mountedRef.current) setLocation(nextLocation);
    } catch (nextError) {
      if (mountedRef.current) setError(getLocationErrorMessage(normalizeLocationError(nextError)));
    } finally {
      requestingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLocation) return undefined;
    let active = true;
    let stopWatching = () => {};

    Promise.resolve()
      .then(() => watchLocation((nextLocation) => {
        setLocation(nextLocation);
        setError(null);
      }, (watchError) => {
        if (!active) return;
        setError(getLocationErrorMessage(normalizeLocationError(watchError), 'watch'));
      }))
      .then((unsubscribe) => {
        if (active) stopWatching = unsubscribe;
        else unsubscribe();
      })
      .catch(() => {
        if (active) setError('Не удалось включить обновление геопозиции. Попробуйте определить её снова.');
      });

    return () => {
      active = false;
      stopWatching();
    };
  }, [hasLocation]);

  return { location, mapCenter: location || INITIAL_CENTER, isLoading, error, requestLocation };
}
