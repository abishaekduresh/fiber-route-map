'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUsers } from '@/lib/api';
import styles from '../dashboard/dashboard.module.css';

/**
 * Manage Users Page
 * 
 * Lists all users with their roles and status.
 */
export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result.success && result.data) {
          setUsers(result.data);
        } else {
          setError(result.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error('Fetch users error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <DashboardLayout title="Manage Users">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>System Users</h3>
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{users.length} users found</span>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Accessing user directory...</p>
          </div>
        ) : error ? (
          <div className={styles.tableLoader} style={{ color: '#ef4444' }}>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>User Information</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Session Limit</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{user.attributes?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                          @{user.attributes?.username || 'user'} • {user.attributes?.email || 'No Email'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                        {user.attributes?.roles?.[0]?.name || 'Member'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status-' + (user.attributes?.status || 'active')]}`}>
                        {user.attributes?.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#fff' }}>{user.attributes?.sessionLimit ?? 1} sessions</span>
                    </td>
                    <td>
                      <span style={{ color: '#a1a1aa' }}>
                        {user.meta?.createdAt ? new Date(user.meta.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
