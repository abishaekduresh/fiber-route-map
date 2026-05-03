'use client';

import { useState } from 'react';
import { TenantUserData } from '@/lib/api';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

interface Props {
  user: TenantUserData;
  onEdit?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onDelete?: () => void;
}

export default function TenantUserCard({ user, onEdit, onBlock, onUnblock, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const a = user.attributes;
  const meta = user.meta;
  const status = (a.status || 'active').toLowerCase();
  const roleName = (a.role as any)?.name || (a.role as any)?.slug || 'User';
  const isBlocked = status === 'blocked';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{a.name?.[0]?.toUpperCase() || 'U'}</div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={a.name}>{a.name || 'Unknown User'}</h3>
          <div className={styles.roleBadge}>{roleName}</div>
          <div className={styles.userHandle}>@{a.username || 'user'}</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue} title={a.email}>{a.email || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Country</span>
          <span className={styles.detailValue}>{a.country?.name || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Joined</span>
          <span className={styles.detailValue}>
            {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.extraDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.expandedValue}>{a.phone || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Business</span>
              <span className={styles.expandedValue}>{a.business?.name || 'None'}</span>
            </div>
            <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.detailLabel}>Address</span>
              <span className={styles.expandedValue}>{a.address || 'N/A'}</span>
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

        {/* Expand */}
        <button className={styles.actionBtn} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Show Less' : 'Show More'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Block / Unblock */}
        {onBlock && onUnblock && (
          isBlocked ? (
            <button className={`${styles.actionBtn} ${styles.unblockBtn}`} onClick={onUnblock} title="Unblock User">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" />
              </svg>
            </button>
          ) : (
            <button className={`${styles.actionBtn} ${styles.blockBtn}`} onClick={onBlock} title="Block User">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </button>
          )
        )}

        {/* Edit */}
        {onEdit && (
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit} title="Edit User">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {/* Delete */}
        {onDelete && (
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={onDelete} title="Delete User">
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
          avatarChar={a.name?.[0]?.toUpperCase() || 'U'}
          title={a.name || 'Unknown User'}
          subtitle={`@${a.username || 'user'}`}
          badge={roleName}
          status={status}
          sections={[
            {
              title: 'Account',
              fields: [
                { label: 'Full Name', value: a.name },
                { label: 'Username', value: a.username ? `@${a.username}` : null },
                { label: 'Email', value: a.email },
                { label: 'Role', value: roleName },
              ],
            },
            {
              title: 'Contact',
              fields: [
                { label: 'Phone', value: a.phone },
                { label: 'Address', value: a.address, fullWidth: true },
                { label: 'Country', value: a.country?.name },
                { label: 'Business', value: a.business?.name },
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
