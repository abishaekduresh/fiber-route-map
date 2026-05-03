'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getLcos, deleteLco, LcoData } from '@/lib/api';
import LcoModal from '@/components/tenant-lcos/LcoModal';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';

export default function LcosClient() {
  const [lcos, setLcos] = useState<LcoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLco, setSelectedLco] = useState<LcoData | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('lco.create');
  const canUpdate = hasPermission('lco.update');
  const canDelete = hasPermission('lco.delete');

  const fetchLcos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getLcos({ filter: { lcoName: searchTerm } });
      if (res.success && Array.isArray(res.data)) {
        setLcos(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch LCOs:', err);
      toast.error('Failed to fetch LCOs');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLcos();
  }, [fetchLcos]);

  const handleCreate = () => {
    setSelectedLco(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lco: LcoData) => {
    setSelectedLco(lco);
    setIsModalOpen(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this LCO?')) return;
    try {
      const res = await deleteLco(uuid);
      if (res.success) {
        toast.success('LCO deleted successfully');
        fetchLcos();
      } else {
        toast.error((res as any).message ?? 'Failed to delete LCO');
      }
    } catch (err: any) {
      console.error('Failed to delete LCO:', err);
      toast.error(err.message ?? 'An error occurred during deletion');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #a1a1b5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LCO Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Manage your Local Cable Operators and their details.
          </p>
        </div>
        
        {canCreate && (
          <button
            onClick={handleCreate}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: '#fff', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add LCO
          </button>
        )}
      </div>

      <div style={{
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(10px)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by LCO name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', color: '#fff', outline: 'none'
            }}
          />
          <svg
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 200, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }} />
          ))
        ) : lcos.length > 0 ? (
          lcos.map((lco) => (
            <div
              key={lco.id}
              style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.5rem', transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-blue)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {lco.attributes.code}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{lco.attributes.lcoName}</h3>
                </div>
                <div style={{
                  padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700,
                  background: lco.attributes.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: lco.attributes.status === 'active' ? '#10b981' : '#ef4444', border: `1px solid ${lco.attributes.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  {lco.attributes.status.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  {lco.attributes.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {lco.attributes.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <svg style={{ marginTop: '0.125rem' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{lco.attributes.address_line1}, {lco.attributes.city}, {lco.attributes.state} - {lco.attributes.pincode}</span>
                </div>
              </div>

              {(canUpdate || canDelete) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  {canUpdate && (
                    <button
                      onClick={() => handleEdit(lco)}
                      style={{
                        padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', cursor: 'pointer'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(lco.id)}
                      style={{
                        padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>No LCOs Found</h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              {searchTerm ? 'Try adjusting your search term.' : 'Click "Add LCO" to get started.'}
            </p>
          </div>
        )}
      </div>

      <LcoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchLcos();
        }}
        lco={selectedLco}
      />
    </div>
  );
}
