'use client';

import React, { useState } from 'react';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import styles from './profile.module.css';

/**
 * Tenant Profile Page
 * 
 * Displays detailed information about the authenticated tenant and their business association.
 */
export default function TenantProfilePage() {
  const { tenant } = useTenantAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!tenant) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const { attributes: attr, meta } = tenant;
  const formattedDate = meta?.createdAt 
    ? new Date(meta.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.coverPhoto} />
        <div className={styles.profileMeta}>
          <div className={styles.avatarLarge}>
            {attr.name.charAt(0)}
          </div>
          <div className={styles.nameSection}>
            <h1 className={styles.name}>{attr.name}</h1>
            <p className={styles.subtitle}>@{attr.username} • {attr.status.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Personal Information */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <h2>Personal Information</h2>
          </div>
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Full Name</span>
              <span className={styles.value}>{attr.name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Email Address</span>
              <span className={styles.value}>{attr.email}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Phone Number</span>
              <span className={styles.value}>{attr.phone}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Country</span>
              <span className={styles.value}>{attr.country?.name || 'Not Specified'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Residential Address</span>
              <span className={styles.value}>{attr.address || 'Not Provided'}</span>
            </div>
          </div>
        </section>

        {/* Business Association */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <h2>Business Association</h2>
          </div>
          {attr.business ? (
            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <span className={styles.label}>Business Name</span>
                <span className={styles.value}>{attr.business.name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Entity Type</span>
                <span className={styles.value}>{attr.business.type.toUpperCase()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Business Status</span>
                <div className={`${styles.statusBadge} ${styles[attr.business.status]}`}>
                  {attr.business.status.toUpperCase()}
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Role within Business</span>
                <span className={styles.value}>{attr.role?.name || 'Staff'}</span>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No business association found for this account.</p>
            </div>
          )}
        </section>

        {/* Security & System */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2>Security & System</h2>
          </div>
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Account Status</span>
              <div className={`${styles.statusBadge} ${styles[attr.status]}`}>
                {attr.status.toUpperCase()}
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Username</span>
              <span className={styles.value}>{attr.username}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Member Since</span>
              <span className={styles.value}>{formattedDate}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={() => setIsPasswordModalOpen(true)}>
              Change Password
            </button>
          </div>
        </section>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
