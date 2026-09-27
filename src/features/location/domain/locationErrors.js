export const LOCATION_ERROR_CODES = Object.freeze({
  permissionDenied: 'location/permission-denied',
  unavailable: 'location/unavailable',
  timeout: 'location/timeout',
  unsupported: 'location/unsupported',
});

export function normalizeLocationError(error) {
  if (Object.values(LOCATION_ERROR_CODES).includes(error?.code)) return error;

  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  let normalizedCode = LOCATION_ERROR_CODES.unavailable;
  if (error?.code === 1 || code.includes('permission') || message.includes('permission')) {
    normalizedCode = LOCATION_ERROR_CODES.permissionDenied;
  } else if (error?.code === 3 || code.includes('timeout') || message.includes('timeout')) {
    normalizedCode = LOCATION_ERROR_CODES.timeout;
  } else if (code.includes('unsupported') || message.includes('not supported')) {
    normalizedCode = LOCATION_ERROR_CODES.unsupported;
  }

  const normalizedError = new Error(normalizedCode);
  normalizedError.code = normalizedCode;
  normalizedError.cause = error;
  return normalizedError;
}
