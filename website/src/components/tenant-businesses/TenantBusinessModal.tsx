'use client';

import { useState, useEffect } from 'react';
import { getCountries, getRoles, createTenant, createTenantBusiness, updateTenantBusiness, ApiResponse } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';
import { toast } from 'sonner';

interface TenantBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  business?: any;
}

const SECTION_DIVIDER_STYLE: React.CSSProperties = {
  gridColumn: '1 / -1',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  margin: '0.5rem 0',
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
};

const SECTION_LINE_STYLE: React.CSSProperties = {
  flex: 1,
  height: '1px',
  background: 'var(--color-border)',
};

const AUTO_ROLE_NOTE_STYLE: React.CSSProperties = {
  gridColumn: '1 / -1',
  fontSize: '0.78rem',
  color: 'var(--color-text-muted)',
  background: 'rgba(59,130,246,0.06)',
  border: '1px solid rgba(59,130,246,0.15)',
  borderRadius: 'var(--radius-md)',
  padding: '0.5rem 0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export default function TenantBusinessModal({ isOpen, onClose, onSuccess, business }: TenantBusinessModalProps) {
  const isEdit = !!business;
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [tenantSuperAdminRoleUuid, setTenantSuperAdminRoleUuid] = useState<string>('');

  // Business fields
  const [bizData, setBizData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'operator' as 'operator' | 'distributor',
    countryUuid: '',
  });

  // Tenant user fields (create only)
  const [tenantData, setTenantData] = useState({
    name: '',
    username: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    countryUuid: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        const [countriesRes, rolesRes] = await Promise.all([getCountries(), getRoles()]);
        if (countriesRes.success) setCountries(countriesRes.data || []);
        if (rolesRes.success) {
          const roles: any[] = rolesRes.data || [];
          const superAdminRole = roles.find((r: any) => r.attributes?.slug === 'tenant-business-super-admin');
          if (superAdminRole) setTenantSuperAdminRoleUuid(superAdminRole.id);
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();

    if (business) {
      setBizData({
        name: business.attributes?.name || '',
        email: business.attributes?.email || '',
        phone: business.attributes?.phone || '',
        address: business.attributes?.address || '',
        type: business.attributes?.type || 'operator',
        countryUuid: business.attributes?.country?.uuid || '',
      });
    } else {
      setBizData({ name: '', email: '', phone: '', address: '', type: 'operator', countryUuid: '' });
      setTenantData({ name: '', username: '', email: '', address: '', password: '', confirmPassword: '', countryUuid: '' });
    }
  }, [isOpen, business]);

  const handleBizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBizData(prev => ({ ...prev, [name]: value }));
  };

  const handleTenantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTenantData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && tenantData.password !== tenantData.confirmPassword) {
      toast.error('Tenant passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit) {
        // Edit: only update business fields
        const result: ApiResponse = await updateTenantBusiness(business.id, {
          name: bizData.name,
          email: bizData.email,
          phone: bizData.phone,
          address: bizData.address,
          type: bizData.type,
          countryUuid: bizData.countryUuid || undefined,
        });

        if (result.success) {
          toast.success('Business updated successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(result.message || 'Update failed');
        }
      } else {
        // Create: first create tenant user, then create business
        const tenantPayload: any = {
          name: tenantData.name,
          username: tenantData.username,
          email: tenantData.email,
          address: tenantData.address,
          password: tenantData.password,
        };
        if (tenantData.countryUuid) tenantPayload.countryUuid = tenantData.countryUuid;
        if (tenantSuperAdminRoleUuid) tenantPayload.roleUuid = tenantSuperAdminRoleUuid;

        const tenantResult: ApiResponse = await createTenant(tenantPayload);
        if (!tenantResult.success) {
          toast.error(`Tenant creation failed: ${tenantResult.message || 'Unknown error'}`);
          setIsLoading(false);
          return;
        }

        const bizPayload: any = {
          name: bizData.name,
          email: bizData.email,
          phone: bizData.phone,
          address: bizData.address,
          type: bizData.type,
        };
        if (bizData.countryUuid) bizPayload.countryUuid = bizData.countryUuid;

        const bizResult: ApiResponse = await createTenantBusiness(bizPayload);
        if (bizResult.success) {
          toast.success('Tenant and Business created successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(`Business creation failed: ${bizResult.message || 'Unknown error'} (Tenant account was created)`);
        }
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
      <div className={styles.modal} style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? 'Edit Business' : 'Create Business & Tenant Account'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>

              {/* ── Business Information ── */}
              <div style={SECTION_DIVIDER_STYLE}>
                <span style={SECTION_LABEL_STYLE}>Business Information</span>
                <span style={SECTION_LINE_STYLE} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Business Name</label>
                <input type="text" name="name" className={styles.input} required value={bizData.name} onChange={handleBizChange} placeholder="ACME ISP" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Business Type</label>
                <select name="type" className={styles.select} required value={bizData.type} onChange={handleBizChange}>
                  <option value="operator">Operator</option>
                  <option value="distributor">Distributor</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Business Email</label>
                <input type="email" name="email" className={styles.input} required value={bizData.email} onChange={handleBizChange} placeholder="contact@acme-isp.com" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Business Phone</label>
                <input type="tel" name="phone" className={styles.input} required value={bizData.phone} onChange={handleBizChange} placeholder="+1234567890" />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Business Address</label>
                <input type="text" name="address" className={styles.input} required value={bizData.address} onChange={handleBizChange} placeholder="456 Network Ave, City" />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Business Country</label>
                <select name="countryUuid" className={styles.select} value={bizData.countryUuid} onChange={handleBizChange}>
                  <option value="">Select a country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.attributes?.name} ({c.attributes?.phoneCode})</option>
                  ))}
                </select>
              </div>

              {/* ── Tenant Account (create only) ── */}
              {!isEdit && (
                <>
                  <div style={SECTION_DIVIDER_STYLE}>
                    <span style={SECTION_LABEL_STYLE}>Tenant Account</span>
                    <span style={SECTION_LINE_STYLE} />
                  </div>

                  <div style={AUTO_ROLE_NOTE_STYLE}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Role will be automatically assigned to <strong style={{ marginLeft: 4 }}>tenant-business-super-admin</strong>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tenant Full Name</label>
                    <input type="text" name="name" className={styles.input} required value={tenantData.name} onChange={handleTenantChange} placeholder="John Doe" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Username</label>
                    <input type="text" name="username" className={styles.input} required value={tenantData.username} onChange={handleTenantChange} placeholder="johndoe" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tenant Email</label>
                    <input type="email" name="email" className={styles.input} required value={tenantData.email} onChange={handleTenantChange} placeholder="john@example.com" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tenant Country</label>
                    <select name="countryUuid" className={styles.select} value={tenantData.countryUuid} onChange={handleTenantChange}>
                      <option value="">Select a country</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.attributes?.name} ({c.attributes?.phoneCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Tenant Address</label>
                    <input type="text" name="address" className={styles.input} required value={tenantData.address} onChange={handleTenantChange} placeholder="123 Main St, City" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <input type="password" name="password" className={styles.input} required value={tenantData.password} onChange={handleTenantChange} placeholder="••••••••" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confirm Password</label>
                    <input type="password" name="confirmPassword" className={styles.input} required value={tenantData.confirmPassword} onChange={handleTenantChange} placeholder="••••••••" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading || isFetchingData}>
              {isLoading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create Business & Tenant')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
