'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createLco, updateLco, LcoData, getTenantCountries } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lco?: LcoData | null;
}

interface FormState {
  lcoName: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  countryUuid: string;
  status: 'active' | 'inactive';
}

const EMPTY: FormState = {
  lcoName: '', phone: '', email: '', address_line1: '',
  city: '', state: '', pincode: '', countryUuid: '', status: 'active',
};

export default function LcoModal({ isOpen, onClose, onSuccess, lco }: Props) {
  const isEditing = Boolean(lco);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [countries, setCountries] = useState<{ id: string; attributes: { name: string } }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    getTenantCountries().then((res) => {
      if (res.success && Array.isArray(res.data)) setCountries(res.data);
    });

    if (lco) {
      setForm({
        lcoName: lco.attributes.lcoName ?? '',
        phone: lco.attributes.phone ?? '',
        email: lco.attributes.email ?? '',
        address_line1: lco.attributes.address_line1 ?? '',
        city: lco.attributes.city ?? '',
        state: lco.attributes.state ?? '',
        pincode: lco.attributes.pincode ?? '',
        countryUuid: (lco.attributes as any).countryUuid ?? '',
        status: lco.attributes.status === 'active' ? 'active' : 'inactive',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [isOpen, lco]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = { ...form };

      if (isEditing && lco) {
        const res = await updateLco(lco.id, data);
        if (!res.success) throw new Error((res as any).message ?? 'Update failed');
        toast.success('LCO updated successfully');
      } else {
        const res = await createLco(data);
        if (!res.success) throw new Error((res as any).message ?? 'Create failed');
        toast.success('LCO created successfully');
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--color-bg-input)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    colorScheme: 'dark',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.375rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-secondary, #1a1a2e)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            {isEditing ? 'Edit LCO' : 'Create New LCO'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', padding: '0.25rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>LCO Name *</label>
              <input type="text" value={form.lcoName} onChange={set('lcoName')} required placeholder="LCO Name" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Phone *</label>
              <input type="tel" value={form.phone} onChange={set('phone')} required placeholder="Phone Number" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="Email Address" style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address Line 1 *</label>
              <input type="text" value={form.address_line1} onChange={set('address_line1')} required placeholder="Address" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>City *</label>
              <input type="text" value={form.city} onChange={set('city')} required placeholder="City" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>State *</label>
              <input type="text" value={form.state} onChange={set('state')} required placeholder="State" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Pincode *</label>
              <input type="text" value={form.pincode} onChange={set('pincode')} required placeholder="Pincode" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Country</label>
              <select value={form.countryUuid} onChange={set('countryUuid')} style={inputStyle}>
                <option value="">Select country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.attributes.name}</option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={set('status')} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            marginTop: '1.75rem', paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.625rem 1.25rem', background: 'transparent',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none', borderRadius: 'var(--radius-md)',
                color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 700,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Processing...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
