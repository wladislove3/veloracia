import { useCallback, useEffect, useRef, useState } from 'react';
import { countMessagesSince, publishVoiceMessage } from '../../shared/data/radioMessageRepository';
import { useAudioCapture } from './audio/useAudioCapture';

const MAX_MESSAGES_PER_HOUR = 10;
const MAX_RECORDING_MILLISECONDS = 30_000;
const MAX_AUDIO_BYTES = 700 * 1024;
const MIN_RECORDING_MILLISECONDS = 250;
const HOUR_MILLISECONDS = 60 * 60 * 1000;

export function usePushToTalk({ userId, profile, location }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const startTimeRef = useRef(0);
  const stopTimerRef = useRef(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);

  const refreshRateLimit = useCallback(async () => {
    if (!userId) return;
    try {
      const now = Date.now();
      const sentTimes = await countMessagesSince(userId, now - HOUR_MILLISECONDS);
      const oldest = Math.min(...sentTimes);
      const blocked = sentTimes.length >= MAX_MESSAGES_PER_HOUR;
      setIsBlocked(blocked);
      setRemainingTime(blocked ? Math.max(0, oldest + HOUR_MILLISECONDS - now) : 0);
      setRateLimitError(null);
    } catch {
      setRateLimitError('Не удалось проверить лимит эфира. Попробуйте ещё раз.');
    }
  }, [userId]);

  const publish = useCallback(async (audioBase64, mimeType) => {
    if (audioBase64.length * 0.75 > MAX_AUDIO_BYTES) {
      throw new Error('Сообщение слишком длинное. Запишите голос короче.');
    }
    await publishVoiceMessage({ userId, profile, location, audioBase64, mimeType });
    await refreshRateLimit();
  }, [location, profile, refreshRateLimit, userId]);
  const { isRecording, startCapture, stopCapture, releaseCapture } = useAudioCapture(publish);

  const stopRecording = useCallback(async () => {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    let captureStopped = false;
    try {
      if (startTimeRef.current && elapsed < MIN_RECORDING_MILLISECONDS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORDING_MILLISECONDS - elapsed));
      }
      await stopCapture();
      captureStopped = true;
    } catch (nextError) {
      if (!captureStopped) releaseCapture();
      setError(nextError.message || 'Не удалось отправить запись. Попробуйте ещё раз.');
    } finally {
      startTimeRef.current = 0;
      stoppingRef.current = false;
    }
  }, [releaseCapture, stopCapture]);

  const startRecording = useCallback(async (onAutoStop) => {
    if (startingRef.current || stoppingRef.current || isBlocked || !userId) return false;
    startingRef.current = true;
    setError(null);
    try {
      await startCapture();
      startTimeRef.current = Date.now();
      stopTimerRef.current = setTimeout(async () => {
        await stopRecording();
        await onAutoStop?.();
      }, MAX_RECORDING_MILLISECONDS);
      return true;
    } catch (nextError) {
      releaseCapture();
      setError(nextError.message || 'Не удалось начать запись. Проверьте доступ к микрофону.');
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [isBlocked, releaseCapture, startCapture, stopRecording, userId]);

  useEffect(() => {
    refreshRateLimit();
    const interval = setInterval(refreshRateLimit, 60_000);
    return () => clearInterval(interval);
  }, [refreshRateLimit]);

  useEffect(() => () => {
    clearTimeout(stopTimerRef.current);
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isBlocked,
    remainingTime,
    error: error || rateLimitError,
    clearError: () => {
      setError(null);
      setRateLimitError(null);
    },
  };
}
