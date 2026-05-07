'use client';

import { useState } from 'react';
import { DeviceTypeData } from '@/lib/api';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

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

export default function DeviceTypeCard({ deviceType, onEdit, onDelete }: Props) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const a = deviceType.attributes;
  const meta = deviceType.meta;
  const status = (a.status || 'active').toLowerCase();

  const activeFlags = BOOL_FLAGS.filter((f) => Boolean(a[f.key]));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {a.name?.[0]?.toUpperCase() || 'D'}
        </div>
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
