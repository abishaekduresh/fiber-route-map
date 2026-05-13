'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import { Can } from '../auth/Can';
import styles from './DashboardLayout.module.css';

/**
 * Sidebar Component
 * 
 * Provides navigation for the dashboard.
 */
export default function Sidebar({ 
  className = '', 
  onClose 
}: { 
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/superadmin');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect to login
      router.push('/superadmin');
    }
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(['Manage', 'Tenants']);

  const toggleDropdown = (name: string) => {
    setExpandedItems((prev: string[]) => 
      prev.includes(name) 
        ? prev.filter((i: string) => i !== name) 
        : [...prev, name]
    );
  };

  const icon = (path: React.ReactNode, extra?: string) => (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }} {...(extra ? {} : {})}>
      {path}
    </svg>
  );

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: icon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>),
    },
    {
      name: 'Manage',
      icon: icon(<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>),
      subItems: [
        { name: 'Users',       href: '/manage/users',        icon: icon(<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>) },
        { name: 'Roles',       href: '/manage/roles',        icon: icon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>)</>),                  permission: 'role.view' },
        { name: 'Permissions', href: '/manage/permissions',  icon: icon(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></>),  permission: 'permission.view' },
        { name: 'Countries',   href: '/manage/countries',    icon: icon(<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></>) },
        { name: 'Icons',       href: '/manage/icons',        icon: icon(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>) },
        { name: 'Audit Logs',  href: '/manage/audit-logs',   icon: icon(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></>),  permission: 'audit_log.view' },
      ],
    },
    {
      name: 'Tenants',
      icon: icon(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
      subItems: [
        { name: 'Businesses',      href: '/manage/tenant-businesses', icon: icon(<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>) },
        { name: 'Tenants',         href: '/manage/tenants',           icon: icon(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>) },
        { name: 'Support Tickets', href: '/manage/support-tickets',   icon: icon(<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>)</>),                                                              permission: 'support_ticket.view' },
      ],
    },
    {
      name: 'Developer',
      icon: icon(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>),
      subItems: [
        { name: 'API Docs', href: '/manage/api-docs', icon: icon(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>), permission: 'apidoc.view' },
      ],
    },
  ];

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <img 
            src="/assets/app/logo.png" 
            alt="Logo" 
            width={24} 
            height={24} 
            style={{ objectFit: 'contain' }}
          />
        </div>
        <span className={styles.brandName}>
          {process.env.NEXT_PUBLIC_APP_NAME || 'FIBER ROUTE'}
        </span>
        
        <button className={styles.mobileCloseBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className={styles.navSection}>
        <ul className={styles.navList}>
          {navLinks.map((link) => {
            const isExpanded = expandedItems.includes(link.name);
            const hasSubItems = link.subItems && link.subItems.length > 0;

            if (hasSubItems) {
              return (
                <li key={link.name}>
                  <div 
                    className={`${styles.navItem} ${styles.dropdownToggle} ${isExpanded ? styles.activeNavItem : ''}`}
                    onClick={() => toggleDropdown(link.name)}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                    <svg 
                      className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`} 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {isExpanded && (
                    <ul className={styles.dropdownMenu}>
                      {link.subItems!.map(sub => {
                        const content = (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`${styles.subItem} ${pathname === sub.href ? styles.activeSubItem : ''}`}
                            >
                              {(sub as any).icon && (sub as any).icon}
                              <span>{sub.name}</span>
                            </Link>
                          </li>
                        );

                        if (sub.permission) {
                          return (
                            <Can key={sub.href} I={sub.permission}>
                              {content}
                            </Can>
                          );
                        }

                        return content;
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={link.href}>
                <Link 
                  href={link.href!} 
                  className={`${styles.navItem} ${pathname === link.href ? styles.activeNavItem : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
