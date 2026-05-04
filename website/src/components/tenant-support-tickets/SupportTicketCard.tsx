'use client';

import { SupportTicketData } from '@/lib/api';
import styles from '@/components/users/UserCard.module.css';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

interface Props {
  ticket: SupportTicketData;
  onClick: () => void;
}

export default function SupportTicketCard({ ticket, onClick }: Props) {
  const a = ticket.attributes;
  const meta = ticket.meta;
  const status = a.status || 'open';
  const priority = a.priority || 'medium';
  const priorityColor = PRIORITY_COLORS[priority] || '#64748b';
  const isOverdue = a.dueAt && new Date(a.dueAt) < new Date() && !['resolved', 'closed'].includes(status);

  return (
    <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar} style={{ background: priorityColor, fontSize: '0.75rem', fontWeight: 700 }}>
          {priority.toUpperCase().slice(0, 3)}
        </div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName} title={a.subject} style={{ fontSize: '0.95rem' }}>{a.subject}</h3>
          <div className={styles.roleBadge}>{a.ticketNumber}</div>
          <div className={styles.userHandle}>{a.category} · {a.impactLevel} impact</div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusBadge} ${styles['status-' + status.replace('_', '-')]}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Priority</span>
          <span style={{ color: priorityColor, fontWeight: 600, fontSize: '0.8rem' }}>
            {priority.toUpperCase()}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Due</span>
          <span className={styles.detailValue} style={{ color: isOverdue ? '#ef4444' : undefined }}>
            {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'N/A'}
            {isOverdue && ' ⚠'}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Created</span>
          <span className={styles.detailValue}>
            {meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
