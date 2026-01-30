# Настройка Firebase для проекта Veloraz

## Проблема
Ошибка: "Missing or insufficient permissions" - отсутствуют права доступа к Firestore.

## Решение

### 1. Настройте правила безопасности Firestore

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `veloracia`
3. Перейдите в Firestore Database → вкладка "Rules"
4. Замените правила на следующие (для разработки):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Разрешаем чтение и запись всем пользователям (для разработки)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Или более строгие правила для радио-очереди:
    match /radioQueue/{userId} {
      allow read, write: if true;
    }
    
    match /radioMessages/{messageId} {
      allow read, write: if true;
    }
  }
}
```

### 2. Для продакшена используйте более безопасные правила:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /radioQueue/{userId} {
      allow read: if true; // Все могут видеть очередь
      allow write: if request.auth != null; // Только авторизованные
    }
    
    match /radioMessages/{messageId} {
      allow read: if true; // Все могут читать сообщения
      allow write: if request.auth != null; // Только авторизованные
    }
  }
}
```

### 3. Проверьте настройки Firestore

- В Firebase Console → Firestore Database
- Убедитесь, что база данных создана и находится в режиме **"Production"** или **"Test"**
- Если в режиме Test - правила по умолчанию разрешают доступ

### 4. Перезапустите приложение

После применения правил перезапустите Expo:
```bash
npx expo start --clear
```

## Важные замечания

⚠️ **Безопасность**: Правила `allow read, write: if true;` подходят только для разработки!

Для продакшена всегда используйте аутентификацию и более строгие правила доступа.