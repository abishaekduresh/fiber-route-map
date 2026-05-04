'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  SupportTicketData,
  TicketMessageData,
  getTicketMessages,
  addTicketMessage,
  closeSupportTicket,
} from '@/lib/api';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened',
};

interface Props {
  ticket: SupportTicketData;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SupportTicketDetail({ ticket, onClose, onUpdate }: Props) {
  const [messages, setMessages] = useState<TicketMessageData[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = useTenantPermissions();

  const canUpdate = hasPermission('support_ticket.update');
  const canCreate = hasPermission('support_ticket.create');
  const isClosed = ['resolved', 'closed'].includes(ticket.attributes.status);

  const a = ticket.attributes;
  const priorityColor = PRIORITY_COLORS[a.priority] || '#64748b';

  const loadMessages = async () => {
    setMsgLoading(true);
    try {
      const res = await getTicketMessages(ticket.id);
      if (res.success && Array.isArray(res.data)) setMessages(res.data);
    } catch { /* ignore */ }
    finally { setMsgLoading(false); }
  };

  useEffect(() => { loadMessages(); }, [ticket.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await addTicketMessage(ticket.id, { message: replyText.trim() });
      if (res.success) {
        setReplyText('');
        await loadMessages();
      } else {
        toast.error((res as any).message ?? 'Failed to send message');
      }
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    setClosing(true);
    try {
      const res = await closeSupportTicket(ticket.id);
      if (res.success) {
        toast.success('Ticket closed');
        onUpdate();
      } else {
        toast.error((res as any).message ?? 'Failed to close ticket');
      }
    } catch { toast.error('Failed to close ticket'); }
    finally { setClosing(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader} style={{ flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                {a.ticketNumber}
              </span>
              <span className={`${styles.statusBadge} ${styles['status-' + a.status.replace('_', '-')]}`}>
                {STATUS_LABELS[a.status] || a.status}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: priorityColor }}>
                {a.priority.toUpperCase()}
              </span>
            </div>
            <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: '1rem' }} title={a.subject}>
              {a.subject}
            </h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <span>Category: <strong>{a.category}</strong></span>
            <span>Impact: <strong>{a.impactLevel}</strong></span>
            {a.dueAt && (
              <span>Due: <strong style={{ color: new Date(a.dueAt) < new Date() && !isClosed ? '#ef4444' : undefined }}>
                {new Date(a.dueAt).toLocaleString()}
              </strong></span>
            )}
            {a.assigneeName && <span>Assigned to: <strong>{a.assigneeName}</strong></span>}
          </div>

          {/* Description */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1.25rem',
            fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {a.description}
          </div>

          {/* Resolution notes */}
          {a.resolutionNotes && (
            <div style={{
              background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}>
              <strong style={{ color: '#4ade80' }}>Resolution Notes:</strong>
              <p style={{ margin: '0.25rem 0 0', lineHeight: '1.5' }}>{a.resolutionNotes}</p>
            </div>
          )}

          {/* Messages */}
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Messages
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', minHeight: '80px' }}>
            {msgLoading ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No messages yet.</p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderType === 'admin';
                return (
                  <div key={msg.id} style={{
                    alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '78%',
                    background: isAdmin ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.12)',
                    border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.25)' : 'rgba(59,130,246,0.25)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.625rem 0.875rem',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      {isAdmin ? 'Support Admin' : 'You'} · {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.45', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
          {!isClosed && canCreate && (
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.625rem', marginBottom: canUpdate ? '0.75rem' : 0 }}>
              <textarea
                className={styles.input}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                style={{ flex: 1, resize: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(e as any);
                }}
              />
              <button type="submit" className={styles.submitBtn} disabled={sending || !replyText.trim()} style={{ alignSelf: 'flex-end' }}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
            <button className={styles.cancelBtn} onClick={onClose}>Close Panel</button>
            {!isClosed && canUpdate && (
              <button
                className={styles.submitBtn}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                onClick={handleClose}
                disabled={closing}
              >
                {closing ? 'Closing...' : 'Close Ticket'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
