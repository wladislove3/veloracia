import { useCallback, useEffect, useRef, useState } from 'react';

export function useRadioTalkSession({ userId, queuePosition, currentSpeaker, isRecording, join, leave, startRecording, stopRecording }) {
  const [isHoldingTalk, setIsHoldingTalk] = useState(false);
  const [notice, setNotice] = useState(null);
  const isHoldingTalkRef = useRef(false);
  const queueJoinPromiseRef = useRef(null);
  const isStartingRecordingRef = useRef(false);
  const hasStartedRecordingRef = useRef(false);

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
    if (currentSpeaker?.userId !== userId || isRecording || isStartingRecordingRef.current || hasStartedRecordingRef.current) return;

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
  }, [currentSpeaker?.userId, finishTalkSession, isHoldingTalk, isRecording, leave, startRecording, stopRecording, userId]);

  const handlePressIn = useCallback(async () => {
    if (isHoldingTalkRef.current) return;

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

  return {
    isHoldingTalk,
    isWaiting: isHoldingTalk && queuePosition > 1,
    notice,
    setNotice,
    handlePressIn,
    handlePressOut,
  };
}
