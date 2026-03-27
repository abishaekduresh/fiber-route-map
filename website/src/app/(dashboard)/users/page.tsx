'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUsers, deleteUser } from '@/lib/api';
import UserModal from '@/components/users/UserModal';
import UserDetailsModal from '@/components/users/UserDetailsModal';
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
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleView = (user: any) => {
    setViewingUser(user);
    setIsViewOpen(true);
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.attributes?.name}"?`)) {
      return;
    }

    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || 'Delete failed');
      }
    } catch (err) {
      alert('Network error during deletion');
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.tableTitle}>System Users</h3>
            <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{users.length} users found</span>
          </div>
          <button className={styles.createBtn} onClick={handleCreate}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New User
          </button>
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
                  <th style={{ textAlign: 'right' }}>System Actions</th>
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
                      <span style={{ color: '#fff' }}>{user.attributes?.sessionLimit ?? 1} </span>
                    </td>
                    <td>
                      <span style={{ color: '#a1a1aa' }}>
                        {user.meta?.createdAt ? new Date(user.meta.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button 
                          className={`${styles.actionBtn} ${styles.viewBtn}`} 
                          onClick={() => handleView(user)}
                          title="View Details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.editBtn}`} 
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                          onClick={() => handleDelete(user)}
                          title="Remove User"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

import UserDetailsModal from '@/components/users/UserDetailsModal';

// ... at the bottom ...
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUsers}
        user={editingUser}
      />

      <UserDetailsModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        user={viewingUser}
      />
    </DashboardLayout>
  );
}
