import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioCapture(onCaptured) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const onCapturedRef = useRef(onCaptured);
  onCapturedRef.current = onCaptured;

  const startCapture = useCallback(async () => {
    if (recorderRef.current?.state === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Браузер не поддерживает запись голоса.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    try {
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      chunksRef.current = [];
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      });
      recorder.start(500);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      throw error;
    }
  }, []);

  const stopCapture = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    try {
      const blob = await new Promise((resolve, reject) => {
        recorder.addEventListener('error', reject, { once: true });
        recorder.addEventListener('stop', () => resolve(new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })), { once: true });
        recorder.stop();
      });
      if (blob.size) await onCapturedRef.current(blob, blob.type || 'audio/webm');
    } finally {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
    }
  }, []);

  const releaseCapture = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => releaseCapture, [releaseCapture]);

  return { isRecording, startCapture, stopCapture, releaseCapture };
}
