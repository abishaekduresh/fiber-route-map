'use client';

import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Permission {
  id: string;
  type: string;
  attributes: {
    name: string;
    slug: string;
    resource: string;
    description: string | null;
  };
  meta: {
    createdAt: string;
    updatedAt: string;
  };
}

interface PermissionCardProps {
  permission: Permission;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

export default function PermissionCard({ permission, onEdit, onDelete }: PermissionCardProps) {
  const { name, slug, resource, description } = permission.attributes;

  return (
    <div className={styles.statCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{name}</h4>
          <code style={{ fontSize: '0.75rem', color: 'var(--color-accent-blue)', opacity: 0.8 }}>{slug}</code>
        </div>
        <div style={{ 
          fontSize: '0.65rem', 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: 'var(--color-accent-blue)',
          padding: '4px 10px', 
          borderRadius: '20px', 
          textTransform: 'uppercase',
          fontWeight: 800,
          letterSpacing: '0.05em'
        }}>
          {resource}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
          {description || 'No specialized description provided for this permission.'}
        </p>
      </div>

      <div className={styles.actionCell} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => onEdit(permission)} title="Edit Permission">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(permission)} title="Delete Permission">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
