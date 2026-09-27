import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveLocation } from '../../location/useLiveLocation';
import { distanceInMeters } from '../../../shared/domain/geo';
import { useAudioPlayback } from '../audio/useAudioPlayback';
import { usePushToTalk } from '../usePushToTalk';
import { useRadioFeed } from '../useRadioFeed';
import { useRadioQueue } from '../useRadioQueue';

export function useRadioDashboard(profile, radius) {
  const { location, mapCenter, isLoading: isLocationLoading, error: locationError, requestLocation } = useLiveLocation();
  const { visibleMessages, activeUsers, connectionError } = useRadioFeed({ userId: profile.userId, location, radius });
  const { queue, currentSpeaker, isInQueue, join, leave, error: queueError } = useRadioQueue({ userId: profile.userId, profile, location });
  const { isRecording, isBlocked, remainingTime, error: recordingError, startRecording, stopRecording } = usePushToTalk({
    userId: profile.userId,
    profile,
    location,
  });
  const [isHoldingTalk, setIsHoldingTalk] = useState(false);
  const [notice, setNotice] = useState(null);
  const isHoldingTalkRef = useRef(false);
  const queueJoinPromiseRef = useRef(null);
  const isStartingRecordingRef = useRef(false);
  const hasStartedRecordingRef = useRef(false);
  const { playingId, play, stop } = useAudioPlayback();
  const isWaiting = isHoldingTalk && isInQueue && currentSpeaker?.userId !== profile.userId;

  const finishTalkSession = useCallback(async () => {
    isHoldingTalkRef.current = false;
    hasStartedRecordingRef.current = false;
    setIsHoldingTalk(false);
    await leave().catch(() => setNotice('Не удалось освободить эфир.'));
  }, [leave]);

  useEffect(() => {
    if (!isHoldingTalk) {
      hasStartedRecordingRef.current = false;
      return;
    }
    if (currentSpeaker?.userId !== profile.userId || isRecording || isStartingRecordingRef.current || hasStartedRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    hasStartedRecordingRef.current = true;
    startRecording(finishTalkSession).then(async (started) => {
      if (!started) {
        isHoldingTalkRef.current = false;
        hasStartedRecordingRef.current = false;
        setIsHoldingTalk(false);
        await leave().catch(() => undefined);
      } else if (!isHoldingTalkRef.current) {
        await stopRecording();
        await leave().catch(() => undefined);
      }
    }).finally(() => {
      isStartingRecordingRef.current = false;
    });
  }, [currentSpeaker?.userId, finishTalkSession, isHoldingTalk, isRecording, leave, profile.userId, startRecording, stopRecording]);

  const mapRegion = useMemo(() => ({
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: Math.max(0.035, (radius / 111_000) * 2.4),
    longitudeDelta: Math.max(0.035, (radius / (111_000 * Math.max(Math.cos((mapCenter.latitude * Math.PI) / 180), 0.2))) * 2.4),
  }), [mapCenter.latitude, mapCenter.longitude, radius]);
  const nearbyQueue = useMemo(() => queue.filter((user) => (
    user.userId !== profile.userId && user.location && location && distanceInMeters(location, user.location) <= radius
  )), [location, profile.userId, queue, radius]);
  const screenError = recordingError || locationError || queueError?.message
    || (connectionError?.message ? 'Не удалось подключиться к радио.' : null) || notice;

  const handlePressIn = useCallback(async () => {
    isHoldingTalkRef.current = true;
    setIsHoldingTalk(true);
    setNotice(null);
    const joining = join();
    queueJoinPromiseRef.current = joining;
    await joining.catch(() => {
      isHoldingTalkRef.current = false;
      setIsHoldingTalk(false);
      setNotice('Не удалось встать в очередь. Проверьте подключение.');
    }).finally(() => {
      if (queueJoinPromiseRef.current === joining) queueJoinPromiseRef.current = null;
    });
  }, [join]);

  const handlePressOut = useCallback(async () => {
    isHoldingTalkRef.current = false;
    hasStartedRecordingRef.current = false;
    setIsHoldingTalk(false);
    if (isRecording) await stopRecording();
    await queueJoinPromiseRef.current?.catch(() => undefined);
    queueJoinPromiseRef.current = null;
    await leave().catch(() => setNotice('Не удалось освободить эфир.'));
  }, [isRecording, leave, stopRecording]);

  const playMessage = useCallback(async (message, isPlaying) => {
    if (isPlaying) {
      await stop();
      return;
    }
    try {
      await play(message);
    } catch (error) {
      setNotice(error.message || 'Не удалось воспроизвести запись.');
    }
  }, [play, stop]);

  return {
    location, mapCenter, isLocationLoading, requestLocation, mapRegion, nearbyQueue,
    visibleMessages, activeUsers, currentSpeaker, isInQueue, isWaiting,
    isRecording, isBlocked, remainingTime, playingId, playMessage,
    handlePressIn, handlePressOut, screenError, isConnected: !connectionError,
  };
}
