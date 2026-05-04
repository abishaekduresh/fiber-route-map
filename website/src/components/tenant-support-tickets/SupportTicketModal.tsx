'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createSupportTicket } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  subject: string;
  description: string;
  category: string;
  priority: string;
  impactLevel: string;
  relatedNodeId: string;
  relatedRouteId: string;
  relatedCustomerId: string;
}

const EMPTY: FormState = {
  subject: '',
  description: '',
  category: 'technical',
  priority: 'medium',
  impactLevel: 'medium',
  relatedNodeId: '',
  relatedRouteId: '',
  relatedCustomerId: '',
};

export default function SupportTicketModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setForm(EMPTY); setError(null); }
  }, [isOpen]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const payload: any = {
        subject: form.subject,
        description: form.description,
        category: form.category,
        priority: form.priority,
        impactLevel: form.impactLevel,
      };
      if (form.relatedNodeId.trim()) payload.relatedNodeId = form.relatedNodeId.trim();
      if (form.relatedRouteId.trim()) payload.relatedRouteId = form.relatedRouteId.trim();
      if (form.relatedCustomerId.trim()) payload.relatedCustomerId = form.relatedCustomerId.trim();

      const res = await createSupportTicket(payload);
      if (!res.success) throw new Error((res as any).message ?? 'Create failed');
      toast.success('Support ticket created successfully');
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? 'An unexpected error occurred.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Raise Support Ticket</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            {error && (
              <div style={{ padding: '0.75rem', marginBottom: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Subject *</label>
                <input type="text" className={styles.input} value={form.subject} onChange={set('subject')} required placeholder="Brief description of the issue" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Category *</label>
                <select className={styles.select} value={form.category} onChange={set('category')} required>
                  <option value="network">Network</option>
                  <option value="fiber">Fiber</option>
                  <option value="iptv">IPTV</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Priority</label>
                <select className={styles.select} value={form.priority} onChange={set('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Impact Level</label>
                <select className={styles.select} value={form.impactLevel} onChange={set('impactLevel')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description *</label>
                <textarea
                  className={styles.input}
                  value={form.description}
                  onChange={set('description')}
                  required
                  placeholder="Detailed description of the issue, steps to reproduce, etc."
                  rows={4}
                  style={{ resize: 'vertical', minHeight: '96px' }}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Related Node ID</label>
                <input type="text" className={styles.input} value={form.relatedNodeId} onChange={set('relatedNodeId')} placeholder="Optional" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Related Route ID</label>
                <input type="text" className={styles.input} value={form.relatedRouteId} onChange={set('relatedRouteId')} placeholder="Optional" />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Related Customer ID</label>
                <input type="text" className={styles.input} value={form.relatedCustomerId} onChange={set('relatedCustomerId')} placeholder="Optional" />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
