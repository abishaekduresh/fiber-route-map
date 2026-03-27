'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUsers } from '@/lib/api';
import styles from './dashboard.module.css';

/**
 * Dashboard Overview Page
 */
export default function DashboardPage() {
  const [userCount, setUserCount] = useState<number | string>('-');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getUsers();
        if (result.success && result.data) {
          setUserCount(result.data.length);
        }
      } catch (e) {}
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout title="System Overview">
      <div className={styles.welcomeContainer}>
        <div className={styles.glassCard}>
          <h1 className={styles.welcomeTitle}>Welcome to Fiber Route Control</h1>
          <p className={styles.welcomeSubtitle}>
            Monitor and manage your network infrastructure from a single, high-performance interface.
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent-blue)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className={styles.statData}>
              <span className={styles.statValue}>0</span>
              <span className={styles.statLabel}>Active Routes</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(147, 51, 234, 0.1)', color: 'var(--color-accent-purple)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.statData}>
              <span className={styles.statValue}>{userCount}</span>
              <span className={styles.statLabel}>Users Managed</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.statData}>
              <span className={styles.statValue}>Secure</span>
              <span className={styles.statLabel}>System Status</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
