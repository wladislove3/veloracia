import { LOCATION_ERROR_CODES, normalizeLocationError } from '../domain/locationErrors';
import * as Location from 'expo-location';

function toCoordinates(position) {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    const error = new Error(LOCATION_ERROR_CODES.permissionDenied);
    error.code = LOCATION_ERROR_CODES.permissionDenied;
    throw error;
  }
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return toCoordinates(position);
  } catch (error) {
    throw normalizeLocationError(error);
  }
}

export async function watchLocation(onLocation, onError) {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    const error = new Error(LOCATION_ERROR_CODES.permissionDenied);
    error.code = LOCATION_ERROR_CODES.permissionDenied;
    onError?.(error);
    return () => {};
  }
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 20 },
    (position) => onLocation(toCoordinates(position)),
    (error) => onError?.(normalizeLocationError(error))
  );
  return () => subscription.remove();
}
