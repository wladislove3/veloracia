import React, { useEffect } from 'react';
import { MapContainer, Marker as LeafletMarker, Popup, TileLayer, Circle as LeafletCircle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapView.web.css';

const WEB_MERCATOR_LIMIT = 85.05112878;
const TILE_SIZE = 256;

function mercatorLatitude(latitude) {
  const clamped = Math.max(-WEB_MERCATOR_LIMIT, Math.min(WEB_MERCATOR_LIMIT, latitude));
  const radians = (clamped * Math.PI) / 180;
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function calculateZoom(region, size) {
  if (!size.x || !size.y) return 11;
  const north = region.latitude + region.latitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;
  const projectedLatitudeDelta = Math.max(mercatorLatitude(north) - mercatorLatitude(south), 0.001);
  const longitudeDelta = Math.max(region.longitudeDelta || region.latitudeDelta, 0.001);
  const horizontalZoom = Math.log2((360 * size.x) / (TILE_SIZE * longitudeDelta));
  const verticalZoom = Math.log2((360 * size.y) / (TILE_SIZE * projectedLatitudeDelta));
  return Math.max(3, Math.min(18, Math.floor(Math.min(horizontalZoom, verticalZoom) - 0.15)));
}

const RegionSynchronizer = ({ region, onRegionChangeComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (!region) return;
    const regionIsVisible = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      return Math.abs(center.lat - region.latitude) < 0.00001
        && Math.abs(center.lng - region.longitude) < 0.00001
        && Math.abs((bounds.getNorth() - bounds.getSouth()) - region.latitudeDelta) < 0.0001
        && Math.abs((bounds.getEast() - bounds.getWest()) - region.longitudeDelta) < 0.0001;
    };
    const fitRegion = () => {
      if (regionIsVisible()) return;
      const zoom = calculateZoom(region, map.getSize());
      map.setView([region.latitude, region.longitude], zoom, { animate: true });
    };
    const reportRegion = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      onRegionChangeComplete?.({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: Math.max(bounds.getNorth() - bounds.getSouth(), 0.001),
        longitudeDelta: Math.max(bounds.getEast() - bounds.getWest(), 0.001),
      });
    };
    fitRegion();
    map.on('resize', fitRegion);
    map.on('moveend', reportRegion);
    return () => {
      map.off('resize', fitRegion);
      map.off('moveend', reportRegion);
    };
  }, [map, onRegionChangeComplete, region?.latitude, region?.longitude, region?.latitudeDelta, region?.longitudeDelta]);
  return null;
};

const MapView = ({ region, style, children, onLoad, onRegionChangeComplete, zoomControl = false, showsUserLocation, showsCompass, ...rest }) => {
  if (!region) return null;
  const center = [region.latitude, region.longitude];

  return (
    <MapContainer center={center} zoom={11} style={style} zoomControl={zoomControl} {...rest} whenReady={onLoad}>
      <RegionSynchronizer region={region} onRegionChangeComplete={onRegionChangeComplete} />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        subdomains='abcd'
        errorTileUrl=''
      />
      {children}
    </MapContainer>
  );
};

const Marker = ({ coordinate, title, description, onPress }) => {
  if (!coordinate) return null;
  const position = [coordinate.latitude, coordinate.longitude];
  const label = Array.from(String(title || '•').trim())[0]?.toUpperCase() || '•';
  const icon = L.divIcon({
    className: 'veloracia-marker-wrap',
    html: `<div class="veloracia-marker${title === 'Вы' ? ' veloracia-marker--self' : ''}">${label.replace(/[&<>"']/g, '')}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
  return (
    <LeafletMarker position={position} icon={icon} eventHandlers={{ click: () => onPress?.() }}>
      {(title || description) && (
        <Popup>
          <div style={{ fontWeight: 600 }}>{title}</div>
          {description && <div>{description}</div>}
        </Popup>
      )}
    </LeafletMarker>
  );
};

const Circle = ({ center, radius, strokeColor, fillColor }) => {
  if (!center) return null;
  return (
    <LeafletCircle
      center={[center.latitude, center.longitude]}
      radius={radius}
      pathOptions={{ color: strokeColor || '#0B6E6A', fillColor: fillColor || 'rgba(11,110,106,0.14)' }}
    />
  );
};

export { Circle, Marker };
export default MapView;
