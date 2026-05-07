'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getDeviceTypes,
  getDeviceCategories,
  deleteDeviceType,
  DeviceTypeData,
  DeviceCategoryData,
} from '@/lib/api';
import DeviceTypeModal from '@/components/tenant-device-types/DeviceTypeModal';
import DeviceTypeCard from '@/components/tenant-device-types/DeviceTypeCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ITEMS_PER_PAGE = 6;

export default function DeviceTypesClient() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeData[]>([]);
  const [categories, setCategories] = useState<DeviceCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<DeviceTypeData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('device_type.create');
  const canUpdate = hasPermission('device_type.update');
  const canDelete = hasPermission('device_type.delete');

  const fetchDeviceTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDeviceTypes({ limit: -1 });
      if (res.success && Array.isArray(res.data)) {
        setDeviceTypes(res.data);
      } else {
        setDeviceTypes([]);
      }
    } catch (err) {
      console.error('Failed to fetch device types:', err);
      setDeviceTypes([]);
      toast.error('Failed to fetch device types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeviceTypes();
    getDeviceCategories({ limit: -1 }).then((res) => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    });
  }, [fetchDeviceTypes]);

  const filtered = useMemo(() => {
    return deviceTypes.filter((dt) => {
      const a = dt.attributes;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (a.name || '').toLowerCase().includes(search) ||
        (a.code || '').toLowerCase().includes(search) ||
        (a.categoryName || '').toLowerCase().includes(search) ||
        (a.description || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || (a.status || 'active').toLowerCase() === statusFilter;
      const matchCategory = !categoryFilter || String(a.tenantDeviceCategoryId) === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [deviceTypes, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, categoryFilter]);

  const handleAdd = () => { setSelected(null); setModalOpen(true); };
  const handleEdit = (dt: DeviceTypeData) => { setSelected(dt); setModalOpen(true); };

  const handleDelete = (dt: DeviceTypeData) => {
    setConfirmDialog({
      title: 'Delete Device Type',
      message: `Are you sure you want to delete "${dt.attributes.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await deleteDeviceType(dt.id);
          if (res.success) { toast.success('Device type deleted successfully'); fetchDeviceTypes(); }
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
            <h3 className={styles.tableTitle}>Device Types</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {filtered.length} {filtered.length === 1 ? 'type' : 'types'} found
              {deviceTypes.length !== filtered.length && ` (filtered from ${deviceTypes.length})`}
            </span>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={handleAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Device Type
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
              placeholder="Search by name, code, category or description..."
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
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.attributes.numericId)}>
                {cat.attributes.name}
              </option>
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
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableLoader}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading device types...</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {paginated.length > 0 ? (
            paginated.map((dt) => (
              <DeviceTypeCard
                key={dt.id}
                deviceType={dt}
                onEdit={canUpdate ? () => handleEdit(dt) : undefined}
                onDelete={canDelete ? () => handleDelete(dt) : undefined}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
              </svg>
              <p>No device types found{searchTerm || statusFilter !== 'all' || categoryFilter ? ' matching your criteria' : ''}.</p>
              {(searchTerm || statusFilter !== 'all' || categoryFilter) && (
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter(''); }}
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

      <DeviceTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchDeviceTypes(); }}
        deviceType={selected}
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
