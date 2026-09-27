import * as Location from 'expo-location';

function toCoordinates(position) {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Разрешите доступ к геопозиции, чтобы видеть эфир рядом.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return toCoordinates(position);
}

export async function watchLocation(onLocation) {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') return () => {};
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 20 },
    (position) => onLocation(toCoordinates(position))
  );
  return () => subscription.remove();
}
