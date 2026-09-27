import { useEffect, useMemo, useState } from 'react';
import { subscribeToRecentMessages } from '../data/firestore/radioMessageRepository';
import { cacheRadioMessages, getCachedRadioMessages } from '../data/radioFeedCache';
import { selectActiveRadioUsers, selectVisibleRadioMessages } from '../domain/radioFeed';

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

  const selection = { userId, location, radius, now };
  const visibleMessages = useMemo(
    () => selectVisibleRadioMessages(messages, selection),
    [location, messages, now, radius, userId],
  );
  const activeUsers = useMemo(
    () => selectActiveRadioUsers(messages, selection),
    [location, messages, now, radius],
  );

  return { messages, visibleMessages, activeUsers, connectionError };
}
