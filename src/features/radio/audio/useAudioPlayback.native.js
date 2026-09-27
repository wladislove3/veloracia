import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioPlayback() {
  const [playingId, setPlayingId] = useState(null);
  const playerRef = useRef(null);
  const statusSubscriptionRef = useRef(null);
  const temporaryFileRef = useRef(null);
  const activeRef = useRef(true);

  const stop = useCallback(async () => {
    statusSubscriptionRef.current?.remove();
    statusSubscriptionRef.current = null;
    const player = playerRef.current;
    playerRef.current = null;
    player?.remove?.();
    const temporaryFile = temporaryFileRef.current;
    temporaryFileRef.current = null;
    if (temporaryFile) await FileSystem.deleteAsync(temporaryFile, { idempotent: true }).catch(() => undefined);
    if (activeRef.current) setPlayingId(null);
  }, []);

  const play = useCallback(async (message) => {
    if (!message.audioUrl && !message.audioData) throw new Error('Эта запись больше недоступна.');
    await stop();
    try {
      let source = message.audioUrl;
      if (!source && message.audioData) {
        const extension = message.mimeType?.includes('webm') ? 'webm' : 'm4a';
        source = `${FileSystem.cacheDirectory}voice-${message.id}.${extension}`;
        temporaryFileRef.current = source;
        await FileSystem.writeAsStringAsync(source, message.audioData, { encoding: FileSystem.EncodingType.Base64 });
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      const player = createAudioPlayer(source);
      playerRef.current = player;
      statusSubscriptionRef.current = player.addListener('playbackStatusUpdate', async (status) => {
        if (status?.didJustFinish) await stop();
      });
      setPlayingId(message.id);
      player.play();
    } catch (error) {
      await stop();
      throw error;
    }
  }, [stop]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      statusSubscriptionRef.current?.remove();
      playerRef.current?.remove?.();
      if (temporaryFileRef.current) {
        FileSystem.deleteAsync(temporaryFileRef.current, { idempotent: true }).catch(() => undefined);
      }
    };
  }, []);

  return { playingId, play, stop };
}
