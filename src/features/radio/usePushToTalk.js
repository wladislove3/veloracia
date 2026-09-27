import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { countMessagesSince, publishVoiceMessage } from '../../shared/data/radioMessageRepository';

const MAX_MESSAGES_PER_HOUR = 10;
const MAX_RECORDING_MILLISECONDS = 30_000;
const MAX_AUDIO_BYTES = 700 * 1024;
const MIN_RECORDING_MILLISECONDS = 250;

const recorderOptions = {
  ...RecordingPresets.LOW_QUALITY,
  android: { ...RecordingPresets.LOW_QUALITY.android, encodingBitRate: 32_000 },
  ios: { ...RecordingPresets.LOW_QUALITY.ios, bitRate: 32_000 },
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать запись.'));
    reader.readAsDataURL(blob);
  });
}

export function usePushToTalk({ userId, profile, location }) {
  const recorder = useAudioRecorder(recorderOptions);
  const [isRecordingWeb, setIsRecordingWeb] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState(null);
  const webRecorderRef = useRef(null);
  const webStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const stopTimerRef = useRef(null);
  const startingRef = useRef(false);

  const refreshRateLimit = useCallback(async () => {
    if (!userId) return;
    try {
      const now = Date.now();
      const sentTimes = await countMessagesSince(userId, now - 60 * 60 * 1000);
      const oldest = Math.min(...sentTimes);
      const blocked = sentTimes.length >= MAX_MESSAGES_PER_HOUR;
      setIsBlocked(blocked);
      setRemainingTime(blocked ? Math.max(0, oldest + 60 * 60 * 1000 - now) : 0);
    } catch (nextError) {
      setError('Не удалось проверить лимит эфира. Попробуйте ещё раз.');
    }
  }, [userId]);

  useEffect(() => {
    refreshRateLimit();
    const interval = setInterval(refreshRateLimit, 60_000);
    return () => clearInterval(interval);
  }, [refreshRateLimit]);

  const publish = useCallback(async (audioBase64, mimeType) => {
    if (audioBase64.length * 0.75 > MAX_AUDIO_BYTES) {
      throw new Error('Сообщение слишком длинное. Запишите голос короче.');
    }
    await publishVoiceMessage({ userId, profile, location, audioBase64, mimeType });
    await refreshRateLimit();
  }, [location, profile, refreshRateLimit, userId]);

  const stopRecording = useCallback(async () => {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < MIN_RECORDING_MILLISECONDS && startTimeRef.current) {
      await new Promise((resolve) => setTimeout(resolve, MIN_RECORDING_MILLISECONDS - elapsed));
    }

    try {
      if (Platform.OS === 'web') {
        const mediaRecorder = webRecorderRef.current;
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
        const blob = await new Promise((resolve, reject) => {
          mediaRecorder.addEventListener('error', reject, { once: true });
          mediaRecorder.addEventListener('stop', () => {
            resolve(new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' }));
          }, { once: true });
          mediaRecorder.stop();
        });
        const base64 = await blobToBase64(blob);
        if (base64) await publish(base64, blob.type || 'audio/webm');
      } else if (recorder.isRecording) {
        await recorder.stop();
        if (!recorder.uri) throw new Error('Запись не сохранилась. Попробуйте ещё раз.');
        const base64 = await FileSystem.readAsStringAsync(recorder.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await publish(base64, 'audio/m4a');
      }
    } catch (nextError) {
      setError(nextError.message || 'Не удалось отправить запись. Попробуйте ещё раз.');
    } finally {
      webStreamRef.current?.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
      webRecorderRef.current = null;
      chunksRef.current = [];
      setIsRecordingWeb(false);
      startTimeRef.current = 0;
    }
  }, [publish, recorder]);

  const startRecording = useCallback(async () => {
    if (startingRef.current || isBlocked || !userId) return false;
    startingRef.current = true;
    setError(null);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          throw new Error('Браузер не поддерживает запись голоса.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        webStreamRef.current = stream;
        chunksRef.current = [];
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size) chunksRef.current.push(event.data);
        });
        mediaRecorder.start(500);
        webRecorderRef.current = mediaRecorder;
        setIsRecordingWeb(true);
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (permission.status !== 'granted') throw new Error('Разрешите доступ к микрофону, чтобы выйти в эфир.');
        await AudioModule.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
      startTimeRef.current = Date.now();
      stopTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_MILLISECONDS);
      return true;
    } catch (nextError) {
      webStreamRef.current?.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
      setError(nextError.message || 'Не удалось начать запись. Проверьте доступ к микрофону.');
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [isBlocked, recorder, stopRecording, userId]);

  useEffect(() => () => {
    clearTimeout(stopTimerRef.current);
    webStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording: Platform.OS === 'web' ? isRecordingWeb : recorder.isRecording,
    isBlocked,
    remainingTime,
    error,
    clearError: () => setError(null),
  };
}
