'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, useMap, useMapEvents, ScaleControl } from 'react-leaflet';
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

function CompassControl() {
  const map = useMap();

  useEffect(() => {
    const Compass = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const div = L.DomUtil.create('div');
        div.style.cssText = 'margin-top:8px;cursor:default;';
        div.innerHTML = `
          <div style="
            width:76px;height:76px;border-radius:50%;
            background:rgba(15,23,42,0.88);
            border:1px solid rgba(255,255,255,0.12);
            box-shadow:0 4px 20px rgba(0,0,0,0.45);
            display:flex;align-items:center;justify-content:center;
            backdrop-filter:blur(8px);
          ">
            <svg width="72" height="72" viewBox="-36 -36 72 72" xmlns="http://www.w3.org/2000/svg">
              <!-- Dial ring -->
              <circle cx="0" cy="0" r="34" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
              <!-- Diagonal ticks: NE SE SW NW -->
              <line x1="22.6" y1="-22.6" x2="25.5" y2="-25.5" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-linecap="round"/>
              <line x1="22.6" y1="22.6"  x2="25.5" y2="25.5"  stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-linecap="round"/>
              <line x1="-22.6" y1="22.6" x2="-25.5" y2="25.5" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-linecap="round"/>
              <line x1="-22.6" y1="-22.6" x2="-25.5" y2="-25.5" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-linecap="round"/>
              <!-- Cardinal ticks -->
              <line x1="0"   y1="-34" x2="0"   y2="-29" stroke="rgba(239,68,68,0.9)"  stroke-width="1.5" stroke-linecap="round"/>
              <line x1="34"  y1="0"   x2="29"  y2="0"   stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="0"   y1="34"  x2="0"   y2="29"  stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="-34" y1="0"   x2="-29" y2="0"   stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-linecap="round"/>
              <!-- Needle: north red, south slate -->
              <polygon points="0,-17 -5,0 0,4.5 5,0"  fill="#ef4444"/>
              <polygon points="0,17  -5,0 0,-4.5 5,0" fill="#475569"/>
              <!-- Centre cap -->
              <circle cx="0" cy="0" r="4" fill="#0f172a" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/>
              <!-- Cardinal labels -->
              <text x="0"   y="-22" text-anchor="middle" dy="0.35em" fill="#ef4444" font-weight="800" font-size="11" font-family="system-ui,sans-serif">N</text>
              <text x="22"  y="0"   text-anchor="middle" dy="0.35em" fill="#94a3b8" font-weight="700" font-size="9"  font-family="system-ui,sans-serif">E</text>
              <text x="0"   y="22"  text-anchor="middle" dy="0.35em" fill="#94a3b8" font-weight="700" font-size="9"  font-family="system-ui,sans-serif">S</text>
              <text x="-22" y="0"   text-anchor="middle" dy="0.35em" fill="#94a3b8" font-weight="700" font-size="9"  font-family="system-ui,sans-serif">W</text>
            </svg>
          </div>
        `;
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      },
    });
    const ctrl = new Compass();
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);

  return null;
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

export interface RoutePolyline {
  id: string;
  points: [number, number][];
  color: string;
  label: string;
  thickness: number;
}

function DrawLayer({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    return () => { map.getContainer().style.cursor = ''; };
  }, [map]);
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function DrawOverlay({ points }: { points: [number, number][] }) {
  if (points.length === 0) return null;
  return (
    <>
      {points.length > 1 && (
        <Polyline positions={points} pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '6 4', opacity: 0.9 }} />
      )}
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={pt}
          radius={i === 0 ? 7 : i === points.length - 1 ? 7 : 5}
          pathOptions={{
            color: i === 0 ? '#10b981' : i === points.length - 1 ? '#ef4444' : '#f59e0b',
            fillColor: i === 0 ? '#10b981' : i === points.length - 1 ? '#ef4444' : '#f59e0b',
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}

interface LeafletMapProps {
  layer: keyof typeof TILE_LAYERS;
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  showScaleBar?: boolean;
  scaleUnit?: 'metric' | 'imperial';
  userLocation?: UserLocation;
  drawMode?: boolean;
  drawPoints?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  routes?: RoutePolyline[];
}

export default function LeafletMap({ layer, markers, center, zoom, showScaleBar = true, scaleUnit = 'metric', userLocation, drawMode, drawPoints = [], onMapClick, routes = [] }: LeafletMapProps) {
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
      <CompassControl />
      {userLocation && <UserLocationMarker location={userLocation} />}
      {showScaleBar && (
        <ScaleControl
          position="bottomright"
          metric={scaleUnit === 'metric' || scaleUnit === undefined}
          imperial={scaleUnit === 'imperial'}
        />
      )}
      {/* Existing routes */}
      {routes.filter((r) => r.points.length > 1).map((r) => (
        <Polyline
          key={r.id}
          positions={r.points}
          pathOptions={{ color: r.color || '#3b82f6', weight: r.thickness || 3, opacity: 0.85 }}
        >
          <Popup>
            <strong>{r.label}</strong>
          </Popup>
        </Polyline>
      ))}
      {/* Draw mode */}
      {drawMode && onMapClick && <DrawLayer onMapClick={onMapClick} />}
      {drawMode && <DrawOverlay points={drawPoints} />}
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
