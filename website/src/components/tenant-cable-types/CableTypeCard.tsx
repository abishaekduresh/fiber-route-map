'use client';

import { useState } from 'react';
import { CableTypeData } from '@/lib/api';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

interface Props {
  cableType: CableTypeData;
  onEdit?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onDelete?: () => void;
}

export default function CableTypeCard({ cableType, onEdit, onBlock, onUnblock, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const a = cableType.attributes;
  const meta = cableType.meta;
  const status = (a.status || 'active').toLowerCase();
  const isBlocked = status === 'blocked';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{a.name?.[0]?.toUpperCase() || 'C'}</div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={a.name}>{a.name || 'Unknown Cable Type'}</h3>
          <div className={styles.roleBadge}>{a.code}</div>
          <div className={styles.userHandle}>{a.fiberCoreCount} cores · ⌀{a.cableDiameter} mm</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Fiber Cores</span>
          <span className={styles.detailValue}>{a.fiberCoreCount}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Diameter (mm)</span>
          <span className={styles.detailValue}>{a.cableDiameter}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Created</span>
          <span className={styles.detailValue}>
            {meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {isExpanded && a.description && (
        <div className={styles.extraDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.detailLabel}>Description</span>
              <span className={styles.expandedValue}>{a.description}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        {/* View */}
        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setIsViewOpen(true)} title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Expand (only if description exists) */}
        {a.description && (
          <button className={styles.actionBtn} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Show Less' : 'Show More'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Edit */}
        {onEdit && (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit} title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {/* Block / Unblock */}
        {isBlocked && onUnblock ? (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onUnblock} title="Unblock" style={{ color: '#10b981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </button>
        ) : (!isBlocked && onBlock) ? (
          <button className={styles.actionBtn} onClick={onBlock} title="Block" style={{ color: '#f59e0b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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
          avatarChar={a.name?.[0]?.toUpperCase() || 'C'}
          title={a.name || 'Unknown Cable Type'}
          subtitle={a.code}
          badge="Cable Type"
          status={status}
          sections={[
            {
              title: 'Cable Specifications',
              fields: [
                { label: 'Name', value: a.name },
                { label: 'Code', value: a.code },
                { label: 'Fiber Core Count', value: String(a.fiberCoreCount) },
                { label: 'Cable Diameter (mm)', value: String(a.cableDiameter) },
                { label: 'Status', value: a.status },
              ],
            },
            {
              title: 'Details',
              fields: [
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
