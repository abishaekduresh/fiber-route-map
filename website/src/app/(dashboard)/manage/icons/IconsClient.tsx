'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthContext';
import {
  getIcons, deleteIcon,
  IconData, IconType, IconStatus,
} from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IconModal from '@/components/widgets/IconModal';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ICON_TYPE_LABELS: Record<IconType, string> = {
  active_device:  'Active Device',
  passive_device: 'Passive Device',
  power_device:   'Power Device',
  junction:       'Junction',
  fiber_terminal: 'Fiber Terminal',
  splitter:       'Splitter',
  coupler:        'Coupler',
  route_point:    'Route Point',
  customer_end:   'Customer End',
  flag:           'Flag',
};

const PER_PAGE = 10;

export default function IconsClient() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('icon.create');
  const canUpdate = hasPermission('icon.update');
  const canDelete = hasPermission('icon.delete');

  const [icons, setIcons]             = useState<IconData[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [typeFilter, setType]         = useState('');
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [selected, setSelected]       = useState<IconData | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const totalPages = Math.ceil(total / PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIcons({ page, limit: PER_PAGE, search, status: statusFilter, type: typeFilter });
      if (res.success && Array.isArray(res.data)) {
        setIcons(res.data);
        setTotal((res.meta as any)?.pagination?.total ?? res.data.length);
      }
    } catch {
      toast.error('Failed to load icons');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (w: IconData) => { setSelected(w); setModalOpen(true); };

  const handleDelete = async (w: IconData) => {
    if (!confirm(`Delete icon "${w.attributes.name}"? This cannot be undone.`)) return;
    setDeletingId(w.id);
    try {
      const res = await deleteIcon(w.id);
      if (res.success) {
        toast.success('Icon deleted');
        load();
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status: IconStatus) => {
    const map: Record<string, string> = {
      active:   styles['status-active'],
      inactive: styles['status-pending'],
      deleted:  styles['status-blocked'],
    };
    return (
      <span className={`${styles.statusBadge} ${map[status] ?? ''}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout title="Icons">
    <div className={styles.welcomeContainer}>
      <div className={styles.tableContainer}>
        {/* Header */}
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <h2 className={styles.tableTitle}>Icons</h2>
            <div className={styles.headerActions}>
              {canCreate && (
                <button className={styles.createBtn} onClick={openCreate}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Icon
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filterControls}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Search by name or code…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={e => { setType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              {(Object.entries(ICON_TYPE_LABELS) as [IconType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.tableLoader}>
            <svg style={{ animation: 'spin 0.8s linear infinite' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading…
          </div>
        ) : icons.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            <p>No icons found</p>
          </div>
        ) : (
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Icon</th>
                <th>Size</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {icons.map(w => {
                const a = w.attributes;
                return (
                  <tr key={w.id}>
                    <td>
                      <code style={{ fontSize: '0.8125rem', background: 'var(--color-bg-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {a.code}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {ICON_TYPE_LABELS[a.type] ?? a.type}
                      </span>
                    </td>
                    <td>
                      {a.iconType === 'svg' && a.svgTemplate ? (
                        <div
                          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          dangerouslySetInnerHTML={{ __html: a.svgTemplate }}
                        />
                      ) : a.iconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={a.iconUrl} alt={a.name} width={32} height={32} style={{ objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'ui-monospace, monospace' }}>{a.iconType}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {a.width} × {a.height}
                    </td>
                    <td>{statusBadge(a.status)}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {new Date(w.meta.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        {canUpdate && (
                          <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Edit" onClick={() => openEdit(w)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Delete"
                            disabled={deletingId === w.id}
                            onClick={() => handleDelete(w)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.activePageBtn : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <span className={styles.pageInfo}>{total} total</span>
          </div>
        )}
      </div>

      {modalOpen && (
        <IconModal
          icon={selected}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
    </DashboardLayout>
  );
}
