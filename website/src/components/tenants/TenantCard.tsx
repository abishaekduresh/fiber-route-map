'use client';

import { useState } from 'react';
import { Can } from '@/components/auth/Can';
import ViewModal from '@/components/ui/ViewModal';
import styles from '@/components/users/UserCard.module.css';

interface TenantCardProps {
  tenant: any;
  onEdit: (tenant: any) => void;
  onDelete: (tenant: any) => void;
  onBlock: (tenant: any) => void;
  onUnblock: (tenant: any) => void;
  onSuspend: (tenant: any) => void;
  onSwitchToDashboard: (tenant: any) => void;
}

export default function TenantCard({ tenant, onEdit, onDelete, onBlock, onUnblock, onSuspend, onSwitchToDashboard }: TenantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const attributes = tenant.attributes || {};
  const meta = tenant.meta || {};
  const status = (attributes.status || 'active').toLowerCase();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{attributes.name?.[0]?.toUpperCase() || 'T'}</div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={attributes.name}>{attributes.name || 'Unknown Tenant'}</h3>
          <div className={styles.roleBadge}>{attributes.role?.name || 'Tenant'}</div>
          <div className={styles.userHandle}>@{attributes.username || 'tenant'}</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue} title={attributes.email}>{attributes.email || 'N/A'}</span>
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
              <span className={styles.detailLabel}>Address</span>
              <span className={styles.expandedValue}>{attributes.address || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Business</span>
              <span className={styles.expandedValue}>{attributes.business?.name || 'None'}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        {status === 'active' && (
          <button
            className={`${styles.actionBtn}`}
            onClick={() => onSwitchToDashboard(tenant)}
            title="Switch to Tenant Dashboard"
            style={{ color: '#10b981' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        )}

        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setIsViewOpen(true)} title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <button className={styles.actionBtn} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Show Less' : 'Show More'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <Can I="tenant.update">
          {status === 'active' ? (
            <button className={`${styles.actionBtn} ${styles.blockBtn}`} onClick={() => onBlock(tenant)} title="Block Tenant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </button>
          ) : status === 'blocked' ? (
            <button className={`${styles.actionBtn} ${styles.unblockBtn}`} onClick={() => onUnblock(tenant)} title="Unblock Tenant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" />
              </svg>
            </button>
          ) : status === 'suspended' ? (
            <button className={`${styles.actionBtn} ${styles.unblockBtn}`} onClick={() => onUnblock(tenant)} title="Reactivate Tenant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ) : null}
        </Can>

        <Can I="tenant.update">
          {status === 'active' && (
            <button className={`${styles.actionBtn} ${styles.suspendBtn}`} onClick={() => onSuspend(tenant)} title="Suspend Tenant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
              </svg>
            </button>
          )}
        </Can>

        <Can I="tenant.update">
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => onEdit(tenant)} title="Edit Tenant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </Can>

        <Can I="tenant.delete">
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(tenant)} title="Delete Tenant">
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
          avatarChar={attributes.name?.[0]?.toUpperCase() || 'T'}
          title={attributes.name || 'Unknown Tenant'}
          subtitle={`@${attributes.username || 'tenant'}`}
          badge={attributes.role?.name || 'Tenant'}
          status={status}
          sections={[
            {
              title: 'Account',
              fields: [
                { label: 'Full Name', value: attributes.name },
                { label: 'Username', value: attributes.username ? `@${attributes.username}` : null },
                { label: 'Email', value: attributes.email },
                { label: 'Role', value: attributes.role?.name },
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
