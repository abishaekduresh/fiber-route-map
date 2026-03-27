'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
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
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect to login
      router.push('/login');
    }
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(['Manage']);

  const toggleDropdown = (name: string) => {
    setExpandedItems((prev: string[]) => 
      prev.includes(name) 
        ? prev.filter((i: string) => i !== name) 
        : [...prev, name]
    );
  };

  const navLinks = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    { 
      name: 'Manage', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      subItems: [
        { name: 'Users', href: '/manage/users' }
      ]
    }
  ];

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <span className={styles.brandName}>FIBER ROUTE</span>
        
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
                      {link.subItems!.map(sub => (
                        <li key={sub.href}>
                          <Link 
                            href={sub.href}
                            className={`${styles.subItem} ${pathname === sub.href ? styles.activeSubItem : ''}`}
                          >
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      ))}
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
