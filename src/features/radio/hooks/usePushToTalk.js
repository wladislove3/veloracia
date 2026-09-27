import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRadioMessageId, getRecentMessageTimestamps, saveRadioMessage } from '../data/firestore/radioMessageRepository';
import { deleteRadioAudio, getRadioAudioPath, uploadRadioAudio } from '../data/storage/radioAudioRepository';
import { createPublishVoiceMessage } from '../application/publishVoiceMessage';
import { useAudioCapture } from '../audio/useAudioCapture';
import {
  MAX_MESSAGES_PER_HOUR,
  MAX_RECORDING_AUDIO_BYTES,
  MAX_RECORDING_DURATION_MS,
  MIN_RECORDING_DURATION_MS,
  RADIO_MESSAGE_RATE_WINDOW_MS,
} from '../domain/radioPolicy';

export function usePushToTalk({ userId, profile, location }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const startTimeRef = useRef(0);
  const stopTimerRef = useRef(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const publishVoiceMessage = useMemo(() => createPublishVoiceMessage({
    createMessageId: createRadioMessageId,
    getAudioPath: getRadioAudioPath,
    uploadAudio: uploadRadioAudio,
    saveMessage: saveRadioMessage,
    deleteAudio: deleteRadioAudio,
  }), []);

  const refreshRateLimit = useCallback(async () => {
    if (!userId) return;
    try {
      const now = Date.now();
      const sentTimes = await getRecentMessageTimestamps(userId, now - RADIO_MESSAGE_RATE_WINDOW_MS);
      const oldest = Math.min(...sentTimes);
      const blocked = sentTimes.length >= MAX_MESSAGES_PER_HOUR;
      setIsBlocked(blocked);
      setRemainingTime(blocked ? Math.max(0, oldest + RADIO_MESSAGE_RATE_WINDOW_MS - now) : 0);
      setRateLimitError(null);
    } catch {
      setRateLimitError('Не удалось проверить лимит эфира. Попробуйте ещё раз.');
    }
  }, [userId]);

  const publish = useCallback(async (audioBytes, mimeType) => {
    const sizeInBytes = audioBytes.byteLength ?? audioBytes.size;
    if (!Number.isFinite(sizeInBytes) || sizeInBytes > MAX_RECORDING_AUDIO_BYTES) {
      throw new Error('Сообщение слишком длинное. Запишите голос короче.');
    }
    await publishVoiceMessage({ userId, profile, location, audioBytes, mimeType });
    await refreshRateLimit();
  }, [location, profile, publishVoiceMessage, refreshRateLimit, userId]);
  const { isRecording, startCapture, stopCapture, releaseCapture } = useAudioCapture(publish);

  useEffect(() => {
    if (!isRecording) {
      setRecordingElapsed(0);
      return undefined;
    }
    const updateElapsed = () => {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      setRecordingElapsed(Math.min(MAX_RECORDING_DURATION_MS, elapsed));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1_000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const stopRecording = useCallback(async () => {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    let captureStopped = false;
    try {
      if (startTimeRef.current && elapsed < MIN_RECORDING_DURATION_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORDING_DURATION_MS - elapsed));
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
      }, MAX_RECORDING_DURATION_MS);
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
    recordingElapsed,
    error: error || rateLimitError,
    clearError: () => {
      setError(null);
      setRateLimitError(null);
    },
  };
}
