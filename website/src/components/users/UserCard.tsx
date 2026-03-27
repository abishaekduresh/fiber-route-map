'use client';

import { useState } from 'react';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: any;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const attributes = user.attributes || {};
  const meta = user.meta || {};
  const status = (attributes.status || 'active').toLowerCase();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {attributes.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>{attributes.name || 'Unknown User'}</h3>
          <div className={styles.userHandle}>@{attributes.username || 'user'}</div>
        </div>
        <div className={styles.roleBadge}>
          {attributes.roles?.[0]?.name || 'Member'}
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue} title={attributes.email}>{attributes.email || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Phone</span>
          <span className={styles.detailValue}>{attributes.phone || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status]}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Sessions</span>
          <span className={styles.detailValue}>{attributes.sessionLimit ?? 1} Max</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.extraDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Country</span>
              <span className={styles.expandedValue}>
                {attributes.country ? `${attributes.country.name} (${attributes.country.phoneCode})` : 'N/A'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Joined</span>
              <span className={styles.expandedValue}>
                {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        <button 
          className={styles.actionBtn} 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Show Less" : "Show More Details"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button 
          className={`${styles.actionBtn} ${styles.editBtn}`} 
          onClick={() => onEdit(user)}
          title="Edit User"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button 
          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
          onClick={() => onDelete(user)}
          title="Delete User"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
