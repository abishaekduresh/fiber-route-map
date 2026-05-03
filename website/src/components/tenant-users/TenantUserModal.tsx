'use client';

import { useState, useEffect } from 'react';
import {
  createTenantUser,
  updateTenantUser,
  getTenantRoles,
  getTenantCountries,
  TenantUserData,
  TenantRoleData,
} from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: TenantUserData | null;
}

interface FormState {
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  countryUuid: string;
  roleUuid: string;
}

const EMPTY: FormState = {
  name: '', username: '', email: '', phone: '', address: '',
  password: '', confirmPassword: '', countryUuid: '', roleUuid: '',
};

export default function TenantUserModal({ isOpen, onClose, onSuccess, user }: Props) {
  const isEditing = Boolean(user);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [roles, setRoles] = useState<TenantRoleData[]>([]);
  const [countries, setCountries] = useState<{ id: string; attributes: { name: string } }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch roles + countries
    Promise.all([getTenantRoles(), getTenantCountries()]).then(([rolesRes, countriesRes]) => {
      if (rolesRes.success && Array.isArray(rolesRes.data)) setRoles(rolesRes.data);
      if (countriesRes.success && Array.isArray(countriesRes.data)) setCountries(countriesRes.data);
    });

    // Pre-fill for edit
    if (user) {
      setForm({
        name: user.attributes.name ?? '',
        username: user.attributes.username ?? '',
        email: user.attributes.email ?? '',
        phone: user.attributes.phone ?? '',
        address: user.attributes.address ?? '',
        password: '',
        confirmPassword: '',
        countryUuid: user.attributes.country?.uuid ?? '',
        roleUuid: (user.attributes.role as any)?.uuid ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [isOpen, user]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditing && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && user) {
        const data: Parameters<typeof updateTenantUser>[1] = {
          name: form.name,
          username: form.username || undefined,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          countryUuid: form.countryUuid || undefined,
          roleUuid: form.roleUuid || undefined,
        };
        const res = await updateTenantUser(user.id, data);
        if (!res.success) throw new Error((res as any).message ?? 'Update failed');
      } else {
        const res = await createTenantUser({
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          password: form.password,
          countryUuid: form.countryUuid || undefined,
          roleUuid: form.roleUuid || undefined,
        });
        if (!res.success) throw new Error((res as any).message ?? 'Create failed');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--color-bg-input, rgba(255,255,255,0.04))',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
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
        {/* Modal header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            {isEditing ? 'Edit User' : 'Create New User'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', padding: '0.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ padding: '1.75rem' }}>
          {/* Hidden honeypot fields to defeat autocomplete */}
          <input type="text" name="fake_user" style={{ display: 'none' }} readOnly />
          <input type="password" name="fake_pass" style={{ display: 'none' }} readOnly />

          {error && (
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: '#f87171' }}>*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="off"
                placeholder="John Doe"
                style={inputStyle}
              />
            </div>

            {/* Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                autoComplete="off"
                placeholder="john_doe (auto-generated if blank)"
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#f87171' }}>*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="off"
                placeholder="john@example.com"
                style={inputStyle}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="off"
                placeholder="+1 234 567 8900"
                style={inputStyle}
              />
            </div>

            {/* Password (create only) */}
            {!isEditing && (
              <>
                <div>
                  <label style={labelStyle}>Password <span style={{ color: '#f87171' }}>*</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password <span style={{ color: '#f87171' }}>*</span></label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {/* Address (full width) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input
                type="text"
                value={form.address}
                onChange={set('address')}
                autoComplete="off"
                placeholder="123 Main St, City"
                style={inputStyle}
              />
            </div>

            {/* Country */}
            <div>
              <label style={labelStyle}>Country</label>
              <select
                value={form.countryUuid}
                onChange={set('countryUuid')}
                autoComplete="off"
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select country…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.attributes.name}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label style={labelStyle}>Role</label>
              <select
                value={form.roleUuid}
                onChange={set('roleUuid')}
                autoComplete="off"
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer buttons */}
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
                padding: '0.625rem 1.25rem',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
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
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Processing…' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
