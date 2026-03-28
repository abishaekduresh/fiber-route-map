'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getRoles, deleteRole, ApiResponse } from '@/lib/api';
import RoleModal from '@/components/roles/RoleModal';
import RoleCard from '@/components/roles/RoleCard';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

/**
 * Manage Roles Page
 * 
 * Lists all system roles and their assigned permissions.
 */
export default function ManageRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const result = await getRoles();
      if (result.success && result.data) {
        setRoles(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch roles');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
      console.error('Fetch roles error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Filtered roles logic
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const attributes = role.attributes || {};
      const name = (attributes.name || '').toLowerCase();
      const slug = (attributes.slug || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return name.includes(search) || slug.includes(search);
    });
  }, [roles, searchTerm]);

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (role: any) => {
    if (!window.confirm(`Are you sure you want to delete role "${role.attributes?.name}"?`)) {
      return;
    }

    try {
      const result = await deleteRole(role.id);
      if (result.success) {
        toast.success(`Role "${role.attributes?.name}" deleted successfully`);
        fetchRoles();
      } else {
        toast.error(result.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error during deletion');
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Manage Roles">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>System Roles</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'} defining system permissions
              </span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.createBtn} onClick={handleCreate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create New Role
              </button>
            </div>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.searchInputWrapper} style={{ maxWidth: '100%' }}>
              <div className={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search roles by name or slug..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Accessing role definitions...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <RoleCard 
                  key={role.id} 
                  role={role} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No roles found matching your search criteria.</p>
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

      <RoleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchRoles}
        role={editingRole}
      />
    </DashboardLayout>
  );
}
