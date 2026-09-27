import { distanceInMeters, timestampToMillis } from '../../../shared/domain/geo';
import { RADIO_QUEUE_LIFETIME_MS } from './radioPolicy';

export function selectCurrentRadioQueue(users, now) {
  const cutoff = now - RADIO_QUEUE_LIFETIME_MS;
  return users.filter((user) => timestampToMillis(user.joinedAt) >= cutoff);
}

export function selectNearbyRadioQueue(users, { userId, location, radius }) {
  if (!location) return [];

  return users.filter((user) => (
    user.userId !== userId
      && user.location
      && distanceInMeters(location, user.location) <= radius
  ));
}

export function getRadioQueuePosition(queue, userId) {
  const index = queue.findIndex((user) => user.userId === userId);
  return { isInQueue: index !== -1, queuePosition: index === -1 ? null : index + 1 };
}
