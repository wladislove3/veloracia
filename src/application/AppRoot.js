import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Circle, Marker } from '../../components/MapView';
import { useLiveLocation } from '../features/location/useLiveLocation';
import { useAudioPlayback } from '../features/radio/useAudioPlayback';
import { usePushToTalk } from '../features/radio/usePushToTalk';
import { useRadioFeed } from '../features/radio/useRadioFeed';
import { useRadioQueue } from '../features/radio/useRadioQueue';
import { useGuestProfile } from '../features/profile/useGuestProfile';
import { distanceInMeters, timestampToMillis } from '../shared/domain/geo';
import { palette, radii, shadows, spacing } from '../shared/ui/tokens';

const AVATARS = ['🚴', '🧭', '🦊', '🐻', '🦉', '🐈', '🐺', '🦋'];
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

function ProfileSetup({ onSave }) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    const cleanName = nickname.trim();
    if (!cleanName) {
      setError('Введите имя для эфира.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ nickname: cleanName, avatar });
    } catch {
      setError('Не получилось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.profileScreen}>
      <View style={styles.profileCard}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
        <Text style={styles.eyebrow}>VELO · ЛОКАЛЬНЫЙ ЭФИР</Text>
        <Text style={styles.profileTitle}>Город звучит ближе.</Text>
        <Text style={styles.profileSubtitle}>Выберите имя — и слушайте голоса людей вокруг.</Text>
        <Text style={styles.inputLabel}>ВАШ ПОЗЫВНОЙ</Text>
        <TextInput
          accessibilityLabel="Ваш позывной"
          autoCapitalize="words"
          maxLength={20}
          onChangeText={(value) => { setNickname(value); setError(''); }}
          onSubmitEditing={submit}
          placeholder="Например, Лис"
          placeholderTextColor={palette.textFaint}
          returnKeyType="done"
          style={styles.nameInput}
          value={nickname}
        />
        <Text style={styles.inputLabel}>ВАШ ЗНАК</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((item) => (
            <Pressable key={item} onPress={() => setAvatar(item)} style={[styles.avatarChoice, avatar === item && styles.avatarChoiceSelected]}>
              <Text style={styles.avatarChoiceText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
        <Pressable onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          {isSaving ? <ActivityIndicator color={palette.ink} /> : <Text style={styles.primaryButtonText}>Войти в эфир <Text>↗</Text></Text>}
        </Pressable>
        <Text style={styles.privacyNote}>Без телефона и регистрации. Только ваш голос и район.</Text>
      </View>
    </SafeAreaView>
  );
}

function SetupRequired({ message, onRetry }) {
  return (
    <SafeAreaView style={styles.profileScreen}>
      <View style={styles.profileCard}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
        <Text style={styles.eyebrow}>НУЖНА НАСТРОЙКА</Text>
        <Text style={styles.profileTitle}>Почти на частоте.</Text>
        <Text style={styles.profileSubtitle}>{message}</Text>
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Попробовать снова ↗</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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

function PushToTalkControl({ isRecording, isWaiting, isBlocked, remainingTime, onPressIn, onPressOut }) {
  const lockLabel = isBlocked
    ? `Лимит · ${Math.ceil(remainingTime / 60_000)} мин`
    : isWaiting ? 'Вы в очереди · удерживайте' : 'Удерживайте, чтобы говорить';
  return (
    <View style={styles.talkArea}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Отпустите, чтобы отправить голосовое сообщение' : lockLabel}
        accessibilityState={{ disabled: isBlocked }}
        disabled={isBlocked}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onContextMenu={Platform.OS === 'web' ? (event) => event.preventDefault() : undefined}
        style={({ pressed }) => [styles.talkButton, isRecording && styles.talkButtonRecording, pressed && styles.talkButtonPressed, isBlocked && styles.talkButtonBlocked]}
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
}) {
  return (
    <View style={[styles.sidebar, isWide ? styles.sidebarWide : styles.sidebarMobile]}>
      <View style={styles.sidebarHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>ПРЯМО СЕЙЧАС</Text>
          <Text style={styles.sidebarTitle}>Голоса рядом</Text>
        </View>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{visibleMessages.length}</Text></View>
      </View>

      <View style={styles.onAirCard}>
        <View style={styles.onAirIcon}><Text style={styles.onAirIconText}>{currentSpeaker?.avatar || '◌'}</Text></View>
        <View style={styles.onAirCopy}>
          <Text style={styles.onAirEyebrow}>{currentSpeaker ? 'СЕЙЧАС ГОВОРИТ' : 'ЧАСТОТА СВОБОДНА'}</Text>
          <Text numberOfLines={1} style={styles.onAirName}>{currentSpeaker?.nickname || 'Будьте первым'}</Text>
        </View>
        <View style={[styles.onAirSignal, isInQueue && styles.onAirSignalWaiting]}><View style={styles.onAirSignalDot} /></View>
      </View>

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
      />

      <View style={styles.sidebarFooter}>
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
      </View>
    </View>
  );
}

function Dashboard({ profile, onChangeProfile }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
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
    await join().catch(() => {
      isHoldingTalkRef.current = false;
      setIsHoldingTalk(false);
      setNotice('Не удалось встать в очередь. Проверьте подключение.');
    });
  }

  async function handlePressOut() {
    isHoldingTalkRef.current = false;
    setIsHoldingTalk(false);
    if (isRecording) await stopRecording();
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
          <StatusPill tone={location ? 'live' : 'warning'}>{location ? `${nearbyCountLabel(activeUsers, nearbyQueue, profile.userId)} рядом` : 'Геопозиция выключена'}</StatusPill>
          <Pressable onPress={onChangeProfile} style={styles.headerAvatar} accessibilityRole="button" accessibilityLabel="Изменить профиль">
            <Text>{profile.avatar}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.dashboardLayout, !isWide && styles.dashboardLayoutMobile]}>
        <View style={[styles.mapPanel, !isWide && styles.mapPanelMobile]}>
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
                      <Pressable key={option} onPress={() => setRadius(option)} style={[styles.radiusOption, radius === option && styles.radiusOptionActive]}>
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

export default function AppRoot() {
  const { userId, profile, isLoading, error, restoreSession, saveProfile, clearProfile } = useGuestProfile();
  const sessionProfile = useMemo(() => profile && userId ? { ...profile, userId } : null, [profile, userId]);

  if (isLoading) {
    return <View style={styles.loadingScreen}><ActivityIndicator color={palette.lime} /><Text style={styles.loadingLabel}>Включаем радио</Text></View>;
  }
  if (error) return <SetupRequired message={error} onRetry={restoreSession} />;
  if (!sessionProfile) return <ProfileSetup onSave={saveProfile} />;
  return <Dashboard profile={sessionProfile} onChangeProfile={clearProfile} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, color: palette.text },
  topBar: { minHeight: 76, paddingHorizontal: spacing[6], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.line },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  brandMarkSmall: { width: 38, height: 38, borderRadius: 14, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' },
  brandMark: { width: 60, height: 60, borderRadius: 22, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[7] },
  brandMarkText: { color: palette.ink, fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  brandName: { color: palette.text, fontSize: 17, letterSpacing: -0.5, fontWeight: '800' },
  brandCaption: { color: palette.textFaint, fontSize: 9, letterSpacing: 1.7, marginTop: 3, fontWeight: '700' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerAvatar: { width: 40, height: 40, borderRadius: 15, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, fontSize: 20 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: palette.surfaceRaised, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusPillLive: { backgroundColor: palette.limeWash },
  statusPillWarning: { backgroundColor: palette.surfaceRaised },
  statusPillText: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  statusPillTextLive: { color: palette.lime },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.lime },
  dashboardLayout: { flex: 1, flexDirection: 'row', padding: spacing[4], gap: spacing[4], minHeight: 0 },
  dashboardLayoutMobile: { flexDirection: 'column', padding: spacing[3], gap: spacing[3] },
  mapPanel: { flex: 1, minWidth: 0, borderRadius: radii.xl, overflow: 'hidden', position: 'relative', backgroundColor: palette.mapFallback, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  mapPanelMobile: { flex: 1.08, minHeight: 270, borderRadius: radii.lg },
  map: { flex: 1, width: '100%', height: '100%' },
  mapTopOverlay: { position: 'absolute', top: spacing[5], left: spacing[5], right: spacing[5], flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  mapTitleCard: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: radii.md, backgroundColor: palette.overlay, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  mapTitleEyebrow: { color: palette.lime, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  mapTitle: { color: palette.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: palette.overlay, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  iconButtonText: { color: palette.text, fontSize: 24, fontWeight: '700' },
  locateButton: { width: 48, height: 48 },
  mapBottomOverlay: { position: 'absolute', left: spacing[5], right: spacing[5], bottom: spacing[4], alignItems: 'flex-start' },
  locationPrompt: { padding: 13, backgroundColor: palette.overlay, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 11, ...shadows.panel },
  locationPromptIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.limeWash, alignItems: 'center', justifyContent: 'center', color: palette.lime, fontSize: 21 },
  locationPromptCopy: { gap: 3 },
  locationPromptTitle: { color: palette.text, fontWeight: '800', fontSize: 12 },
  locationPromptText: { color: palette.textMuted, fontSize: 11 },
  locationPromptArrow: { color: palette.lime, fontSize: 17, fontWeight: '700', marginLeft: 8 },
  radiusCard: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: palette.overlay, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  radiusHeader: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  radiusEyebrow: { color: palette.textFaint, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  radiusValue: { color: palette.text, fontSize: 17, fontWeight: '800', marginTop: 3 },
  radiusOptions: { flexDirection: 'row', gap: 5 },
  radiusOption: { backgroundColor: palette.surfaceRaised, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 7 },
  radiusOptionActive: { backgroundColor: palette.lime },
  radiusOptionText: { fontSize: 10, fontWeight: '700', color: palette.textMuted },
  radiusOptionTextActive: { color: palette.ink },
  mapAttribution: { color: 'rgba(255,255,255,0.62)', fontSize: 8, letterSpacing: 1, marginTop: 10, marginLeft: 2 },
  sidebar: { backgroundColor: palette.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, padding: spacing[5], overflow: 'hidden' },
  sidebarWide: { width: 352, flexShrink: 0 },
  sidebarMobile: { flex: 0.92, minHeight: 260, padding: spacing[4], borderRadius: radii.lg },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] },
  sectionEyebrow: { color: palette.textFaint, fontWeight: '800', letterSpacing: 1.5, fontSize: 9, marginBottom: 6 },
  sidebarTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.7 },
  countBadge: { backgroundColor: palette.surfaceRaised, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  countBadgeText: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  onAirCard: { flexDirection: 'row', alignItems: 'center', padding: 13, backgroundColor: palette.limeWash, borderWidth: 1, borderColor: 'rgba(206,255,87,0.17)', borderRadius: radii.md, gap: 11, marginBottom: spacing[5] },
  onAirIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(206,255,87,0.12)', alignItems: 'center', justifyContent: 'center' },
  onAirIconText: { fontSize: 21, color: palette.lime },
  onAirCopy: { flex: 1 },
  onAirEyebrow: { color: palette.lime, letterSpacing: 1.05, fontSize: 8, fontWeight: '800', marginBottom: 4 },
  onAirName: { color: palette.text, fontSize: 13, fontWeight: '800' },
  onAirSignal: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(206,255,87,0.17)', alignItems: 'center', justifyContent: 'center' },
  onAirSignalWaiting: { backgroundColor: 'rgba(255,255,255,0.1)' },
  onAirSignalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.lime },
  feedHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  feedTitle: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  feedScroll: { flex: 1, minHeight: 0 },
  feedList: { gap: 8, paddingBottom: 6, flexGrow: 1 },
  messageCard: { minHeight: 62, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: palette.surfaceRaised, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  messageCardPlaying: { borderColor: 'rgba(206,255,87,0.52)', backgroundColor: palette.limeWash },
  messageAvatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderRadius: 14, fontSize: 19 },
  messageCopy: { flex: 1, minWidth: 0 },
  messageName: { color: palette.text, fontSize: 12, fontWeight: '800' },
  messageMeta: { color: palette.textFaint, fontSize: 10, marginTop: 4 },
  playButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: palette.surface, color: palette.textMuted },
  playButtonActive: { backgroundColor: palette.lime },
  playButtonText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  emptyState: { flex: 1, minHeight: 96, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyIcon: { color: palette.textFaint, fontSize: 28, marginBottom: 5 },
  emptyTitle: { color: palette.text, fontSize: 12, fontWeight: '800' },
  emptyCopy: { color: palette.textFaint, fontSize: 10, marginTop: 4, textAlign: 'center' },
  talkArea: { alignItems: 'center', paddingVertical: 13, borderTopWidth: 1, borderTopColor: palette.line, marginTop: 5 },
  talkButton: { width: 70, height: 70, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, shadowColor: palette.lime, shadowOpacity: 0.21, shadowRadius: 20, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  talkButtonRecording: { backgroundColor: palette.record, transform: [{ scale: 1.06 }] },
  talkButtonPressed: { transform: [{ scale: 0.96 }] },
  talkButtonBlocked: { backgroundColor: palette.surfaceRaised, shadowOpacity: 0 },
  talkButtonIcon: { color: palette.ink, fontSize: 27, fontWeight: '900' },
  talkTitle: { color: palette.text, fontSize: 13, fontWeight: '800', marginTop: 9 },
  talkHint: { color: palette.textFaint, fontSize: 10, marginTop: 3 },
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
  footerUser: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  footerAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center', fontSize: 17 },
  footerUserCopy: { flex: 1 },
  footerUserName: { color: palette.text, fontSize: 11, fontWeight: '800' },
  footerStatus: { color: palette.textFaint, fontSize: 9, marginTop: 3 },
  profileMenuButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  profileMenuButtonText: { color: palette.textMuted, fontSize: 21, lineHeight: 24, fontWeight: '900' },
  inlineError: { color: palette.warning, fontSize: 10, lineHeight: 14, paddingBottom: 8 },
  profileScreen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  profileCard: { width: '100%', maxWidth: 430, padding: spacing[7], borderRadius: radii.xl, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  eyebrow: { color: palette.lime, fontWeight: '800', letterSpacing: 1.7, fontSize: 10 },
  profileTitle: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1.4, marginTop: 10 },
  profileSubtitle: { color: palette.textMuted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 27 },
  inputLabel: { color: palette.textFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  nameInput: { height: 50, paddingHorizontal: 14, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceRaised, color: palette.text, marginBottom: 22, fontSize: 15 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  avatarChoice: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceRaised, borderWidth: 1, borderColor: 'transparent' },
  avatarChoiceSelected: { backgroundColor: palette.limeWash, borderColor: palette.lime },
  avatarChoiceText: { fontSize: 20 },
  primaryButton: { minHeight: 52, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, marginTop: 4 },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.1 },
  privacyNote: { color: palette.textFaint, fontSize: 10, textAlign: 'center', marginTop: 15 },
  errorText: { color: palette.warning, fontSize: 12, marginBottom: 8 },
  loadingScreen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
