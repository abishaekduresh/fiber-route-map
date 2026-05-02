'use client';

import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * TenantTopBar Component
 * 
 * Shows current page title and tenant information.
 */
export default function TenantTopBar({ 
  title, 
  onMenuClick 
}: { 
  title: string;
  onMenuClick?: () => void;
}) {
  const { tenant } = useTenantAuth();

  return (
    <header className={styles.topBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className={styles.menuBtn} 
          onClick={onMenuClick}
          aria-label="Toggle Sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2 className={styles.topBarTitle}>{title}</h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <ThemeToggle />
        
        <Link href="/tenant/profile" className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{tenant?.attributes.name || 'Loading...'}</span>
            <span className={styles.userRole} style={{ color: '#10b981' }}>
              Tenant Account
            </span>
          </div>
          <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            {tenant?.attributes.name?.charAt(0) || 'T'}
          </div>
        </Link>
      </div>
    </header>
  );
}
