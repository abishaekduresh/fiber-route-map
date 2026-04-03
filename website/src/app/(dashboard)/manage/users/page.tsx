'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUsers, deleteUser, blockUser, unblockUser } from '@/lib/api';
import UserModal from '@/components/users/UserModal';
import UserCard from '@/components/users/UserCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

/**
 * Manage Users Page
 * 
 * Lists all users with their roles and status.
 * Includes search, filtering, and export capabilities.
 */
export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const attributes = user.attributes || {};
      const name = (attributes.name || '').toLowerCase();
      const username = (attributes.username || '').toLowerCase();
      const email = (attributes.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || 
                           username.includes(search) || 
                           email.includes(search);
      
      const role = attributes.roles?.[0]?.slug || 'member';
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      
      const status = (attributes.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Paginated users logic
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: any) => {
    setConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.attributes?.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const result = await deleteUser(user.id);
          if (result.success) {
            toast.success(`User "${user.attributes?.name}" deleted successfully`);
            fetchUsers();
          } else {
            toast.error(result.message || 'Delete failed');
          }
        } catch (err) {
          toast.error('Network error during deletion');
        }
      },
    });
  };

  const handleBlock = async (user: any) => {
    try {
      const result = await blockUser(user.id);
      if (result.success) {
        toast.success(`User "${user.attributes?.name}" blocked`);
        fetchUsers();
      } else {
        toast.error(result.message || 'Block failed');
      }
    } catch (err) {
      toast.error('Network error during blocking');
    }
  };

  const handleUnblock = async (user: any) => {
    try {
      const result = await unblockUser(user.id);
      if (result.success) {
        toast.success(`User "${user.attributes?.name}" unblocked`);
        fetchUsers();
      } else {
        toast.error(result.message || 'Unblock failed');
      }
    } catch (err) {
      toast.error('Network error during unblocking');
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Session Limit', 'Created At'];
    const csvData = filteredUsers.map(user => [
      user.id,
      user.attributes?.name || '',
      user.attributes?.username || '',
      user.attributes?.email || '',
      user.attributes?.roles?.[0]?.name || 'Member',
      user.attributes?.status || 'Active',
      user.attributes?.sessionLimit ?? 1,
      user.meta?.createdAt ? new Date(user.meta.createdAt).toISOString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('User list exported to CSV');
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>System Users</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                {users.length !== filteredUsers.length && ` (filtered from ${users.length})`}
              </span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.exportBtn} onClick={handleExportCSV}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
              <button className={styles.createBtn} onClick={handleCreate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New User
              </button>
            </div>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.searchInputWrapper}>
              <div className={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by name, username or email..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>

            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Accessing user directory...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No users found matching your search criteria.</p>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredUsers.length > 0 && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.pageBtn} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>
            
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show pages around current page if there are many pages
                if (
                  totalPages <= 7 || 
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePageBtn : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === currentPage - 2 && pageNum > 1) || 
                  (pageNum === currentPage + 2 && pageNum < totalPages)
                ) {
                  return <span key={pageNum} className={styles.pageInfo}>...</span>;
                }
                return null;
              })}
            </div>

            <button 
              className={styles.pageBtn} 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        user={editingUser}
      />

      <ConfirmDialog
        isOpen={confirmDialog !== null}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel="Delete"
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </DashboardLayout>
  );
}
