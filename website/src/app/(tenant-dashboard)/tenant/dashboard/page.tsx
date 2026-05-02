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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1>Tenant Dashboard</h1>
        </div>
        
        <div className={styles.userSection}>
          <div className={styles.tenantInfo}>
            <span className={styles.tenantName}>{tenant.attributes.name}</span>
            <span className={styles.tenantPhone}>{tenant.attributes.phone}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
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
      </main>
    </div>
  );
}
