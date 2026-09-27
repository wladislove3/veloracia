import React from 'react';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { timestampToMillis } from '../../../shared/domain/geo';
import { styles } from '../radioDashboard.styles';

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

export function RadioStatusPill({ children, tone }) {
  return <StatusPill tone={tone}>{children}</StatusPill>;
}

export default function RadioSidebar({
  isWide, profile, visibleMessages, currentSpeaker, isInQueue, isWaiting, isRecording, isBlocked,
  remainingTime, playingId, onPlay, onPressIn, onPressOut, radius, onChangeProfile,
  isConnected, error, isCompactMobile,
}) {
  return (
    <View style={[styles.sidebar, isWide ? styles.sidebarWide : styles.sidebarMobile, isCompactMobile && styles.sidebarCompact]}>
      {isWide ? (
        <View style={styles.sidebarHeader}>
          <View><Text style={styles.sectionEyebrow}>ПРЯМО СЕЙЧАС</Text><Text style={styles.sidebarTitle}>Голоса рядом</Text></View>
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

      <View style={styles.feedHeading}><Text style={styles.feedTitle}>Недавние сообщения</Text><StatusPill>{formatDistance(radius)}</StatusPill></View>
      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VoiceMessage message={item} isPlaying={playingId === item.id} onPlay={onPlay} />}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>⌁</Text><Text style={styles.emptyTitle}>Пока тихо</Text><Text style={styles.emptyCopy}>Первый голос рядом может быть вашим.</Text></View>}
        style={styles.feedScroll}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />
      {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
      <PushToTalkControl
        isBlocked={isBlocked} isRecording={isRecording} isWaiting={isWaiting}
        onPressIn={onPressIn} onPressOut={onPressOut} remainingTime={remainingTime} compact={isCompactMobile}
      />

      {isWide ? <View style={styles.sidebarFooter}>
        <View style={styles.footerUser}>
          <View style={styles.footerAvatar}><Text>{profile.avatar}</Text></View>
          <View style={styles.footerUserCopy}><Text numberOfLines={1} style={styles.footerUserName}>{profile.nickname}</Text><Text style={styles.footerStatus}>{isConnected ? 'На связи' : 'Нет подключения'}</Text></View>
        </View>
        <Pressable onPress={onChangeProfile} accessibilityRole="button" accessibilityLabel="Сменить профиль" style={styles.profileMenuButton}>
          <Text style={styles.profileMenuButtonText}>···</Text>
        </Pressable>
      </View> : null}
    </View>
  );
}
