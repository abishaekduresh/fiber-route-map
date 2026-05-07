'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createDeviceCategory, updateDeviceCategory, DeviceCategoryData } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceCategory?: DeviceCategoryData | null;
}

interface FormState {
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
}

const EMPTY: FormState = { name: '', code: '', description: '', status: 'active' };

export default function DeviceCategoryModal({ isOpen, onClose, onSuccess, deviceCategory }: Props) {
  const isEditing = Boolean(deviceCategory);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (deviceCategory) {
      const a = deviceCategory.attributes;
      setForm({
        name: a.name ?? '',
        code: a.code ?? '',
        description: a.description ?? '',
        status: (a.status === 'active' || a.status === 'inactive') ? a.status : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [isOpen, deviceCategory]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || null,
        ...(isEditing ? { status: form.status } : {}),
      };

      if (isEditing && deviceCategory) {
        const res = await updateDeviceCategory(deviceCategory.id, payload);
        if (!res.success) throw new Error((res as any).message ?? 'Update failed');
        toast.success('Device category updated successfully');
      } else {
        const res = await createDeviceCategory(payload);
        if (!res.success) throw new Error((res as any).message ?? 'Create failed');
        toast.success('Device category created successfully');
      }
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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? 'Edit Device Category' : 'Add Device Category'}
          </h3>
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
                <label className={styles.label}>Category Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.name}
                  onChange={set('name')}
                  required
                  placeholder="e.g. Router"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Code *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.code}
                  onChange={set('code')}
                  required
                  placeholder="e.g. TDC01"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  Unique per business (e.g. TDC01, TDC02)
                </span>
              </div>

              {isEditing && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.select} value={form.status} onChange={set('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.input}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Optional description..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '72px' }}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Processing...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
