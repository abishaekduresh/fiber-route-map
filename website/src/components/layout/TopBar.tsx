import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';

/**
 * TopBar Component
 * 
 * Shows current page title and user information.
 */
export default function TopBar({ title }: { title: string }) {
  const [user, setUser] = useState<{ name: string; roles: any[] } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success && (result.data as any)?.user) {
          const userData = (result.data as any).user;
          setUser({
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
      <h2 className={styles.topBarTitle}>{title}</h2>
      
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
    </header>
  );
}
