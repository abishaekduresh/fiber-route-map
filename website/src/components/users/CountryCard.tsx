'use client';

import { useState } from 'react';
import styles from './UserCard.module.css';

interface CountryCardProps {
  country: any;
  onEdit: (country: any) => void;
  onDelete: (country: any) => void;
  onBlock: (country: any) => void;
  onUnblock: (country: any) => void;
}

export default function CountryCard({ country, onEdit, onDelete, onBlock, onUnblock }: CountryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const attributes = country.attributes || {};
  const meta = country.meta || {};
  const status = (attributes.status || 'active').toLowerCase();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          {attributes.code || '??'}
        </div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>{attributes.name || 'Unknown Country'}</h3>
          <div className={styles.userHandle}>Code: {attributes.code} • Dialing: {attributes.phoneCode}</div>
        </div>
        <div className={`${styles.statusBadge} ${styles['status-' + status]}`}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>ISO Code</span>
          <span className={styles.detailValue}>{attributes.code}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Phone Code</span>
          <span className={styles.detailValue}>{attributes.phoneCode}</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.extraDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.expandedValue}>
                {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Updated</span>
              <span className={styles.expandedValue}>
                {meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString() : 'N/A'}
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

        {status === 'active' ? (
          <button 
            className={styles.actionBtn} 
            onClick={() => onBlock(country)}
            title="Block Country"
            style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>
        ) : (
          <button 
            className={styles.actionBtn} 
            onClick={() => onUnblock(country)}
            title="Unblock Country"
            style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" />
            </svg>
          </button>
        )}

        <button 
          className={`${styles.actionBtn} ${styles.editBtn}`} 
          onClick={() => onEdit(country)}
          title="Edit Country"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button 
          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
          onClick={() => onDelete(country)}
          title="Delete Country"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
