'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createUpstreamProvider, updateUpstreamProvider, UpstreamProviderData, getTenantCountries } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider?: UpstreamProviderData | null;
}

interface FormState {
  name: string;
  serviceCategory: 'cabletv' | 'bandwidth' | 'iptv' | 'hybrid';
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  countryUuid: string;
  status: 'active' | 'inactive';
}

const EMPTY: FormState = {
  name: '', serviceCategory: 'bandwidth', contactPerson: '',
  phone: '', email: '', addressLine1: '', city: '', state: '',
  countryUuid: '', status: 'active',
};

const SERVICE_CATEGORIES = [
  { value: 'cabletv', label: 'Cable TV' },
  { value: 'bandwidth', label: 'Bandwidth' },
  { value: 'iptv', label: 'IPTV' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function UpstreamProviderModal({ isOpen, onClose, onSuccess, provider }: Props) {
  const isEditing = Boolean(provider);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [countries, setCountries] = useState<{ id: string; attributes: { name: string } }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    getTenantCountries().then((res) => {
      if (res.success && Array.isArray(res.data)) setCountries(res.data);
    });

    if (provider) {
      const a = provider.attributes;
      setForm({
        name: a.name ?? '',
        serviceCategory: a.serviceCategory ?? 'bandwidth',
        contactPerson: a.contactPerson ?? '',
        phone: a.phone ?? '',
        email: a.email ?? '',
        addressLine1: a.addressLine1 ?? '',
        city: a.city ?? '',
        state: a.state ?? '',
        countryUuid: a.country?.uuid ?? '',
        status: (a.status === 'active' || a.status === 'inactive') ? a.status : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [isOpen, provider]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = { ...form };

      if (isEditing && provider) {
        const res = await updateUpstreamProvider(provider.id, data);
        if (!res.success) throw new Error((res as any).message ?? 'Update failed');
        toast.success('Upstream provider updated successfully');
      } else {
        const res = await createUpstreamProvider(data);
        if (!res.success) throw new Error((res as any).message ?? 'Create failed');
        toast.success('Upstream provider created successfully');
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
            {isEditing ? 'Edit Upstream Provider' : 'Add Upstream Provider'}
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
                <label className={styles.label}>Provider Name *</label>
                <input type="text" className={styles.input} value={form.name} onChange={set('name')} required placeholder="Provider Name" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Service Category *</label>
                <select className={styles.select} value={form.serviceCategory} onChange={set('serviceCategory')} required>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Contact Person *</label>
                <input type="text" className={styles.input} value={form.contactPerson} onChange={set('contactPerson')} required placeholder="Contact Person Name" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone *</label>
                <input type="tel" className={styles.input} value={form.phone} onChange={set('phone')} required placeholder="Phone Number" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email *</label>
                <input type="email" className={styles.input} value={form.email} onChange={set('email')} required placeholder="Email Address" />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Address Line 1 *</label>
                <input type="text" className={styles.input} value={form.addressLine1} onChange={set('addressLine1')} required placeholder="Address" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>City *</label>
                <input type="text" className={styles.input} value={form.city} onChange={set('city')} required placeholder="City" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>State *</label>
                <input type="text" className={styles.input} value={form.state} onChange={set('state')} required placeholder="State" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Country</label>
                <select className={styles.select} value={form.countryUuid} onChange={set('countryUuid')}>
                  <option value="">Select country...</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.attributes.name}</option>
                  ))}
                </select>
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
