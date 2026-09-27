import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, SafeAreaView, Text, View, useWindowDimensions } from 'react-native';
import MapView, { Circle, Marker } from '../../../../components/MapView';
import { useLiveLocation } from '../../location/useLiveLocation';
import { useAudioPlayback } from '../useAudioPlayback';
import { usePushToTalk } from '../usePushToTalk';
import { useRadioFeed } from '../useRadioFeed';
import { useRadioQueue } from '../useRadioQueue';
import { distanceInMeters, timestampToMillis } from '../../../shared/domain/geo';
import { palette } from '../../../shared/ui/tokens';
import { styles } from '../radioDashboard.styles';

const RADIUS_OPTIONS = [2_000, 5_000, 10_000, 20_000];

function formatDistance(radius) {
  return radius < 1_000 ? `${radius} м` : `${(radius / 1_000).toLocaleString('ru-RU')} км`;
}

function formatAge(timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestampToMillis(timestamp)) / 60_000));
  if (minutes < 1) return 'сейчас';
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч`;
}

function StatusPill({ children, tone = 'neutral' }) {
  return (
    <View style={[styles.statusPill, tone === 'live' && styles.statusPillLive, tone === 'warning' && styles.statusPillWarning]}>
      {tone === 'live' ? <View style={styles.statusDot} /> : null}
      <Text style={[styles.statusPillText, tone === 'live' && styles.statusPillTextLive]}>{children}</Text>
    </View>
  );
}

function IconButton({ label, onPress, accessibilityLabel, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}
    >
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
}

function VoiceMessage({ message, isPlaying, onPlay }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isPlaying ? 'Остановить' : 'Слушать'} сообщение от ${message.nickname || 'велосипедиста'}`}
      onPress={() => onPlay(message, isPlaying)}
      style={({ pressed }) => [styles.messageCard, isPlaying && styles.messageCardPlaying, pressed && styles.pressed]}
    >
      <View style={styles.messageAvatar}><Text>{message.avatar || '🎙️'}</Text></View>
      <View style={styles.messageCopy}>
        <Text numberOfLines={1} style={styles.messageName}>{message.nickname || 'Аноним'}</Text>
        <Text style={styles.messageMeta}>{formatAge(message.createdAt)} · голосовое</Text>
      </View>
      <View style={[styles.playButton, isPlaying && styles.playButtonActive]}>
        <Text style={styles.playButtonText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </View>
    </Pressable>
  );
}

function PushToTalkControl({ isRecording, isWaiting, isBlocked, remainingTime, onPressIn, onPressOut, compact }) {
  const lockLabel = isBlocked
    ? `Лимит · ${Math.ceil(remainingTime / 60_000)} мин`
    : isWaiting ? 'Вы в очереди · удерживайте' : 'Удерживайте, чтобы говорить';
  return (
    <View style={[styles.talkArea, compact && styles.talkAreaCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Отпустите, чтобы отправить голосовое сообщение' : lockLabel}
        accessibilityState={{ disabled: isBlocked }}
        disabled={isBlocked}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onContextMenu={Platform.OS === 'web' ? (event) => event.preventDefault() : undefined}
        style={({ pressed }) => [styles.talkButton, compact && styles.talkButtonCompact, isRecording && styles.talkButtonRecording, pressed && styles.talkButtonPressed, isBlocked && styles.talkButtonBlocked]}
      >
        <Text style={styles.talkButtonIcon}>{isRecording ? '◉' : '⌁'}</Text>
      </Pressable>
      <Text style={styles.talkTitle}>{isRecording ? 'В эфире…' : isBlocked ? 'Небольшая пауза' : isWaiting ? 'Вы следующие' : 'Сказать рядом'}</Text>
      <Text style={styles.talkHint}>{isRecording ? 'Отпустите кнопку, чтобы отправить' : isWaiting ? 'Запись начнётся автоматически' : lockLabel}</Text>
    </View>
  );
}

function RadioSidebar({
  isWide,
  profile,
  visibleMessages,
  currentSpeaker,
  isInQueue,
  isWaiting,
  isRecording,
  isBlocked,
  remainingTime,
  playingId,
  onPlay,
  onPressIn,
  onPressOut,
  radius,
  setRadius,
  onChangeProfile,
  isConnected,
  error,
  isCompactMobile,
}) {
  return (
    <View style={[styles.sidebar, isWide ? styles.sidebarWide : styles.sidebarMobile, isCompactMobile && styles.sidebarCompact]}>
      {isWide ? (
        <View style={styles.sidebarHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ПРЯМО СЕЙЧАС</Text>
            <Text style={styles.sidebarTitle}>Голоса рядом</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{visibleMessages.length}</Text></View>
        </View>
      ) : null}

      {isWide || currentSpeaker ? <View style={styles.onAirCard}>
        <View style={styles.onAirIcon}><Text style={styles.onAirIconText}>{currentSpeaker?.avatar || '◌'}</Text></View>
        <View style={styles.onAirCopy}>
          <Text style={styles.onAirEyebrow}>{currentSpeaker ? 'СЕЙЧАС ГОВОРИТ' : 'ЧАСТОТА СВОБОДНА'}</Text>
          <Text numberOfLines={1} style={styles.onAirName}>{currentSpeaker?.nickname || 'Будьте первым'}</Text>
        </View>
        <View style={[styles.onAirSignal, isInQueue && styles.onAirSignalWaiting]}><View style={styles.onAirSignalDot} /></View>
      </View> : null}

      <View style={styles.feedHeading}>
        <Text style={styles.feedTitle}>Недавние сообщения</Text>
        <StatusPill>{formatDistance(radius)}</StatusPill>
      </View>

      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VoiceMessage message={item} isPlaying={playingId === item.id} onPlay={onPlay} />}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⌁</Text>
            <Text style={styles.emptyTitle}>Пока тихо</Text>
            <Text style={styles.emptyCopy}>Первый голос рядом может быть вашим.</Text>
          </View>
        )}
        style={styles.feedScroll}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />

      {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
      <PushToTalkControl
        isBlocked={isBlocked}
        isRecording={isRecording}
        isWaiting={isWaiting}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        remainingTime={remainingTime}
        compact={isCompactMobile}
      />

      {isWide ? <View style={styles.sidebarFooter}>
        <View style={styles.footerUser}>
          <View style={styles.footerAvatar}><Text>{profile.avatar}</Text></View>
          <View style={styles.footerUserCopy}>
            <Text numberOfLines={1} style={styles.footerUserName}>{profile.nickname}</Text>
            <Text style={styles.footerStatus}>{isConnected ? 'На связи' : 'Нет подключения'}</Text>
          </View>
        </View>
        <Pressable onPress={onChangeProfile} accessibilityRole="button" accessibilityLabel="Сменить профиль" style={styles.profileMenuButton}>
          <Text style={styles.profileMenuButtonText}>···</Text>
        </Pressable>
      </View> : null}
    </View>
  );
}

export default function RadioDashboard({ profile, onChangeProfile }) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompactMobile = !isWide && height < 720;
  const { location, mapCenter, error: locationError, requestLocation } = useLiveLocation();
  const [radius, setRadius] = useState(10_000);
  const { visibleMessages, activeUsers, connectionError } = useRadioFeed({ userId: profile.userId, location, radius });
  const { queue, currentSpeaker, isInQueue, join, leave, error: queueError } = useRadioQueue({ userId: profile.userId, profile, location });
  const { isRecording, isBlocked, remainingTime, error: recordingError, startRecording, stopRecording } = usePushToTalk({
    userId: profile.userId,
    profile,
    location,
  });
  const [isHoldingTalk, setIsHoldingTalk] = useState(false);
  const isHoldingTalkRef = useRef(false);
  const queueJoinPromiseRef = useRef(null);
  const isStartingRecordingRef = useRef(false);
  const { playingId, play, stop } = useAudioPlayback();
  const [notice, setNotice] = useState(null);
  const isWaiting = isHoldingTalk && isInQueue && currentSpeaker?.userId !== profile.userId;

  React.useEffect(() => {
    if (!isHoldingTalk || currentSpeaker?.userId !== profile.userId || isRecording || isStartingRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    startRecording().then(async (started) => {
      if (!started) {
        isHoldingTalkRef.current = false;
        setIsHoldingTalk(false);
        await leave().catch(() => undefined);
      } else if (!isHoldingTalkRef.current) {
        await stopRecording();
        await leave().catch(() => undefined);
      }
    }).finally(() => {
      isStartingRecordingRef.current = false;
    });
  }, [currentSpeaker?.userId, isHoldingTalk, isRecording, leave, profile.userId, startRecording, stopRecording]);
  const feedError = connectionError?.message ? 'Не удалось подключиться к радио.' : null;
  const screenError = recordingError || locationError || queueError?.message || feedError || notice;

  const mapRegion = useMemo(() => ({
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: Math.max(0.035, (radius / 111_000) * 2.4),
    longitudeDelta: Math.max(0.035, (radius / (111_000 * Math.max(Math.cos((mapCenter.latitude * Math.PI) / 180), 0.2))) * 2.4),
  }), [mapCenter.latitude, mapCenter.longitude, radius]);
  const nearbyQueue = useMemo(() => queue.filter((user) => (
    user.userId !== profile.userId && user.location && location && distanceInMeters(location, user.location) <= radius
  )), [location, profile.userId, queue, radius]);

  async function handlePressIn() {
    isHoldingTalkRef.current = true;
    setIsHoldingTalk(true);
    setNotice(null);
    const joining = join();
    queueJoinPromiseRef.current = joining;
    await joining.catch(() => {
      isHoldingTalkRef.current = false;
      setIsHoldingTalk(false);
      setNotice('Не удалось встать в очередь. Проверьте подключение.');
    }).finally(() => {
      if (queueJoinPromiseRef.current === joining) queueJoinPromiseRef.current = null;
    });
  }

  async function handlePressOut() {
    isHoldingTalkRef.current = false;
    setIsHoldingTalk(false);
    if (isRecording) await stopRecording();
    await queueJoinPromiseRef.current?.catch(() => undefined);
    queueJoinPromiseRef.current = null;
    await leave().catch(() => setNotice('Не удалось освободить эфир.'));
  }

  async function playMessage(message, isPlaying) {
    if (isPlaying) {
      await stop();
      return;
    }
    try {
      await play(message);
    } catch (error) {
      setNotice(error.message || 'Не удалось воспроизвести запись.');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMarkSmall}><Text style={styles.brandMarkText}>V</Text></View>
          <View>
            <Text style={styles.brandName}>veloracia</Text>
            <Text style={styles.brandCaption}>ГОРОДСКОЕ РАДИО</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {width >= 520 ? <StatusPill tone={location ? 'live' : 'warning'}>{location ? `${nearbyCountLabel(activeUsers, nearbyQueue, profile.userId)} рядом` : 'Геопозиция выключена'}</StatusPill> : null}
          <Pressable onPress={onChangeProfile} style={styles.headerAvatar} accessibilityRole="button" accessibilityLabel="Изменить профиль">
            <Text>{profile.avatar}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.dashboardLayout, !isWide && styles.dashboardLayoutMobile, isCompactMobile && styles.dashboardLayoutCompact]}>
        <View style={[styles.mapPanel, !isWide && styles.mapPanelMobile, isCompactMobile && styles.mapPanelCompact]}>
          <MapView style={styles.map} region={mapRegion} showsUserLocation={false} showsCompass={false}>
            {location ? <Circle center={location} radius={radius} fillColor="rgba(206,255,87,0.08)" strokeColor="rgba(206,255,87,0.62)" strokeWidth={1} /> : null}
            {location ? <Marker coordinate={location} title="Вы" description="Вы здесь" /> : null}
            {nearbyQueue.map((user) => (
              <Marker key={`queue-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'В эфире'} description={user.nickname || 'Слушает радио рядом'} />
            ))}
          {activeUsers.filter((user) => user.userId !== profile.userId && !nearbyQueue.some((queued) => queued.userId === user.userId)).map((user) => (
              <Marker key={`active-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'Рядом'} description={user.nickname || 'Недавно был в эфире'} />
            ))}
          </MapView>

          <View style={styles.mapTopOverlay} pointerEvents="box-none">
            <View style={styles.mapTitleCard}>
              <Text style={styles.mapTitleEyebrow}>ВАШ РАЙОН</Text>
              <Text style={styles.mapTitle}>{location ? 'Эфир поблизости' : 'Найдите свой эфир'}</Text>
            </View>
            <IconButton label="◎" accessibilityLabel="Обновить геопозицию" onPress={requestLocation} style={styles.locateButton} />
          </View>

          <View style={styles.mapBottomOverlay} pointerEvents="box-none">
            {!location ? (
              <Pressable onPress={requestLocation} style={styles.locationPrompt}>
                <View style={styles.locationPromptIcon}><Text>⌖</Text></View>
                <View style={styles.locationPromptCopy}>
                  <Text style={styles.locationPromptTitle}>Включите геопозицию</Text>
                  <Text style={styles.locationPromptText}>Чтобы услышать людей поблизости</Text>
                </View>
                <Text style={styles.locationPromptArrow}>↗</Text>
              </Pressable>
            ) : (
              <View style={styles.radiusCard}>
                <View style={styles.radiusHeader}>
                  <View><Text style={styles.radiusEyebrow}>РАДИУС ЭФИРА</Text><Text style={styles.radiusValue}>{formatDistance(radius)}</Text></View>
                  <View style={styles.radiusOptions}>
                    {RADIUS_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityLabel={`Радиус эфира ${formatDistance(option)}`}
                        accessibilityState={{ selected: radius === option }}
                        onPress={() => setRadius(option)}
                        style={[styles.radiusOption, radius === option && styles.radiusOptionActive]}
                      >
                        <Text style={[styles.radiusOptionText, radius === option && styles.radiusOptionTextActive]}>{formatDistance(option)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
            <Text style={styles.mapAttribution}>КАРТА · OPENSTREETMAP</Text>
          </View>
        </View>

        <RadioSidebar
          currentSpeaker={currentSpeaker}
          error={screenError}
          isBlocked={isBlocked}
          isConnected={!connectionError}
          isInQueue={isInQueue}
          isWaiting={isWaiting}
          isRecording={isRecording}
          isWide={isWide}
          onChangeProfile={onChangeProfile}
          onPlay={playMessage}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          playingId={playingId}
          profile={profile}
          radius={radius}
          remainingTime={remainingTime}
          setRadius={setRadius}
          visibleMessages={visibleMessages}
          isCompactMobile={isCompactMobile}
        />
      </View>
    </SafeAreaView>
  );
}

function nearbyCountLabel(users, queue, userId) {
  const identities = new Set([...users, ...queue].map((user) => user.userId).filter((id) => id && id !== userId));
  const count = identities.size;
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
