'use client';

import { useState } from 'react';
import { Can } from '@/components/auth/Can';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

interface TenantBusinessCardProps {
  business: any;
  onEdit: (business: any) => void;
  onDelete: (business: any) => void;
  onBlock: (business: any) => void;
  onUnblock: (business: any) => void;
  onSuspend: (business: any) => void;
}

export default function TenantBusinessCard({ business, onEdit, onDelete, onBlock, onUnblock, onSuspend }: TenantBusinessCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const attributes = business.attributes || {};
  const meta = business.meta || {};
  const status = (attributes.status || 'active').toLowerCase();
  const type = (attributes.type || '').toLowerCase();
  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Business';
  const operatorStyle = type === 'operator' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' } : undefined;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{attributes.name?.[0]?.toUpperCase() || 'B'}</div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>{attributes.name || 'Unknown Business'}</h3>
          <div className={styles.userHandle}>{attributes.email || ''}</div>
        </div>
        <div className={styles.roleBadge} style={operatorStyle}>{typeLabel}</div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Phone</span>
          <span className={styles.detailValue}>{attributes.phone || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>{status.toUpperCase()}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Country</span>
          <span className={styles.detailValue}>{attributes.country?.name || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Created</span>
          <span className={styles.detailValue}>
            {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.extraDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Address</span>
              <span className={styles.expandedValue}>{attributes.address || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone Code</span>
              <span className={styles.expandedValue}>{attributes.country?.phoneCode || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        <button className={styles.actionBtn} onClick={() => setIsViewOpen(true)} title="View Details" style={{ color: 'var(--color-accent-blue)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <button className={styles.actionBtn} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Show Less' : 'Show More'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <Can I="tenant-business.update">
          {status === 'active' ? (
            <button className={styles.actionBtn} onClick={() => onBlock(business)} title="Block Business" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </button>
          ) : status === 'blocked' ? (
            <button className={styles.actionBtn} onClick={() => onUnblock(business)} title="Unblock Business" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" />
              </svg>
            </button>
          ) : null}
        </Can>

        <Can I="tenant-business.update">
          {status === 'active' && (
            <button className={styles.actionBtn} onClick={() => onSuspend(business)} title="Suspend Business" style={{ color: '#a855f7', borderColor: 'rgba(168,85,247,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
              </svg>
            </button>
          )}
        </Can>

        <Can I="tenant-business.update">
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => onEdit(business)} title="Edit Business">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </Can>

        <Can I="tenant-business.delete">
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(business)} title="Delete Business">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </Can>
      </div>

      {isViewOpen && (
        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          avatarChar={attributes.name?.[0]?.toUpperCase() || 'B'}
          title={attributes.name || 'Unknown Business'}
          subtitle={attributes.email || ''}
          badge={typeLabel}
          badgeStyle={operatorStyle}
          status={status}
          sections={[
            {
              title: 'Business Info',
              fields: [
                { label: 'Business Name', value: attributes.name },
                { label: 'Type', value: typeLabel },
                { label: 'Email', value: attributes.email },
                { label: 'Phone', value: attributes.phone },
              ],
            },
            {
              title: 'Location',
              fields: [
                { label: 'Address', value: attributes.address, fullWidth: true },
                { label: 'Country', value: attributes.country?.name },
                { label: 'Phone Code', value: attributes.country?.phoneCode },
              ],
            },
            {
              title: 'Timestamps',
              fields: [
                { label: 'Created At', value: meta.createdAt ? new Date(meta.createdAt).toLocaleString() : null },
                { label: 'Updated At', value: meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : null },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
