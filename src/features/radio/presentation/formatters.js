import { timestampToMillis } from '../../../shared/domain/geo';

export function formatDistanceInMeters(distance) {
  return distance < 1_000 ? `${distance} м` : `${(distance / 1_000).toLocaleString('ru-RU')} км`;
}

export function formatRelativeMessageAge(timestamp, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - timestampToMillis(timestamp)) / 60_000));
  if (minutes < 1) return 'сейчас';
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч`;
}

export function formatRecordingDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1_000);
  return `00:${String(seconds).padStart(2, '0')}`;
}

export function formatNearbyRiderCount(count) {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun = remainder100 >= 11 && remainder100 <= 14
    ? 'велосипедистов'
    : remainder10 === 1
      ? 'велосипедист'
      : remainder10 >= 2 && remainder10 <= 4
        ? 'велосипедиста'
        : 'велосипедистов';
  return `${count} ${noun}`;
}
