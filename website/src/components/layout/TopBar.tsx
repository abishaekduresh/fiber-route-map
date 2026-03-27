import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * TopBar Component
 * 
 * Shows current page title and user information.
 */
export default function TopBar({ 
  title, 
  onMenuClick 
}: { 
  title: string;
  onMenuClick?: () => void;
}) {
  const [user, setUser] = useState<{ id: string; name: string; roles: any[] } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success && (result.data as any)?.user) {
          const userData = (result.data as any).user;
          setUser({
            id: userData.id,
            name: userData.attributes.name,
            roles: userData.attributes.roles
          });
        }
      } catch (err) {
        // Silently fail, user info will just be missing
        console.error('Failed to fetch user:', err);
      }
    };

    // Try to get from localStorage first if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fiber_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            id: parsed.id,
            name: parsed.attributes?.name || 'User',
            roles: parsed.attributes?.roles || []
          });
        } catch (e) {}
      }
    }

    fetchUser();
  }, []);

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
        
        <Link href="/profile" className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'Loading...'}</span>
            <span className={styles.userRole}>
              {user?.roles?.[0]?.name || 'Member'}
            </span>
          </div>
          <div className={styles.avatar}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
}
