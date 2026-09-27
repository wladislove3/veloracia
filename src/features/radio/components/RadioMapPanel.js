import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Circle, Marker } from '../../location/components/MapView';
import { palette } from '../../../shared/ui/tokens';
import { RADIO_RADIUS_OPTIONS_METERS } from '../domain/radioPolicy';
import { formatDistanceInMeters } from '../presentation/formatters';
import LocationMapPlaceholder from './LocationMapPlaceholder';
import { mapPanelStyles as styles } from './radioMapPanel.styles';

function LocateButton({ isLoading, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLoading ? 'Определяем геопозицию' : 'Обновить геопозицию'}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, styles.locateButton, pressed && styles.pressed, isLoading && styles.disabled]}
    >
      {isLoading ? <ActivityIndicator color={palette.lime} /> : <Text style={styles.iconButtonText}>◎</Text>}
    </Pressable>
  );
}

function LocationPrompt({ isLoading, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [styles.locationPrompt, pressed && styles.pressed, isLoading && styles.disabled]}
    >
      <View style={styles.locationPromptIcon}><Text>⌖</Text></View>
      <View style={styles.locationPromptCopy}>
        <Text style={styles.locationPromptTitle}>{isLoading ? 'Ищем вас на карте' : 'Включите геопозицию'}</Text>
        <Text style={styles.locationPromptText}>{isLoading ? 'Это займёт пару секунд' : 'Чтобы услышать людей поблизости'}</Text>
      </View>
      <Text style={styles.locationPromptArrow}>↗</Text>
    </Pressable>
  );
}

function RadiusPicker({ radius, onRadiusChange }) {
  return (
    <View style={styles.radiusCard}>
      <View style={styles.radiusHeader}>
        <View><Text style={styles.radiusEyebrow}>РАДИУС ЭФИРА</Text><Text style={styles.radiusValue}>{formatDistanceInMeters(radius)}</Text></View>
        <View style={styles.radiusOptions}>
          {RADIO_RADIUS_OPTIONS_METERS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Радиус эфира ${formatDistanceInMeters(option)}`}
              accessibilityState={{ selected: radius === option }}
              onPress={() => onRadiusChange(option)}
              style={[styles.radiusOption, radius === option && styles.radiusOptionActive]}
            >
              <Text style={[styles.radiusOptionText, radius === option && styles.radiusOptionTextActive]}>{formatDistanceInMeters(option)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function RadioMapPanel({
  location,
  isLoading,
  requestLocation,
  mapRegion,
  nearbyQueue,
  activeUsers,
  userId,
  radius,
  onRadiusChange,
  isWide,
  isCompactMobile,
}) {
  const queuedUserIds = useMemo(() => new Set(nearbyQueue.map((user) => user.userId)), [nearbyQueue]);
  const activeUsersNotQueued = useMemo(
    () => activeUsers.filter((user) => user.userId !== userId && !queuedUserIds.has(user.userId)),
    [activeUsers, queuedUserIds, userId],
  );

  return (
    <View style={[styles.panel, !isWide && styles.panelMobile, isCompactMobile && styles.panelCompact]}>
      {location ? (
        <MapView style={styles.map} region={mapRegion} showsUserLocation={false} showsCompass={false}>
          <Circle center={location} radius={radius} fillColor="rgba(206,255,87,0.08)" strokeColor="rgba(206,255,87,0.62)" strokeWidth={1} />
          <Marker coordinate={location} title="Вы" description="Вы здесь" />
          {nearbyQueue.map((user) => (
            <Marker key={`queue-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'В эфире'} description={user.nickname || 'Слушает радио рядом'} />
          ))}
          {activeUsersNotQueued.map((user) => (
            <Marker key={`active-${user.userId}`} coordinate={user.location} title={user.avatar || user.nickname || 'Рядом'} description={user.nickname || 'Недавно был в эфире'} />
          ))}
        </MapView>
      ) : <LocationMapPlaceholder />}

      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.titleCard}>
          <Text style={styles.titleEyebrow}>ВАШ РАЙОН</Text>
          <Text style={styles.title}>{location ? 'Эфир поблизости' : isLoading ? 'Находим ваш район…' : 'Найдите свой эфир'}</Text>
        </View>
        <LocateButton isLoading={isLoading} onPress={requestLocation} />
      </View>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {location
          ? <RadiusPicker radius={radius} onRadiusChange={onRadiusChange} />
          : <LocationPrompt isLoading={isLoading} onPress={requestLocation} />}
        <Text style={styles.attribution}>КАРТА · OPENSTREETMAP</Text>
      </View>
    </View>
  );
}
