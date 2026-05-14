'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { toast } from 'sonner';
import {
  getRoutePointTemplates,
  deleteRoutePointTemplate,
  type RoutePointTemplateData,
} from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RoutePointTemplateModal from '@/components/widgets/RoutePointTemplateModal';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const PER_PAGE = 10;

const FLAG_LABELS: { key: keyof RoutePointTemplateData['attributes']; label: string }[] = [
  { key: 'isPoleNumberRequired',    label: 'Pole #' },
  { key: 'isLandmarkRequired',      label: 'Landmark' },
  { key: 'isAddressRequired',       label: 'Address' },
  { key: 'isPhotoRequired',         label: 'Photo' },
  { key: 'isHeightRequired',        label: 'Height' },
  { key: 'isOwnerNameRequired',     label: 'Owner' },
  { key: 'isContactNumberRequired', label: 'Contact' },
  { key: 'isElectricityAvailable',  label: 'Elec.' },
];

export default function RoutePointTemplatesClient() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('route_point_templates.create');
  const canUpdate = hasPermission('route_point_templates.update');
  const canDelete = hasPermission('route_point_templates.delete');

  const [templates, setTemplates] = useState<RoutePointTemplateData[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected]   = useState<RoutePointTemplateData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RoutePointTemplateData | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const totalPages = Math.ceil(total / PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoutePointTemplates({ page, limit: PER_PAGE, search, status: statusFilter });
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
        setTotal((res.meta as any)?.pagination?.total ?? res.data.length);
      }
    } catch {
      toast.error('Failed to load route point templates');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (t: RoutePointTemplateData) => { setSelected(t); setModalOpen(true); };

  const askDelete = (t: RoutePointTemplateData) => { setPendingDelete(t); setConfirmOpen(true); };
  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await deleteRoutePointTemplate(pendingDelete.id);
      if (res.success) { toast.success('Template deleted'); load(); }
      else toast.error(res.message || 'Delete failed');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); setConfirmOpen(false); setPendingDelete(null); }
  };

  return (
    <DashboardLayout title="Route Point Templates">
    <div className={styles.welcomeContainer}>
      <div className={styles.tableContainer}>
        {/* Header */}
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <h2 className={styles.tableTitle}>Route Point Templates</h2>
            <div className={styles.headerActions}>
              {canCreate && (
                <button className={styles.createBtn} onClick={openCreate}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Template
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
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
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
        ) : templates.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No templates found</p>
          </div>
        ) : (
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Device</th>
                <th>Required Fields</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => {
                const a = t.attributes;
                return (
                  <tr key={t.id}>
                    <td>
                      <code style={{ fontSize: '0.8125rem', background: 'var(--color-bg-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {a.code}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td>
                      {a.isDevice
                        ? <span className={styles.statusBadge} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>Device</span>
                        : <span className={styles.statusBadge} style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>Passive</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {a.isPointNameRequired && (
                          <span className={styles.statusBadge} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Name</span>
                        )}
                        {FLAG_LABELS.filter(f => a[f.key]).map(f => (
                          <span key={f.key} className={styles.statusBadge} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{f.label}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${a.status === 'active' ? styles['status-active'] : styles['status-pending']}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {new Date(t.meta.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        {canUpdate && (
                          <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Edit" onClick={() => openEdit(t)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => askDelete(t)}>
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
        <RoutePointTemplateModal
          template={selected}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Template"
        message={`Delete template "${pendingDelete?.attributes.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
    </DashboardLayout>
  );
}
