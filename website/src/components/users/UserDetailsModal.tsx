'use client';

import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const attributes = user.attributes || {};
  const meta = user.meta || {};

  const DetailItem = ({ label, value, fullWidth = false }: { label: string; value: any; fullWidth?: boolean }) => (
    <div className={`${styles.inputGroup} ${fullWidth ? styles.fullWidth : ''}`}>
      <label className={styles.label}>{label}</label>
      <div style={{ 
        background: 'var(--color-bg-glass)', 
        border: '1px solid var(--color-border)', 
        borderRadius: '10px', 
        padding: '0.75rem 1rem',
        color: 'var(--color-text-primary)',
        fontSize: '0.95rem',
        minHeight: '2.5rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        {value || <span style={{ color: 'var(--color-text-muted)' }}>Not provided</span>}
      </div>
    </div>
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.25rem', color: '#fff'
            }}>
              {attributes.name?.[0] || 'U'}
            </div>
            <div>
              <h3 className={styles.modalTitle}>{attributes.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>User ID: {user.id}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.formGrid}>
            <DetailItem label="Full Name" value={attributes.name} />
            <DetailItem label="Username" value={`@${attributes.username}`} />
            <DetailItem label="Email Address" value={attributes.email} />
            <DetailItem label="Phone Number" value={attributes.phone} />
            <DetailItem label="Account Status" value={
              <span className={`${styles.statusBadge} ${styles['status-' + (attributes.status || 'active')]}`}>
                {attributes.status || 'Active'}
              </span>
            } />
            <DetailItem label="Max Sessions" value={attributes.sessionLimit} />
            
            <DetailItem 
              label="Country" 
              fullWidth 
              value={attributes.country ? `${attributes.country.name} (${attributes.country.phoneCode})` : 'None'} 
            />

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>System Roles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {attributes.roles?.map((role: any) => (
                  <span key={role.uuid} className={`${styles.statusBadge} ${styles['status-active']}`}>
                    {role.name}
                  </span>
                )) || <span style={{ color: 'var(--color-text-muted)' }}>No roles assigned</span>}
              </div>
            </div>

            <div className={styles.fullWidth} style={{ 
              marginTop: '1rem', 
              padding: '1.5rem', 
              background: 'var(--color-bg-glass)', 
              borderRadius: '15px',
              border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ color: 'var(--color-text-primary)', fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>System Timestamps</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className={styles.label} style={{ fontSize: '0.75rem' }}>Created At</label>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{meta.createdAt ? new Date(meta.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <label className={styles.label} style={{ fontSize: '0.75rem' }}>Last Updated</label>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Close Directory</button>
        </div>
      </div>
    </div>
  );
}
