'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { toast } from 'sonner';
import { getDeviceCategories, deleteDeviceCategory, type DeviceCategoryData } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GlobalDeviceCategoryModal from '@/components/widgets/GlobalDeviceCategoryModal';

const PER_PAGE = 10;

export default function DeviceCategoriesGlobalClient() {
  const { hasPermission } = useAuth();
  const canView   = hasPermission('device_categories.view');
  const canCreate = hasPermission('device_categories.create');
  const canUpdate = hasPermission('device_categories.update');
  const canDelete = hasPermission('device_categories.delete');

  const [categories, setCategories] = useState<DeviceCategoryData[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [selected, setSelected]     = useState<DeviceCategoryData | null>(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeviceCategoryData | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const totalPages = Math.ceil(total / PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeviceCategories({ page, limit: PER_PAGE, search, status: statusFilter });
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
        setTotal((res.meta as any)?.pagination?.total ?? res.data.length);
      }
    } catch { toast.error('Failed to load device categories'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { if (canView) load(); }, [load, canView]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (c: DeviceCategoryData) => { setSelected(c); setModalOpen(true); };
  const askDelete  = (c: DeviceCategoryData) => { setPendingDelete(c); setConfirmOpen(true); };
  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await deleteDeviceCategory(pendingDelete.id);
      if (res.success) { toast.success('Category deleted'); load(); }
      else toast.error(res.message || 'Delete failed');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); setConfirmOpen(false); setPendingDelete(null); }
  };

  if (!canView) return (
    <DashboardLayout title="Device Categories">
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.4 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <p style={{ margin: 0, fontWeight: 600 }}>Access Denied</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>You don't have permission to view device categories.</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Device Categories">
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Device Categories</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>Global device categories shared across all tenants</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Category
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
        <input
          style={{ flex: 1, padding: '0.45rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.8rem' }}
          placeholder="Search by name or code…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          style={{ padding: '0.45rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.8rem' }}
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-glass)', borderBottom: '1px solid var(--color-border)' }}>
              {['Code','Name','Description','Status','Created','Actions'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No categories found</td></tr>
            ) : categories.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.55rem 0.8rem' }}><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '2px 6px', borderRadius: 4 }}>{c.attributes.code}</span></td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.attributes.name}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'var(--color-text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.attributes.description || '—'}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: c.attributes.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: c.attributes.status === 'active' ? '#10b981' : '#94a3b8' }}>{c.attributes.status}</span>
                </td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{new Date(c.meta.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {canUpdate && (
                      <button onClick={() => openEdit(c)} title="Edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => askDelete(c)} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.3rem 0.6rem', borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '0.3rem 0.6rem', borderRadius: 4, border: `1px solid ${p === page ? 'var(--color-primary)' : 'var(--color-border)'}`, background: p === page ? 'var(--color-primary)' : 'transparent', color: p === page ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: '0.8rem' }}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.3rem 0.6rem', borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>{total} total</span>
        </div>
      )}

      {modalOpen && (
        <GlobalDeviceCategoryModal
          category={selected}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Category"
        message={`Delete category "${pendingDelete?.attributes.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
    </DashboardLayout>
  );
}
