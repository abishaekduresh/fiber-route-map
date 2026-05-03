'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import styles from './DashboardLayout.module.css';

/**
 * TenantSidebar Component
 * 
 * Provides navigation for the tenant dashboard.
 */
export default function TenantSidebar({ 
  className = '', 
  onClose 
}: { 
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { logout, isImpersonating } = useTenantAuth();

  const navLinks = [
    { 
      name: 'Dashboard', 
      href: '/tenant/dashboard', 
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    { 
      name: 'My Businesses', 
      href: '/tenant/businesses', 
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /><rect x="2" y="7" width="20" height="14" rx="2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      )
    },
    { 
      name: 'Network Status', 
      href: '/tenant/network', 
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    { 
      name: 'Support', 
      href: '/tenant/support', 
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    }
  ];

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <img 
            src="/assets/app/logo.png" 
            alt="Logo" 
            className={styles.sidebarLogo} 
          />
        </div>
        <span className={styles.brandName}>
          TENANT PORTAL
        </span>
        
        <button className={styles.mobileCloseBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className={styles.navSection}>
        <ul className={styles.navList}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={`${styles.navItem} ${pathname === link.href ? styles.activeNavItem : ''}`}
                onClick={() => onClose?.()}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        {!isImpersonating && (
          <button className={styles.logoutBtn} onClick={logout}>
            <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
