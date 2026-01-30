import { useState, useRef, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';

export function usePushToTalk(userId, userProfile, location) {
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.LOW_QUALITY,
    android: {
      ...RecordingPresets.LOW_QUALITY.android,
      encodingBitRate: 32000,
    },
    ios: {
      ...RecordingPresets.LOW_QUALITY.ios,
      bitRate: 32000,
    }
  });
  
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const messageCountRef = useRef(0);
  const lastResetTimeRef = useRef(Date.now());
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaChunksRef = useRef([]);

  const minRecordTime = 200;
  const recordStartTime = useRef(0);

  useEffect(() => {
    const checkMessageLimit = async () => {
      if (!userId) return;
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      if (lastResetTimeRef.current < oneHourAgo) {
        messageCountRef.current = 0;
        lastResetTimeRef.current = now;
        setIsBlocked(false);
        setRemainingTime(0);
      }
      
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
    const interval = setInterval(checkMessageLimit, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isRecordingWeb, setIsRecordingWeb] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          setHasMicPermission(!!navigator?.mediaDevices?.getUserMedia);
          return;
        }
        const { status, canAskAgain } = await AudioModule.requestRecordingPermissionsAsync();
        
        if (status !== 'granted') {
          setHasMicPermission(false);
          return;
        }

        setHasMicPermission(true);
        await AudioModule.setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.error('Ошибка инициализации аудио-модуля', e);
        setHasMicPermission(false);
      }
    })();
  }, []);

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
        // start(1000) requests data every second, ensuring we capture audio even if onstop fires early
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        recordStartTime.current = Date.now();
        setIsRecordingWeb(true);
      } catch (error) {
        console.error('Web recording error:', error);
        Alert.alert('Запись недоступна', 'Не удалось получить доступ к микрофону в браузере.');
      }
      return;
    }

    if (!hasMicPermission) {
      Alert.alert('Нет доступа к микрофону', 'Разрешите доступ к микрофону в настройках.');
      return;
    }

    try {
      recordStartTime.current = Date.now();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (e) {
      console.error('Ошибка при старте записи', e);
    }
  };

  const stopRecordingWeb = async () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecordingWeb(false);
        return;
      }
      const elapsed = Date.now() - recordStartTime.current;
      if (elapsed < minRecordTime) {
        await new Promise(res => setTimeout(res, minRecordTime - elapsed));
      }
      
      // Важно: захватываем чанки ДО остановки, если MediaRecorder ведет себя странно
      const stopPromise = new Promise((resolve) => {
        recorder.onstop = () => {
          console.log('MediaRecorder stopped, chunks count:', mediaChunksRef.current.length);
          resolve();
        };
      });
      
      recorder.stop();
      await stopPromise;
      setIsRecordingWeb(false);

      if (mediaChunksRef.current.length === 0) {
        console.error('No audio data captured');
        return;
      }

      const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      console.log('Blob created, size:', blob.size);
      mediaChunksRef.current = [];
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (blob.size > 700 * 1024) {
        Alert.alert('Слишком длинное сообщение', 'Запишите более короткое сообщение.');
        return;
      }

      const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const audioDoc = {
        userId,
        nickname: userProfile?.nickname || '',
        avatar: userProfile?.avatar || '',
        audioData: base64Content,
        mimeType: blob.type || 'audio/webm',
        size: base64Content.length,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude
        } : null,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'radioMessages'), audioDoc);
    } catch (error) {
      console.error('Ошибка при остановке записи (web)', error);
    }
  };

  const stopRecordingNative = async () => {
    try {
      const elapsed = Date.now() - recordStartTime.current;
      if (elapsed < minRecordTime) {
        await new Promise(res => setTimeout(res, minRecordTime - elapsed));
      }
      if (!audioRecorder.isRecording) return;
      
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;

      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      const audioDoc = {
        userId,
        nickname: userProfile?.nickname || '',
        avatar: userProfile?.avatar || '',
        audioData: base64Content,
        mimeType: 'audio/m4a',
        size: base64Content.length,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude
        } : null,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'radioMessages'), audioDoc);
    } catch (e) {
      console.error('Ошибка при остановке записи (native)', e);
    }
  };

  return { 
    startRecording: (!isBlocked && hasMicPermission) ? startRecording : undefined,
    stopRecording: (!isBlocked && hasMicPermission) ? (Platform.OS === 'web' ? stopRecordingWeb : stopRecordingNative) : undefined,
    isRecording: Platform.OS === 'web' ? isRecordingWeb : (audioRecorder?.isRecording || false),
    lastAudioUrl,
    isBlocked: isBlocked || !hasMicPermission,
    remainingTime,
    hasMicPermission
  };
}