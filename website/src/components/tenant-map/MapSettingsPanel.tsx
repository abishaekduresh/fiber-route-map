'use client';

import { useState, useEffect } from 'react';
import { saveUserSettings } from '@/lib/api';
import { toast } from 'sonner';
import styles from './MapSettingsPanel.module.css';

export interface MapSettings {
  defaultLayer: 'street' | 'terrain' | 'dark';
  defaultZoom: number;
  showScaleBar: boolean;
  scaleUnit: 'metric' | 'imperial';
  autoCenterGPS: boolean;
  filtersOpenByDefault: boolean;
}

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  defaultLayer: 'street',
  defaultZoom: 13,
  showScaleBar: true,
  scaleUnit: 'metric',
  autoCenterGPS: true,
  filtersOpenByDefault: true,
};

const ZOOM_LABELS: Record<number, string> = {
  1: 'World', 3: 'Continent', 5: 'Country', 7: 'State/Province',
  10: 'City', 12: 'Town', 13: 'Neighbourhood', 15: 'Streets',
  17: 'Building', 18: 'Rooftop',
};

function zoomLabel(z: number) {
  const keys = Object.keys(ZOOM_LABELS).map(Number).sort((a, b) => a - b);
  let label = ZOOM_LABELS[1];
  for (const k of keys) { if (z >= k) label = ZOOM_LABELS[k]; }
  return label;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: MapSettings;
  onApply: (s: MapSettings) => void;
}

export default function MapSettingsPanel({ isOpen, onClose, current, onApply }: Props) {
  const [form, setForm] = useState<MapSettings>(current);
  const [saving, setSaving] = useState(false);

  // Sync when parent settings change (e.g. loaded from API)
  useEffect(() => { setForm(current); }, [current]);

  const set = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [
        { key: 'map.defaultLayer',        name: 'Default Map Layer',              value: form.defaultLayer },
        { key: 'map.defaultZoom',         name: 'Default Zoom Level',             value: String(form.defaultZoom) },
        { key: 'map.showScaleBar',        name: 'Show Scale Bar',                 value: String(form.showScaleBar) },
        { key: 'map.scaleUnit',           name: 'Scale Bar Unit',                 value: form.scaleUnit },
        { key: 'map.autoCenterGPS',       name: 'Auto-center on GPS Location',    value: String(form.autoCenterGPS) },
        { key: 'map.filtersOpenByDefault',name: 'Filter Panel Open by Default',   value: String(form.filtersOpenByDefault) },
      ];
      const res = await saveUserSettings(payload);
      if (!res.success) throw new Error((res as any).message ?? 'Save failed');
      onApply(form);
      toast.success('Map settings saved');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setForm(DEFAULT_MAP_SETTINGS);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
            Map Settings
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* ── Map Display ─────────────────────────────────── */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Map Display</h4>

            <div className={styles.field}>
              <label className={styles.label}>Default Layer</label>
              <div className={styles.segmented}>
                {(['street', 'terrain', 'dark'] as const).map((l) => (
                  <button
                    key={l}
                    className={`${styles.seg} ${form.defaultLayer === l ? styles.segActive : ''}`}
                    onClick={() => set('defaultLayer', l)}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Default Zoom
                <span className={styles.labelSub}>{form.defaultZoom} — {zoomLabel(form.defaultZoom)}</span>
              </label>
              <input
                type="range" min={1} max={18} step={1}
                value={form.defaultZoom}
                onChange={(e) => set('defaultZoom', Number(e.target.value))}
                className={styles.range}
              />
              <div className={styles.rangeLabels}>
                <span>World</span><span>Street</span><span>Rooftop</span>
              </div>
            </div>
          </section>

          {/* ── Scale Bar ───────────────────────────────────── */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Scale Bar</h4>
            <p className={styles.sectionDesc}>
              Displays the ground distance at the current zoom level in the map corner.
            </p>

            <div className={styles.field}>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Show Scale Bar</div>
                  <div className={styles.toggleSub}>Ground distance indicator at current zoom</div>
                </div>
                <button
                  className={`${styles.toggle} ${form.showScaleBar ? styles.toggleOn : ''}`}
                  onClick={() => set('showScaleBar', !form.showScaleBar)}
                  role="switch" aria-checked={form.showScaleBar}
                />
              </div>
            </div>

            {form.showScaleBar && (
              <div className={styles.field}>
                <label className={styles.label}>Units</label>
                <div className={styles.segmented}>
                  <button
                    className={`${styles.seg} ${form.scaleUnit === 'metric' ? styles.segActive : ''}`}
                    onClick={() => set('scaleUnit', 'metric')}
                  >
                    Metric (m / km)
                  </button>
                  <button
                    className={`${styles.seg} ${form.scaleUnit === 'imperial' ? styles.segActive : ''}`}
                    onClick={() => set('scaleUnit', 'imperial')}
                  >
                    Imperial (ft / mi)
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── Behaviour ───────────────────────────────────── */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Behaviour</h4>

            <div className={styles.field}>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Auto-center on GPS</div>
                  <div className={styles.toggleSub}>Always centre map on your current location</div>
                </div>
                <button
                  className={`${styles.toggle} ${form.autoCenterGPS ? styles.toggleOn : ''}`}
                  onClick={() => set('autoCenterGPS', !form.autoCenterGPS)}
                  role="switch" aria-checked={form.autoCenterGPS}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Filter Panel Open by Default</div>
                  <div className={styles.toggleSub}>Show filter sidebar when the map loads</div>
                </div>
                <button
                  className={`${styles.toggle} ${form.filtersOpenByDefault ? styles.toggleOn : ''}`}
                  onClick={() => set('filtersOpenByDefault', !form.filtersOpenByDefault)}
                  role="switch" aria-checked={form.filtersOpenByDefault}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>Restore Defaults</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
