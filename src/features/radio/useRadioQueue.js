import { useCallback, useEffect, useMemo, useState } from 'react';
import { timestampToMillis } from '../../shared/domain/geo';
import { joinRadioQueue, leaveRadioQueue, subscribeToQueue } from './data/firestore/radioQueueRepository';
import { RADIO_QUEUE_LIFETIME_MS } from './domain/radioPolicy';

export function useRadioQueue({ userId, profile, location }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let unsubscribe = () => {};
    const refreshSubscription = () => {
      unsubscribe();
      unsubscribe = subscribeToQueue(
        Date.now() - RADIO_QUEUE_LIFETIME_MS,
        (nextUsers) => {
          setUsers(nextUsers);
          setError(null);
        },
        (nextError) => setError(nextError)
      );
    };

    refreshSubscription();
    const interval = setInterval(refreshSubscription, RADIO_QUEUE_LIFETIME_MS);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const queue = useMemo(() => {
    const cutoff = now - RADIO_QUEUE_LIFETIME_MS;
    return users.filter((user) => timestampToMillis(user.joinedAt) >= cutoff);
  }, [now, users]);

  const currentSpeaker = queue[0] || null;
  const queueIndex = queue.findIndex((user) => user.userId === userId);
  const isInQueue = queueIndex !== -1;
  const queuePosition = isInQueue ? queueIndex + 1 : null;

  const join = useCallback(async () => {
    if (!userId) return;
    await joinRadioQueue({ userId, profile, location });
  }, [location, profile, userId]);

  const leave = useCallback(async () => {
    if (!userId) return;
    await leaveRadioQueue(userId);
  }, [userId]);

  return { queue, currentSpeaker, isInQueue, queuePosition, join, leave, error };
}
