'use client';

import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import styles from './dashboard.module.css';

export default function TenantDashboard() {
  const { tenant, logout } = useTenantAuth();

  if (!tenant) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
        <p>Loading tenant session...</p>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.welcomeCard}>
        <h2>Welcome back, {tenant.attributes.name}!</h2>
        <p>You are successfully authenticated in the Tenant Portal.</p>
        <div className={styles.statusBadge}>
          <div className={styles.statusDot} />
          <span>Account Status: {tenant.attributes.status.toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Active Fiber Routes</h3>
          <p className={styles.stat}>0</p>
          <p className={styles.cardDesc}>View and manage your assigned fiber network infrastructure.</p>
        </div>
        <div className={styles.card}>
          <h3>Service Nodes</h3>
          <p className={styles.stat}>0</p>
          <p className={styles.cardDesc}>Monitor the status of your active service nodes and equipment.</p>
        </div>
        <div className={styles.card}>
          <h3>Support Tickets</h3>
          <p className={styles.stat}>0</p>
          <p className={styles.cardDesc}>Raise or track support requests regarding your fiber route access.</p>
        </div>
      </div>
    </div>
  );
}
