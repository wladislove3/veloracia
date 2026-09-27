# Veloracia

**Городское голосовое радио рядом с вами.** Veloracia показывает эфир на карте, помогает слушать короткие голосовые сообщения поблизости и выходить в общую очередь.

Приложение работает в браузере и на iOS/Android на Expo SDK 57. Для локальной разработки требуется Node.js 22.13 или новее. Веб-версия собирается в статические файлы для Vercel.

## Возможности

- Локальная карта и радиус эфира до 20 км.
- Общая очередь с одним текущим говорящим.
- Короткие голосовые записи с лимитом 10 сообщений в час.
- Гостевой профиль без телефона и электронной почты.
- Аудиофайлы в Firebase Storage, метаданные и очередь в Firestore.
- Адаптивный интерфейс для широкого экрана и телефона.

## Запуск

```bash
npm ci
npm run web
```

Для мобильной разработки используйте `npm start`, затем откройте проект через Expo Go или эмулятор.

## Настройка Firebase

Перед запуском создайте файл `.env.local` по образцу `.env.example`, включите **Anonymous** в Firebase Authentication и примените правила базы и хранилища:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Пошаговые инструкции и список переменных окружения находятся в [`docs/firebase-setup.md`](docs/firebase-setup.md). Сначала проверьте проект Firebase: клиентские операции требуют авторизованного гостя.

## Структура

```text
src/
  application/         соединение пользовательских сценариев
  features/
    profile/           гостевой профиль, его правила, хранилище и экраны входа
    location/          разрешение, обновление геопозиции и web/native адаптеры
    radio/             очередь, лента, запись, воспроизведение и экран эфира
      audio/           отдельные адаптеры захвата звука для web и native
      data/            Firestore-репозитории и локальный кэш
      domain/          ограничения эфира и радиус
      presentation/    форматирование расстояний и времени
  shared/
    domain/            независимые правила предметной области
    ui/                дизайн-токены
services/              инициализация Firebase и гостевой вход
components/            платформенные карты для native и web
```

Направление зависимостей: экран → feature hooks/use cases → репозитории → Firebase. Доступ к Firestore и Storage не размещается в компонентах интерфейса.

## Сборка

```bash
npm run web:build
npm run android:bundle
```

`web:build` собирает сайт Vercel в `dist/`. `android:bundle` собирает JavaScript-бандл Android с Hermes в `dist-android/`; APK эта команда не создаёт. Нативная сборка на SDK 57 требует iOS 16.4 или новее.

Vercel использует `vercel.json`: команда `npm run web:build`, каталог результата `dist`. Добавьте Firebase-переменные из `.env.example` в Vercel Project Settings для нужных deployment environments.
