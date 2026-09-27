import { AudioModule } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useAudioPlayback() {
  const [playingId, setPlayingId] = useState(null);
  const webAudioRef = useRef(null);
  const nativePlayerRef = useRef(null);
  const temporaryFileRef = useRef(null);
  const active = useRef(true);

  const stop = useCallback(async () => {
    webAudioRef.current?.pause();
    webAudioRef.current = null;
    const player = nativePlayerRef.current;
    nativePlayerRef.current = null;
    if (player?.remove) await player.remove().catch(() => undefined);
    if (temporaryFileRef.current) {
      await FileSystem.deleteAsync(temporaryFileRef.current, { idempotent: true }).catch(() => undefined);
      temporaryFileRef.current = null;
    }
    if (active.current) setPlayingId(null);
  }, []);

  const play = useCallback(async (message) => {
    if (!message.audioUrl && !message.audioData) throw new Error('Эта запись больше недоступна.');
    await stop();
    if (Platform.OS === 'web') {
      const source = message.audioUrl || `data:${message.mimeType || 'audio/webm'};base64,${message.audioData}`;
      const audio = new Audio(source);
      webAudioRef.current = audio;
      setPlayingId(message.id);
      audio.addEventListener('ended', () => active.current && setPlayingId(null), { once: true });
      audio.addEventListener('error', () => active.current && setPlayingId(null), { once: true });
      await audio.play();
      return;
    }

    let source = message.audioUrl;
    if (!source && message.audioData) {
      const extension = message.mimeType?.includes('webm') ? 'webm' : 'm4a';
      source = `${FileSystem.cacheDirectory}voice-${message.id}.${extension}`;
      temporaryFileRef.current = source;
      await FileSystem.writeAsStringAsync(source, message.audioData, { encoding: FileSystem.EncodingType.Base64 });
    }
    const player = await AudioModule.createPlayerAsync({ uri: source });
    nativePlayerRef.current = player;
    player.on?.('playbackStatusUpdate', async (status) => {
      if (status?.didJustFinish) await stop();
    });
    setPlayingId(message.id);
    await player.play();
  }, [stop]);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      webAudioRef.current?.pause();
      nativePlayerRef.current?.remove?.().catch(() => undefined);
      if (temporaryFileRef.current) FileSystem.deleteAsync(temporaryFileRef.current, { idempotent: true }).catch(() => undefined);
    };
  }, []);

  return { playingId, play, stop };
}
