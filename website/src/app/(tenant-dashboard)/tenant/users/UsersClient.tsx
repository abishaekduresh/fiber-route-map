'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getTenantUsers,
  deleteTenantUser,
  blockTenantUser,
  unblockTenantUser,
  TenantUserData,
} from '@/lib/api';
import TenantUserModal from '@/components/tenant-users/TenantUserModal';
import TenantUserCard from '@/components/tenant-users/TenantUserCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ITEMS_PER_PAGE = 6;

export default function UsersClient() {
  const [users, setUsers] = useState<TenantUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUserData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('tenant_user.create');
  const canUpdate = hasPermission('tenant_user.update');
  const canDelete = hasPermission('tenant_user.delete');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTenantUsers({ limit: -1 });
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const a = u.attributes;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (a.name || '').toLowerCase().includes(search) ||
        (a.username || '').toLowerCase().includes(search) ||
        (a.email || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || (a.status || 'active').toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handleAdd = () => { setEditingUser(null); setModalOpen(true); };
  const handleEdit = (user: TenantUserData) => { setEditingUser(user); setModalOpen(true); };

  const handleDelete = (user: TenantUserData) => {
    setConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.attributes.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setConfirmDialog(null);
          const res = await deleteTenantUser(user.id);
          if (res.success) {
            toast.success('User deleted successfully');
            fetchUsers();
          } else {
            toast.error((res as any).message ?? 'Failed to delete user');
          }
        } catch (err: any) {
          toast.error(err.message ?? 'An error occurred during deletion');
        }
      },
    });
  };

  const handleBlock = async (user: TenantUserData) => {
    try {
      const res = await blockTenantUser(user.id);
      if (res.success) {
        toast.success('User blocked successfully');
        fetchUsers();
      } else {
        toast.error((res as any).message ?? 'Failed to block user');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'An error occurred');
    }
  };

  const handleUnblock = async (user: TenantUserData) => {
    try {
      const res = await unblockTenantUser(user.id);
      if (res.success) {
        toast.success('User unblocked successfully');
        fetchUsers();
      } else {
        toast.error((res as any).message ?? 'Failed to unblock user');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'An error occurred');
    }
  };

  return (
    <div className={styles.tableContainer}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.tableTitle}>Users</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'} found
              {users.length !== filtered.length && ` (filtered from ${users.length})`}
            </span>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={handleAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add User
              </button>
            )}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableLoader}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading users...</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {paginated.length > 0 ? (
            paginated.map((user) => (
              <TenantUserCard
                key={user.id}
                user={user}
                onEdit={canUpdate ? () => handleEdit(user) : undefined}
                onBlock={canUpdate ? () => handleBlock(user) : undefined}
                onUnblock={canUpdate ? () => handleUnblock(user) : undefined}
                onDelete={canDelete ? () => handleDelete(user) : undefined}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p>No users found{searchTerm || statusFilter !== 'all' ? ' matching your criteria' : ''}.</p>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filtered.length > ITEMS_PER_PAGE && (
        <div className={styles.paginationContainer}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <TenantUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchUsers(); }}
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
    </div>
  );
}
