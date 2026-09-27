function getGeolocation() {
  if (!globalThis.navigator?.geolocation) {
    throw new Error('Браузер не поддерживает геолокацию.');
  }
  return globalThis.navigator.geolocation;
}

export function getCurrentLocation() {
  const geolocation = getGeolocation();
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 }
    );
  });
}

export function watchLocation(onLocation, onError) {
  const geolocation = getGeolocation();
  const watchId = geolocation.watchPosition(
    ({ coords }) => onLocation({ latitude: coords.latitude, longitude: coords.longitude }),
    onError,
    { enableHighAccuracy: true, maximumAge: 15_000 }
  );
  return () => geolocation.clearWatch(watchId);
}
