'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCountries, deleteCountry, blockCountry, unblockCountry } from '@/lib/api';
import CountryCard from '@/components/users/CountryCard';
import CountryModal from '@/components/users/CountryModal';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

/**
 * Manage Countries Page
 * 
 * Lists all countries with their codes and status.
 * Supports CRUD, blocking/unblocking, and searching.
 */
export default function ManageCountriesPage() {
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const result = await getCountries();
      if (result.success && result.data) {
        setCountries(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch countries');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
      console.error('Fetch countries error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Filtered countries logic
  const filteredCountries = useMemo(() => {
    return countries.filter(country => {
      const attributes = country.attributes || {};
      const name = (attributes.name || '').toLowerCase();
      const code = (attributes.code || '').toLowerCase();
      const phoneCode = (attributes.phoneCode || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || 
                           code.includes(search) || 
                           phoneCode.includes(search);
      
      const status = (attributes.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [countries, searchTerm, statusFilter]);

  // Paginated countries logic
  const paginatedCountries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCountries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCountries, currentPage]);

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleEdit = (country: any) => {
    setEditingCountry(country);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCountry(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (country: any) => {
    if (!window.confirm(`Are you sure you want to delete country "${country.attributes?.name}"?`)) {
      return;
    }

    try {
      const result = await deleteCountry(country.id);
      if (result.success) {
        toast.success(`Country "${country.attributes?.name}" deleted successfully`);
        fetchCountries();
      } else {
        toast.error(result.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error during deletion');
    }
  };

  const handleBlock = async (country: any) => {
    try {
      const result = await blockCountry(country.id);
      if (result.success) {
        toast.success(`Country "${country.attributes?.name}" blocked`);
        fetchCountries();
      } else {
        toast.error(result.message || 'Block failed');
      }
    } catch (err) {
      toast.error('Network error during blocking');
    }
  };

  const handleUnblock = async (country: any) => {
    try {
      const result = await unblockCountry(country.id);
      if (result.success) {
        toast.success(`Country "${country.attributes?.name}" unblocked`);
        fetchCountries();
      } else {
        toast.error(result.message || 'Unblock failed');
      }
    } catch (err) {
      toast.error('Network error during unblocking');
    }
  };

  return (
    <DashboardLayout title="Manage Countries">
      <div className={styles.tableContainer} style={{ background: 'transparent', border: 'none' }}>
        <div className={styles.tableHeader} style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={styles.tableTitle}>System Countries</h3>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
              </span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.createBtn} onClick={handleCreate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Country
              </button>
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
                placeholder="Search by name, code or dialing code..." 
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
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.tableLoader}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Accessing country directory...</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {paginatedCountries.length > 0 ? (
              paginatedCountries.map((country) => (
                <CountryCard 
                  key={country.id} 
                  country={country} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No countries found matching your search criteria.</p>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredCountries.length > 0 && (
          <div className={styles.paginationContainer} style={{ background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginTop: '2rem' }}>
            <button 
              className={styles.pageBtn} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <CountryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCountries}
        country={editingCountry}
      />
    </DashboardLayout>
  );
}
