import { useEffect, useState, useCallback } from 'react';
import { db } from '../services/firebaseConfig';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where,
  updateDoc
} from 'firebase/firestore';

// userId — уникальный идентификатор пользователя (например, randomId или deviceId)
// userProfile — { nickname, avatar }
export function useRadioQueue(userId, userProfile, location) {
  const [queue, setQueue] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [error, setError] = useState(null);
  
  // Защита от null db
  const queueRef = collection(db, 'radioQueue');

  // Подписка на очередь с автоочисткой старых пользователей
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const setupQueue = async () => {
      try {
        const q = query(queueRef, orderBy('joinedAt'));
        const unsub = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;

          const now = Date.now();
          const QUEUE_TIMEOUT = 30 * 60 * 1000; // 30 минут
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => {
            // Проверяем, не истек ли таймаут для пользователя
            if (!user.joinedAt) return true;
            const joinedTime = user.joinedAt.seconds ? user.joinedAt.seconds * 1000 : user.joinedAt;
            const age = now - joinedTime;
            if (age > QUEUE_TIMEOUT) {
              // Удаляем старого пользователя в фоне
              deleteDoc(doc(db, 'radioQueue', user.id)).catch(console.error);
              return false;
            }
            return true;
          });
          
          setQueue(users);
          setCurrentSpeaker(users[0] || null);
          setError(null);
        }, (err) => {
          if (!isMounted) return;

          console.error('Firestore error:', err);
          setError('Ошибка подключения к Firestore');
        });

        return unsub;
      } catch (err) {
        if (!isMounted) return null;

        console.error('Firestore init error:', err);
        setError('Ошибка инициализации Firestore');
        return null;
      }
    };

    const init = async () => {
      unsubscribe = await setupQueue();
    };
    init();

    return () => {
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Встать в очередь или обновить локацию
  const joinQueue = useCallback(async () => {
    if (!userId) return;
    try {
      const q = query(queueRef, where('userId', '==', userId));
      const docs = await getDocs(q);
      if (docs.empty) {
        await addDoc(queueRef, {
          userId,
          nickname: userProfile?.nickname || '',
          avatar: userProfile?.avatar || '',
          location: location || null,
          joinedAt: serverTimestamp(),
        });
        console.log('joinQueue: добавлен в очередь');
      } else {
        // Обновляем локацию, если уже в очереди - используем Promise.all
        await Promise.all(
          docs.docs.map(d =>
            updateDoc(doc(db, 'radioQueue', d.id), {
              location: location || null,
            })
          )
        );
        console.log('joinQueue: локация обновлена');
      }
    } catch (err) {
      console.error('joinQueue error:', err);
    }
  }, [userId, userProfile, location]);

  // Выйти из очереди
  const leaveQueue = useCallback(async () => {
    if (!userId) return;
    try {
      const q = query(queueRef, where('userId', '==', userId));
      const docs = await getDocs(q);
      // Используем Promise.all чтобы дождаться всех удалений
      await Promise.all(
        docs.docs.map(d => deleteDoc(doc(db, 'radioQueue', d.id)))
      );
      console.log('leaveQueue: успешно удален из очереди');
    } catch (err) {
      console.error('leaveQueue error:', err);
    }
  }, [userId]);

  // Сбросить всю очередь (например, по таймауту)
  const resetQueue = useCallback(async () => {
    const docs = await getDocs(queueRef);
    docs.forEach(async (d) => {
      await deleteDoc(doc(db, 'radioQueue', d.id));
    });
  }, []);

  // ВНИМАНИЕ: НЕ автоматически добавлять в очередь при изменении локации
  // joinQueue() должна вызываться ТОЛЬКО когда пользователь нажимает кнопку
  // Автообновление локации будет происходить в joinQueue() если пользователь уже в очереди

  return { queue, currentSpeaker, joinQueue, leaveQueue, resetQueue, error };
} 