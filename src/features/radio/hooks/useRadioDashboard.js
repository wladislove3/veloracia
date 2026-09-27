import { useCallback, useMemo } from 'react';
import { useLiveLocation } from '../../location/hooks/useLiveLocation';
import { useAudioPlayback } from '../audio/useAudioPlayback';
import { usePushToTalk } from './usePushToTalk';
import { useRadioFeed } from './useRadioFeed';
import { useRadioQueue } from './useRadioQueue';
import { useRadioTalkSession } from './useRadioTalkSession';
import { selectNearbyRadioQueue } from '../domain/radioQueue';

export function useRadioDashboard(profile, radius) {
  const { location, mapCenter, isLoading: isLocationLoading, error: locationError, requestLocation } = useLiveLocation();
  const { visibleMessages, activeUsers, connectionError } = useRadioFeed({ userId: profile.userId, location, radius });
  const { queue, currentSpeaker, isInQueue, queuePosition, join, leave, error: queueError } = useRadioQueue({ userId: profile.userId, profile, location });
  const { isRecording, isBlocked, remainingTime, recordingElapsed, error: recordingError, startRecording, stopRecording } = usePushToTalk({
    userId: profile.userId,
    profile,
    location,
  });
  const { playingId, play, stop } = useAudioPlayback();
  const talkSession = useRadioTalkSession({
    userId: profile.userId,
    queuePosition,
    currentSpeaker,
    isRecording,
    join,
    leave,
    startRecording,
    stopRecording,
  });

  const mapRegion = useMemo(() => ({
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: Math.max(0.035, (radius / 111_000) * 2.4),
    longitudeDelta: Math.max(0.035, (radius / (111_000 * Math.max(Math.cos((mapCenter.latitude * Math.PI) / 180), 0.2))) * 2.4),
  }), [mapCenter.latitude, mapCenter.longitude, radius]);
  const nearbyQueue = useMemo(
    () => selectNearbyRadioQueue(queue, { userId: profile.userId, location, radius }),
    [location, profile.userId, queue, radius],
  );
  const screenError = recordingError || locationError || queueError?.message
    || (connectionError?.message ? 'Не удалось подключиться к радио.' : null) || talkSession.notice;

  const playMessage = useCallback(async (message, isPlaying) => {
    if (isPlaying) {
      await stop();
      return;
    }
    try {
      await play(message);
    } catch (error) {
      talkSession.setNotice(error.message || 'Не удалось воспроизвести запись.');
    }
  }, [play, stop, talkSession.setNotice]);

  return {
    location, locationError, mapCenter, isLocationLoading, requestLocation, mapRegion, nearbyQueue,
    visibleMessages, activeUsers, currentSpeaker, isInQueue, queuePosition, isWaiting: talkSession.isWaiting,
    isRecording, isBlocked, remainingTime, recordingElapsed, playingId, playMessage,
    handlePressIn: talkSession.handlePressIn, handlePressOut: talkSession.handlePressOut,
    screenError, isFeedConnected: !connectionError,
  };
}
