'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ScaleControl } from 'react-leaflet';
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

export interface UserLocation {
  position: [number, number];
  heading: number | null;
  accuracy: number;
}

function UserLocationMarker({ location }: { location: UserLocation }) {
  const { position, heading, accuracy } = location;

  // Inject pulse keyframe once into the document head
  useEffect(() => {
    if (document.getElementById('ulm-style')) return;
    const s = document.createElement('style');
    s.id = 'ulm-style';
    s.textContent = `
      @keyframes ulmPulse {
        0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
        100% { transform: translate(-50%,-50%) scale(3);  opacity: 0;   }
      }
    `;
    document.head.appendChild(s);
  }, []);

  const icon = L.divIcon({
    className: '',
    iconSize:   [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="position:relative;width:0;height:0;pointer-events:none;">
        <!-- Direction cone + blue dot -->
        <div style="
          position:absolute;
          transform:translate(-50%,-50%) rotate(${heading ?? 0}deg);
          width:56px;height:56px;
        ">
          <svg width="56" height="56" viewBox="-28 -28 56 56" xmlns="http://www.w3.org/2000/svg">
            ${heading !== null ? `
              <defs>
                <radialGradient id="ulmConeGrad" cx="50%" cy="100%" r="110%">
                  <stop offset="0%"   stop-color="rgba(59,130,246,0.55)"/>
                  <stop offset="100%" stop-color="rgba(59,130,246,0)"/>
                </radialGradient>
              </defs>
              <path d="M0,0 L-11,-26 A28 28 0 0 1 11,-26 Z" fill="url(#ulmConeGrad)"/>
            ` : ''}
            <circle cx="0" cy="0" r="12"  fill="rgba(255,255,255,0.92)"/>
            <circle cx="0" cy="0" r="8.5" fill="#3b82f6"/>
            <circle cx="0" cy="0" r="12"  fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.2"/>
          </svg>
        </div>
        <!-- Pulsing ring -->
        <div style="
          position:absolute;
          width:18px;height:18px;
          border-radius:50%;
          border:2px solid rgba(59,130,246,0.6);
          animation:ulmPulse 2s ease-out infinite;
        "></div>
      </div>
    `,
  });

  return (
    <>
      {accuracy > 0 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.07, weight: 1, opacity: 0.25 }}
        />
      )}
      <Marker position={position} icon={icon} zIndexOffset={1000} />
    </>
  );
}

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
  userLocation?: UserLocation;
}

export default function LeafletMap({ layer, markers, center, zoom, showScaleBar = true, scaleUnit = 'metric', userLocation }: LeafletMapProps) {
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
      {userLocation && <UserLocationMarker location={userLocation} />}
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
