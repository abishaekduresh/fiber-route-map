'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function RecenterControl({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  // Re-center on GPS position changes — preserve current user zoom
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  // Apply zoom when settings change (MapContainer ignores zoom prop after mount)
  useEffect(() => {
    map.setZoom(zoom);
  }, [zoom, map]);
  return null;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  category?: string;
  status?: string;
}

interface LeafletMapProps {
  layer: keyof typeof TILE_LAYERS;
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  showScaleBar?: boolean;
  scaleUnit?: 'metric' | 'imperial';
}

export default function LeafletMap({ layer, markers, center, zoom, showScaleBar = true, scaleUnit = 'metric' }: LeafletMapProps) {
  const tile = TILE_LAYERS[layer] ?? TILE_LAYERS.street;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      zoomControl={true}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      <RecenterControl center={center} zoom={zoom} />
      {showScaleBar && (
        <ScaleControl
          position="bottomright"
          metric={scaleUnit === 'metric' || scaleUnit === undefined}
          imperial={scaleUnit === 'imperial'}
        />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup>
            <div style={{ minWidth: 140 }}>
              <strong>{m.label}</strong>
              {m.category && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>Category: {m.category}</div>}
              {m.status && (
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                    background: m.status === 'active' ? '#d1fae5' : '#fee2e2',
                    color: m.status === 'active' ? '#065f46' : '#991b1b',
                  }}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
