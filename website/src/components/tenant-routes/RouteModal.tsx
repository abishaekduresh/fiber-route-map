'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getTenantRoutes,
  createTenantRoute, updateTenantRoute,
  TenantRouteData, TenantRouteType,
  TenantRoutePointType, TenantRoutePoint,
} from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ROUTE_TYPES: { value: TenantRouteType; label: string }[] = [
  { value: 'fiber_route',        label: 'Fiber Route' },
  { value: 'coaxial_route',      label: 'Coaxial Route' },
  { value: 'backbone_route',     label: 'Backbone Route' },
  { value: 'distribution_route', label: 'Distribution Route' },
  { value: 'drop_route',         label: 'Drop Route' },
  { value: 'underground_duct',   label: 'Underground Duct' },
  { value: 'pole_to_pole',       label: 'Pole to Pole' },
];

const POINT_TYPES: { value: TenantRoutePointType; label: string }[] = [
  { value: 'start',    label: 'Start' },
  { value: 'middle',   label: 'Middle' },
  { value: 'end',      label: 'End' },
  { value: 'junction', label: 'Junction' },
  { value: 'pole',     label: 'Pole' },
  { value: 'device',   label: 'Device' },
];

interface PointForm {
  _key:           string;
  sequenceNumber: string;
  latitude:       string;
  longitude:      string;
  altitude:       string;
  pointType:      TenantRoutePointType;
  poleNumber:     string;
  remarks:        string;
}

interface FormState {
  name:            string;
  type:            TenantRouteType;
  routeColor:      string;
  lineThickness:   string;
  parentRouteUuid: string;
  description:     string;
  status:          'active' | 'inactive' | 'maintenance';
}

const EMPTY: FormState = {
  name: '', type: 'fiber_route',
  routeColor: '#3b82f6', lineThickness: '3',
  parentRouteUuid: '', description: '', status: 'active',
};

const newPoint = (seq: number): PointForm => ({
  _key:           `pt_${Date.now()}_${seq}`,
  sequenceNumber: String(seq),
  latitude:       '',
  longitude:      '',
  altitude:       '',
  pointType:      seq === 1 ? 'start' : 'middle',
  poleNumber:     '',
  remarks:        '',
});

interface Props {
  route:     TenantRouteData | null;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function RouteModal({ route, onClose, onSuccess }: Props) {
  const isEdit = !!route;
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [points, setPoints]     = useState<PointForm[]>([]);
  const [allRoutes, setAllRoutes] = useState<TenantRouteData[]>([]);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState<Partial<Record<keyof FormState, string>>>({});
  const [activeTab, setActiveTab] = useState<'info' | 'points'>('info');

  // Load sibling routes for parent selector
  const loadRoutes = useCallback(async () => {
    try {
      const res = await getTenantRoutes({ limit: -1 });
      if (res.success && Array.isArray(res.data)) setAllRoutes(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  useEffect(() => {
    if (route) {
      const a = route.attributes;
      setForm({
        name:            a.name,
        type:            a.type,
        routeColor:      a.routeColor      ?? '#3b82f6',
        lineThickness:   a.lineThickness   != null ? String(a.lineThickness) : '3',
        parentRouteUuid: a.parentRouteUuid ?? '',
        description:     a.description    ?? '',
        status:          (a.status === 'maintenance' ? 'maintenance' : a.status === 'inactive' ? 'inactive' : 'active'),
      });
      setPoints(
        (a.points ?? []).map(p => ({
          _key:           `pt_${p.id}`,
          sequenceNumber: String(p.sequenceNumber),
          latitude:       String(p.latitude),
          longitude:      String(p.longitude),
          altitude:       p.altitude != null ? String(p.altitude) : '',
          pointType:      p.pointType,
          poleNumber:     p.poleNumber ?? '',
          remarks:        p.remarks    ?? '',
        }))
      );
    } else {
      setForm(EMPTY);
      setPoints([]);
    }
    setErrors({});
    setActiveTab('info');
  }, [route]);

  const setField = (f: keyof FormState, v: string) => setForm(p => ({ ...p, [f]: v }));

  const setPoint = (key: string, f: keyof PointForm, v: string) =>
    setPoints(ps => ps.map(p => p._key === key ? { ...p, [f]: v } : p));

  const addPoint = () => {
    const seq = points.length + 1;
    setPoints(ps => {
      // Auto-mark last point as 'end' when there are >=2 points
      const updated = ps.map((p, i) => i === ps.length - 1 && ps.length >= 1 ? { ...p, pointType: 'middle' as TenantRoutePointType } : p);
      return [...updated, { ...newPoint(seq), pointType: seq === 1 ? 'start' : 'end' }];
    });
  };

  const removePoint = (key: string) => {
    setPoints(ps => {
      const filtered = ps.filter(p => p._key !== key);
      return filtered.map((p, i) => ({ ...p, sequenceNumber: String(i + 1) }));
    });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) { setActiveTab('info'); return; }
    setSaving(true);
    try {
      const parsedPoints = points.map((p, i) => ({
        sequenceNumber: Number(p.sequenceNumber) || i + 1,
        latitude:       parseFloat(p.latitude),
        longitude:      parseFloat(p.longitude),
        altitude:       p.altitude !== '' ? parseFloat(p.altitude) : null,
        pointType:      p.pointType,
        poleNumber:     p.poleNumber.trim() || null,
        remarks:        p.remarks.trim()    || null,
      }));

      const payload: Record<string, any> = {
        name:            form.name.trim(),
        type:            form.type,
        routeColor:      form.routeColor      || null,
        lineThickness:   form.lineThickness !== '' ? Number(form.lineThickness) : null,
        parentRouteUuid: form.parentRouteUuid || null,
        description:     form.description.trim() || null,
        points:          parsedPoints,
      };
      if (isEdit) payload.status = form.status;

      const res = isEdit
        ? await updateTenantRoute(route!.id, payload)
        : await createTenantRoute(payload);

      if (res.success) {
        toast.success(isEdit ? 'Route updated' : 'Route created');
        onSuccess();
      } else {
        toast.error((res as any).message || 'Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = allRoutes.filter(r => r.id !== route?.id);

  const tabStyle = (tab: 'info' | 'points'): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--color-accent-blue)' : '2px solid transparent',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s',
  });

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 680, width: '95%' }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{isEdit ? 'Edit Route' : 'Add Route'}</h3>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1.25rem' }}>
            <button type="button" style={tabStyle('info')} onClick={() => setActiveTab('info')}>Route Info</button>
            <button type="button" style={tabStyle('points')} onClick={() => setActiveTab('points')}>
              Points {points.length > 0 && <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', background: 'var(--color-accent-blue)', color: '#fff', borderRadius: '999px', padding: '0 0.4rem' }}>{points.length}</span>}
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalContent} style={{ maxHeight: '65vh', overflowY: 'auto' }}>

            {/* ── Route Info Tab ── */}
            {activeTab === 'info' && (
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Name *</label>
                  <input className={styles.input} placeholder="e.g. Backbone Route A" value={form.name}
                    onChange={e => setField('name', e.target.value)} />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Type *</label>
                  <select className={styles.select} value={form.type} onChange={e => setField('type', e.target.value)}>
                    {ROUTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Parent Route</label>
                  <select className={styles.select} value={form.parentRouteUuid} onChange={e => setField('parentRouteUuid', e.target.value)}>
                    <option value="">— None —</option>
                    {parentOptions.map(r => (
                      <option key={r.id} value={r.id}>{r.attributes.name} ({r.attributes.code})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Route Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="color" value={form.routeColor} onChange={e => setField('routeColor', e.target.value)}
                      style={{ width: 40, height: 36, border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px', background: 'var(--color-bg-primary)', cursor: 'pointer' }} />
                    <input className={styles.input} value={form.routeColor} onChange={e => setField('routeColor', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Line Thickness (px)</label>
                  <input className={styles.input} type="number" min={1} placeholder="3" value={form.lineThickness}
                    onChange={e => setField('lineThickness', e.target.value)} />
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.input} rows={3} placeholder="Optional route description…"
                    value={form.description} onChange={e => setField('description', e.target.value)}
                    style={{ resize: 'vertical' }} />
                </div>

                {isEdit && (
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Status</label>
                    <select className={styles.select} value={form.status} onChange={e => setField('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ── Points Tab ── */}
            {activeTab === 'points' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {points.length === 0 ? 'No points added yet.' : `${points.length} point${points.length !== 1 ? 's' : ''}`}
                  </span>
                  <button type="button" onClick={addPoint}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: 'var(--color-accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Point
                  </button>
                </div>

                {points.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    Click "Add Point" to define the route path coordinates.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {points.map((pt, idx) => (
                      <div key={pt._key} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--color-bg-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            Point {idx + 1}
                          </span>
                          <button type="button" onClick={() => removePoint(pt._key)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #ef4444)', padding: '0.25rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                            </svg>
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Latitude *</label>
                            <input className={styles.input} type="number" step="any" placeholder="12.345678"
                              value={pt.latitude} onChange={e => setPoint(pt._key, 'latitude', e.target.value)} />
                          </div>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Longitude *</label>
                            <input className={styles.input} type="number" step="any" placeholder="77.123456"
                              value={pt.longitude} onChange={e => setPoint(pt._key, 'longitude', e.target.value)} />
                          </div>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Altitude (m)</label>
                            <input className={styles.input} type="number" step="any" placeholder="optional"
                              value={pt.altitude} onChange={e => setPoint(pt._key, 'altitude', e.target.value)} />
                          </div>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Point Type</label>
                            <select className={styles.select} value={pt.pointType} onChange={e => setPoint(pt._key, 'pointType', e.target.value)}>
                              {POINT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Pole Number</label>
                            <input className={styles.input} placeholder="e.g. P-042"
                              value={pt.poleNumber} onChange={e => setPoint(pt._key, 'poleNumber', e.target.value)} />
                          </div>
                          <div className={styles.inputGroup} style={{ margin: 0 }}>
                            <label className={styles.label}>Seq #</label>
                            <input className={styles.input} type="number" min={1}
                              value={pt.sequenceNumber} onChange={e => setPoint(pt._key, 'sequenceNumber', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
