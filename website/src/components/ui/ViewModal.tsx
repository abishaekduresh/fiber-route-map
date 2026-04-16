'use client';

import styles from './ViewModal.module.css';

export interface ViewField {
  label: string;
  value?: string | null;
  fullWidth?: boolean;
}

export interface ViewSection {
  title: string;
  fields: ViewField[];
}

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarChar: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeStyle?: React.CSSProperties;
  status?: string;
  sections: ViewSection[];
}

export default function ViewModal({
  isOpen,
  onClose,
  avatarChar,
  title,
  subtitle,
  badge,
  badgeStyle,
  status,
  sections,
}: ViewModalProps) {
  if (!isOpen) return null;

  const statusKey = (status || '').toLowerCase();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <div className={styles.avatar}>{avatarChar}</div>
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            <div className={styles.badgeRow}>
              {badge && <span className={styles.badge} style={badgeStyle}>{badge}</span>}
              {status && (
                <span className={`${styles.statusBadge} ${styles['status-' + statusKey]}`}>
                  {status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {sections.map(section => (
            <div key={section.title} className={styles.section}>
              <div className={styles.sectionTitle}>{section.title}</div>
              <div className={styles.fieldsGrid}>
                {section.fields.map((field, i) => (
                  <div key={i} className={`${styles.field} ${field.fullWidth ? styles.fullWidth : ''}`}>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <span className={`${styles.fieldValue} ${!field.value ? styles.empty : ''}`}>
                      {field.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeFooterBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
