import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef } from 'react';

const recorderOptions = {
  ...RecordingPresets.LOW_QUALITY,
  android: { ...RecordingPresets.LOW_QUALITY.android, encodingBitRate: 32_000 },
  ios: { ...RecordingPresets.LOW_QUALITY.ios, bitRate: 32_000 },
};

export function useAudioCapture(onCaptured) {
  const recorder = useAudioRecorder(recorderOptions);
  const onCapturedRef = useRef(onCaptured);
  onCapturedRef.current = onCaptured;

  const startCapture = useCallback(async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Разрешите доступ к микрофону, чтобы выйти в эфир.');
    await AudioModule.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const stopCapture = useCallback(async () => {
    if (!recorder.isRecording) return;
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) throw new Error('Запись не сохранилась. Попробуйте ещё раз.');
    const audioFile = new File(uri);
    try {
      const audioBytes = await audioFile.bytes();
      await onCapturedRef.current(audioBytes, 'audio/m4a');
    } finally {
      try {
        audioFile.delete();
      } catch {
        // Temporary file cleanup is best-effort after publishing completes.
      }
    }
  }, [recorder]);

  const releaseCapture = useCallback(() => {
    if (recorder.isRecording) recorder.stop().catch(() => undefined);
  }, [recorder]);

  useEffect(() => releaseCapture, [releaseCapture]);

  return { isRecording: recorder.isRecording, startCapture, stopCapture, releaseCapture };
}
