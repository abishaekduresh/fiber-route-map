'use client';

import React from 'react';
import styles from './RoleCard.module.css';

/**
 * RoleCard Component — Display details for a system role.
 */
export default function RoleCard({ 
  role, 
  onEdit, 
  onDelete 
}: { 
  role: any; 
  onEdit: (role: any) => void;
  onDelete: (role: any) => void;
}) {
  const attributes = role.attributes || {};
  const permissionsCount = attributes.permissions?.length || 0;
  const isDefaultRole = ['admin', 'manager', 'member'].includes(attributes.slug);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className={styles.roleInfo}>
          <h3 className={styles.roleName}>{attributes.name}</h3>
          <div className={styles.roleSlug}>/{attributes.slug}</div>
        </div>
        <div className={styles.statusBadge}>
          {permissionsCount} {permissionsCount === 1 ? 'Permission' : 'Permissions'}
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Description</span>
          <span className={styles.detailValue} title={attributes.description}>
            {attributes.description || 'No description provided.'}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button 
          className={`${styles.actionBtn} ${styles.editBtn}`} 
          title="Edit Role" 
          onClick={() => onEdit(role)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {!isDefaultRole && (
          <button 
            className={`${styles.actionBtn} ${styles.deleteBtn}`} 
            title="Delete Role"
            onClick={() => onDelete(role)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6m4-6v6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
