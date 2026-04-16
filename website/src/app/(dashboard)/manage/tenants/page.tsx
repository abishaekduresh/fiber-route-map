'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getTenants, deleteTenant, blockTenant, unblockTenant, suspendTenant } from '@/lib/api';
import TenantCard from '@/components/tenants/TenantCard';
import TenantModal from '@/components/tenants/TenantModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Can } from '@/components/auth/Can';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

export default function ManageTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const result = await getTenants();
      if (result.success && result.data) {
        setTenants(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch tenants');
      }
    } catch {
      toast.error('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const attrs = t.attributes || {};
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (attrs.name || '').toLowerCase().includes(search) ||
        (attrs.username || '').toLowerCase().includes(search) ||
        (attrs.email || '').toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'all' || (attrs.status || 'active').toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [filteredTenants, currentPage]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTenant(null);
    setIsModalOpen(true);
  };

  const handleDelete = (tenant: any) => {
    setConfirmDialog({
      title: 'Delete Tenant',
      message: `Are you sure you want to delete "${tenant.attributes?.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const result = await deleteTenant(tenant.id);
          if (result.success) {
            toast.success(`Tenant "${tenant.attributes?.name}" deleted`);
            fetchTenants();
          } else {
            toast.error(result.message || 'Delete failed');
          }
        } catch {
          toast.error('Network error during deletion');
        }
      },
    });
  };

  const handleBlock = async (tenant: any) => {
    try {
      const result = await blockTenant(tenant.id);
      if (result.success) { toast.success(`Tenant "${tenant.attributes?.name}" blocked`); fetchTenants(); }
      else toast.error(result.message || 'Block failed');
    } catch { toast.error('Network error'); }
  };

  const handleUnblock = async (tenant: any) => {
    try {
      const result = await unblockTenant(tenant.id);
      if (result.success) { toast.success(`Tenant "${tenant.attributes?.name}" unblocked`); fetchTenants(); }
      else toast.error(result.message || 'Unblock failed');
    } catch { toast.error('Network error'); }
  };

  const handleSuspend = async (tenant: any) => {
    try {
      const result = await suspendTenant(tenant.id);
      if (result.success) { toast.success(`Tenant "${tenant.attributes?.name}" suspended`); fetchTenants(); }
      else toast.error(result.message || 'Suspend failed');
    } catch { toast.error('Network error'); }
  };

  const handleExportCSV = () => {
    if (filteredTenants.length === 0) { toast.error('No data to export'); return; }
    const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Country', 'Created At'];
    const rows = filteredTenants.map(t => [
      t.id,
      t.attributes?.name || '',
      t.attributes?.username || '',
      t.attributes?.email || '',
      t.attributes?.role?.name || '',
      t.attributes?.status || '',
      t.attributes?.country?.name || '',
      t.meta?.createdAt ? new Date(t.meta.createdAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Tenants exported to CSV');
  };

  return (
    <DashboardLayout title="Manage Tenants">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>Tenants</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredTenants.length} {filteredTenants.length === 1 ? 'tenant' : 'tenants'} found
                {tenants.length !== filteredTenants.length && ` (filtered from ${tenants.length})`}
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
              <Can I="tenant.create">
                <button className={styles.createBtn} onClick={handleCreate}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Tenant
                </button>
              </Can>
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
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading tenants...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {paginatedTenants.length > 0 ? (
              paginatedTenants.map(tenant => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                  onSuspend={handleSuspend}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No tenants found matching your search criteria.</p>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredTenants.length > 0 && (
          <div className={styles.paginationContainer}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Prev
            </button>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 7 || pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button key={pageNum} className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePageBtn : ''}`} onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </button>
                  );
                } else if ((pageNum === currentPage - 2 && pageNum > 1) || (pageNum === currentPage + 2 && pageNum < totalPages)) {
                  return <span key={pageNum} className={styles.pageInfo}>...</span>;
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

      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTenants}
        tenant={editingTenant}
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
