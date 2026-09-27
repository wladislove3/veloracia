import { distanceInMeters, timestampToMillis } from '../../../shared/domain/geo';
import { RADIO_MESSAGE_RETENTION_MS } from './radioPolicy';

export function selectVisibleRadioMessages(messages, { userId, location, radius, now }) {
  const cutoff = now - RADIO_MESSAGE_RETENTION_MS;

  return messages.filter((message) => {
    if (timestampToMillis(message.createdAt) < cutoff && !message.audioData) return false;
    if (message.userId === userId) return true;
    if (!location || !message.location) return false;
    return distanceInMeters(location, message.location) <= radius;
  });
}

export function selectActiveRadioUsers(messages, { location, radius, now }) {
  if (!location) return [];

  const cutoff = now - RADIO_MESSAGE_RETENTION_MS;
  const latestMessageByUser = new Map();

  for (const message of messages) {
    if (!message.userId || !message.location) continue;

    const timestamp = timestampToMillis(message.createdAt);
    if (timestamp < cutoff) continue;

    const current = latestMessageByUser.get(message.userId);
    if (!current || timestamp > timestampToMillis(current.createdAt)) {
      latestMessageByUser.set(message.userId, message);
    }
  }

  return [...latestMessageByUser.values()].filter((user) => (
    distanceInMeters(location, user.location) <= radius
  ));
}
