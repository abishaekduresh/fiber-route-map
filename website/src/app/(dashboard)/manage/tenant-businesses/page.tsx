'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getTenantBusinesses, deleteTenantBusiness, blockTenantBusiness, unblockTenantBusiness, suspendTenantBusiness } from '@/lib/api';
import TenantBusinessCard from '@/components/tenant-businesses/TenantBusinessCard';
import TenantBusinessModal from '@/components/tenant-businesses/TenantBusinessModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

export default function ManageTenantBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const result = await getTenantBusinesses();
      if (result.success && result.data) {
        setBusinesses(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch tenant businesses');
      }
    } catch {
      toast.error('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const attrs = b.attributes || {};
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (attrs.name || '').toLowerCase().includes(search) ||
        (attrs.email || '').toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'all' || (attrs.status || 'active').toLowerCase() === statusFilter;
      const matchesType = typeFilter === 'all' || (attrs.type || '').toLowerCase() === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [businesses, searchTerm, statusFilter, typeFilter]);

  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBusinesses.slice(start, start + itemsPerPage);
  }, [filteredBusinesses, currentPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const handleEdit = (business: any) => {
    setEditingBusiness(business);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBusiness(null);
    setIsModalOpen(true);
  };

  const handleDelete = (business: any) => {
    setConfirmDialog({
      title: 'Delete Business',
      message: `Are you sure you want to delete "${business.attributes?.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const result = await deleteTenantBusiness(business.id);
          if (result.success) {
            toast.success(`Business "${business.attributes?.name}" deleted`);
            fetchBusinesses();
          } else {
            toast.error(result.message || 'Delete failed');
          }
        } catch {
          toast.error('Network error during deletion');
        }
      },
    });
  };

  const handleBlock = async (business: any) => {
    try {
      const result = await blockTenantBusiness(business.id);
      if (result.success) { toast.success(`Business "${business.attributes?.name}" blocked`); fetchBusinesses(); }
      else toast.error(result.message || 'Block failed');
    } catch { toast.error('Network error'); }
  };

  const handleUnblock = async (business: any) => {
    try {
      const result = await unblockTenantBusiness(business.id);
      if (result.success) { toast.success(`Business "${business.attributes?.name}" unblocked`); fetchBusinesses(); }
      else toast.error(result.message || 'Unblock failed');
    } catch { toast.error('Network error'); }
  };

  const handleSuspend = async (business: any) => {
    try {
      const result = await suspendTenantBusiness(business.id);
      if (result.success) { toast.success(`Business "${business.attributes?.name}" suspended`); fetchBusinesses(); }
      else toast.error(result.message || 'Suspend failed');
    } catch { toast.error('Network error'); }
  };

  const handleExportCSV = () => {
    if (filteredBusinesses.length === 0) { toast.error('No data to export'); return; }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Country', 'Created At'];
    const rows = filteredBusinesses.map(b => [
      b.id,
      b.attributes?.name || '',
      b.attributes?.email || '',
      b.attributes?.phone || '',
      b.attributes?.type || '',
      b.attributes?.status || '',
      b.attributes?.country?.name || '',
      b.meta?.createdAt ? new Date(b.meta.createdAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenant_businesses_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Tenant businesses exported to CSV');
  };

  return (
    <DashboardLayout title="Manage Tenant Businesses">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>Tenant Businesses</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
                {businesses.length !== filteredBusinesses.length && ` (filtered from ${businesses.length})`}
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
                Add Business
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
                placeholder="Search by name or email..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="operator">Operator</option>
              <option value="distributor">Distributor</option>
            </select>
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
            <p>Loading tenant businesses...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {paginatedBusinesses.length > 0 ? (
              paginatedBusinesses.map(business => (
                <TenantBusinessCard
                  key={business.id}
                  business={business}
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
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
                <p>No businesses found matching your search criteria.</p>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredBusinesses.length > 0 && (
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

      <TenantBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBusinesses}
        business={editingBusiness}
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
