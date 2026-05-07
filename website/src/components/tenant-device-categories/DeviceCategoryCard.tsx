'use client';

import { useState } from 'react';
import { DeviceCategoryData } from '@/lib/api';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

interface Props {
  deviceCategory: DeviceCategoryData;
  onEdit?: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

export default function DeviceCategoryCard({ deviceCategory, onEdit, onDeactivate, onActivate, onDelete }: Props) {
  const [isViewOpen, setIsViewOpen] = useState(false);

  const a = deviceCategory.attributes;
  const meta = deviceCategory.meta;
  const status = (a.status || 'active').toLowerCase();
  const isInactive = status === 'inactive';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{a.name?.[0]?.toUpperCase() || 'D'}</div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={a.name}>{a.name || 'Unknown Category'}</h3>
          <div className={styles.roleBadge}>{a.code}</div>
          <div className={styles.userHandle}>Device Category</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Code</span>
          <span className={styles.detailValue}>{a.code}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Created</span>
          <span className={styles.detailValue}>
            {meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        {a.description && (
          <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.detailLabel}>Description</span>
            <span className={styles.expandedValue}>{a.description}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {/* View */}
        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setIsViewOpen(true)} title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Edit */}
        {onEdit && (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit} title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {/* Deactivate / Activate */}
        {isInactive && onActivate ? (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onActivate} title="Activate" style={{ color: '#10b981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : (!isInactive && onDeactivate) ? (
          <button className={styles.actionBtn} onClick={onDeactivate} title="Deactivate" style={{ color: '#f59e0b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        ) : null}

        {/* Delete */}
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
          title={a.name || 'Unknown Category'}
          subtitle={a.code}
          badge="Device Category"
          status={status}
          sections={[
            {
              title: 'Category Details',
              fields: [
                { label: 'Name', value: a.name },
                { label: 'Code', value: a.code },
                { label: 'Status', value: a.status },
                { label: 'Description', value: a.description ?? null, fullWidth: true },
              ],
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
