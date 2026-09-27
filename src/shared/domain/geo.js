const EARTH_RADIUS_METERS = 6_371_000;

export function distanceInMeters(from, to) {
  if (!from || !to) return Number.POSITIVE_INFINITY;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  const normalizedHaversine = Math.min(1, Math.max(0, haversine));
  return 2 * EARTH_RADIUS_METERS * Math.atan2(
    Math.sqrt(normalizedHaversine),
    Math.sqrt(1 - normalizedHaversine)
  );
}

export function timestampToMillis(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return typeof value === 'number' ? value : 0;
}
