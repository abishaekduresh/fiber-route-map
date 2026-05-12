'use client';

import { useState } from 'react';
import { DeviceTypeData } from '@/lib/api';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

interface Props {
  deviceType: DeviceTypeData;
  onEdit?: () => void;
  onDelete?: () => void;
}

const BOOL_FLAGS = [
  { key: 'isModelNumberRequired',  label: 'Model #' },
  { key: 'isSerialNumberRequired', label: 'Serial #' },
  { key: 'isMacAddressRequired',   label: 'MAC Addr' },
  { key: 'isIPAddressRequired',    label: 'IP Addr' },
  { key: 'isGpsLocationRequired',  label: 'GPS' },
] as const;

function WidgetAvatar({ a }: { a: DeviceTypeData['attributes'] }) {
  if (a.widgetIconType === 'svg' && a.widgetSvgTemplate) {
    return (
      <div className={styles.avatar} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span dangerouslySetInnerHTML={{ __html: fitSvg(a.widgetSvgTemplate) }} style={{ display: 'flex', width: 36, height: 36 }} />
      </div>
    );
  }
  if ((a.widgetIconType === 'png' || a.widgetIconType === 'webp') && a.widgetIconUrl) {
    return (
      <div className={styles.avatar} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={a.widgetIconUrl} alt={a.widgetName || ''} style={{ width: 36, height: 36, objectFit: 'contain' }} />
      </div>
    );
  }
  return <div className={styles.avatar}>{a.name?.[0]?.toUpperCase() || 'D'}</div>;
}

export default function DeviceTypeCard({ deviceType, onEdit, onDelete }: Props) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const a = deviceType.attributes;
  const meta = deviceType.meta;
  const status = (a.status || 'active').toLowerCase();

  const activeFlags = BOOL_FLAGS.filter((f) => Boolean(a[f.key]));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <WidgetAvatar a={a} />
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={a.name}>{a.name}</h3>
          <div className={styles.roleBadge}>{a.code}</div>
          <div className={styles.userHandle}>{a.categoryName ?? 'No Category'}</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Category</span>
          <span className={styles.detailValue}>{a.categoryName ?? '—'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Created</span>
          <span className={styles.detailValue}>
            {meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        {a.widgetName && (
          <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.detailLabel}>Map Widget</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              {a.widgetIconType === 'svg' && a.widgetSvgTemplate ? (
                <span dangerouslySetInnerHTML={{ __html: fitSvg(a.widgetSvgTemplate) }} style={{ display: 'flex', width: 20, height: 20, flexShrink: 0 }} />
              ) : a.widgetIconUrl ? (
                <img src={a.widgetIconUrl} alt={a.widgetName} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
              ) : null}
              <span className={styles.detailValue}>{a.widgetName}</span>
              {a.widgetCode && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>({a.widgetCode})</span>}
            </div>
          </div>
        )}
        {activeFlags.length > 0 && (
          <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.detailLabel}>Required Fields</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
              {activeFlags.map((f) => (
                <span key={f.key} style={{
                  fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                  borderRadius: '999px', background: 'rgba(16,185,129,0.15)',
                  color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                }}>
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {a.description && (
          <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.detailLabel}>Description</span>
            <span className={styles.expandedValue}>{a.description}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setIsViewOpen(true)} title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {onEdit && (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit} title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={onDelete} title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </div>

      {isViewOpen && (
        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          avatarChar={a.name?.[0]?.toUpperCase() || 'D'}
          title={a.name}
          subtitle={a.code}
          badge="Device Type"
          status={status}
          sections={[
            {
              title: 'Basic Info',
              fields: [
                { label: 'Name', value: a.name },
                { label: 'Code', value: a.code },
                { label: 'Category', value: a.categoryName ?? null },
                { label: 'Status', value: a.status },
                { label: 'Map Widget', value: a.widgetName ? `${a.widgetName} (${a.widgetCode})` : null },
                { label: 'Description', value: a.description ?? null, fullWidth: true },
              ],
            },
            {
              title: 'Required Fields',
              fields: BOOL_FLAGS.map((f) => ({
                label: f.label,
                value: a[f.key] ? 'Yes' : 'No',
              })),
            },
            {
              title: 'Timestamps',
              fields: [
                { label: 'Created At', value: meta?.createdAt ? new Date(meta.createdAt).toLocaleString() : null },
                { label: 'Updated At', value: meta?.updatedAt ? new Date(meta.updatedAt).toLocaleString() : null },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
