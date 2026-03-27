'use client';

import { useState, useEffect } from 'react';
import { getCountries, getRoles, createUser, updateUser, ApiResponse } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any; // If provided, we are in Edit mode
}

export default function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const isEdit = !!user;
  const [countries, setCountries] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    countryUuid: '',
    roleUuids: [] as string[],
    sessionLimit: 1
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesRes, rolesRes] = await Promise.all([
          getCountries(),
          getRoles()
        ]);

        if (countriesRes.success) setCountries(countriesRes.data || []);
        if (rolesRes.success) setRoles(rolesRes.data || []);
      } catch (err) {
        console.error('Error fetching form data:', err);
      } finally {
        setIsFetchingData(false);
      }
    };

    if (isOpen) {
      fetchData();
      if (user) {
        setFormData({
          name: user.attributes?.name || '',
          username: user.attributes?.username || '',
          email: user.attributes?.email || '',
          phone: user.attributes?.phone || '',
          password: '',
          confirmPassword: '',
          countryUuid: user.attributes?.country?.id || '',
          roleUuids: user.attributes?.roles?.map((r: any) => r.uuid) || [],
          sessionLimit: user.attributes?.sessionLimit ?? 1
        });
      } else {
        setFormData({
          name: '',
          username: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          countryUuid: '',
          roleUuids: [],
          sessionLimit: 1
        });
      }
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleUuid: string) => {
    setFormData(prev => ({
      ...prev,
      roleUuids: [roleUuid] // Only allow one role
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!isEdit && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let result: ApiResponse;
      if (isEdit) {
        // Prepare update data (password optional)
        const updateData: any = { 
          ...formData,
          sessionLimit: Number(formData.sessionLimit)
        };
        if (!formData.password) {
          delete updateData.password;
          delete updateData.confirmPassword;
        }
        result = await updateUser(user.id, updateData);
      } else {
        result = await createUser({
          ...formData,
          sessionLimit: Number(formData.sessionLimit)
        });
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? 'Edit User' : 'Create New User'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            {error && <div className={styles.errorText} style={{ marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" name="name" className={styles.input} required 
                  value={formData.name} onChange={handleChange} placeholder="John Doe"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input 
                  type="text" name="username" className={styles.input} required 
                  value={formData.username} onChange={handleChange} placeholder="johndoe"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  type="email" name="email" className={styles.input} required 
                  value={formData.email} onChange={handleChange} placeholder="john@example.com"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Number</label>
                <input 
                  type="tel" name="phone" className={styles.input} 
                  value={formData.phone} onChange={handleChange} placeholder="+1234567890"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{isEdit ? 'New Password (Optional)' : 'Password'}</label>
                <input 
                  type="password" name="password" className={styles.input} required={!isEdit}
                  value={formData.password} onChange={handleChange} placeholder="••••••••"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input 
                  type="password" name="confirmPassword" className={styles.input} required={!isEdit && formData.password !== ''}
                  value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Max Session Limit</label>
                <input 
                  type="number" name="sessionLimit" className={styles.input} required min="1" max="10"
                  value={formData.sessionLimit} onChange={handleChange} 
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Country</label>
                <select 
                  name="countryUuid" className={styles.select} required
                  value={formData.countryUuid} onChange={handleChange}
                >
                  <option value="">Select a country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.attributes?.name} ({c.attributes?.phoneCode})</option>
                  ))}
                </select>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>System Roles</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {roles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleChange(role.id)}
                      className={`${styles.statusBadge} ${formData.roleUuids.includes(role.id) ? styles['status-active'] : ''}`}
                      style={{ 
                        cursor: 'pointer', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      {role.attributes?.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading || isFetchingData}>
              {isLoading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
