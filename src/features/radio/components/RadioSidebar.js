import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { sidebarStyles as styles } from './radioSidebar.styles';
import { formatDistanceInMeters } from '../presentation/formatters';
import RadioStatusPill from './RadioStatusPill';
import VoiceMessageCard from './VoiceMessageCard';
import PushToTalkControl from './PushToTalkControl';

export default function RadioSidebar({
  isWide, profile, visibleMessages, currentSpeaker, isInQueue, isWaiting, queuePosition, isRecording, isBlocked, isLocationReady,
  remainingTime, recordingElapsed, playingId, onPlay, onPressIn, onPressOut, radius, onChangeProfile,
  isFeedConnected, error, isCompactMobile,
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

      <View style={styles.feedHeading}><Text style={styles.feedTitle}>Недавние сообщения</Text><RadioStatusPill>{formatDistanceInMeters(radius)}</RadioStatusPill></View>
      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VoiceMessageCard message={item} isPlaying={playingId === item.id} onPlay={onPlay} />}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>⌁</Text><Text style={styles.emptyTitle}>Пока тихо</Text><Text style={styles.emptyCopy}>Первый голос рядом может быть вашим.</Text></View>}
        style={styles.feedScroll}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />
      {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
      <PushToTalkControl
        isBlocked={isBlocked} isLocationReady={isLocationReady} isRecording={isRecording} isWaiting={isWaiting}
        queuePosition={queuePosition}
        onPressIn={onPressIn} onPressOut={onPressOut} remainingTime={remainingTime}
        recordingElapsed={recordingElapsed} compact={isCompactMobile}
      />

      {isWide ? <View style={styles.sidebarFooter}>
        <View style={styles.footerUser}>
          <View style={styles.footerAvatar}><Text>{profile.avatar}</Text></View>
          <View style={styles.footerUserCopy}><Text numberOfLines={1} style={styles.footerUserName}>{profile.nickname}</Text><Text style={styles.footerStatus}>{isFeedConnected ? 'Эфир на связи' : 'Нет связи с эфиром'}</Text></View>
        </View>
        <Pressable onPress={onChangeProfile} accessibilityRole="button" accessibilityLabel="Сменить профиль" style={styles.profileMenuButton}>
          <Text style={styles.profileMenuButtonText}>···</Text>
        </Pressable>
      </View> : null}
    </View>
  );
}
