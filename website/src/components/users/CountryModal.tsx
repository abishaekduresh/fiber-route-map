'use client';

import { useState, useEffect } from 'react';
import { createCountry, updateCountry } from '@/lib/api';
import { toast } from 'sonner';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  country: any | null;
}

export default function CountryModal({ isOpen, onClose, onSuccess, country }: CountryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phoneCode: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (country) {
      setFormData({
        name: country.attributes.name || '',
        code: country.attributes.code || '',
        phoneCode: country.attributes.phoneCode || '',
        status: country.attributes.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        code: '',
        phoneCode: '',
        status: 'active'
      });
    }
  }, [country, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = country 
        ? await updateCountry(country.id, formData)
        : await createCountry(formData);

      if (result.success) {
        toast.success(country ? 'Country updated successfully' : 'Country created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{country ? 'Edit Country' : 'Add New Country'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Country Name</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="e.g. United States"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>ISO Code (2-3 chars)</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="e.g. US"
                  required
                  maxLength={5}
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Code</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="e.g. +1"
                  required
                  value={formData.phoneCode}
                  onChange={e => setFormData({...formData, phoneCode: e.target.value})}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Initial Status</label>
                <select 
                  className={styles.select}
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="spinner-mini" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
              {country ? 'Save Changes' : 'Create Country'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
