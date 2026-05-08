'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getDeviceCategories, getDeviceTypes, getUserSettings, DeviceCategoryData, DeviceTypeData } from '@/lib/api';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import type { MapMarker } from './LeafletMap';
import MapSettingsPanel, { MapSettings, DEFAULT_MAP_SETTINGS } from '@/components/tenant-map/MapSettingsPanel';
import styles from './map.module.css';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

type LayerKey = 'street' | 'terrain' | 'dark';
type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

const LAYER_OPTIONS: { value: LayerKey; label: string }[] = [
  { value: 'street', label: 'Street' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'dark', label: 'Dark' },
];


function parseSettings(raw: { key: string; value: string }[]): MapSettings {
  const m: Record<string, string> = {};
  raw.forEach((r) => { m[r.key] = r.value; });
  return {
    defaultLayer: (m['map.defaultLayer'] as LayerKey) ?? DEFAULT_MAP_SETTINGS.defaultLayer,
    defaultZoom:  Number(m['map.defaultZoom'])  || DEFAULT_MAP_SETTINGS.defaultZoom,
    showScaleBar: m['map.showScaleBar'] !== undefined ? m['map.showScaleBar'] === 'true' : DEFAULT_MAP_SETTINGS.showScaleBar,
    scaleUnit:    (m['map.scaleUnit'] as 'metric' | 'imperial') ?? DEFAULT_MAP_SETTINGS.scaleUnit,
    autoCenterGPS: m['map.autoCenterGPS'] !== undefined ? m['map.autoCenterGPS'] === 'true' : DEFAULT_MAP_SETTINGS.autoCenterGPS,
    filtersOpenByDefault: m['map.filtersOpenByDefault'] !== undefined ? m['map.filtersOpenByDefault'] === 'true' : DEFAULT_MAP_SETTINGS.filtersOpenByDefault,
  };
}

export default function MapClient() {
  const router = useRouter();
  const { hasPermission } = useTenantAuth();

  useEffect(() => {
    if (!hasPermission('map.view')) {
      router.replace('/tenant/dashboard');
    }
  }, [hasPermission, router]);

  const [geoStatus, setGeoStatus]       = useState<GeoStatus>('idle');
  const [center, setCenter]             = useState<[number, number]>([0, 0]);
  const [heading, setHeading]           = useState<number | null>(null);
  const [accuracy, setAccuracy]         = useState<number>(0);
  const watchIdRef                      = useRef<number | null>(null);
  const [mapSettings, setMapSettings]   = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Active layer/zoom can diverge from saved defaults after user interacts
  const [layer, setLayer]               = useState<LayerKey>(DEFAULT_MAP_SETTINGS.defaultLayer);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [categories, setCategories]     = useState<DeviceCategoryData[]>([]);
  const [deviceTypes, setDeviceTypes]   = useState<DeviceTypeData[]>([]);
  const [filtersOpen, setFiltersOpen]   = useState(DEFAULT_MAP_SETTINGS.filtersOpenByDefault);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Load saved settings from API ─────────────────────────────────────────
  useEffect(() => {
    getUserSettings().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const parsed = parseSettings(res.data.map((d) => ({ key: d.attributes.key, value: d.attributes.value })));
        setMapSettings(parsed);
        setLayer(parsed.defaultLayer);
        setFiltersOpen(parsed.filtersOpenByDefault);
      }
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  const handleSettingsApply = useCallback((s: MapSettings) => {
    setMapSettings(s);
    setLayer(s.defaultLayer);
    setFiltersOpen(s.filtersOpenByDefault);
  }, []);

  // ── Geolocation (continuous watch) ───────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('unsupported'); return; }
    setGeoStatus('requesting');
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        const h = pos.coords.heading;
        setHeading(h != null && !isNaN(h) ? h : null);
        setGeoStatus('granted');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [requestLocation]);

  // ── Fullscreen ───────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) wrapperRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── API data ─────────────────────────────────────────────────────────────
  const loadApiData = useCallback(async () => {
    const [catRes, dtRes] = await Promise.all([
      getDeviceCategories({ limit: -1 }),
      getDeviceTypes({ limit: -1 }),
    ]);
    if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
    if (dtRes.success && Array.isArray(dtRes.data)) setDeviceTypes(dtRes.data);
  }, []);

  useEffect(() => { loadApiData(); }, [loadApiData]);

  const refreshMap = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadApiData();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadApiData]);

  const filteredDeviceTypes = useMemo(() => {
    if (!categoryFilter) return deviceTypes;
    return deviceTypes.filter((dt) => String(dt.attributes.tenantDeviceCategoryId) === categoryFilter);
  }, [deviceTypes, categoryFilter]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategoryFilter(val); setDeviceTypeFilter('');
  }, []);

  const filteredMarkers = useMemo<MapMarker[]>(() => [], []);

  const activeCount   = 0;
  const inactiveCount = 0;

  // ── Permission screens ───────────────────────────────────────────────────
  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>Location Access Required</h2>
          <p className={styles.geoDesc}>
            The Network Map requires your GPS location to display the map centred on your area.
            Please allow location access when prompted by your browser.
          </p>
          <div className={styles.geoSpinner} />
          <p className={styles.geoHint}>Waiting for location permission…</p>
        </div>
      </div>
    );
  }

  if (geoStatus === 'denied') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>Location Access Denied</h2>
          <p className={styles.geoDesc}>Location permission was denied. To use the Network Map you must allow location access.</p>
          <ol className={styles.geoSteps}>
            <li>Click the <strong>lock / info icon</strong> in your browser's address bar.</li>
            <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
            <li>Reload this page.</li>
          </ol>
          <button className={styles.geoRetryBtn} onClick={requestLocation}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (geoStatus === 'unsupported') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>GPS Not Supported</h2>
          <p className={styles.geoDesc}>
            Your browser does not support the Geolocation API. Please use a modern browser such as Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  // ── Main map UI (geoStatus === 'granted') ────────────────────────────────
  const effectiveZoom = settingsLoaded ? mapSettings.defaultZoom : DEFAULT_MAP_SETTINGS.defaultZoom;

  return (
    <div className={`${styles.wrapper} ${isFullscreen ? styles.wrapperFullscreen : ''}`} ref={wrapperRef}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Network Map</h2>
          <p className={styles.subtitle}>
            {filteredMarkers.length} node{filteredMarkers.length !== 1 ? 's' : ''} visible
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stats}>
            <div className={styles.statBadge} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span className={styles.statDot} style={{ background: '#10b981' }} />{activeCount} Active
            </div>
            <div className={styles.statBadge} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <span className={styles.statDot} style={{ background: '#ef4444' }} />{inactiveCount} Inactive
            </div>
          </div>
          {/* Refresh */}
          <button
            className={styles.fullscreenBtn}
            onClick={refreshMap}
            title="Refresh map"
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.6 : 1 }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          {/* Settings */}
          <button
            className={`${styles.fullscreenBtn} ${settingsPanelOpen ? styles.headerBtnActive : ''}`}
            onClick={() => setSettingsPanelOpen((o) => !o)}
            title="Map settings"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          </button>
          {/* Fullscreen */}
          <button className={styles.fullscreenBtn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Filter panel */}
        <aside className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : styles.filtersClosed}`}>
          <div className={styles.filtersHeader}>
            <span className={styles.filtersTitle}>Filters</span>
            <button className={styles.filtersToggle} onClick={() => setFiltersOpen((o) => !o)} title="Toggle filters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {filtersOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {filtersOpen && (
            <div className={styles.filtersBody}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Search</label>
                <div className={styles.searchWrapper}>
                  <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" className={styles.filterInput} placeholder="Search nodes..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Map Layer</label>
                <div className={styles.layerButtons}>
                  {LAYER_OPTIONS.map((opt) => (
                    <button key={opt.value} className={`${styles.layerBtn} ${layer === opt.value ? styles.layerBtnActive : ''}`} onClick={() => setLayer(opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Category</label>
                <select className={styles.filterSelect} value={categoryFilter} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.attributes.numericId)}>{c.attributes.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Type</label>
                <select className={styles.filterSelect} value={deviceTypeFilter} onChange={(e) => setDeviceTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {filteredDeviceTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.attributes.name} ({dt.attributes.code})</option>
                  ))}
                </select>
              </div>

              {(statusFilter !== 'all' || categoryFilter || deviceTypeFilter || search) && (
                <button className={styles.clearBtn} onClick={() => { setStatusFilter('all'); setCategoryFilter(''); setDeviceTypeFilter(''); setSearch(''); }}>
                  Clear all filters
                </button>
              )}

              <div className={styles.legend}>
                <div className={styles.filterLabel} style={{ marginBottom: '0.5rem' }}>Legend</div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#10b981' }} /><span>Active node</span></div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ef4444' }} /><span>Inactive node</span></div>
              </div>
            </div>
          )}
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <LeafletMap
            layer={layer}
            markers={filteredMarkers}
            center={center}
            zoom={effectiveZoom}
            showScaleBar={mapSettings.showScaleBar}
            scaleUnit={mapSettings.scaleUnit}
            userLocation={{ position: center, heading, accuracy }}
          />
          {filteredMarkers.length === 0 && (
            <div className={styles.emptyOverlay}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: '0.75rem' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <p>No nodes match the current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings panel */}
      <MapSettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        current={mapSettings}
        onApply={handleSettingsApply}
      />
    </div>
  );
}
