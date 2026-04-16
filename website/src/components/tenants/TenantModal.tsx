'use client';

import { useState, useEffect } from 'react';
import { getCountries, getRoles, createTenant, updateTenant, ApiResponse } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';
import { toast } from 'sonner';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant?: any;
}

export default function TenantModal({ isOpen, onClose, onSuccess, tenant }: TenantModalProps) {
  const isEdit = !!tenant;
  const [countries, setCountries] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    countryUuid: '',
    roleUuid: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        const [countriesRes, rolesRes] = await Promise.all([getCountries(), getRoles()]);
        if (countriesRes.success) setCountries(countriesRes.data || []);
        if (rolesRes.success) setRoles(rolesRes.data || []);
      } catch (err) {
        console.error('Error fetching form data:', err);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();

    if (tenant) {
      setFormData({
        name: tenant.attributes?.name || '',
        username: tenant.attributes?.username || '',
        email: tenant.attributes?.email || '',
        address: tenant.attributes?.address || '',
        password: '',
        confirmPassword: '',
        countryUuid: tenant.attributes?.country?.uuid || '',
        roleUuid: tenant.attributes?.role?.uuid || '',
      });
    } else {
      setFormData({ name: '', username: '', email: '', address: '', password: '', confirmPassword: '', countryUuid: '', roleUuid: '' });
    }
  }, [isOpen, tenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      let result: ApiResponse;
      if (isEdit) {
        const updateData: any = { name: formData.name, username: formData.username, email: formData.email, address: formData.address, countryUuid: formData.countryUuid || undefined, roleUuid: formData.roleUuid || undefined };
        if (formData.password) updateData.password = formData.password;
        result = await updateTenant(tenant.id, updateData);
      } else {
        result = await createTenant({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          address: formData.address,
          password: formData.password,
          countryUuid: formData.countryUuid || undefined,
          roleUuid: formData.roleUuid || undefined,
        });
      }

      if (result.success) {
        toast.success(isEdit ? 'Tenant updated successfully' : 'Tenant created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? 'Edit Tenant' : 'Create New Tenant'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <input type="text" name="name" className={styles.input} required value={formData.name} onChange={handleChange} placeholder="John Doe" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input type="text" name="username" className={styles.input} required value={formData.username} onChange={handleChange} placeholder="johndoe" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input type="email" name="email" className={styles.input} required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{isEdit ? 'New Password (Optional)' : 'Password'}</label>
                <input type="password" name="password" className={styles.input} required={!isEdit} value={formData.password} onChange={handleChange} placeholder="••••••••" />
              </div>

              {(!isEdit || formData.password) && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Confirm Password</label>
                  <input type="password" name="confirmPassword" className={styles.input} required={!isEdit} value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                </div>
              )}

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Address</label>
                <input type="text" name="address" className={styles.input} required value={formData.address} onChange={handleChange} placeholder="123 Main St, City" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Country</label>
                <select name="countryUuid" className={styles.select} value={formData.countryUuid} onChange={handleChange}>
                  <option value="">Select a country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.attributes?.name} ({c.attributes?.phoneCode})</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Role</label>
                <select name="roleUuid" className={styles.select} value={formData.roleUuid} onChange={handleChange}>
                  <option value="">Select a role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.attributes?.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading || isFetchingData}>
              {isLoading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create Tenant')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
