'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, CircleMarker, Polyline, useMap, useMapEvents, ScaleControl } from 'react-leaflet';
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

export interface RoutePointWidget {
  lat: number;
  lng: number;
  pointType: string;
  sequenceNumber: number;
  widgetIconType?: 'svg' | 'png' | 'webp' | null;
  widgetSvg?: string | null;
  widgetIconUrl?: string | null;
  widgetWidth?: number | null;
  widgetHeight?: number | null;
  widgetName?: string | null;
  deviceTypeName?: string | null;
  pointName?: string | null;
  pointDescription?: string | null;
}

export interface RoutePolyline {
  id: string;
  points: [number, number][];
  color: string;
  label: string;
  thickness: number;
  routePoints: RoutePointWidget[];
  // 360 detail fields
  code: string;
  type: string;
  description: string | null;
  status: string;
  parentRouteName: string | null;
  pointsCount: number;
  createdAt: string;
  updatedAt: string;
}

const ROUTE_TYPE_LABELS: Record<string, string> = {
  fiber_route:       'Fiber Route',
  coaxial_route:     'Coaxial Route',
  backbone_route:    'Backbone Route',
  distribution_route:'Distribution Route',
  drop_route:        'Drop Route',
  underground_duct:  'Underground Duct',
  pole_to_pole:      'Pole to Pole',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:      { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  inactive:    { bg: 'rgba(100,116,139,0.12)', text: '#64748b' },
  maintenance: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function RoutePopup({ r, onEdit }: { r: RoutePolyline; onEdit?: () => void }) {
  const statusStyle = STATUS_COLORS[r.status] ?? STATUS_COLORS.inactive;
  return (
    <div style={{ minWidth: 240, maxWidth: 300, fontFamily: 'system-ui,sans-serif', fontSize: '0.8rem', lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block', boxShadow: `0 0 0 2px ${r.color}33` }} />
        <code style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.03em' }}>
          {r.code}
        </code>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: statusStyle.bg, color: statusStyle.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {r.status}
        </span>
      </div>
      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {r.label}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: '0.5rem' }} />

      {/* Key-value rows */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
        <tbody>
          <tr>
            <td style={{ color: '#64748b', paddingBottom: '0.2rem', paddingRight: '0.75rem', whiteSpace: 'nowrap' }}>Type</td>
            <td style={{ fontWeight: 600, paddingBottom: '0.2rem' }}>{ROUTE_TYPE_LABELS[r.type] ?? r.type}</td>
          </tr>
          <tr>
            <td style={{ color: '#64748b', paddingBottom: '0.2rem', paddingRight: '0.75rem' }}>Thickness</td>
            <td style={{ fontWeight: 600, paddingBottom: '0.2rem' }}>{r.thickness ?? 2}px</td>
          </tr>
          <tr>
            <td style={{ color: '#64748b', paddingBottom: '0.2rem', paddingRight: '0.75rem' }}>Points</td>
            <td style={{ fontWeight: 600, paddingBottom: '0.2rem' }}>{r.pointsCount}</td>
          </tr>
          {r.parentRouteName && (
            <tr>
              <td style={{ color: '#64748b', paddingBottom: '0.2rem', paddingRight: '0.75rem' }}>Parent</td>
              <td style={{ fontWeight: 600, paddingBottom: '0.2rem' }}>{r.parentRouteName}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Description */}
      {r.description && (
        <>
          <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
          <p style={{ margin: 0, color: '#475569', fontSize: '0.75rem', lineHeight: 1.55 }}>{r.description}</p>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
        <div>
          <div>Created {fmtDate(r.createdAt)}</div>
          <div>Updated {fmtDate(r.updatedAt)}</div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, color: '#3b82f6', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function fitSvgForMap(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

function PointTooltipContent({ p }: { p: RoutePointWidget }) {
  const title = p.pointName || p.widgetName || p.deviceTypeName || null;
  return (
    <div style={{ minWidth: 120, maxWidth: 220, fontFamily: 'system-ui,sans-serif' }}>
      {title && <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{title}</div>}
      {p.deviceTypeName && p.deviceTypeName !== title && (
        <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginBottom: 2 }}>{p.deviceTypeName}</div>
      )}
      {p.pointDescription && (
        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 3, lineHeight: 1.4 }}>{p.pointDescription}</div>
      )}
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>
        {p.pointType} · pt {p.sequenceNumber}
      </div>
    </div>
  );
}

function RouteWidgetMarkers({ routePoints }: { routePoints: RoutePointWidget[] }) {
  const visible = routePoints.filter(
    (p) => p.widgetIconType || p.pointName || p.pointDescription || p.deviceTypeName,
  );
  if (visible.length === 0) return null;
  return (
    <>
      {visible.map((p, i) => {
        if (p.widgetIconType) {
          const size = Math.min(Math.max(p.widgetWidth || 32, 16), 48);
          const html =
            p.widgetIconType === 'svg'
              ? `<div style="width:${size}px;height:${size}px;overflow:hidden;display:flex;align-items:center;justify-content:center;">${fitSvgForMap(p.widgetSvg || '')}</div>`
              : `<img src="${p.widgetIconUrl}" style="width:${size}px;height:${size}px;object-fit:contain;" alt="" />`;
          const icon = L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
          return (
            <Marker key={`rp-${i}`} position={[p.lat, p.lng]} icon={icon} zIndexOffset={600}>
              <Tooltip direction="top" offset={[0, -(size / 2 + 4)]} opacity={1}>
                <PointTooltipContent p={p} />
              </Tooltip>
            </Marker>
          );
        }
        // No icon — render a small dot marker so hover tooltip still works
        const dotIcon = L.divIcon({
          className: '',
          html: `<div style="width:8px;height:8px;border-radius:50%;background:rgba(100,116,139,0.6);border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize:   [8, 8],
          iconAnchor: [4, 4],
        });
        return (
          <Marker key={`rp-${i}`} position={[p.lat, p.lng]} icon={dotIcon} zIndexOffset={400}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <PointTooltipContent p={p} />
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

function EditLayer({
  points, color, thickness, onMapClick, onPointMove, onInsertPoint,
}: {
  points: [number, number][];
  color: string;
  thickness: number;
  onMapClick: (lat: number, lng: number) => void;
  onPointMove: (idx: number, lat: number, lng: number) => void;
  onInsertPoint: (afterIdx: number, lat: number, lng: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    return () => { map.getContainer().style.cursor = ''; };
  }, [map]);
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });

  return (
    <>
      {points.length > 1 && (
        <Polyline positions={points} pathOptions={{ color, weight: thickness, opacity: 0.85 }} />
      )}
      {/* Midpoint handles — click or drag to insert a new point between two existing ones */}
      {points.slice(0, -1).map((pt, i) => {
        const next   = points[i + 1];
        const midLat = (pt[0] + next[0]) / 2;
        const midLng = (pt[1] + next[1]) / 2;
        const midIcon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid ${color};opacity:0.75;cursor:copy;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
          iconSize:   [10, 10],
          iconAnchor: [5, 5],
        });
        return (
          <Marker
            key={`mid-${i}`}
            position={[midLat, midLng]}
            icon={midIcon}
            draggable
            zIndexOffset={-50}
            eventHandlers={{
              click(e) {
                (e as any).originalEvent?.stopPropagation();
                onInsertPoint(i, midLat, midLng);
              },
              dragend(e) {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                onInsertPoint(i, lat, lng);
              },
            }}
          />
        );
      })}
      {/* Point handles */}
      {points.map((pt, i) => {
        const isFirst = i === 0;
        const isLast  = i === points.length - 1;
        const dot     = isFirst ? '#10b981' : isLast ? '#ef4444' : color;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${dot};border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.45);cursor:grab;"></div>`,
          iconSize:   [14, 14],
          iconAnchor: [7, 7],
        });
        return (
          <Marker
            key={i}
            position={pt}
            icon={icon}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                onPointMove(i, lat, lng);
              },
            }}
          />
        );
      })}
    </>
  );
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
  onEditRoute?: (routeId: string) => void;
  canEditRoutes?: boolean;
  editMode?: boolean;
  editRouteId?: string;
  editPoints?: [number, number][];
  editRouteColor?: string;
  editRouteThickness?: number;
  onEditMapClick?: (lat: number, lng: number) => void;
  onEditPointMove?: (idx: number, lat: number, lng: number) => void;
  onInsertEditPoint?: (afterIdx: number, lat: number, lng: number) => void;
}

export default function LeafletMap({ layer, markers, center, zoom, showScaleBar = true, scaleUnit = 'metric', userLocation, drawMode, drawPoints = [], onMapClick, routes = [], onEditRoute, canEditRoutes, editMode, editRouteId, editPoints = [], editRouteColor = '#3b82f6', editRouteThickness = 2, onEditMapClick, onEditPointMove, onInsertEditPoint }: LeafletMapProps) {
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
      {/* Existing routes — polylines + widget icons at points (skip the one being edited) */}
      {routes.filter((r) => r.points.length > 1 && r.id !== editRouteId).map((r) => (
        <React.Fragment key={r.id}>
          <Polyline
            positions={r.points}
            pathOptions={{ color: r.color || '#3b82f6', weight: r.thickness || 3, opacity: 0.85 }}
          >
            <Popup minWidth={244}>
              <RoutePopup r={r} onEdit={canEditRoutes && onEditRoute ? () => onEditRoute(r.id) : undefined} />
            </Popup>
          </Polyline>
          <RouteWidgetMarkers routePoints={r.routePoints} />
        </React.Fragment>
      ))}
      {/* Edit mode */}
      {editMode && onEditMapClick && onEditPointMove && onInsertEditPoint && (
        <EditLayer
          points={editPoints}
          color={editRouteColor}
          thickness={editRouteThickness}
          onMapClick={onEditMapClick}
          onPointMove={onEditPointMove}
          onInsertPoint={onInsertEditPoint}
        />
      )}
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
