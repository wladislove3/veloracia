import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { pushToTalkStyles as styles } from './pushToTalkControl.styles';
import { formatRecordingDuration } from '../presentation/formatters';
import { MAX_RECORDING_DURATION_MS } from '../domain/radioPolicy';

export default function PushToTalkControl({
  isRecording,
  isWaiting,
  queuePosition,
  isBlocked,
  isLocationReady,
  remainingTime,
  recordingElapsed,
  onPressIn,
  onPressOut,
  compact,
}) {
  const isDisabled = !isRecording && (isBlocked || !isLocationReady);
  const lockLabel = isBlocked
    ? `Лимит · ${Math.ceil(remainingTime / 60_000)} мин`
    : !isLocationReady ? 'Включите геопозицию для местного эфира'
      : isWaiting ? `В очереди · №${queuePosition}. Удерживайте` : 'Удерживайте, чтобы говорить · до 30 сек';
  const talkTitle = isRecording
    ? `В эфире · ${formatRecordingDuration(recordingElapsed)}`
    : isBlocked ? 'Небольшая пауза'
      : !isLocationReady ? 'Нужна геопозиция'
        : isWaiting ? `Вы в очереди · №${queuePosition}` : 'Сказать рядом';
  const talkHint = isRecording
    ? 'Отпустите, чтобы отправить · до 30 секунд'
    : isWaiting ? 'Запись начнётся, когда эфир освободится' : lockLabel;

  return (
    <View style={[styles.area, compact && styles.areaCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? `Запись ${formatRecordingDuration(recordingElapsed)}. Отпустите, чтобы отправить голосовое сообщение` : lockLabel}
        accessibilityState={{ disabled: isDisabled, busy: isRecording }}
        disabled={isDisabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onContextMenu={Platform.OS === 'web' ? (event) => event.preventDefault() : undefined}
        style={({ pressed }) => [styles.button, compact && styles.buttonCompact, isRecording && styles.recording, pressed && styles.pressed, isDisabled && styles.blocked]}
      >
        <Text style={styles.icon}>{isRecording ? '◉' : '⌁'}</Text>
      </Pressable>
      <Text style={styles.title}>{talkTitle}</Text>
      <Text style={styles.hint}>{talkHint}</Text>
      {isRecording ? (
        <View accessibilityElementsHidden style={styles.recordingProgressTrack}>
          <View style={[styles.recordingProgressFill, { width: `${Math.min(100, (recordingElapsed / MAX_RECORDING_DURATION_MS) * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}
