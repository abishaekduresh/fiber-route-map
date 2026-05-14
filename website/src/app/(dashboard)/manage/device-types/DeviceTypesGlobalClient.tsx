'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { toast } from 'sonner';
import { getGlobalDeviceTypes, getGlobalDeviceCategories, deleteGlobalDeviceType, type GlobalDeviceTypeData, type GlobalDeviceCategoryData } from '@/lib/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GlobalDeviceTypeModal from '@/components/widgets/GlobalDeviceTypeModal';

const PER_PAGE = 10;

function fitSvgInline(svg: string) {
  return svg.replace(/<svg([^>]*)>/i, (_, a) => `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`);
}

export default function DeviceTypesGlobalClient() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('device_types.create');
  const canUpdate = hasPermission('device_types.update');
  const canDelete = hasPermission('device_types.delete');

  const [types, setTypes]               = useState<GlobalDeviceTypeData[]>([]);
  const [categories, setCategories]     = useState<GlobalDeviceCategoryData[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [selected, setSelected]         = useState<GlobalDeviceTypeData | null>(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GlobalDeviceTypeData | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const totalPages = Math.ceil(total / PER_PAGE);

  useEffect(() => {
    getGlobalDeviceCategories({ limit: 100 }).then(res => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGlobalDeviceTypes({ page, limit: PER_PAGE, search, status: statusFilter, categoryId: catFilter || undefined });
      if (res.success && Array.isArray(res.data)) {
        setTypes(res.data);
        setTotal((res.meta as any)?.pagination?.total ?? res.data.length);
      }
    } catch { toast.error('Failed to load device types'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (t: GlobalDeviceTypeData) => { setSelected(t); setModalOpen(true); };
  const askDelete  = (t: GlobalDeviceTypeData) => { setPendingDelete(t); setConfirmOpen(true); };
  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await deleteGlobalDeviceType(pendingDelete.id);
      if (res.success) { toast.success('Device type deleted'); load(); }
      else toast.error(res.message || 'Delete failed');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); setConfirmOpen(false); setPendingDelete(null); }
  };

  const flagKeys = ['isModelNumberRequired','isSerialNumberRequired','isMacAddressRequired','isIPAddressRequired','isGpsLocationRequired'] as const;
  const flagLabels = { isModelNumberRequired: 'Model#', isSerialNumberRequired: 'Serial#', isMacAddressRequired: 'MAC', isIPAddressRequired: 'IP', isGpsLocationRequired: 'GPS' };

  const inputSt: React.CSSProperties = { padding: '0.45rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.8rem' };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Device Types</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>Global device types shared across all tenants</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Device Type
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input style={{ ...inputSt, flex: 1, minWidth: 180 }} placeholder="Search by name or code…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={inputSt} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.attributes.name}</option>)}
        </select>
        <select style={inputSt} value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-glass)', borderBottom: '1px solid var(--color-border)' }}>
              {['Code','Name','Category','Icon','Flags','Status','Created','Actions'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
            ) : types.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No device types found</td></tr>
            ) : types.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.55rem 0.8rem' }}><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '2px 6px', borderRadius: 4 }}>{t.attributes.code}</span></td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{t.attributes.name}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'var(--color-text-secondary)' }}>{t.attributes.categoryName ?? '—'}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  {t.attributes.iconFileType === 'svg' && t.attributes.iconSvgTemplate
                    ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(t.attributes.iconSvgTemplate) }} style={{ display: 'inline-flex', width: 22, height: 22 }} />
                    : t.attributes.iconUrl
                    ? <img src={t.attributes.iconUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    : <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>—</span>}
                </td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    {flagKeys.filter(k => t.attributes[k]).map(k => (
                      <span key={k} style={{ padding: '1px 5px', borderRadius: 3, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{flagLabels[k]}</span>
                    ))}
                    {!flagKeys.some(k => t.attributes[k]) && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: t.attributes.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: t.attributes.status === 'active' ? '#10b981' : '#94a3b8' }}>{t.attributes.status}</span>
                </td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{new Date(t.meta.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {canUpdate && (
                      <button onClick={() => openEdit(t)} title="Edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => askDelete(t)} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
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
        <GlobalDeviceTypeModal
          deviceType={selected}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Device Type"
        message={`Delete device type "${pendingDelete?.attributes.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
  );
}
