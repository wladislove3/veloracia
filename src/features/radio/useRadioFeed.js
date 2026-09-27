import { useEffect, useMemo, useState } from 'react';
import { distanceInMeters, timestampToMillis } from '../../shared/domain/geo';
import { subscribeToRecentMessages } from '../../shared/data/radioMessageRepository';
import { cacheRadioMessages, getCachedRadioMessages } from './data/radioFeedCache';

const CACHE_MAX_AGE = 3 * 60 * 60 * 1000;

export function useRadioFeed({ userId, location, radius }) {
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    let hasServerSnapshot = false;
    getCachedRadioMessages()
      .then((cached) => {
        if (active && !hasServerSnapshot && cached.length) setMessages(cached);
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToRecentMessages(
      (nextMessages) => {
        if (!active) return;
        hasServerSnapshot = true;
        setMessages(nextMessages);
        setConnectionError(null);
        cacheRadioMessages(nextMessages).catch(() => undefined);
      },
      (error) => {
        if (active) setConnectionError(error);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const visibleMessages = useMemo(() => {
    const cutoff = now - CACHE_MAX_AGE;
    return messages.filter((message) => {
      if (timestampToMillis(message.createdAt) < cutoff && !message.audioData) return false;
      if (message.userId === userId) return true;
      if (!location || !message.location) return false;
      return distanceInMeters(location, message.location) <= radius;
    });
  }, [location, messages, now, radius, userId]);

  const activeUsers = useMemo(() => {
    const cutoff = now - 3 * 60 * 60 * 1000;
    const latestByUser = new Map();

    for (const message of messages) {
      const timestamp = timestampToMillis(message.createdAt);
      if (!message.userId || !message.location || timestamp < cutoff) continue;
      const current = latestByUser.get(message.userId);
      if (!current || timestamp > timestampToMillis(current.createdAt)) latestByUser.set(message.userId, message);
    }

    return [...latestByUser.values()].filter((user) => (
      user.location && location && distanceInMeters(location, user.location) <= radius
    ));
  }, [location, messages, now, radius]);

  return { messages, visibleMessages, activeUsers, connectionError };
}
