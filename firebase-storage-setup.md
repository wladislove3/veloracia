# Настройка Firebase Storage для Veloraz

## Проблема
Ошибка: `Firebase Storage: An unknown error occurred` - проблема с настройками Storage.

## Решение

### 1. Настройте правила безопасности Storage

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `veloracia`
3. Перейдите в **Storage** → вкладка "Rules"
4. Замените правила на следующие (для разработки):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Разрешаем чтение и запись всем пользователям (для разработки)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Создайте папку "audio" в Storage

1. В Firebase Console → Storage
2. Создайте папку `audio` (если не существует)
3. Убедитесь, что настройки хранения позволяют загрузку

### 3. Проверьте настройки Storage

- В Firebase Console → Storage → Settings
- Убедитесь, что Storage включен
- Проверьте лимиты и биллинг

### 4. Перезапустите приложение

```bash
npx expo start --clear
```

## Важные замечания

⚠️ **Безопасность**: Правила `allow read, write: if true;` подходят только для разработки!

Для продакшена используйте:
```javascript
match /audio/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null;
}
```