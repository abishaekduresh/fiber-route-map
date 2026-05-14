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
  const { logout, isImpersonating, hasPermission } = useTenantAuth();
  const [manageOpen, setManageOpen] = useState(
    pathname.startsWith('/tenant/users') ||
    pathname.startsWith('/tenant/lcos') ||
    pathname.startsWith('/tenant/upstream-providers') ||
    pathname.startsWith('/tenant/cable-types')
  );

  const topLinks = [
    {
      name: 'Dashboard',
      href: '/tenant/dashboard',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      show: true,
    },
    {
      name: 'Map',
      href: '/tenant/map',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
      show: hasPermission('map.view'),
    },
    {
      name: 'Support Tickets',
      href: '/tenant/support-tickets',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      show: hasPermission('support_ticket.view'),
    },
  ].filter((l) => l.show);

  const manageLinks = [
    {
      name: 'Users',
      href: '/tenant/users',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      show: hasPermission('tenant_user.view'),
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
      show: hasPermission('lco.view'),
    },
    {
      name: 'Upstream Providers',
      href: '/tenant/upstream-providers',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      ),
      show: hasPermission('upstream_provider.view'),
    },
    {
      name: 'Cable Types',
      href: '/tenant/cable-types',
      icon: (
        <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      ),
      show: hasPermission('cable_type.view'),
    },
  ].filter((l) => l.show);

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
          {topLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.navItem} ${pathname.startsWith(link.href) ? styles.activeNavItem : ''}`}
                onClick={() => onClose?.()}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {manageLinks.length > 0 && (
            <li>
              <button
                className={styles.navItem}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'space-between' }}
                onClick={() => setManageOpen((o) => !o)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg className={styles.navIcon} style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
                  </svg>
                  <span>Manage</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: manageOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {manageOpen && (
                <ul className={styles.navList} style={{ paddingLeft: '0.75rem', marginTop: '0.25rem' }}>
                  {manageLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${styles.navItem} ${pathname.startsWith(link.href) ? styles.activeNavItem : ''}`}
                        onClick={() => onClose?.()}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}
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
