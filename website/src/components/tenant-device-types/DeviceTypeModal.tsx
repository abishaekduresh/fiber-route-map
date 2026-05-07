'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createDeviceType, updateDeviceType, DeviceTypeData, DeviceCategoryData, getDeviceCategories } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceType?: DeviceTypeData | null;
}

const ICONS = ['📡', '🖥️', '🔌', '📶', '🔧', '⚡', '🛰️', '📟', '🔗', '💡', '🖧', '📦'];

const BOOL_FIELDS = [
  { key: 'isModelNumberRequired',  label: 'Model Number Required' },
  { key: 'isSerialNumberRequired', label: 'Serial Number Required' },
  { key: 'isMacAddressRequired',   label: 'MAC Address Required' },
  { key: 'isIPAddressRequired',    label: 'IP Address Required' },
  { key: 'isGpsLocationRequired',  label: 'GPS Location Required' },
] as const;

type BoolKey = typeof BOOL_FIELDS[number]['key'];

interface FormState {
  tenantDeviceCategoryId: string;
  name: string;
  isModelNumberRequired: boolean;
  isSerialNumberRequired: boolean;
  isMacAddressRequired: boolean;
  isIPAddressRequired: boolean;
  isGpsLocationRequired: boolean;
  icon: string;
  description: string;
  status: 'active' | 'inactive';
}

const EMPTY: FormState = {
  tenantDeviceCategoryId: '',
  name: '',
  isModelNumberRequired: false,
  isSerialNumberRequired: false,
  isMacAddressRequired: false,
  isIPAddressRequired: false,
  isGpsLocationRequired: false,
  icon: '',
  description: '',
  status: 'active',
};

export default function DeviceTypeModal({ isOpen, onClose, onSuccess, deviceType }: Props) {
  const isEditing = Boolean(deviceType);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<DeviceCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getDeviceCategories({ limit: -1 }).then((res) => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    });

    if (deviceType) {
      const a = deviceType.attributes;
      setForm({
        tenantDeviceCategoryId: String(a.tenantDeviceCategoryId ?? ''),
        name: a.name ?? '',
        isModelNumberRequired: Boolean(a.isModelNumberRequired),
        isSerialNumberRequired: Boolean(a.isSerialNumberRequired),
        isMacAddressRequired: Boolean(a.isMacAddressRequired),
        isIPAddressRequired: Boolean(a.isIPAddressRequired),
        isGpsLocationRequired: Boolean(a.isGpsLocationRequired),
        icon: a.icon ?? '',
        description: a.description ?? '',
        status: (a.status === 'active' || a.status === 'inactive') ? a.status : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [isOpen, deviceType]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const toggleBool = (field: BoolKey) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantDeviceCategoryId) { setError('Category is required'); return; }
    if (!form.name.trim()) { setError('Name is required'); return; }

    setError(null);
    setIsLoading(true);

    try {
      const payload: any = {
        tenantDeviceCategoryId: Number(form.tenantDeviceCategoryId),
        name: form.name,
        isModelNumberRequired: form.isModelNumberRequired,
        isSerialNumberRequired: form.isSerialNumberRequired,
        isMacAddressRequired: form.isMacAddressRequired,
        isIPAddressRequired: form.isIPAddressRequired,
        isGpsLocationRequired: form.isGpsLocationRequired,
        icon: form.icon || null,
        description: form.description || null,
        ...(isEditing ? { status: form.status } : {}),
      };

      if (isEditing && deviceType) {
        const res = await updateDeviceType(deviceType.id, payload);
        if (!res.success) throw new Error((res as any).message ?? 'Update failed');
        toast.success('Device type updated successfully');
      } else {
        const res = await createDeviceType(payload);
        if (!res.success) throw new Error((res as any).message ?? 'Create failed');
        toast.success('Device type created successfully');
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
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? 'Edit Device Type' : 'Add Device Type'}
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
              {/* Category */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Category *</label>
                <select
                  className={styles.select}
                  value={form.tenantDeviceCategoryId}
                  onChange={set('tenantDeviceCategoryId')}
                  required
                >
                  <option value="">— Select Category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.attributes.numericId)}>
                      {cat.attributes.name} ({cat.attributes.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Name *</label>
                <input type="text" className={styles.input} value={form.name} onChange={set('name')} required placeholder="e.g. OLT" />
              </div>

              {/* Status (edit only) */}
              {isEditing && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.select} value={form.status} onChange={set('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Icon picker */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Icon</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {ICONS.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setForm((p) => ({ ...p, icon: p.icon === ic ? '' : ic }))}
                      style={{
                        width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-sm)',
                        border: form.icon === ic ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        background: form.icon === ic ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, icon: '' }))}
                    style={{
                      padding: '0 0.75rem', height: '2.25rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                      color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.75rem',
                    }}
                  >
                    None
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.input}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Optional description..."
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              {/* Boolean toggles */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label} style={{ marginBottom: '0.75rem', display: 'block' }}>Field Requirements &amp; Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {BOOL_FIELDS.map(({ key, label }) => (
                    <label
                      key={key}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{label}</span>
                      <div
                        onClick={() => toggleBool(key)}
                        style={{
                          width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative', cursor: 'pointer',
                          background: form[key] ? '#10b981' : 'rgba(255,255,255,0.15)',
                          transition: 'background 0.2s ease', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '0.175rem', left: form[key] ? 'calc(100% - 1rem - 0.175rem)' : '0.175rem',
                          width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Processing...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
