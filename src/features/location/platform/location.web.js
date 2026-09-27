import { LOCATION_ERROR_CODES, normalizeLocationError } from '../domain/locationErrors';

function getGeolocation() {
  if (!globalThis.navigator?.geolocation) {
    const error = new Error(LOCATION_ERROR_CODES.unsupported);
    error.code = LOCATION_ERROR_CODES.unsupported;
    throw error;
  }
  return globalThis.navigator.geolocation;
}

export function getCurrentLocation() {
  const geolocation = getGeolocation();
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(normalizeLocationError(error)),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 }
    );
  });
}

export function watchLocation(onLocation, onError) {
  const geolocation = getGeolocation();
  const watchId = geolocation.watchPosition(
    ({ coords }) => onLocation({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => onError(normalizeLocationError(error)),
    { enableHighAccuracy: true, maximumAge: 15_000 }
  );
  return () => geolocation.clearWatch(watchId);
}
