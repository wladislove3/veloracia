# 📁 Структура проекта Veloraz Demo

```
veloraz-demo/
│
├── 📄 App.js                          # Главный компонент приложения
├── 📄 index.js                        # Entry point приложения
├── 📄 app.json                        # Конфигурация Expo
├── 📄 package.json                    # Зависимости проекта
│
├── 📚 components/                     # React компоненты UI
│   ├── 🎤 PushToTalkButton.js        # Кнопка записи с анимацией
│   ├── 🗺️ UserMarker.js              # Маркер пользователя на карте
│   ├── 📊 QueueIndicator.js          # Индикатор текущего говорящего
│   ├── 🌐 NetworkStatus.js           # Индикатор состояния сети
│   └── 🔐 GuestLogin.js              # Экран входа
│
├── 🎯 hooks/                          # Custom React хуки
│   ├── 🔊 usePushToTalk.js           # Логика записи и отправки аудио
│   │   ├── Запись аудиосообщений
│   │   ├── Ограничение на 10 в час
│   │   ├── Проверка прав микрофона
│   │   └── Валидация размера файла
│   │
│   ├── 📋 useRadioQueue.js           # Управление очередью выступлений
│   │   ├── Подписка на очередь
│   │   ├── Добавление в очередь
│   │   ├── Удаление из очереди
│   │   └── Обновление локации
│   │
│   └── 🌐 useNetworkStatus.js        # Отслеживание состояния сети
│       ├── Проверка подключения
│       ├── Отслеживание типа сети
│       └── Event listeners
│
├── 🔧 services/                       # Сервисы и конфигурация
│   └── 🔥 firebaseConfig.js          # Firebase инициализация
│       ├── Authentication
│       ├── Firestore Database
│       └── Storage
│
├── 🛠️ utils/                          # Утилиты и хелперы
│   └── 🧹 cleanupAudioCache.js       # Очистка временных файлов
│       ├── Удаление старых файлов
│       └── Защита от переполнения памяти
│
├── 📱 assets/                         # Статические ресурсы
│   ├── icon.png                       # Иконка приложения
│   ├── splash-icon.png                # Splash экран
│   └── adaptive-icon.png              # Адаптивная иконка (Android)
│
├── 📖 Документация
│   ├── README.md                      # Основная документация
│   ├── OPTIMIZATION_REPORT.md         # Отчет об оптимизации
│   ├── PRE_RELEASE_CHECKLIST.md      # Чеклист перед публикацией
│   ├── RELEASE_NOTES.md              # Заметки о релизе
│   └── PROJECT_STRUCTURE.md          # Этот файл
│
└── 📋 Конфигурационные файлы
    ├── eas.json                       # EAS Build конфигурация
    ├── .gitignore                     # Git игнор
    └── package-lock.json              # Lock файл зависимостей
```

## 🔑 Ключевые компоненты и их функции

### App.js
**Описание**: Главный компонент приложения
- Управление состоянием приложения
- Отображение карты с пользователями
- Управление радиоочередью
- Отслеживание геолокации
- Воспроизведение аудиосообщений

### Components

#### PushToTalkButton.js
- Кнопка для записи аудио
- Анимация при активном состоянии
- Отображение статуса (говорим, в очереди, ожидание)
- Блокировка при достижении лимита

#### UserMarker.js
- Отображение маркера пользователя на карте
- Popup с информацией о пользователе
- Кнопка для "приватного вызова"

#### QueueIndicator.js
- Отображение текущего говорящего
- Аватар и имя пользователя
- Статус радиоэфира

#### NetworkStatus.js
- Индикатор состояния интернета
- Плавная анимация появления/исчезновения
- Цветовая схема для статусов

#### GuestLogin.js
- Форма входа для гостей
- Ввод никнейма
- Выбор аватара
- Сохранение в AsyncStorage

### Hooks

#### usePushToTalk.js
```javascript
Возвращает:
{
  startRecording,    // Функция для начала записи
  stopRecording,     // Функция для остановки записи
  isRecording,       // Флаг активной записи
  lastAudioUrl,      // URL последнего записанного аудио
  isBlocked,         // Флаг блокировки по лимиту
  remainingTime,     // Оставшееся время до сброса лимита
  hasMicPermission   // Флаг наличия доступа к микрофону
}
```

#### useRadioQueue.js
```javascript
Возвращает:
{
  queue,           // Массив пользователей в очереди
  currentSpeaker,  // Текущий говорящий
  joinQueue,       // Функция для присоединения к очереди
  leaveQueue,      // Функция для выхода из очереди
  resetQueue,      // Функция для сброса всей очереди
  error            // Ошибка при работе с Firestore
}
```

#### useNetworkStatus.js
```javascript
Возвращает:
{
  isConnected,    // Флаг подключения к сети
  lastStatus,     // Последний статус сети
  connectionType, // Тип подключения
  isWifi,         // Wi-Fi подключение
  isCellular      // Мобильная сеть
}
```

## 🗄️ Структура данных в Firestore

### Коллекция: `radioMessages`
```javascript
{
  id: string,              // Document ID
  userId: string,          // ID пользователя
  nickname: string,        // Никнейм пользователя
  avatar: string,          // Аватар (эмодзи)
  audioData: string,       // Audio в формате base64
  mimeType: string,        // "audio/m4a"
  size: number,            // Размер файла в байтах
  location: {
    latitude: number,      // Широта
    longitude: number,     // Долгота
    altitude: number       // Высота (опционально)
  },
  createdAt: timestamp     // Время создания (серверное время)
}
```

### Коллекция: `radioQueue`
```javascript
{
  id: string,              // Document ID (= userId)
  userId: string,          // ID пользователя
  nickname: string,        // Никнейм
  avatar: string,          // Аватар
  location: {
    latitude: number,      // Текущая широта
    longitude: number,     // Текущая долгота
    altitude: number       // Высота (опционально)
  },
  joinedAt: timestamp      // Время присоединения к очереди
}
```

## 🎵 Формат аудиофайлов

- **Кодек**: AAC (m4a)
- **Битрейт**: 32 kbps (оптимизировано для размера)
- **Частота дискретизации**: 16 kHz
- **Канальность**: Mono
- **Максимальный размер**: 700 KB (до конвертации в base64)
- **Максимальное время**: ~30 секунд

## 🔐 Безопасность и разрешения

### Требуемые разрешения Android
- `android.permission.RECORD_AUDIO` - Запись аудио
- `android.permission.ACCESS_FINE_LOCATION` - Высокая точность геолокации
- `android.permission.ACCESS_COARSE_LOCATION` - Грубая геолокация

### Требуемые разрешения iOS
- `NSMicrophoneUsageDescription` - Доступ к микрофону
- `NSLocationWhenInUseUsageDescription` - Доступ к геолокации

## 📊 Лимиты и ограничения

| Лимит | Значение | Описание |
|-------|----------|---------|
| Сообщений в час | 10 | На одного пользователя |
| Размер аудио | 700 KB | Перед конвертацией |
| Размер base64 | 900 KB | Для Firestore документа |
| Длительность | ~30 сек | Максимальное время записи |
| Загруженных сообщений | 100 | В памяти приложения |
| Радиус поиска | 0.5 - 20 км | Пользовательский выбор |

## 🚀 Тех. стек

- **Frontend**: React Native с Expo
- **Backend**: Firebase (Firestore + Storage)
- **Maps**: react-native-maps с Google Maps API
- **Audio**: expo-audio
- **Location**: expo-location
- **State Management**: React Hooks + Zustand (опционально)
- **Storage**: AsyncStorage для локальных данных

## 📱 Совместимость

- **Android**: 9.0 (API 28) и выше
- **iOS**: 13.0 и выше
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Node**: 16.0 и выше
- **Expo SDK**: 54.0

---

**Последнее обновление**: 10 ноября 2025  
**Версия**: 1.0.0  
**Статус**: Production Ready ✅
