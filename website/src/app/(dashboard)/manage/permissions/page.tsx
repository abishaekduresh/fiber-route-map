'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getPermissions, deletePermission, ApiResponse } from '@/lib/api';
import PermissionModal from '@/components/permissions/PermissionModal';
import PermissionCard from '@/components/permissions/PermissionCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

/**
 * Manage Permissions Page
 * 
 * Lists all available system permissions for resource-based access control.
 */
export default function ManagePermissionsPage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const result = await getPermissions();
      if (result.success && result.data) {
        setPermissions(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch permissions');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
      console.error('Fetch permissions error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = useMemo(() => {
    return permissions.filter(perm => {
      const name = (perm.attributes?.name || '').toLowerCase();
      const slug = (perm.attributes?.slug || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return name.includes(search) || slug.includes(search);
    });
  }, [permissions, searchTerm]);

  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    permissions.forEach(perm => {
      const resource = perm.attributes?.slug?.split('.')[0] || 'other';
      counts[resource] = (counts[resource] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [permissions]);

  const handleEdit = (permission: any) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const handleDelete = (permission: any) => {
    setConfirmDialog({
      title: 'Delete Permission',
      message: `Are you sure you want to permanently delete "${permission.attributes?.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const result = await deletePermission(permission.id);
          if (result.success) {
            toast.success(`Permission "${permission.attributes?.name}" deleted successfully`);
            fetchPermissions();
          } else {
            toast.error(result.message || 'Delete failed');
          }
        } catch (err) {
          toast.error('Network error during deletion');
        }
      },
    });
  };

  const handleCreate = () => {
    setEditingPermission(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Manage Permissions">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>System Permissions</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredPermissions.length} {filteredPermissions.length === 1 ? 'permission' : 'permissions'} defining system access levels
              </span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.createBtn} onClick={handleCreate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Permission
              </button>
            </div>
          </div>

          <div className={styles.filterControls} style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className={styles.searchInputWrapper} style={{ maxWidth: '100%', marginBottom: '0.5rem' }}>
              <div className={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by name or slug (e.g. user.view)..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {resourceCounts.map(([resource, count]) => (
                <div key={resource} style={{ 
                  fontSize: '0.7rem', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>{resource}</span>
                  <span style={{ color: 'var(--color-accent-blue)', fontWeight: 800 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Accessing system permission definitions...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filteredPermissions.length > 0 ? (
              filteredPermissions.map((perm) => (
                <PermissionCard 
                  key={perm.id} 
                  permission={perm} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No permissions found matching your search criteria.</p>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <PermissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPermissions}
        permission={editingPermission}
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
