'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getTenantRoutes, deleteTenantRoute,
  TenantRouteData, TenantRouteType,
} from '@/lib/api';
import RouteModal from '@/components/tenant-routes/RouteModal';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const TYPE_LABELS: Record<TenantRouteType, string> = {
  fiber_route:          'Fiber Route',
  coaxial_route:        'Coaxial Route',
  backbone_route:       'Backbone Route',
  distribution_route:   'Distribution Route',
  drop_route:           'Drop Route',
  underground_duct:     'Underground Duct',
  pole_to_pole:         'Pole to Pole',
};

const PER_PAGE = 10;

export default function RoutesClient() {
  const { hasPermission } = useTenantPermissions();
  const canCreate = hasPermission('tenant_routes.create');
  const canUpdate = hasPermission('tenant_routes.update');
  const canDelete = hasPermission('tenant_routes.delete');

  const [routes, setRoutes]         = useState<TenantRouteData[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [selected, setSelected]     = useState<TenantRouteData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Record<string, string> = {};
      if (search)      filter.search = search;
      if (typeFilter)  filter.type   = typeFilter;
      if (statusFilter) filter.status = statusFilter;
      const res = await getTenantRoutes({ page, limit: PER_PAGE, filter });
      if (res.success && Array.isArray(res.data)) {
        setRoutes(res.data);
        setTotal((res.meta as any)?.pagination?.total ?? res.data.length);
      }
    } catch {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (r: TenantRouteData) => { setSelected(r); setModalOpen(true); };

  const handleDelete = async (r: TenantRouteData) => {
    if (!confirm(`Delete route "${r.attributes.name}" (${r.attributes.code})? This cannot be undone.`)) return;
    setDeletingId(r.id);
    try {
      const res = await deleteTenantRoute(r.id);
      if (res.success) { toast.success('Route deleted'); load(); }
      else toast.error(res.message || 'Delete failed');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const statusClass = (status: string) => {
    const map: Record<string, string> = {
      active:      styles['status-active'],
      inactive:    styles['status-pending'],
      maintenance: styles['status-pending'],
      deleted:     styles['status-blocked'],
    };
    return `${styles.statusBadge} ${map[status] ?? ''}`;
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums: (number | '…')[] = [1];
    if (page > 3) nums.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) nums.push(p);
    if (page < totalPages - 2) nums.push('…');
    nums.push(totalPages);
    return nums;
  }, [page, totalPages]);

  return (
    <div className={styles.tableContainer}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <h2 className={styles.tableTitle}>Routes</h2>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={openCreate}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Route
              </button>
            )}
          </div>
        </div>

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
          <select className={styles.filterSelect} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {(Object.entries(TYPE_LABELS) as [TenantRouteType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
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
      ) : routes.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 17l4-8 4 4 4-6 4 3" />
          </svg>
          <p>No routes found</p>
        </div>
      ) : (
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Color</th>
              <th>Points</th>
              <th>Parent Route</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => {
              const a = r.attributes;
              return (
                <tr key={r.id}>
                  <td>
                    <code style={{ fontSize: '0.8125rem', background: 'var(--color-bg-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                      {a.code}
                    </code>
                  </td>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {TYPE_LABELS[a.type] ?? a.type}
                  </td>
                  <td>
                    {a.routeColor ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: a.routeColor, border: '1px solid var(--color-border)', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{a.routeColor}</span>
                      </span>
                    ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {a.pointsCount > 0 ? `${a.pointsCount} pts` : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {a.parentRouteName ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={statusClass(a.status)} style={{ textTransform: 'capitalize' }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {new Date(r.meta.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      {canUpdate && (
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Edit" onClick={() => openEdit(r)}>
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
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r)}
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
          {pageNumbers.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className={styles.pageInfo}>…</span>
              : <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePageBtn : ''}`} onClick={() => setPage(p as number)}>{p}</button>
          )}
          <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          <span className={styles.pageInfo}>{total} total</span>
        </div>
      )}

      {modalOpen && (
        <RouteModal
          route={selected}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
