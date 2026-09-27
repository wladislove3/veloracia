import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, View, useWindowDimensions } from 'react-native';
import RadioDashboardHeader from '../components/RadioDashboardHeader';
import RadioMapPanel from '../components/RadioMapPanel';
import RadioSidebar from '../components/RadioSidebar';
import { DEFAULT_RADIO_RADIUS_METERS } from '../domain/radioPolicy';
import { formatNearbyRiderCount } from '../presentation/formatters';
import { useRadioDashboard } from '../hooks/useRadioDashboard';
import { styles } from '../radioDashboard.styles';

function getNearbyStatus(activeUsers, queue, userId) {
  const identities = new Set([...activeUsers, ...queue].map((user) => user.userId).filter((id) => id && id !== userId));
  return formatNearbyRiderCount(identities.size);
}

export default function RadioDashboard({ profile, onChangeProfile }) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompactMobile = !isWide && height < 720;
  const [radius, setRadius] = useState(DEFAULT_RADIO_RADIUS_METERS);
  const [mapViewport, setMapViewport] = useState(null);
  const radio = useRadioDashboard(profile, radius);
  const mapRegion = useMemo(() => {
    return mapViewport || radio.mapRegion;
  }, [mapViewport, radio.mapRegion]);
  const zoomMap = useCallback((factor) => {
    setMapViewport((current) => {
      const region = current || radio.mapRegion;
      const scale = (value) => Math.max(0.002, Math.min(90, value * factor));
      return { ...region, latitudeDelta: scale(region.latitudeDelta), longitudeDelta: scale(region.longitudeDelta) };
    });
  }, [radio.mapRegion]);
  const handleMapRegionChange = useCallback((region) => {
    if (!Number.isFinite(region?.latitude) || !Number.isFinite(region?.longitude)
      || !Number.isFinite(region?.latitudeDelta) || !Number.isFinite(region?.longitudeDelta)) return;
    setMapViewport(region);
  }, []);
  const locateOnMap = useCallback(async () => {
    setMapViewport(null);
    await radio.requestLocation();
  }, [radio.requestLocation]);
  const statusLabel = !radio.isFeedConnected
    ? 'Нет связи с эфиром'
    : radio.locationError
      ? 'Нет обновления геопозиции'
      : radio.location
        ? `${getNearbyStatus(radio.activeUsers, radio.nearbyQueue, profile.userId)} рядом`
        : 'Геопозиция выключена';

  return (
    <SafeAreaView style={styles.screen}>
      <RadioDashboardHeader
        profile={profile}
        onChangeProfile={onChangeProfile}
        statusLabel={statusLabel}
        statusTone={radio.isFeedConnected && radio.location && !radio.locationError ? 'live' : 'warning'}
        showStatus={width >= 520}
      />
      <View style={[styles.layout, !isWide && styles.layoutMobile, isCompactMobile && styles.layoutCompact]}>
        <RadioMapPanel
          location={radio.location}
          isLoading={radio.isLocationLoading}
          requestLocation={locateOnMap}
          mapRegion={mapRegion}
          onRegionChangeComplete={handleMapRegionChange}
          zoomIn={() => zoomMap(0.5)}
          zoomOut={() => zoomMap(2)}
          canZoomIn={mapRegion.latitudeDelta > 0.0021 && mapRegion.longitudeDelta > 0.0021}
          canZoomOut={mapRegion.latitudeDelta < 89 && mapRegion.longitudeDelta < 89}
          nearbyQueue={radio.nearbyQueue}
          activeUsers={radio.activeUsers}
          userId={profile.userId}
          radius={radius}
          onRadiusChange={setRadius}
          isWide={isWide}
          isCompactMobile={isCompactMobile}
        />
        <RadioSidebar
          currentSpeaker={radio.currentSpeaker}
          error={radio.screenError}
          isBlocked={radio.isBlocked}
          isFeedConnected={radio.isFeedConnected}
          isInQueue={radio.isInQueue}
          isWaiting={radio.isWaiting}
          queuePosition={radio.queuePosition}
          isLocationReady={Boolean(radio.location && !radio.locationError)}
          isRecording={radio.isRecording}
          isWide={isWide}
          onChangeProfile={onChangeProfile}
          onPlay={radio.playMessage}
          onPressIn={radio.handlePressIn}
          onPressOut={radio.handlePressOut}
          playingId={radio.playingId}
          profile={profile}
          radius={radius}
          remainingTime={radio.remainingTime}
          recordingElapsed={radio.recordingElapsed}
          visibleMessages={radio.visibleMessages}
          isCompactMobile={isCompactMobile}
        />
      </View>
    </SafeAreaView>
  );
}
