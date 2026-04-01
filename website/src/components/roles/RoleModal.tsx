'use client';

import { useState, useEffect, useMemo } from 'react';
import { getPermissions, createRole, updateRole, syncRolePermissions, ApiResponse } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';
import { toast } from 'sonner';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: any; // If provided, we are in Edit mode
}

export default function RoleModal({ isOpen, onClose, onSuccess, role }: RoleModalProps) {
  const isEdit = !!role;
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [permissionSearch, setPermissionSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissionIds: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const permissionsRes = await getPermissions();
        if (permissionsRes.success) {
          setPermissions(permissionsRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setIsFetchingData(false);
      }
    };

    if (isOpen) {
      fetchData();
      if (role) {
        setFormData({
          name: role.attributes?.name || '',
          slug: role.attributes?.slug || '',
          description: role.attributes?.description || '',
          permissionIds: role.attributes?.permissions?.map((p: any) => p.id) || []
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          permissionIds: []
        });
      }
    }
  }, [isOpen, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => {
      const isSelected = prev.permissionIds.includes(permissionId);
      const newPermissions = isSelected 
        ? prev.permissionIds.filter(p => p !== permissionId)
        : [...prev.permissionIds, permissionId];
      return { ...prev, permissionIds: newPermissions };
    });
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const filteredPerms = permissions.filter(p => {
      const name = (p.attributes?.name || '').toLowerCase();
      const slug = (p.attributes?.slug || '').toLowerCase();
      const search = permissionSearch.toLowerCase();
      return name.includes(search) || slug.includes(search);
    });

    filteredPerms.forEach(p => {
      const resource = p.attributes?.slug?.split('.')[0] || 'other';
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  }, [permissions, permissionSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result: ApiResponse;
      if (isEdit) {
        result = await updateRole(role.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description
        });
      } else {
        result = await createRole({
          name: formData.name,
          slug: formData.slug,
          description: formData.description
        });
      }

      if (result.success) {
        const targetUuid = isEdit ? role.id : (result.data as any).id;
        
        // Now sync permissions
        const syncResult = await syncRolePermissions(targetUuid, formData.permissionIds);
        
        if (syncResult.success) {
          toast.success(isEdit ? 'Role updated successfully' : 'Role created successfully');
          onSuccess();
          onClose();
        } else {
          toast.error('Role saved but permissions failed to sync.');
        }
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Network error during operation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? 'Edit Role' : 'Create New Role'}</h3>
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
                <label className={styles.label}>Role Name</label>
                <input 
                  type="text" name="name" className={styles.input} required 
                  value={formData.name} onChange={handleChange} placeholder="e.g., Support Staff"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Role Slug</label>
                <input 
                  type="text" name="slug" className={styles.input} required 
                  value={formData.slug} onChange={handleChange} placeholder="e.g., support-staff"
                  disabled={isEdit}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  className={styles.input} 
                  rows={2}
                  style={{ resize: 'none' }}
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Describe what users with this role can do..."
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label} style={{ marginBottom: '1rem' }}>Granular Permissions</label>
                
                {isFetchingData ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Loading system permissions...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className={styles.searchInputWrapper} style={{ marginBottom: '0.5rem' }}>
                      <div className={styles.searchIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search system permissions..." 
                        className={styles.searchInput}
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem 0.5rem 2.2rem' }}
                      />
                    </div>

                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h5 style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-accent-blue)' }}>
                            {resource} Management
                          </h5>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                              type="button" 
                              onClick={() => {
                                const allIds = perms.map(p => p.id);
                                setFormData(prev => ({
                                  ...prev,
                                  permissionIds: [...new Set([...prev.permissionIds, ...allIds])]
                                }));
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8 }}
                            >
                              Check All
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                const allIds = perms.map(p => p.id);
                                setFormData(prev => ({
                                  ...prev,
                                  permissionIds: prev.permissionIds.filter(id => !allIds.includes(id))
                                }));
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.6 }}
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                          {perms.map(p => (
                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <input 
                                type="checkbox" 
                                checked={formData.permissionIds.includes(p.id)}
                                onChange={() => handlePermissionToggle(p.id)}
                                style={{ accentColor: 'var(--color-accent-blue)' }}
                              />
                              <span style={{ color: formData.permissionIds.includes(p.id) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                {p.attributes.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading || isFetchingData}>
              {isLoading ? 'Saving Role...' : (isEdit ? 'Save Changes' : 'Create Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
