import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View, useWindowDimensions } from 'react-native';
import MapView, { Circle, Marker } from '../../../../components/MapView';
import { styles } from '../radioDashboard.styles';
import RadioSidebar, { RadioStatusPill } from '../components/RadioSidebar';
import LocationMapPlaceholder from '../components/LocationMapPlaceholder';
import { useRadioDashboard } from '../hooks/useRadioDashboard';

const RADIUS_OPTIONS = [2_000, 5_000, 10_000, 20_000];

function formatDistance(radius) {
  return radius < 1_000 ? `${radius} м` : `${(radius / 1_000).toLocaleString('ru-RU')} км`;
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

function IconButton({ label, onPress, accessibilityLabel, style, disabled = false, busy = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {busy ? <ActivityIndicator color="#CEFF57" /> : <Text style={styles.iconButtonText}>{label}</Text>}
    </Pressable>
  );
}

export default function RadioDashboard({ profile, onChangeProfile }) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompactMobile = !isWide && height < 720;
  const [radius, setRadius] = useState(10_000);
  const radio = useRadioDashboard(profile, radius);
  const {
    location, isLocationLoading, requestLocation, mapRegion, nearbyQueue, activeUsers, visibleMessages,
    currentSpeaker, isInQueue, isWaiting, isRecording, isBlocked, remainingTime, recordingElapsed,
    playingId, playMessage, handlePressIn, handlePressOut, screenError, isConnected,
  } = radio;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMarkSmall}><Text style={styles.brandMarkText}>V</Text></View>
          <View><Text style={styles.brandName}>veloracia</Text><Text style={styles.brandCaption}>ГОРОДСКОЕ РАДИО</Text></View>
        </View>
        <View style={styles.topBarRight}>
          {width >= 520 ? <RadioStatusPill tone={location ? 'live' : 'warning'}>
            {location ? `${nearbyCountLabel(activeUsers, nearbyQueue, profile.userId)} рядом` : 'Геопозиция выключена'}
          </RadioStatusPill> : null}
          <Pressable onPress={onChangeProfile} style={styles.headerAvatar} accessibilityRole="button" accessibilityLabel="Изменить профиль">
            <Text>{profile.avatar}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.dashboardLayout, !isWide && styles.dashboardLayoutMobile, isCompactMobile && styles.dashboardLayoutCompact]}>
        <View style={[styles.mapPanel, !isWide && styles.mapPanelMobile, isCompactMobile && styles.mapPanelCompact]}>
          {location ? (
            <MapView style={styles.map} region={mapRegion} showsUserLocation={false} showsCompass={false}>
              <Circle center={location} radius={radius} fillColor="rgba(206,255,87,0.08)" strokeColor="rgba(206,255,87,0.62)" strokeWidth={1} />
              <Marker coordinate={location} title="Вы" description="Вы здесь" />
              {nearbyQueue.map((user) => (
                <Marker key={`queue-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'В эфире'} description={user.nickname || 'Слушает радио рядом'} />
              ))}
              {activeUsers.filter((user) => user.userId !== profile.userId && !nearbyQueue.some((queued) => queued.userId === user.userId)).map((user) => (
                <Marker key={`active-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'Рядом'} description={user.nickname || 'Недавно был в эфире'} />
              ))}
            </MapView>
          ) : <LocationMapPlaceholder />}

          <View style={styles.mapTopOverlay} pointerEvents="box-none">
            <View style={styles.mapTitleCard}>
              <Text style={styles.mapTitleEyebrow}>ВАШ РАЙОН</Text>
              <Text style={styles.mapTitle}>{location ? 'Эфир поблизости' : isLocationLoading ? 'Находим ваш район…' : 'Найдите свой эфир'}</Text>
            </View>
            <IconButton
              label="◎"
              accessibilityLabel={isLocationLoading ? 'Определяем геопозицию' : 'Обновить геопозицию'}
              onPress={requestLocation}
              style={styles.locateButton}
              disabled={isLocationLoading}
              busy={isLocationLoading}
            />
          </View>

          <View style={styles.mapBottomOverlay} pointerEvents="box-none">
            {!location ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isLocationLoading, busy: isLocationLoading }}
                disabled={isLocationLoading}
                onPress={requestLocation}
                style={({ pressed }) => [styles.locationPrompt, pressed && styles.pressed, isLocationLoading && styles.disabled]}
              >
                <View style={styles.locationPromptIcon}><Text>⌖</Text></View>
                <View style={styles.locationPromptCopy}>
                  <Text style={styles.locationPromptTitle}>{isLocationLoading ? 'Ищем вас на карте' : 'Включите геопозицию'}</Text>
                  <Text style={styles.locationPromptText}>{isLocationLoading ? 'Это займёт пару секунд' : 'Чтобы услышать людей поблизости'}</Text>
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
          isConnected={isConnected}
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
          recordingElapsed={recordingElapsed}
          visibleMessages={visibleMessages}
          isCompactMobile={isCompactMobile}
        />
      </View>
    </SafeAreaView>
  );
}
