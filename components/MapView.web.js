import React, { useEffect } from 'react';
import { MapContainer, Marker as LeafletMarker, Popup, TileLayer, Circle as LeafletCircle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const injectLeafletOverrides = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-overrides')) return;
  const style = document.createElement('style');
  style.id = 'leaflet-overrides';
  style.textContent = `
    .leaflet-container { z-index: 1; background: #17201c; font-family: sans-serif; }
    .leaflet-pane { z-index: 1; }
    .leaflet-top, .leaflet-bottom { z-index: 2; }
    .veloracia-marker { background: #ceff57; border: 3px solid #111713; border-radius: 50%; box-shadow: 0 0 0 5px rgba(206,255,87,.2), 0 5px 16px rgba(0,0,0,.35); color: #14190e; display: grid; font-size: 13px; font-weight: 900; height: 28px; place-items: center; width: 28px; }
    .veloracia-marker--self { background: #f4f5ee; box-shadow: 0 0 0 6px rgba(206,255,87,.24), 0 5px 16px rgba(0,0,0,.35); }
    .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #141919; color: #f2f5eb; }
    .leaflet-popup-content { margin: 10px 13px; }
    .leaflet-control-attribution { background: rgba(13,16,16,.7) !important; color: #9ca69a !important; }
    .leaflet-control-attribution a { color: #ceff57 !important; }
  `;
  document.head.appendChild(style);
};

const RegionSynchronizer = ({ region }) => {
  const map = useMap();
  useEffect(() => {
    if (!region) return;
    const zoom = Math.max(3, Math.min(17, Math.round(12 - Math.log2(region.latitudeDelta || 0.01))));
    map.setView([region.latitude, region.longitude], zoom, { animate: true });
  }, [map, region?.latitude, region?.longitude, region?.latitudeDelta]);
  return null;
};

const MapView = ({ region, style, children, onLoad, onError, ...rest }) => {
  useEffect(() => {
    injectLeafletOverrides();
  }, []);

  if (!region) return null;
  const center = [region.latitude, region.longitude];
  const zoom = Math.max(3, Math.min(17, Math.round(12 - Math.log2(region.latitudeDelta || 0.01))));

  return (
    <MapContainer center={center} zoom={zoom} style={style} {...rest} whenReady={onLoad}>
      <RegionSynchronizer region={region} />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        subdomains='abcd'
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
