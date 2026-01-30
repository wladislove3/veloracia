import React, { useState, useEffect, useRef } from 'react';
import uuid from 'react-native-uuid';
import { Animated, StyleSheet, View, Dimensions, Text, FlatList, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import NetworkStatus from './components/NetworkStatus';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { cleanupAudioCache } from './utils/cleanupAudioCache';
import Slider from '@react-native-community/slider';
import MapView, { Circle, Marker } from './components/MapView';
import * as Location from 'expo-location';
import PushToTalkButton from './components/PushToTalkButton';
import QueueIndicator from './components/QueueIndicator';
import GuestLogin from './components/GuestLogin';
import UserMarker from './components/UserMarker';
import { useRadioQueue } from './hooks/useRadioQueue';
import { usePushToTalk } from './hooks/usePushToTalk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './services/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import { AudioModule } from 'expo-audio';
import { theme } from './utils/theme';

const { width } = Dimensions.get('window');
const MAP_STATE_KEY = 'veloraz_map_state';
const MESSAGES_CACHE_KEY = 'veloraz_messages_cache';

function getRandomId() {
  // Try to use crypto-safe UUID when available, otherwise use Math.random fallback
  try {
    // Suppress react-native-uuid warning by catching the crypto unavailable error
    const id = String(uuid.v4());
    return 'user_' + id.replace(/-/g, '').slice(0, 12);
  } catch (e) {
    // Graceful fallback to Math.random for React Native environment
    // This is acceptable for a user ID since we also use Firestore document IDs for true uniqueness
    console.log('Using Math.random() for UUID generation (expected in Expo)');
    return 'user_' + Math.random().toString(36).slice(2, 10);
  }
}

export default function App() {
  // ===== ВСЕ HOOKS ДОЛЖНЫ БЫТЬ ЗДЕСЬ, В НАЧАЛЕ ФУНКЦИИ =====
  
  const [region, setRegion] = useState({
    latitude: 55.751244,
    longitude: 37.618423,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [radius, setRadius] = useState(1000); // метров
  const [location, setLocation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // {nickname, avatar}
  const [messages, setMessages] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const isMountedRef = useRef(true);
  const webAudioRef = useRef(null);
  const audioListAnim = React.useRef(new Animated.Value(0)).current;
  const mapOverlayAnim = React.useRef(new Animated.Value(0)).current;

  // Hooks из других компонентов - должны быть вызваны безусловно
  const { isConnected } = useNetworkStatus();
  const { queue, currentSpeaker, joinQueue, leaveQueue } = useRadioQueue(userId, userProfile, location);
  const { startRecording, stopRecording, isRecording, isBlocked, remainingTime } = usePushToTalk(userId, userProfile, location);

  // Очистка кэша при запуске
  useEffect(() => {
    cleanupAudioCache().catch(console.error);
    return () => {
      // mark unmounted for async operations
      isMountedRef.current = false;
      // try to cleanup current player if any
      if (currentPlayer && typeof currentPlayer.remove === 'function') {
        try { currentPlayer.remove(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  // Восстанавливаем карту и сообщения после перезагрузки
  useEffect(() => {
    (async () => {
      try {
        const savedMapState = await AsyncStorage.getItem(MAP_STATE_KEY);
        if (savedMapState) {
          const parsed = JSON.parse(savedMapState);
          if (parsed?.region) {
            setRegion((prev) => ({ ...prev, ...parsed.region }));
          }
          if (typeof parsed?.radius === 'number') {
            setRadius(parsed.radius);
          }
        }

        const cachedMessages = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
        if (cachedMessages) {
          try {
            const parsedMessages = JSON.parse(cachedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length) {
              setMessages(parsedMessages);
              console.log('Restored from cache:', parsedMessages.length);
            }
          } catch (e) {
            console.warn('Failed to parse cached messages:', e);
          }
        }
      } catch (error) {
        console.warn('Не удалось восстановить состояние карты/сообщений:', error);
      }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(audioListAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [audioListAnim]);

  useEffect(() => {
    if (mapLoading || mapError) {
      mapOverlayAnim.setValue(0);
      Animated.timing(mapOverlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [mapLoading, mapError, mapOverlayAnim]);

  // Получаем/сохраняем userId и профиль в AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        let id = await AsyncStorage.getItem('userId');
        let profile = await AsyncStorage.getItem('userProfile');
        if (!id) {
          id = getRandomId();
          await AsyncStorage.setItem('userId', id);
        }
        setUserId(id);
        if (profile) {
          try {
            setUserProfile(JSON.parse(profile));
          } catch (e) {
            console.error('Ошибка парсинга профиля:', e);
            setShowLogin(true);
          }
        } else {
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setShowLogin(true);
      }
    })();
  }, []);

  const handleLogin = (profile) => {
    setUserProfile(profile);
    setShowLogin(false);
    setProfileMenu(false);  // закрыть меню если открыто
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userProfile');
    setUserProfile(null);
    setShowLogin(true);
    setProfileMenu(false);
  };

  // Геолокация с автообновлением при движении и ручной центровкой
  useEffect(() => {
    let subscription;
    let webWatchId;
    (async () => {
      try {
        if (Platform.OS === 'web') {
          setMapLoading(true);
          if (!navigator?.geolocation) {
            console.warn('Geolocation is not available on web.');
            setLocation({ latitude: region.latitude, longitude: region.longitude });
            setMapError(false);
            setMapLoading(false);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setLocation(coords);
              setRegion((prev) => ({
                ...prev,
                latitude: coords.latitude,
                longitude: coords.longitude,
              }));
              setMapError(false);
              setMapLoading(false);
            },
            (error) => {
              console.warn('Web geolocation failed:', error);
              setLocation({ latitude: region.latitude, longitude: region.longitude });
              setMapError(false);
              setMapLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );

          webWatchId = navigator.geolocation.watchPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.warn('Web geolocation watch failed:', error);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
          );
          return;
        }

        let { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          const message = canAskAgain 
            ? 'Для работы приложения необходим доступ к геолокации. Пожалуйста, разрешите доступ.'
            : 'Доступ к геолокации запрещен. Пожалуйста, разрешите доступ в настройках устройства.';
            
          setMapError(true);
          setMapLoading(false);
          
          // Показываем специальное сообщение об ошибке геолокации
          Alert.alert(
            'Требуется геолокация',
            message,
            canAskAgain
              ? [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Разрешить', onPress: () => Location.requestForegroundPermissionsAsync() }
                ]
              : [
                  { text: 'Открыть настройки', onPress: () => Linking.openSettings() },
                  { text: 'Отмена', style: 'cancel' }
                ]
          );
          return;
        }

        // Сначала получаем стартовую позицию
        setMapLoading(true);
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          throw new Error('Службы геолокации выключены');
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          maximumAge: 5000,
          timeout: 20000
        });
        
        setLocation(loc.coords);
        setRegion((prev) => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
        setMapError(false);
        setMapLoading(false);

        // Затем подписываемся на обновления с более щадящими настройками
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
            setLocation(loc.coords);
            // setRegion НЕ вызываем, чтобы не дергать карту
          }
        );
      } catch (error) {
        console.error('Ошибка геолокации:', error);
        setMapError(true);
        setMapLoading(false);
        
        // Показываем понятное сообщение об ошибке
        Alert.alert(
          'Ошибка определения местоположения',
          'Не удалось определить ваше местоположение. Проверьте, что:\n\n' +
          '• GPS и службы геолокации включены\n' +
          '• У приложения есть разрешение на геолокацию\n' +
          '• Вы находитесь не в помещении или рядом с окном',
          [
            { 
              text: 'Повторить', 
              onPress: () => {
                setMapLoading(true);
                Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Highest,
                  maximumAge: 0,
                  timeout: 20000
                }).then(loc => {
                  setLocation(loc.coords);
                  setMapError(false);
                }).catch(() => {
                  setMapError(true);
                }).finally(() => {
                  setMapLoading(false);
                });
              }
            },
            { text: 'ОК', style: 'cancel' }
          ]
        );
      }
    })();
    return () => {
      if (subscription) subscription.remove();
      if (webWatchId && navigator?.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
    };
  }, []);

  // Кнопка ручной центровки карты на текущей позиции
  const handleCenterMap = () => {
    if (location) {
      setRegion((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }
  };

  // Очередь через Firestore
  const isSpeaking = currentSpeaker && currentSpeaker.userId === userId;
  const inQueue = queue.some(u => u.userId === userId) && !isSpeaking;
  
  // Логирование состояния очереди
  useEffect(() => {
    console.log('Queue state:', {
      queueLength: queue.length,
      userId,
      inQueue,
      isSpeaking,
      currentSpeaker: currentSpeaker?.userId,
      queueUserIds: queue.map(u => u.userId)
    });
  }, [queue, userId, inQueue, isSpeaking, currentSpeaker]);

  // Сообщения из Firestore с ограничением и очисткой
  useEffect(() => {
    const q = query(
      collection(db, 'radioMessages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    let isMounted = true;
    const unsub = onSnapshot(q, (snapshot) => {
      if (isMounted) {
        const nextMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Received messages from Firestore:', nextMessages.length);
        setMessages(nextMessages);
        
        // Cache for faster initial load
        AsyncStorage.setItem(
          MESSAGES_CACHE_KEY,
          JSON.stringify(
            nextMessages.map((msg) => ({
              ...msg,
              createdAt: msg?.createdAt?.toMillis ? msg.createdAt.toMillis() : (msg?.createdAt?.seconds ? msg.createdAt.seconds * 1000 : msg?.createdAt)
            }))
          )
        ).catch(e => console.warn('Cache error:', e));
      }
    }, (error) => {
      console.error('Firestore Snapshot Error:', error);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Сохраняем масштаб/центр карты и радиус
  useEffect(() => {
    AsyncStorage.setItem(
      MAP_STATE_KEY,
      JSON.stringify({
        region: {
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        radius,
      })
    ).catch((error) => {
      console.warn('Не удалось сохранить состояние карты:', error);
    });
  }, [region, radius]);

  // --- Вычисляем видимые сообщения на основе радиуса ---
  const [visibleMessages, setVisibleMessages] = useState([]);

  // Функция для расчета расстояния (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // метров
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // в метрах
  };

  useEffect(() => {
    if (!location) {
      setVisibleMessages(messages); // Если локация неизвестна, показываем все (или можно скрыть)
      return;
    }

    const filtered = messages.filter((msg) => {
      // Свои сообщения показываем всегда
      if (msg.userId === userId) return true;
      
      if (!msg.location || typeof msg.location.latitude !== 'number') return false;

      const dist = getDistance(
        location.latitude,
        location.longitude,
        msg.location.latitude,
        msg.location.longitude
      );
      
      // Показываем, если отправитель в нашем радиусе ИЛИ мы в радиусе отправителя
      // Но по классике радио: мы слышим тех, кто попал в НАШ радиус
      return dist <= radius;
    });

    setVisibleMessages(filtered);
  }, [messages, location, radius, userId]);

  // --- Вычисляем пользователей, которые говорили в эфир за последние 3 часа ---
  useEffect(() => {
    const now = Date.now();
    const threeHoursAgo = now - 3 * 60 * 60 * 1000;
    // Группируем сообщения по userId, берём последнее сообщение каждого
    const userMap = {};
    messages.forEach(msg => {
      if (!msg.userId || !msg.location || !msg.createdAt) return;
      // createdAt может быть Timestamp или Date или number
      let ts = msg.createdAt;
      if (ts && ts.seconds) ts = ts.seconds * 1000;
      else if (ts instanceof Date) ts = ts.getTime();
      if (ts < threeHoursAgo) return;
      if (!userMap[msg.userId] || userMap[msg.userId].createdAt < ts) {
        userMap[msg.userId] = { ...msg, createdAt: ts };
      }
    });
    setRecentUsers(Object.values(userMap));
  }, [messages]);

  // Периодическая очистка старых сообщений (старше 2 часов)
  useEffect(() => {
    const cleanupOldMessages = async () => {
      try {
        const cutoff = Date.now() - 2 * 60 * 60 * 1000;
        const cutoffTimestamp = Timestamp.fromMillis(cutoff);
        const oldMessagesSnapshot = await getDocs(
          query(
            collection(db, 'radioMessages'),
            where('createdAt', '<', cutoffTimestamp)
          )
        );

        await Promise.all(
          oldMessagesSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref))
        );
      } catch (error) {
        console.error('Ошибка очистки старых сообщений:', error);
      }
    };

    cleanupOldMessages();
    const intervalId = setInterval(cleanupOldMessages, 2 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Воспроизведение аудио (безопасная реализация с очисткой и защитой от демонтирования)
  const playAudio = async (message, id) => {
    if (!message.audioData) {
      Alert.alert('Ошибка', 'Аудиофайл недоступен или был удалён.');
      return;
    }

    if (Platform.OS === 'web') {
      try {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
          webAudioRef.current = null;
        }
        const mimeType = message.mimeType || 'audio/webm';
        const dataUrl = `data:${mimeType};base64,${message.audioData}`;
        const audio = new Audio(dataUrl);
        webAudioRef.current = audio;
        setPlayingId(id);
        audio.onended = () => {
          if (isMountedRef.current) setPlayingId(null);
        };
        audio.onerror = () => {
          if (isMountedRef.current) setPlayingId(null);
          Alert.alert('Ошибка', 'Ошибка воспроизведения аудио');
        };
        await audio.play();
      } catch (error) {
        console.error('Ошибка воспроизведения аудио (web):', error);
        if (isMountedRef.current) setPlayingId(null);
        Alert.alert('Ошибка', 'Ошибка воспроизведения аудио');
      }
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}audio-${id}.m4a`;

    // очистка предыдущего плеера
    const cleanupPrev = async () => {
      if (currentPlayer) {
        try {
          if (currentPlayer.off) currentPlayer.off('playbackStatusUpdate');
          if (typeof currentPlayer.remove === 'function') await currentPlayer.remove();
        } catch (e) {
          console.warn('Ошибка при очистке предыдущего плеера:', e);
        }
        if (isMountedRef.current) setCurrentPlayer(null);
      }
    };

    let player = null;
    try {
      await cleanupPrev();

      if (!isMountedRef.current) return;
      if (isMountedRef.current) setPlayingId(id);

      // Создаём временный файл
      try {
        await FileSystem.writeAsStringAsync(fileUri, message.audioData, { encoding: FileSystem.EncodingType.Base64 });
      } catch (e) {
        if (isMountedRef.current) setPlayingId(null);
        console.error('Ошибка создания временного файла:', e);
        Alert.alert('Ошибка', 'Ошибка подготовки аудиофайла к воспроизведению');
        return;
      }

      // Создаём плеер
      player = await AudioModule.createPlayerAsync({ uri: fileUri });
      if (!player) throw new Error('Не удалось создать аудиоплеер');

      if (isMountedRef.current) setCurrentPlayer(player);

      let statusListener = null;
      statusListener = async (status) => {
        try {
          if (status && status.didJustFinish) {
            if (isMountedRef.current) setPlayingId(null);
            // Отсоединяем слушатель и удаляем плеер
            try { if (player && player.off) player.off('playbackStatusUpdate'); } catch (e) { /* ignore */ }
            try { if (player && typeof player.remove === 'function') await player.remove(); } catch (e) { /* ignore */ }
            if (isMountedRef.current) setCurrentPlayer(null);
            // Удаляем временный файл
            try { await FileSystem.deleteAsync(fileUri); } catch (e) { console.warn('Ошибка при удалении временного файла:', e); }
          }
        } catch (e) {
          console.warn('Ошибка в обработчике статуса плеера:', e);
        }
      };

      if (player.on) {
        player.on('playbackStatusUpdate', statusListener);
      }

      // Запуск плеера (поддерживаем разные API)
      if (typeof player.play === 'function') {
        await player.play();
      } else if (typeof player.playAsync === 'function') {
        await player.playAsync();
      } else {
        console.warn('Плеер не поддерживает метод play');
      }
    } catch (e) {
      if (isMountedRef.current) setPlayingId(null);
      console.error('Ошибка воспроизведения аудио:', e);
      // В случае ошибки постараемся удалить временный файл
      try { await FileSystem.deleteAsync(fileUri); } catch (delErr) { /* ignore */ }
      Alert.alert('Ошибка', 'Ошибка воспроизведения аудио');
    }
  };

  // Push-to-Talk управление очередью и записью с защитой от ложных нажатий
  const pressTimeoutRef = useRef(null);
  const recordingStartedRef = useRef(false);
  const handlePressIn = () => {
    recordingStartedRef.current = false;
    pressTimeoutRef.current = setTimeout(async () => {
      try {
        if (typeof startRecording === 'function') {
          await startRecording();
          recordingStartedRef.current = true;
        } else {
          Alert.alert('Запись недоступна', 'Не удалось начать запись — проверьте доступ к микрофону или лимиты.');
          return;
        }

        if (typeof joinQueue === 'function') {
          await joinQueue();
        }
      } catch (error) {
        console.error('Ошибка при подготовке записи или постановке в очередь:', error);
        if (typeof stopRecording === 'function') {
          await stopRecording().catch(() => {});
        }
        await leaveQueue().catch(() => {});
        recordingStartedRef.current = false;
        Alert.alert('Запись недоступна', 'Не удалось начать запись. Проверьте соединение с сервером и доступ к микрофону.');
      }
    }, 100);
  };
  const handlePressOut = async () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    if (recordingStartedRef.current) {
      if (typeof stopRecording === 'function') {
        await stopRecording();
      } else {
        console.warn('stopRecording is not available');
        Alert.alert('Запись недоступна', 'Не удалось остановить запись корректно.');
      }
      console.log('handlePressOut: вызываем leaveQueue');
      await leaveQueue();
      console.log('handlePressOut: leaveQueue завершена');
      recordingStartedRef.current = false;
    }
    // Если запись не стартовала — ничего не делаем
  };

  // Показываем экран входа если нет профиля
  if (showLogin || !userProfile) {
    return <GuestLogin onLogin={handleLogin} />;
  }

  // Показываем экран загрузки при инициализации userId
  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <NetworkStatus />
      {/* Кнопка профиля */}
      <View style={styles.profileButtonWrapper}>
        <TouchableOpacity onPress={() => setProfileMenu(true)} style={styles.profileButton}>
          <Text style={styles.profileAvatar}>{userProfile.avatar || '👤'}</Text>
        </TouchableOpacity>
      </View>
      {/* Меню профиля */}
      {profileMenu && (
        <View style={styles.menuOverlay}>
          <View style={styles.menuPopup}>
            <Text style={styles.menuTitle}>{userProfile.avatar} {userProfile.nickname}</Text>
            <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
              <Text style={styles.menuBtnText}>Сменить имя и аватар</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setProfileMenu(false)}>
              <Text style={[styles.menuBtnText, styles.menuCancelText]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Кнопка геолокации */}
      <View style={styles.mapActionWrapper}>
        <TouchableOpacity onPress={handleCenterMap} style={styles.mapActionButton}>
          <Text style={styles.mapActionIcon}>📍</Text>
        </TouchableOpacity>
      </View>
      {location ? (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          loadingEnabled={true}
          loadingIndicatorColor={theme.colors.primary}
          loadingBackgroundColor={theme.colors.surface}
          onError={(error) => {
            console.error('MapView error:', error);
            setMapError(true);
            setMapLoading(false);
          }}
          onLoad={() => {
            setMapLoading(false);
            setMapError(false);
          }}
        >
          {location && (
            <>
              <Marker coordinate={location} title="Вы">
                <View style={styles.selfMarker}>
                  <Text style={styles.selfMarkerIcon}>🧭</Text>
                  <Text style={styles.selfMarkerText}>Вы</Text>
                </View>
              </Marker>
              <Circle
                center={location}
                radius={radius}
                fillColor="rgba(11, 110, 106, 0.14)"
                strokeColor="rgba(11, 110, 106, 0.45)"
                strokeWidth={2}
              />
              {/* Метки других пользователей: из очереди и из последних сообщений */}
              {/* Метки из очереди */}
              {queue.filter(u => u.userId !== userId && u.location).map((u, index) => (
                <UserMarker
                  key={'queue-' + u.userId + '-' + index}
                  user={u}
                  onCall={() => {}}
                />
              ))}
              {/* 2. Метки из последних сообщений (если нет в очереди) */}
              {recentUsers
                .filter(u => u.userId !== userId && !queue.some(q => q.userId === u.userId))
                .map((u) => (
                  <UserMarker
                    key={'recent-' + u.userId}
                    user={u}
                    onCall={() => {}}
                  />
                ))}
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.locationFallback}>
          <Text style={styles.locationFallbackText}>Получение геолокации...</Text>
        </View>
      )}

      {mapLoading && (
        <Animated.View
          style={[
            styles.mapOverlay,
            {
              opacity: mapOverlayAnim,
              transform: [
                {
                  translateY: mapOverlayAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.mapOverlayText}>Загрузка карты...</Text>
        </Animated.View>
      )}

      {mapError && (
        <Animated.View
          style={[
            styles.mapOverlay,
            styles.mapOverlayError,
            {
              opacity: mapOverlayAnim,
              transform: [
                {
                  translateY: mapOverlayAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.mapOverlayText, styles.mapOverlayErrorText]}>
            Ошибка загрузки карты. Проверьте интернет-соединение.
          </Text>
        </Animated.View>
      )}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Радиус эфира</Text>
        <Text style={styles.sliderValue}>{(radius/1000).toFixed(2)} км</Text>
        <Slider
          style={styles.slider}
          minimumValue={500}
          maximumValue={20000}
          step={100}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.accent}
        />
      </View>
      <Animated.View
        style={[
          styles.audioListContainer,
          {
            opacity: audioListAnim,
            transform: [
              {
                translateY: audioListAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.audioListCard}>
          <View style={styles.audioListHeader}>
            <Text style={styles.audioListTitle}>Новые голоса</Text>
            <Text style={styles.audioListCount}>{visibleMessages.length}</Text>
          </View>
          {visibleMessages.length === 0 ? (
            <Text style={styles.audioListEmpty}>Пока нет сообщений рядом.</Text>
          ) : (
            <FlatList
              data={visibleMessages}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.audioListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.audioMsg, playingId === item.id && styles.audioMsgActive, !item.audioData && styles.audioMsgDisabled]}
                  onPress={() => {
                    if (!item.audioData) {
                      Alert.alert('Ошибка', 'Аудиофайл недоступен или был удалён.');
                      return;
                    }
                    playAudio(item, item.id);
                  }}
                  disabled={!item.audioData}
                >
                  <Text style={styles.audioMsgAvatar}>{item.avatar || '🎤'}</Text>
                  <Text style={styles.audioMsgName}>{item.nickname || item.userId.slice(-4)}</Text>
                  <Text style={[styles.audioMsgIcon, (!item.audioData || typeof item.audioData !== 'string') && styles.audioMsgIconDisabled]}>▶</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Animated.View>
      <View style={styles.queueContainer}>
        <QueueIndicator
          currentSpeaker={currentSpeaker}
        />
      </View>
      <View style={styles.pttContainer}>
        <PushToTalkButton
          isSpeaking={isSpeaking || isRecording}
          inQueue={inQueue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isBlocked}
          remainingTime={remainingTime}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    zIndex: 1,
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 120,
    ...theme.shadow,
  },
  sliderLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 12,
  },
  sliderValue: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
    marginBottom: 10,
    fontSize: 16,
  },
  slider: {
    width: width - 60,
  },
  audioMsg: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    margin: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: 72,
  },
  audioMsgActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  audioMsgDisabled: {
    opacity: 0.4,
  },
  audioMsgName: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
  },
  audioMsgIcon: {
    color: theme.colors.primary,
  },
  audioMsgIconDisabled: {
    color: '#aaa',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  menuPopup: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    minWidth: 240,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
    zIndex: 30,
  },
  menuTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  menuBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  menuBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
  },
  menuCancelText: {
    color: theme.colors.accent,
  },
  appContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  profileButtonWrapper: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 120,
  },
  profileButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  profileAvatar: {
    fontSize: 24,
  },
  mapActionWrapper: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 120,
  },
  mapActionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  mapActionIcon: {
    fontSize: 22,
  },
  locationFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  locationFallbackText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  mapOverlayText: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontFamily: theme.fonts.bodyBold,
  },
  mapOverlayError: {
    backgroundColor: theme.colors.surface,
  },
  mapOverlayErrorText: {
    color: theme.colors.danger,
  },
  audioListContainer: {
    position: 'absolute',
    bottom: 320,
    left: 0,
    right: 0,
    alignItems: 'center',
    maxHeight: 120,
    zIndex: 120,
  },
  audioListCard: {
    width: '92%',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  audioListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  audioListTitle: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    fontSize: 16,
  },
  audioListCount: {
    backgroundColor: theme.colors.accentSoft,
    color: theme.colors.primaryDark,
    fontFamily: theme.fonts.bodyBold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  audioListEmpty: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    paddingVertical: 8,
  },
  audioListContent: {
    paddingBottom: 4,
  },
  audioMsgAvatar: {
    fontSize: 24,
  },
  selfMarker: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  selfMarkerIcon: {
    fontSize: 20,
  },
  selfMarkerText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
  },
  queueContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 120,
  },
  pttContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
  },
});
