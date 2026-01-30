import * as FileSystem from 'expo-file-system/legacy';

// Очищает все временные аудиофайлы старше определенного времени
export async function cleanupAudioCache(maxAge = 24 * 60 * 60 * 1000) { // По умолчанию 24 часа
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const now = Date.now();
    
    const audioFiles = files.filter(file => 
      file.endsWith('.m4a') || 
      file.startsWith('recording-') || 
      file.startsWith('audio-')
    );

    for (const file of audioFiles) {
      const filePath = cacheDir + file;
      try {
        const info = await FileSystem.getInfoAsync(filePath);
        
        if (info.exists) {
          // Если файл старше maxAge - удаляем
          if (now - info.modificationTime * 1000 > maxAge) {
            await FileSystem.deleteAsync(filePath);
            console.log('Удален старый кэш:', file);
          }
        }
      } catch (e) {
        console.warn('Ошибка при очистке файла:', file, e);
      }
    }
  } catch (e) {
    console.error('Ошибка при очистке кэша:', e);
  }
}