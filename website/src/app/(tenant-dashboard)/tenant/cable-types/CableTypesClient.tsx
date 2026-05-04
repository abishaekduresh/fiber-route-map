'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getCableTypes, blockCableType, unblockCableType, deleteCableType, CableTypeData } from '@/lib/api';
import CableTypeModal from '@/components/tenant-cable-types/CableTypeModal';
import CableTypeCard from '@/components/tenant-cable-types/CableTypeCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ITEMS_PER_PAGE = 6;

export default function CableTypesClient() {
  const [cableTypes, setCableTypes] = useState<CableTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CableTypeData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('cable_type.create');
  const canUpdate = hasPermission('cable_type.update');
  const canDelete = hasPermission('cable_type.delete');

  const fetchCableTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCableTypes({ limit: -1 });
      if (res.success && Array.isArray(res.data)) {
        setCableTypes(res.data);
      } else {
        setCableTypes([]);
      }
    } catch (err) {
      console.error('Failed to fetch cable types:', err);
      setCableTypes([]);
      toast.error('Failed to fetch cable types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCableTypes();
  }, [fetchCableTypes]);

  const filtered = useMemo(() => {
    return cableTypes.filter((ct) => {
      const a = ct.attributes;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (a.name || '').toLowerCase().includes(search) ||
        (a.code || '').toLowerCase().includes(search) ||
        (a.description || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || (a.status || 'active').toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cableTypes, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleAdd = () => { setSelected(null); setModalOpen(true); };
  const handleEdit = (ct: CableTypeData) => { setSelected(ct); setModalOpen(true); };

  const handleBlock = (ct: CableTypeData) => {
    setConfirmDialog({
      title: 'Block Cable Type',
      message: `Block "${ct.attributes.name}"?`,
      confirmLabel: 'Block',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await blockCableType(ct.id);
          if (res.success) { toast.success('Cable type blocked'); fetchCableTypes(); }
          else toast.error((res as any).message ?? 'Failed to block');
        } catch { toast.error('An error occurred'); }
      },
    });
  };

  const handleUnblock = (ct: CableTypeData) => {
    setConfirmDialog({
      title: 'Unblock Cable Type',
      message: `Unblock "${ct.attributes.name}"?`,
      confirmLabel: 'Unblock',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await unblockCableType(ct.id);
          if (res.success) { toast.success('Cable type unblocked'); fetchCableTypes(); }
          else toast.error((res as any).message ?? 'Failed to unblock');
        } catch { toast.error('An error occurred'); }
      },
    });
  };

  const handleDelete = (ct: CableTypeData) => {
    setConfirmDialog({
      title: 'Delete Cable Type',
      message: `Are you sure you want to delete "${ct.attributes.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await deleteCableType(ct.id);
          if (res.success) { toast.success('Cable type deleted successfully'); fetchCableTypes(); }
          else toast.error((res as any).message ?? 'Failed to delete');
        } catch { toast.error('An error occurred during deletion'); }
      },
    });
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.tableTitle}>Cable Types</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {filtered.length} {filtered.length === 1 ? 'cable type' : 'cable types'} found
              {cableTypes.length !== filtered.length && ` (filtered from ${cableTypes.length})`}
            </span>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={handleAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Cable Type
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
              placeholder="Search by name, code or description..."
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
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableLoader}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading cable types...</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {paginated.length > 0 ? (
            paginated.map((ct) => (
              <CableTypeCard
                key={ct.id}
                cableType={ct}
                onEdit={canUpdate ? () => handleEdit(ct) : undefined}
                onBlock={canUpdate && ct.attributes.status !== 'blocked' ? () => handleBlock(ct) : undefined}
                onUnblock={canUpdate && ct.attributes.status === 'blocked' ? () => handleUnblock(ct) : undefined}
                onDelete={canDelete ? () => handleDelete(ct) : undefined}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
              </svg>
              <p>No cable types found{searchTerm || statusFilter !== 'all' ? ' matching your criteria' : ''}.</p>
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

      <CableTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchCableTypes(); }}
        cableType={selected}
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
