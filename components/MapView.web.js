import React, { useEffect } from 'react';
import { MapContainer, Marker as LeafletMarker, Popup, TileLayer, Circle as LeafletCircle } from 'react-leaflet';
import L from 'leaflet';

const injectLeafletStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
};

const injectLeafletOverrides = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-overrides')) return;
  const style = document.createElement('style');
  style.id = 'leaflet-overrides';
  style.textContent = `
    .leaflet-container { z-index: 1; }
    .leaflet-pane { z-index: 1; }
    .leaflet-top, .leaflet-bottom { z-index: 2; }
  `;
  document.head.appendChild(style);
};

const ensureLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

const MapView = ({ region, style, children, onLoad, onError, ...rest }) => {
  useEffect(() => {
    injectLeafletStyles();
    injectLeafletOverrides();
    ensureLeafletIcons();
  }, [onLoad]);

  if (!region) return null;
  const center = [region.latitude, region.longitude];
  const zoom = Math.max(1, Math.round(12 - Math.log2(region.latitudeDelta || 0.01)));

  return (
    <MapContainer center={center} zoom={zoom} style={style} {...rest} whenReady={onLoad}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        errorTileUrl=''
        eventHandlers={{
          tileerror: (event) => {
            console.warn('Tile load error', event?.error);
          },
        }}
      />
      {children}
    </MapContainer>
  );
};

const Marker = ({ coordinate, title, description, onPress }) => {
  if (!coordinate) return null;
  const position = [coordinate.latitude, coordinate.longitude];
  return (
    <LeafletMarker position={position} eventHandlers={{ click: () => onPress?.() }}>
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
