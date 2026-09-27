const FIREBASE_AUTH_SETTINGS_URL = 'https://console.firebase.google.com/project/veloracia-e93c7/authentication/providers';

const anonymousSignInErrors = new Set([
  'auth/admin-restricted-operation',
  'auth/operation-not-allowed',
  'auth/configuration-not-found',
]);

export function getGuestSessionError(error) {
  if (anonymousSignInErrors.has(error?.code)) {
    return {
      title: 'Гостевой вход выключен',
      message: 'Включите анонимный вход в Firebase, чтобы подключить вас к эфиру без регистрации.',
      instruction: 'Firebase Console → Authentication → Sign-in method → Anonymous → Enable',
      settingsUrl: FIREBASE_AUTH_SETTINGS_URL,
      settingsLabel: 'Открыть настройки Firebase',
    };
  }

  if (error?.code === 'auth/unauthorized-domain') {
    return {
      title: 'Этот адрес не разрешён',
      message: 'Добавьте veloracia.vercel.app в список разрешённых доменов Firebase Authentication.',
      instruction: 'Authentication → Settings → Authorized domains',
      settingsUrl: 'https://console.firebase.google.com/project/veloracia-e93c7/authentication/settings',
      settingsLabel: 'Открыть настройки доменов',
    };
  }

  if (error?.code === 'auth/invalid-api-key' || error?.code === 'veloracia/firebase-config-missing') {
    return {
      title: 'Настройки Firebase не совпали',
      message: 'Проверьте конфигурацию Web App и переменные Firebase для этого проекта.',
      instruction: 'Выберите проект veloracia-e93c7 в Firebase Console.',
      settingsUrl: FIREBASE_AUTH_SETTINGS_URL,
      settingsLabel: 'Открыть Firebase Console',
    };
  }

  if (error?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
    return {
      title: 'Firebase отклонил API-ключ',
      message: 'Сайт получил неверную конфигурацию Firebase из переменных окружения Vercel.',
      instruction: 'Для проекта veloracia-e93c7 удалите старые EXPO_PUBLIC_FIREBASE_* overrides либо задайте полный актуальный набор и включите EXPO_PUBLIC_FIREBASE_USE_ENV_CONFIG=true.',
      settingsUrl: 'https://vercel.com/wladislove3s-projects/veloracia/settings/environment-variables',
      settingsLabel: 'Открыть переменные Vercel',
      code: error.code,
    };
  }

  if (error?.code === 'auth/network-request-failed') {
    return {
      title: 'Нет связи с Firebase',
      message: 'Проверьте подключение к интернету и повторите попытку.',
      instruction: 'Если сеть работает, проверьте статус Firebase Authentication.',
      settingsUrl: FIREBASE_AUTH_SETTINGS_URL,
      settingsLabel: 'Проверить Firebase',
    };
  }

  return {
    title: 'Не удалось подключиться к эфиру',
    message: 'Гостевой профиль не создался. Проверьте подключение и настройки Firebase Anonymous sign-in.',
    instruction: 'Если проблема повторится, передайте код ошибки в поддержку.',
    settingsUrl: FIREBASE_AUTH_SETTINGS_URL,
    settingsLabel: 'Открыть Firebase Console',
    code: error?.code || 'unknown',
  };
}
