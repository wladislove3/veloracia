# Veloraz - Location-Based Voice Radio App

**Status:** ✅ Ready for Android Build & Submission

A location-based, real-time voice radio application built with React Native and Expo. Users can record voice messages, broadcast them through a shared queue, and see nearby users on an interactive map.

## 🎯 Features

- 🎤 **Voice Recording**: Record and broadcast voice messages with 10/hour rate limiting
- 📍 **Live Map**: Real-time location sharing and user positions (last 3 hours)
- 📻 **Radio Queue**: Shared broadcast queue with speaker management
- 🌍 **Google Maps Integration**: Interactive map with markers for active users
- 🔐 **Privacy-First**: Base64 audio storage (no third-party audio hosting), UUID-based anonymous users
- ⚡ **Optimized Audio**: 32kbps bitrate, <700KB file size limit
- ✅ **Production-Ready**: All critical bugs fixed, security headers configured

## 📋 Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Language**: JavaScript
- **Backend**: Google Firebase (Firestore + Cloud Functions)
- **Maps**: Google Maps API
- **Location**: Expo Location
- **Audio**: expo-audio with base64 encoding
- **State Management**: React Hooks

## 📦 Quick Setup

```bash
# Install dependencies
npm install

# Verify configuration before build
npm run verify-build

# Start development server
npx expo start --clear --tunnel
```

Scan the QR code with Expo Go (Android) or camera app (iOS).

## 🔒 Security & Privacy

- **No Email/Phone Required**: Anonymous users with UUID-based IDs
- **Encrypted Data**: HTTPS for all Firebase communications
- **Privacy Policy**: See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- **Terms of Service**: See [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- **Environment Variables**: Firebase credentials in `.env.local` (not committed to git)

## 🔧 Установка и запуск

### 1. Установка зависимостей

```bash
cd veloraz-demo
npm install
```

### 2. Запуск приложения

```bash
npx expo start --tunnel
```

Приложение откроется с QR-кодом. Отсканируйте его:
- **Android**: Используйте Expo Go приложение
- **iOS**: Используйте встроенную камеру или Expo Go

## ⚙️ Конфигурация

### Firebase

Приложение использует Firebase для хранения данных. Конфигурация находится в `services/firebaseConfig.js`.

**Важно**: Убедитесь, что ваш проект Firebase имеет:

1. **Firestore Database** в режиме Production или Test
2. **Правила безопасности** для Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Только для разработки!
    }
  }
}
```

### Google Maps API

Приложение требует Google Maps API ключа. Ключ уже настроен в `app.json`:

```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

## 📱 Использование приложения

### Первый вход

1. Введите ваш никнейм (до 20 символов)
2. Выберите аватар (или сгенерируйте случайный)
3. Нажмите "Войти"

### Запись сообщения

1. Нажмите кнопку "Нажмите и говорите" и держите её
2. Говорите в микрофон (до 30 секунд)
3. Отпустите кнопку для отправки

### Ограничения

- **Максимум 10 сообщений в час** на одного пользователя
- **Максимум 30 секунд** на одно сообщение
- Если лимит исчерпан, кнопка будет отключена с указанием оставшегося времени

### Карта

- Ваша позиция отмечена синей точкой с аватаром
- Радиус поиска можно изменить ползунком (0.5 - 20 км)
- Нажмите 📍 для центрирования на вашей позиции

## 🏗️ Архитектура проекта

```
veloraz-demo/
├── App.js                 # Главный компонент приложения
├── components/            # React компоненты
│   ├── GuestLogin.js      # Экран входа
│   ├── PushToTalkButton.js # Кнопка записи
│   ├── QueueIndicator.js  # Индикатор очереди
│   ├── UserMarker.js      # Маркер пользователя на карте
│   └── NetworkStatus.js   # Индикатор состояния сети
├── hooks/                 # Custom React хуки
│   ├── usePushToTalk.js   # Логика записи аудио
│   ├── useRadioQueue.js   # Управление очередью
│   └── useNetworkStatus.js # Отслеживание сети
├── services/              # Сервисы и конфигурация
│   └── firebaseConfig.js  # Firebase конфигурация
├── utils/                 # Утилиты
│   └── cleanupAudioCache.js # Очистка кэша
└── app.json              # Конфигурация Expo
```

## 🛠️ Важные зависимости

- **expo-audio**: Запись и воспроизведение аудио
- **react-native-maps**: Отображение карты
- **expo-location**: Доступ к геолокации
- **firebase**: Backend и база данных
- **expo-file-system**: Работа с файлами

## ⚠️ Критичные ошибки и их решение

### Ошибка: "Unable to resolve module"
- Запустите: `npm install`
- Очистите кэш: `npx expo start --clear`

### Ошибка: "Permission denied" для микрофона
- Дайте приложению доступ к микрофону в настройках телефона
- Переустартуйте приложение

### Ошибка: "Firebase Storage: unknown"
- Убедитесь, что Firebase Storage включен в проекте
- Проверьте правила безопасности Storage

### Ошибка: Геолокация не работает
- Убедитесь, что GPS включен на телефоне
- Дайте приложению разрешение на доступ к геолокации
- Убедитесь, что вы находитесь на открытом воздухе (GPS работает лучше снаружи)

## 📊 Оптимизация для App Store / Play Store

### Требования

✅ **Выполнено**:
- Обработка ошибок и исключения
- Очистка памяти и ресурсов
- Индикаторы загрузки
- Понятные сообщения об ошибках
- Ограничение на использование (защита от спама)
- Проверка разрешений

⚠️ **Требуется перед публикацией**:
- [ ] Приватная политика (Privacy Policy)
- [ ] Условия использования (Terms of Service)
- [ ] Скриншоты для App Store / Play Store
- [ ] Иконка приложения (512x512px)
- [ ] Описание приложения

## 📄 Лицензия

Proprietary - Все права защищены

## 📞 Контакты

Для вопросов и предложений свяжитесь с разработчиком.

---

**Версия**: 1.0.0  
**Последнее обновление**: Ноябрь 2025
