export const MIN_MAP_REGION_DELTA = 0.002;
export const MAX_MAP_REGION_DELTA = 90;

export function normalizeMapRegion(region) {
  if (!Number.isFinite(region?.latitude) || region.latitude < -90 || region.latitude > 90
    || !Number.isFinite(region?.longitude) || region.longitude < -180 || region.longitude > 180
    || !Number.isFinite(region?.latitudeDelta) || region.latitudeDelta <= 0
    || !Number.isFinite(region?.longitudeDelta) || region.longitudeDelta <= 0) return null;

  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: Math.max(MIN_MAP_REGION_DELTA, Math.min(MAX_MAP_REGION_DELTA, region.latitudeDelta)),
    longitudeDelta: Math.max(MIN_MAP_REGION_DELTA, Math.min(MAX_MAP_REGION_DELTA, region.longitudeDelta)),
  };
}

export function scaleMapRegion(region, scale) {
  const normalized = normalizeMapRegion(region);
  if (!normalized || !Number.isFinite(scale) || scale <= 0) return normalized;
  return normalizeMapRegion({
    ...normalized,
    latitudeDelta: normalized.latitudeDelta * scale,
    longitudeDelta: normalized.longitudeDelta * scale,
  });
}

export function canZoomMapIn(region) {
  return region?.latitudeDelta > MIN_MAP_REGION_DELTA && region?.longitudeDelta > MIN_MAP_REGION_DELTA;
}

export function canZoomMapOut(region) {
  return region?.latitudeDelta < MAX_MAP_REGION_DELTA && region?.longitudeDelta < MAX_MAP_REGION_DELTA;
}
