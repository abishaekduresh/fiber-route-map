'use client';

import { useState, useEffect } from 'react';
import { createPermission, updatePermission, ApiResponse } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';
import { toast } from 'sonner';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permission?: any; // If provided, we are in Edit mode
}

export default function PermissionModal({ isOpen, onClose, onSuccess, permission }: PermissionModalProps) {
  const isEdit = !!permission;
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (permission) {
        setFormData({
          name: permission.attributes?.name || '',
          slug: permission.attributes?.slug || '',
          description: permission.attributes?.description || ''
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          description: ''
        });
      }
    }
  }, [isOpen, permission]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result: ApiResponse;
      if (isEdit) {
        result = await updatePermission(permission.id, formData);
      } else {
        result = await createPermission(formData);
      }

      if (result.success) {
        toast.success(isEdit ? 'Permission updated successfully' : 'Permission created successfully');
        onSuccess();
        onClose();
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
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? 'Edit Permission' : 'Create New Permission'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Permission Name</label>
                <input 
                  type="text" name="name" className={styles.input} required 
                  value={formData.name} onChange={handleChange} placeholder="e.g., View Assets"
                  autoFocus
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Permission Slug</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" name="slug" className={styles.input} required 
                    value={formData.slug} onChange={handleChange} placeholder="e.g., asset.view"
                    disabled={isEdit}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  {isEdit && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} title="Slug cannot be changed after creation">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Use dot notation: <code style={{ color: 'var(--color-accent-blue)' }}>resource.action</code> (e.g., device.create)
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  className={styles.input} 
                  rows={3}
                  style={{ resize: 'none' }}
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="What operations does this permission control?"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading && <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
              {isLoading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Permission')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
