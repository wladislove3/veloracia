import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

const INITIAL_CENTER = { latitude: 55.751244, longitude: 37.618423 };

export function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLocation = Boolean(location);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        if (!globalThis.navigator?.geolocation) throw new Error('Браузер не поддерживает геолокацию.');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 10_000,
          });
        });
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Разрешите доступ к геопозиции, чтобы видеть эфир рядом.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (nextError) {
      setError(nextError?.code === 1 ? 'Разрешите доступ к геопозиции в настройках браузера.' : nextError.message || 'Не удалось определить геопозицию.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !hasLocation || !navigator?.geolocation) return undefined;
    let active = true;
    const watchId = navigator.geolocation.watchPosition(
      (position) => active && setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15_000 }
    );
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [hasLocation]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let active = true;
    let subscription;
    async function watchLocation() {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          subscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 20 },
            (position) => active && setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
          );
        }
      } catch (watchError) {
        if (active) setError(watchError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    watchLocation();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [hasLocation]);

  return { location, mapCenter: location || INITIAL_CENTER, isLoading, error, requestLocation };
}
