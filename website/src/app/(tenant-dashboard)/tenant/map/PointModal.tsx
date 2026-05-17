'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RoutePointTemplateData } from '@/lib/api';
import styles from './PointModal.module.css';

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PointDraft {
  latitude:               number;
  longitude:              number;
  pointType:              string;
  pointName:              string;
  routePointTemplateUuid: string;
  fieldData:              Record<string, string>;
}

interface Props {
  draft:       PointDraft;
  pointIndex:  number;       // 0-based
  totalPoints: number;
  routeCode:   string;
  templates:   RoutePointTemplateData[];
  rptFields:   Array<{
    flag: keyof RoutePointTemplateData['attributes'];
    key: string; label: string;
    type?: 'text' | 'password' | 'number'; placeholder?: string;
  }>;
  onSave:     (draft: PointDraft) => void;
  onDelete:   () => void;
  onClose:    () => void;
  onNavigate: (delta: -1 | 1) => void;
}

// ── Role colours ──────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; ring: string; chip: string; text: string }> = {
  start:    { bg: '#10b981', ring: '#059669', chip: 'rgba(16,185,129,0.15)',   text: '#10b981' },
  middle:   { bg: '#3b82f6', ring: '#2563eb', chip: 'rgba(59,130,246,0.15)',   text: '#3b82f6' },
  end:      { bg: '#ec4899', ring: '#db2777', chip: 'rgba(236,72,153,0.15)',   text: '#ec4899' },
  junction: { bg: '#a78bfa', ring: '#7c3aed', chip: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  pole:     { bg: '#f59e0b', ring: '#d97706', chip: 'rgba(245,158,11,0.15)',   text: '#f59e0b' },
  device:   { bg: '#6b7280', ring: '#4b5563', chip: 'rgba(107,114,128,0.15)', text: '#9aa6b8' },
};

const ROLE_OPTIONS = [
  { value: 'start',  label: 'Start', seq: 1 },
  { value: 'middle', label: 'Mid',   seq: 2 },
  { value: 'end',    label: 'End',   seq: 3 },
];

function fitSvg(svg: string) {
  return svg.replace(/<svg([^>]*)>/i, (_, a) =>
    `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PointModal({
  draft, pointIndex, totalPoints, routeCode, templates, rptFields,
  onSave, onDelete, onClose, onNavigate,
}: Props) {
  const [local, setLocal]           = useState<PointDraft>(draft);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Re-init when parent navigates to a different point
  useEffect(() => {
    setLocal(draft);
    setDeleteConfirm(false);
  }, [draft, pointIndex]);

  const set = <K extends keyof PointDraft>(k: K, v: PointDraft[K]) =>
    setLocal(p => ({ ...p, [k]: v }));

  const setFd = (key: string, val: string) =>
    setLocal(p => ({ ...p, fieldData: { ...p.fieldData, [key]: val } }));

  const changeTemplate = (uuid: string) =>
    setLocal(p => ({ ...p, routePointTemplateUuid: uuid === p.routePointTemplateUuid ? '' : uuid, fieldData: {} }));

  const selectedRpt = local.routePointTemplateUuid
    ? templates.find(t => t.id === local.routePointTemplateUuid)
    : null;

  const rc     = ROLE_COLORS[local.pointType] ?? ROLE_COLORS.middle;
  const num    = pointIndex + 1;
  const isValid = local.pointName.trim() !== '' && (local.latitude !== 0 || local.longitude !== 0);

  return (
    <div className={styles.overlay} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerIcon}
            style={{ background: rc.chip, border: `1px solid ${rc.ring}`, color: rc.text }}>
            {num}
          </div>

          <div className={styles.headerMeta}>
            <div className={styles.breadcrumb}>{routeCode} › Point {num} of {totalPoints}</div>
            <div className={styles.headerTitle}>
              <span>{local.pointName || `Point ${num}`}</span>
              <span className={styles.roleBadge}
                style={{ background: rc.chip, color: rc.text, borderColor: rc.ring }}>
                {local.pointType.toUpperCase()}
              </span>
            </div>
          </div>

          <div className={styles.headerNav}>
            <button className={styles.navBtn} disabled={pointIndex === 0} onClick={() => onNavigate(-1)} title="Previous point">‹</button>
            <button className={styles.navBtn} disabled={pointIndex === totalPoints - 1} onClick={() => onNavigate(1)} title="Next point">›</button>
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className={styles.body}>

          {/* Left — form */}
          <div className={styles.formCol}>

            {/* Point Role — display-only indicator */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Point Role</label>
              <div className={styles.rolePicker}>
                {ROLE_OPTIONS.map(role => {
                  const rcc = ROLE_COLORS[role.value];
                  const active = local.pointType === role.value;
                  return (
                    <div key={role.value} className={`${styles.roleBtn} ${active ? styles.roleBtnActive : ''}`}
                      style={active ? { borderColor: rcc.ring, background: rcc.chip, color: rcc.text } : {}}>
                      <span className={styles.roleChip}
                        style={active ? { background: rcc.bg, color: '#fff' } : {}}>
                        {role.seq}
                      </span>
                      {role.label}
                    </div>
                  );
                })}
              </div>
              <p className={styles.fieldHint}>Role is determined by the point&rsquo;s position in the sequence.</p>
            </div>

            {/* Point Name */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Point Name <span className={styles.req}>*</span></label>
              <input className={styles.input} placeholder="e.g. Junction Box A"
                value={local.pointName} onChange={e => set('pointName', e.target.value)} />
            </div>

            {/* Template grid */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Route Point Template</label>
              <div className={styles.templateGrid}>
                {/* "None" card */}
                <button
                  className={`${styles.noTemplate} ${!local.routePointTemplateUuid ? styles.noTemplateActive : ''}`}
                  onClick={() => changeTemplate('')}
                >
                  No template
                </button>

                {templates.map(t => {
                  const a = t.attributes;
                  const active = local.routePointTemplateUuid === t.id;
                  return (
                    <button key={t.id}
                      className={`${styles.templateCard} ${active ? styles.templateCardActive : ''}`}
                      onClick={() => changeTemplate(t.id)}
                    >
                      <div className={styles.templateIconBox}>
                        {a.iconSvgTemplate
                          ? <span dangerouslySetInnerHTML={{ __html: fitSvg(a.iconSvgTemplate) }}
                              style={{ display: 'flex', width: 20, height: 20 }} />
                          : a.iconUrl
                            ? <img src={a.iconUrl} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7689" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                        }
                      </div>
                      <div className={styles.templateInfo}>
                        <span className={styles.templateName}>{a.name}</span>
                        <span className={styles.templateCode}>{a.code}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic RPT fields */}
            {selectedRpt && rptFields.map(({ flag, key, label, type, placeholder }) => {
              if (!selectedRpt.attributes[flag]) return null;
              return (
                <div key={key} className={styles.field}>
                  <label className={styles.fieldLabel}>{label}</label>
                  <input className={`${styles.input} ${type === 'number' || key === 'ipv4' || key === 'ipv6' || key === 'macAddress' ? styles.mono : ''}`}
                    type={type ?? 'text'}
                    placeholder={placeholder}
                    value={local.fieldData[key] ?? ''}
                    onChange={e => setFd(key, e.target.value)}
                  />
                </div>
              );
            })}

            {/* GPS location */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>GPS Location <span className={styles.req}>*</span></label>
              <div className={styles.gpsRow}>
                <div className={styles.gpsInputWrap}>
                  <span className={styles.gpsSubLabel}>Latitude</span>
                  <input className={`${styles.input} ${styles.mono}`}
                    type="number" step="0.00001"
                    value={local.latitude === 0 ? '' : local.latitude}
                    placeholder="0.00000"
                    onChange={e => set('latitude', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.gpsInputWrap}>
                  <span className={styles.gpsSubLabel}>Longitude</span>
                  <input className={`${styles.input} ${styles.mono}`}
                    type="number" step="0.00001"
                    value={local.longitude === 0 ? '' : local.longitude}
                    placeholder="0.00000"
                    onChange={e => set('longitude', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <button className={styles.pickBtn} title="Click on the map to pick coordinates">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="1" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="1"  y1="12" x2="5"  y2="12" /><line x1="19" y1="12" x2="23" y2="12" />
                  </svg>
                  Pick
                </button>
              </div>
            </div>

            {/* Description */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Description <span className={styles.opt}>(optional)</span></label>
              <textarea className={styles.textarea} rows={3}
                placeholder="Brief description of this point…"
                value={local.fieldData.description ?? ''}
                onChange={e => setFd('description', e.target.value)}
              />
            </div>

          </div>

          {/* Right — aside */}
          <div className={styles.asideCol}>

            {/* Validation banner */}
            <div className={isValid ? styles.validBanner : styles.invalidBanner}>
              <div className={styles.bannerIcon}>
                {isValid
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                }
              </div>
              {isValid
                ? 'All required fields are set'
                : 'Fill point name and GPS to enable save'
              }
            </div>

            {/* Mini-map */}
            <div className={styles.miniMapWrap}>
              {local.latitude !== 0 || local.longitude !== 0
                ? <MiniMap lat={local.latitude} lng={local.longitude} />
                : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7689', fontSize: '0.78rem' }}>
                    No coordinates set
                  </div>
              }
              {/* Crosshair pin */}
              {(local.latitude !== 0 || local.longitude !== 0) && (
                <div className={styles.miniMapPin}>
                  <div className={styles.miniMapPinDot} />
                </div>
              )}
              {/* Coords readout */}
              {(local.latitude !== 0 || local.longitude !== 0) && (
                <div className={styles.miniMapCoords}>
                  {local.latitude.toFixed(5)}, {local.longitude.toFixed(5)}
                </div>
              )}
            </div>

            {/* Photos placeholder */}
            <div className={styles.asideSection}>
              <div className={styles.asideSectionHeader}>
                <span className={styles.asideSectionTitle}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Photos
                </span>
                <span className={styles.asideSectionCount}>0</span>
              </div>
              <div className={styles.photoRow}>
                <div className={styles.photoThumb} />
                <div className={styles.photoThumb} />
                <button className={styles.addPhotoBtn} title="Add photo">+</button>
              </div>
            </div>

            {/* Metadata footer */}
            <div className={styles.metaLine}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Point {num} of {totalPoints} — sequence #{num}</span>
            </div>

          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <div className={styles.deleteZone}>
            {deleteConfirm ? (
              <div className={styles.deleteConfirm}>
                <span>Delete point?</span>
                <button className={styles.deleteConfirmYes} onClick={onDelete}>Delete</button>
                <button className={styles.deleteConfirmNo} onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </div>
            ) : (
              <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete Point
              </button>
            )}
          </div>

          <div className={styles.spacer} />

          <div className={styles.autoSave}>
            <span className={styles.autoSaveDot} />
            Auto-saving drafts
          </div>

          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} disabled={!isValid} onClick={() => onSave(local)}>
            Save Point
          </button>
        </div>

      </div>
    </div>
  );
}
