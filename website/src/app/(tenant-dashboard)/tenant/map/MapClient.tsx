'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getDeviceCategories, getDeviceTypes, DeviceCategoryData, DeviceTypeData } from '@/lib/api';
import type { MapMarker } from './LeafletMap';
import styles from './map.module.css';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

type LayerKey = 'street' | 'terrain' | 'dark';

const LAYER_OPTIONS: { value: LayerKey; label: string }[] = [
  { value: 'street', label: 'Street' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'dark', label: 'Dark' },
];

// Default center: India
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// Sample markers — replace with real API data once geographic fields exist
const SAMPLE_MARKERS: MapMarker[] = [
  { id: '1', lat: 28.6139, lng: 77.209,  label: 'Node A — Delhi',     category: 'Active Equipment', status: 'active' },
  { id: '2', lat: 19.076,  lng: 72.8777, label: 'Node B — Mumbai',    category: 'Passive Equipment', status: 'active' },
  { id: '3', lat: 13.0827, lng: 80.2707, label: 'Node C — Chennai',   category: 'Active Equipment', status: 'inactive' },
  { id: '4', lat: 22.5726, lng: 88.3639, label: 'Node D — Kolkata',   category: 'Passive Equipment', status: 'active' },
  { id: '5', lat: 17.385,  lng: 78.4867, label: 'Node E — Hyderabad', category: 'Active Equipment', status: 'active' },
];

export default function MapClient() {
  const [layer, setLayer]               = useState<LayerKey>('street');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [categories, setCategories]     = useState<DeviceCategoryData[]>([]);
  const [deviceTypes, setDeviceTypes]   = useState<DeviceTypeData[]>([]);
  const [filtersOpen, setFiltersOpen]   = useState(true);

  useEffect(() => {
    getDeviceCategories({ limit: -1 }).then((r) => {
      if (r.success && Array.isArray(r.data)) setCategories(r.data);
    });
    getDeviceTypes({ limit: -1 }).then((r) => {
      if (r.success && Array.isArray(r.data)) setDeviceTypes(r.data);
    });
  }, []);

  const filteredDeviceTypes = useMemo(() => {
    if (!categoryFilter) return deviceTypes;
    return deviceTypes.filter((dt) => String(dt.attributes.tenantDeviceCategoryId) === categoryFilter);
  }, [deviceTypes, categoryFilter]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategoryFilter(val);
    setDeviceTypeFilter('');
  }, []);

  const filteredMarkers = useMemo(() => {
    return SAMPLE_MARKERS.filter((m) => {
      const matchStatus   = statusFilter === 'all' || m.status === statusFilter;
      const matchCategory = !categoryFilter || m.category === categories.find(
        (c) => String(c.attributes.numericId) === categoryFilter
      )?.attributes.name;
      const matchSearch   = !search || m.label.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCategory && matchSearch;
    });
  }, [statusFilter, categoryFilter, categories, search]);

  const activeCount   = SAMPLE_MARKERS.filter((m) => m.status === 'active').length;
  const inactiveCount = SAMPLE_MARKERS.filter((m) => m.status === 'inactive').length;

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Network Map</h2>
          <p className={styles.subtitle}>
            {filteredMarkers.length} node{filteredMarkers.length !== 1 ? 's' : ''} visible
            {SAMPLE_MARKERS.length !== filteredMarkers.length && ` (filtered from ${SAMPLE_MARKERS.length})`}
          </p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statBadge} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
            <span className={styles.statDot} style={{ background: '#10b981' }} />
            {activeCount} Active
          </div>
          <div className={styles.statBadge} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            <span className={styles.statDot} style={{ background: '#ef4444' }} />
            {inactiveCount} Inactive
          </div>
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
              {/* Search */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Search</label>
                <div className={styles.searchWrapper}>
                  <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="Search nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Map layer */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Map Layer</label>
                <div className={styles.layerButtons}>
                  {LAYER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.layerBtn} ${layer === opt.value ? styles.layerBtnActive : ''}`}
                      onClick={() => setLayer(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Device Category */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Category</label>
                <select className={styles.filterSelect} value={categoryFilter} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.attributes.numericId)}>
                      {c.attributes.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Type */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Type</label>
                <select className={styles.filterSelect} value={deviceTypeFilter} onChange={(e) => setDeviceTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {filteredDeviceTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.attributes.name} ({dt.attributes.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear */}
              {(statusFilter !== 'all' || categoryFilter || deviceTypeFilter || search) && (
                <button
                  className={styles.clearBtn}
                  onClick={() => { setStatusFilter('all'); setCategoryFilter(''); setDeviceTypeFilter(''); setSearch(''); }}
                >
                  Clear all filters
                </button>
              )}

              {/* Legend */}
              <div className={styles.legend}>
                <div className={styles.filterLabel} style={{ marginBottom: '0.5rem' }}>Legend</div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#10b981' }} />
                  <span>Active node</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                  <span>Inactive node</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <LeafletMap
            layer={layer}
            markers={filteredMarkers}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
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
    </div>
  );
}
