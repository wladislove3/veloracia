import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioPlayback() {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const activeRef = useRef(true);

  const stop = useCallback(async () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    if (activeRef.current) setPlayingId(null);
  }, []);

  const play = useCallback(async (message) => {
    if (!message.audioUrl && !message.audioData) throw new Error('Эта запись больше недоступна.');
    await stop();
    const source = message.audioUrl || `data:${message.mimeType || 'audio/webm'};base64,${message.audioData}`;
    const audio = new Audio(source);
    audioRef.current = audio;
    setPlayingId(message.id);
    const clearPlaying = () => {
      if (audioRef.current === audio) audioRef.current = null;
      if (activeRef.current) setPlayingId(null);
    };
    audio.addEventListener('ended', clearPlaying, { once: true });
    audio.addEventListener('error', clearPlaying, { once: true });
    try {
      await audio.play();
    } catch (error) {
      clearPlaying();
      audio.pause();
      throw error;
    }
  }, [stop]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { playingId, play, stop };
}
