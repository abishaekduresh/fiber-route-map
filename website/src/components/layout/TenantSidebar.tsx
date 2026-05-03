'use client';

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
  const { logout, isImpersonating, hasPermission } = useTenantAuth();

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/tenant/dashboard',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      show: true
    },
    {
      name: 'Users',
      href: '/tenant/users',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      show: hasPermission('tenant_user.view')
    },
    {
      name: 'LCOs',
      href: '/tenant/lcos',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      show: hasPermission('lco.view')
    },
  ].filter(link => link.show);

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
