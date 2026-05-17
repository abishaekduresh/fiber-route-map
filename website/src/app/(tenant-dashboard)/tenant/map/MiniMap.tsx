'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const saLat = isNaN(lat) ? 0 : lat;
  const saLng = isNaN(lng) ? 0 : lng;
  return (
    <MapContainer
      center={[saLat, saLng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
      dragging={false}
      keyboard={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <Recenter lat={saLat} lng={saLng} />
    </MapContainer>
  );
}
