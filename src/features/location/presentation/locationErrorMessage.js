import { LOCATION_ERROR_CODES } from '../domain/locationErrors';

export function getLocationErrorMessage(error, source = 'request') {
  switch (error?.code) {
    case LOCATION_ERROR_CODES.permissionDenied:
      return 'Разрешите доступ к геопозиции в настройках устройства или браузера.';
    case LOCATION_ERROR_CODES.timeout:
      return source === 'watch'
        ? 'Не удалось обновить геопозицию. Попробуйте определить её снова.'
        : 'Не удалось определить геопозицию. Попробуйте ещё раз.';
    case LOCATION_ERROR_CODES.unsupported:
      return 'Это устройство или браузер не поддерживает геолокацию.';
    default:
      return source === 'watch'
        ? 'Не удалось обновить геопозицию. Попробуйте определить её снова.'
        : 'Не удалось определить геопозицию.';
  }
}
