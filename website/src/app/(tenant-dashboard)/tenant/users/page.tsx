'use client';

import { useEffect, useState, useMemo } from 'react';
import TenantDashboardLayout from '@/components/layout/TenantDashboardLayout';
import {
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
  blockTenantUser,
  unblockTenantUser,
  TenantUserData,
} from '@/lib/api';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';
import cardStyles from '@/components/users/UserCard.module.css';

const ROLES = ['admin', 'manager', 'member', 'viewer'];

// ── Modal ──────────────────────────────────────────────────────────────────────
function UserModal({
  isOpen,
  onClose,
  onSuccess,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: TenantUserData | null;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'member', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.attributes.name,
        email: editing.attributes.email,
        phone: editing.attributes.phone || '',
        role: editing.attributes.role,
        password: '',
      });
    } else {
      setForm({ name: '', email: '', phone: '', role: 'member', password: '' });
    }
  }, [editing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (editing) {
        result = await updateTenantUser(editing.id, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
        });
      } else {
        result = await createTenantUser({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          password: form.password,
        });
      }

      if (result.success) {
        toast.success(editing ? 'User updated' : 'User created');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {editing ? 'Edit User' : 'Add User'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(['name', 'email', 'phone'] as const).map((field) => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                {field}{field === 'name' || field === 'email' ? ' *' : ''}
              </label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                required={field !== 'phone'}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{
                  background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                  borderRadius: '8px', padding: '0.6rem 0.875rem',
                  color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '0.6rem 0.875rem',
                color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
              }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>

          {!editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{
                  background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                  borderRadius: '8px', padding: '0.6rem 0.875rem',
                  color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────────
function TenantUserCard({
  user,
  onEdit,
  onDelete,
  onBlock,
  onUnblock,
}: {
  user: TenantUserData;
  onEdit: (u: TenantUserData) => void;
  onDelete: (u: TenantUserData) => void;
  onBlock: (u: TenantUserData) => void;
  onUnblock: (u: TenantUserData) => void;
}) {
  const { name, email, phone, role, status } = user.attributes;
  const { createdAt } = user.meta;

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardHeader}>
        <div className={cardStyles.avatar} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
          {name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className={cardStyles.userInfo}>
          <h3 className={cardStyles.userName} title={name}>{name}</h3>
          <div className={cardStyles.roleBadge} style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
            {role.toUpperCase()}
          </div>
          <div className={cardStyles.userHandle}>{email}</div>
        </div>
      </div>

      <div className={cardStyles.detailsGrid}>
        <div className={cardStyles.detailItem}>
          <span className={cardStyles.detailLabel}>Phone</span>
          <span className={cardStyles.detailValue}>{phone || 'N/A'}</span>
        </div>
        <div className={cardStyles.detailItem}>
          <span className={cardStyles.detailLabel}>Status</span>
          <span className={`${cardStyles.statusBadge} ${cardStyles[`status-${status}`]}`}>{status.toUpperCase()}</span>
        </div>
        <div className={cardStyles.detailItem}>
          <span className={cardStyles.detailLabel}>Role</span>
          <span className={cardStyles.detailValue} style={{ textTransform: 'capitalize' }}>{role}</span>
        </div>
        <div className={cardStyles.detailItem}>
          <span className={cardStyles.detailLabel}>Joined</span>
          <span className={cardStyles.detailValue}>{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      <div className={cardStyles.cardFooter}>
        {status === 'active' ? (
          <button className={`${cardStyles.actionBtn} ${cardStyles.blockBtn}`} onClick={() => onBlock(user)} title="Block User">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>
        ) : (
          <button className={`${cardStyles.actionBtn} ${cardStyles.unblockBtn}`} onClick={() => onUnblock(user)} title="Unblock User">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" />
            </svg>
          </button>
        )}

        <button className={`${cardStyles.actionBtn} ${cardStyles.editBtn}`} onClick={() => onEdit(user)} title="Edit User">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <button className={`${cardStyles.actionBtn} ${cardStyles.deleteBtn}`} onClick={() => onDelete(user)} title="Delete User">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TenantUsersPage() {
  const [users, setUsers] = useState<TenantUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUserData | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<TenantUserData | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getTenantUsers({ limit: -1 });
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch users');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => users.filter(u => {
    const a = u.attributes;
    const s = searchTerm.toLowerCase();
    const matchSearch = (a.name || '').toLowerCase().includes(s) || (a.email || '').toLowerCase().includes(s);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }), [users, searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handleBlock = async (user: TenantUserData) => {
    try {
      const result = await blockTenantUser(user.id);
      if (result.success) { toast.success(`${user.attributes.name} blocked`); fetchUsers(); }
      else toast.error(result.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const handleUnblock = async (user: TenantUserData) => {
    try {
      const result = await unblockTenantUser(user.id);
      if (result.success) { toast.success(`${user.attributes.name} unblocked`); fetchUsers(); }
      else toast.error(result.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const handleDelete = async (user: TenantUserData) => {
    try {
      const result = await deleteTenantUser(user.id);
      if (result.success) { toast.success(`${user.attributes.name} deleted`); fetchUsers(); }
      else toast.error(result.message || 'Failed');
    } catch { toast.error('Network error'); }
    setConfirmDelete(null);
  };

  return (
    <TenantDashboardLayout title="Manage Users">
      <div className={styles.tableContainer}>
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
              <button className={styles.createBtn} onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add User
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
                placeholder="Search by name or email…"
                className={styles.searchInput}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading users…</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {paginated.length > 0 ? paginated.map(user => (
              <TenantUserCard
                key={user.id}
                user={user}
                onEdit={u => { setEditingUser(u); setIsModalOpen(true); }}
                onDelete={u => setConfirmDelete(u)}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
              />
            )) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                <p>No users found matching your search criteria.</p>
                <button
                  style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && filtered.length > itemsPerPage && (
          <div className={styles.paginationContainer}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Prev
            </button>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages <= 7 || p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return <button key={p} className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>;
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={p} className={styles.pageInfo}>…</span>;
                }
                return null;
              })}
            </div>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        editing={editingUser}
      />

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Delete User</h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete <strong>{confirmDelete.attributes.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </TenantDashboardLayout>
  );
}
