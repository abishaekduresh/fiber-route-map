'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getUpstreamProviders, blockUpstreamProvider, unblockUpstreamProvider, deleteUpstreamProvider, UpstreamProviderData } from '@/lib/api';
import UpstreamProviderModal from '@/components/tenant-upstream-providers/UpstreamProviderModal';
import UpstreamProviderCard from '@/components/tenant-upstream-providers/UpstreamProviderCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ITEMS_PER_PAGE = 6;

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  cabletv: 'Cable TV',
  bandwidth: 'Bandwidth',
  iptv: 'IPTV',
  hybrid: 'Hybrid',
};

export default function UpstreamProvidersClient() {
  const [providers, setProviders] = useState<UpstreamProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<UpstreamProviderData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('upstream_provider.create');
  const canUpdate = hasPermission('upstream_provider.update');
  const canDelete = hasPermission('upstream_provider.delete');

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUpstreamProviders({ limit: -1 });
      if (res.success && Array.isArray(res.data)) {
        setProviders(res.data);
      } else {
        setProviders([]);
      }
    } catch (err) {
      console.error('Failed to fetch upstream providers:', err);
      setProviders([]);
      toast.error('Failed to fetch upstream providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const a = p.attributes;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (a.name || '').toLowerCase().includes(search) ||
        (a.code || '').toLowerCase().includes(search) ||
        (a.email || '').toLowerCase().includes(search) ||
        (a.phone || '').toLowerCase().includes(search) ||
        (a.contactPerson || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || (a.status || 'active').toLowerCase() === statusFilter;
      const matchCategory = categoryFilter === 'all' || a.serviceCategory === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [providers, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const handleAdd = () => {
    setSelectedProvider(null);
    setModalOpen(true);
  };

  const handleEdit = (provider: UpstreamProviderData) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const handleBlock = (provider: UpstreamProviderData) => {
    setConfirmDialog({
      title: 'Block Provider',
      message: `Block "${provider.attributes.name}"? They will lose access.`,
      confirmLabel: 'Block',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await blockUpstreamProvider(provider.id);
          if (res.success) {
            toast.success('Provider blocked successfully');
            fetchProviders();
          } else {
            toast.error((res as any).message ?? 'Failed to block provider');
          }
        } catch {
          toast.error('An error occurred');
        }
      },
    });
  };

  const handleUnblock = (provider: UpstreamProviderData) => {
    setConfirmDialog({
      title: 'Unblock Provider',
      message: `Unblock "${provider.attributes.name}"?`,
      confirmLabel: 'Unblock',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await unblockUpstreamProvider(provider.id);
          if (res.success) {
            toast.success('Provider unblocked successfully');
            fetchProviders();
          } else {
            toast.error((res as any).message ?? 'Failed to unblock provider');
          }
        } catch {
          toast.error('An error occurred');
        }
      },
    });
  };

  const handleDelete = (provider: UpstreamProviderData) => {
    setConfirmDialog({
      title: 'Delete Provider',
      message: `Are you sure you want to delete "${provider.attributes.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await deleteUpstreamProvider(provider.id);
          if (res.success) {
            toast.success('Provider deleted successfully');
            fetchProviders();
          } else {
            toast.error((res as any).message ?? 'Failed to delete provider');
          }
        } catch {
          toast.error('An error occurred during deletion');
        }
      },
    });
  };

  return (
    <div className={styles.tableContainer}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.tableTitle}>Upstream Providers</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {filtered.length} {filtered.length === 1 ? 'provider' : 'providers'} found
              {providers.length !== filtered.length && ` (filtered from ${providers.length})`}
            </span>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={handleAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Provider
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
              placeholder="Search by name, code, email or phone..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableLoader}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading upstream providers...</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {paginated.length > 0 ? (
            paginated.map((provider) => (
              <UpstreamProviderCard
                key={provider.id}
                provider={provider}
                onEdit={canUpdate ? () => handleEdit(provider) : undefined}
                onBlock={canUpdate && provider.attributes.status !== 'blocked' ? () => handleBlock(provider) : undefined}
                onUnblock={canUpdate && provider.attributes.status === 'blocked' ? () => handleUnblock(provider) : undefined}
                onDelete={canDelete ? () => handleDelete(provider) : undefined}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
              <p>No providers found{searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? ' matching your criteria' : ''}.</p>
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); }}
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

      <UpstreamProviderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchProviders(); }}
        provider={selectedProvider}
      />

      <ConfirmDialog
        isOpen={confirmDialog !== null}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel={confirmDialog?.confirmLabel ?? 'Confirm'}
        variant={confirmDialog?.variant ?? 'danger'}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
