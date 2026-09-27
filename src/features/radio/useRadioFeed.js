import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { distanceInMeters, timestampToMillis } from '../../shared/domain/geo';
import { subscribeToRecentMessages } from '../../shared/data/radioMessageRepository';

const MESSAGE_CACHE_KEY = 'veloracia.messages.v2';
const CACHE_MAX_AGE = 3 * 60 * 60 * 1000;

export function useRadioFeed({ userId, location, radius }) {
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(MESSAGE_CACHE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const cached = JSON.parse(raw);
        if (Array.isArray(cached)) setMessages(cached);
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToRecentMessages(
      (nextMessages) => {
        if (!active) return;
        setMessages(nextMessages);
        setConnectionError(null);
        const compactCache = nextMessages
          .filter((message) => message.audioUrl)
          .map((message) => ({
            id: message.id,
            userId: message.userId,
            nickname: message.nickname,
            avatar: message.avatar,
            audioUrl: message.audioUrl,
            mimeType: message.mimeType,
            location: message.location,
            createdAt: timestampToMillis(message.createdAt),
          }));
        AsyncStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(compactCache)).catch(() => undefined);
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
