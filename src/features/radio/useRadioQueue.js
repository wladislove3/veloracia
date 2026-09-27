import { useCallback, useEffect, useMemo, useState } from 'react';
import { timestampToMillis } from '../../shared/domain/geo';
import { joinRadioQueue, leaveRadioQueue, subscribeToQueue } from '../../shared/data/radioQueueRepository';

const QUEUE_LIFETIME = 30 * 60 * 1000;

export function useRadioQueue({ userId, profile, location }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = subscribeToQueue(
      (nextUsers) => {
        setUsers(nextUsers);
        setError(null);
      },
      (nextError) => setError(nextError)
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const queue = useMemo(() => {
    const cutoff = now - QUEUE_LIFETIME;
    return users.filter((user) => timestampToMillis(user.joinedAt) >= cutoff);
  }, [now, users]);

  const currentSpeaker = queue[0] || null;
  const isInQueue = queue.some((user) => user.userId === userId);

  const join = useCallback(async () => {
    if (!userId) return;
    await joinRadioQueue({ userId, profile, location });
  }, [location, profile, userId]);

  const leave = useCallback(async () => {
    if (!userId) return;
    await leaveRadioQueue(userId);
  }, [userId]);

  return { queue, currentSpeaker, isInQueue, join, leave, error };
}
