import { useState, useRef, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';

// userProfile — { nickname, avatar }
export function usePushToTalk(userId, userProfile, location) {
  // Рекордер из expo-audio с пониженным качеством для уменьшения размера
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.LOW_QUALITY,
    android: {
      ...RecordingPresets.LOW_QUALITY.android,
      encodingBitRate: 32000, // Уменьшаем битрейт для Android
    },
    ios: {
      ...RecordingPresets.LOW_QUALITY.ios,
      bitRate: 32000, // Уменьшаем битрейт для iOS
    }
  });
  
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Отслеживание количества сообщений за последний час
  const messageCountRef = useRef(0);
  const lastResetTimeRef = useRef(Date.now());
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaChunksRef = useRef([]);

  // Минимальная задержка между стартом и стопом записи (чтобы избежать ошибок stop)
  const minRecordTime = 200; // мс
  const recordStartTime = useRef(0);

  // Проверка и обновление состояния блокировки
  useEffect(() => {
    const checkMessageLimit = async () => {
      if (!userId) return;
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      // Сброс счетчика если прошел час
      if (lastResetTimeRef.current < oneHourAgo) {
        messageCountRef.current = 0;
        lastResetTimeRef.current = now;
        setIsBlocked(false);
        setRemainingTime(0);
      }
      
      // Запрос последних сообщений пользователя
      const hourAgoTimestamp = Timestamp.fromMillis(oneHourAgo);

      try {
        const messagesSnapshot = await getDocs(
          query(
            collection(db, 'radioMessages'),
            where('userId', '==', userId),
            where('createdAt', '>', hourAgoTimestamp)
          )
        );

        messageCountRef.current = messagesSnapshot.size;
        const timestamps = messagesSnapshot.docs
          .map((doc) => doc.data()?.createdAt)
          .map((ts) => (ts?.seconds ? ts.seconds * 1000 : ts))
          .filter(Boolean)
          .sort((a, b) => a - b);

        if (messageCountRef.current >= 10) {
          setIsBlocked(true);
          const oldestTimestamp = timestamps[0] || lastResetTimeRef.current;
          const timeUntilReset = Math.max(0, oldestTimestamp + 60 * 60 * 1000 - now);
          setRemainingTime(timeUntilReset);
        } else {
          setIsBlocked(false);
          setRemainingTime(0);
        }
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const needsIndex = error?.code === 'failed-precondition' || message.includes('requires an index');
        if (!needsIndex) {
          console.error('Ошибка проверки лимита сообщений:', error);
          return;
        }

        console.warn('Composite index missing, falling back to client-side filter.');
        const fallbackSnapshot = await getDocs(
          query(collection(db, 'radioMessages'), where('userId', '==', userId))
        );

        const recentDocs = fallbackSnapshot.docs
          .map((doc) => doc.data())
          .map((doc) => {
            const createdAt = doc?.createdAt?.seconds ? doc.createdAt.seconds * 1000 : doc?.createdAt;
            return { ...doc, createdAt };
          })
          .filter((doc) => doc?.createdAt && doc.createdAt > oneHourAgo)
          .sort((a, b) => a.createdAt - b.createdAt);

        messageCountRef.current = recentDocs.length;
        if (messageCountRef.current >= 10) {
          setIsBlocked(true);
          const oldestTimestamp = recentDocs[0]?.createdAt || lastResetTimeRef.current;
          const timeUntilReset = Math.max(0, oldestTimestamp + 60 * 60 * 1000 - now);
          setRemainingTime(timeUntilReset);
        } else {
          setIsBlocked(false);
          setRemainingTime(0);
        }
      }
    };

    checkMessageLimit();
    const interval = setInterval(checkMessageLimit, 60000); // Проверяем каждую минуту
    
    return () => clearInterval(interval);
  }, [userId]);

  // Разрешение на микрофон и настройка режима
  const [hasMicPermission, setHasMicPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          setHasMicPermission(!!navigator?.mediaDevices?.getUserMedia);
          return;
        }
        const { status, canAskAgain } = await AudioModule.requestRecordingPermissionsAsync();
        
        if (status !== 'granted') {
          const message = canAskAgain
            ? 'Для записи сообщений необходим доступ к микрофону. Пожалуйста, разрешите доступ.'
            : 'Доступ к микрофону запрещен. Пожалуйста, разрешите доступ в настройках устройства.';

          Alert.alert(
            'Требуется микрофон',
            message,
            canAskAgain
              ? [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Разрешить', onPress: () => AudioModule.requestRecordingPermissionsAsync() }
                ]
              : [
                  { text: 'Открыть настройки', onPress: () => Linking.openSettings() },
                  { text: 'Отмена', style: 'cancel' }
                ]
          );
          setHasMicPermission(false);
          return;
        }

        setHasMicPermission(true);
        await AudioModule.setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          staysActiveInBackground: false, // Не продолжать запись в фоне
        });
      } catch (e) {
        console.error('Ошибка инициализации аудио-модуля', e);
        Alert.alert(
          'Ошибка микрофона',
          'Не удалось получить доступ к микрофону. Проверьте, что приложению разрешен доступ к микрофону в настройках устройства.'
        );
        setHasMicPermission(false);
      }
    })();
  }, []);

  // Начать запись
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          Alert.alert('Запись недоступна', 'Браузер не поддерживает запись аудио.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            mediaChunksRef.current.push(event.data);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        recordStartTime.current = Date.now();
        setHasMicPermission(true);
      } catch (error) {
        console.error('Web recording error:', error);
        Alert.alert('Запись недоступна', 'Не удалось получить доступ к микрофону в браузере.');
      }
      return;
    }

    if (!hasMicPermission) {
      Alert.alert(
        'Нет доступа к микрофону',
        'Для записи сообщений необходим доступ к микрофону. Проверьте настройки приложения.'
      );
      return;
    }

    try {
      recordStartTime.current = Date.now();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (e) {
      console.error('Ошибка при старте записи', e);
      Alert.alert(
        'Ошибка записи',
        'Не удалось начать запись. Проверьте, что микрофон не используется другим приложением.'
      );
    }
  };

  // Остановить запись, загрузить в Storage, опубликовать в Firestore
  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          return;
        }
        const elapsed = Date.now() - recordStartTime.current;
        if (elapsed < minRecordTime) {
          await new Promise(res => setTimeout(res, minRecordTime - elapsed));
        }
        await new Promise((resolve) => {
          recorder.onstop = resolve;
          recorder.stop();
        });
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        mediaChunksRef.current = [];
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (blob.size > 700 * 1024) {
          Alert.alert('Слишком длинное сообщение', 'Пожалуйста, запишите более короткое сообщение (максимум 30 секунд)');
          return;
        }
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const dataUrl = typeof base64 === 'string' ? base64 : '';
        const base64Content = dataUrl.split(',')[1] || '';
        if (base64Content.length > 900 * 1024) {
          Alert.alert('Ошибка загрузки', 'Аудиосообщение слишком большое. Пожалуйста, запишите более короткое сообщение.');
          return;
        }
        setLastAudioUrl(dataUrl);
        const audioDoc = {
          userId,
          nickname: userProfile?.nickname || '',
          avatar: userProfile?.avatar || '',
          audioData: base64Content,
          mimeType: blob.type || 'audio/webm',
          size: base64Content.length,
          location: location || null,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'radioMessages'), audioDoc);
      } catch (error) {
        console.error('Ошибка при остановке записи (web)', error);
      }
      return;
    }

    try {
      // Ждём минимальное время, если запись только началась
      const elapsed = Date.now() - recordStartTime.current;
      if (elapsed < minRecordTime) {
        await new Promise(res => setTimeout(res, minRecordTime - elapsed));
      }
      if (!audioRecorder.isRecording) {
        console.warn('stopRecording: запись не идёт, выход');
        return;
      }
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('AUDIO URI:', uri);
      if (!uri) {
        console.error('Нет файла для загрузки!');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File exists:', fileInfo.exists, 'Size:', fileInfo.size);
      if (!fileInfo.exists) {
        console.error('Файл не найден по uri:', uri);
        return;
      }

      // Проверяем размер файла (максимум 700KB для base64)
      if (fileInfo.size > 700 * 1024) {
        Alert.alert(
          'Слишком длинное сообщение',
          'Пожалуйста, запишите более короткое сообщение (максимум 30 секунд)'
        );
        return;
      }

      // Загружаем в Storage
      try {
        // Читаем файл как base64
        const base64Content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        console.log('Audio converted to base64, size:', base64Content.length);
        
        // Проверяем размер base64 данных (максимум 900KB для Firestore документа)
        if (base64Content.length > 900 * 1024) {
          Alert.alert(
            'Ошибка загрузки',
            'Аудиосообщение слишком большое. Пожалуйста, запишите более короткое сообщение.'
          );
          return;
        }
        
        // Создаем data URL для воспроизведения
        const dataUrl = `data:audio/m4a;base64,${base64Content}`;
        setLastAudioUrl(dataUrl);
        
        // Сохраняем в Firestore
        const audioDoc = {
          userId,
          nickname: userProfile?.nickname || '',
          avatar: userProfile?.avatar || '',
          audioData: base64Content, // base64 строка
          mimeType: 'audio/m4a',
          size: base64Content.length,
          location: location || null,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'radioMessages'), audioDoc);
        console.log('Аудио сохранено в Firestore');
          // сброс состояния не требуется — используем audioRecorder
      } catch (e) {
        console.error('Ошибка загрузки в Storage или Firestore', e?.code, e?.message);
        try {
          console.error('Full error:', JSON.stringify(e));
        } catch (jsonErr) {
          console.error('Could not stringify error', jsonErr);
        }
      }
    } catch (e) {
      console.error('Ошибка при остановке записи', e);
    }
  };

  return { 
    startRecording: (!isBlocked && hasMicPermission) ? startRecording : undefined,
    stopRecording: (!isBlocked && hasMicPermission) ? stopRecording : undefined,
    isRecording: audioRecorder?.isRecording || false,
    lastAudioUrl,
    isBlocked: isBlocked || !hasMicPermission,
    remainingTime,
    hasMicPermission
  };
} 