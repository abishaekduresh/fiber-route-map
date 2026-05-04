'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getSupportTickets, SupportTicketData } from '@/lib/api';
import SupportTicketCard from '@/components/tenant-support-tickets/SupportTicketCard';
import SupportTicketModal from '@/components/tenant-support-tickets/SupportTicketModal';
import SupportTicketDetail from '@/components/tenant-support-tickets/SupportTicketDetail';
import { useTenantPermissions } from '@/components/providers/TenantAuthContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ITEMS_PER_PAGE = 9;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function SupportTicketsClient() {
  const [tickets, setTickets] = useState<SupportTicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketData | null>(null);
  const { hasPermission } = useTenantPermissions();

  const canCreate = hasPermission('support_ticket.create');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSupportTickets({ limit: -1 });
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets([]);
      toast.error('Failed to fetch support tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const a = t.attributes;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (a.subject || '').toLowerCase().includes(search) ||
        (a.ticketNumber || '').toLowerCase().includes(search) ||
        (a.category || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || a.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, priorityFilter]);

  const handleTicketClick = (ticket: SupportTicketData) => setSelectedTicket(ticket);

  const handleDetailClose = () => setSelectedTicket(null);

  const handleDetailUpdate = () => {
    setSelectedTicket(null);
    fetchTickets();
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.headerTop}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className={styles.tableTitle}>Support Tickets</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'} found
              {tickets.length !== filtered.length && ` (filtered from ${tickets.length})`}
            </span>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <button className={styles.createBtn} onClick={() => setModalOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Raise Ticket
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
              placeholder="Search by subject, ticket number or category..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={styles.filterSelect} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.tableLoader}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading tickets...</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {paginated.length > 0 ? (
            paginated.map((t) => (
              <SupportTicketCard key={t.id} ticket={t} onClick={() => handleTicketClick(t)} />
            ))
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>No tickets found{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? ' matching your criteria' : ''}.</p>
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-blue)', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }}
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

      <SupportTicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchTickets(); }}
      />

      {selectedTicket && (
        <SupportTicketDetail
          ticket={selectedTicket}
          onClose={handleDetailClose}
          onUpdate={handleDetailUpdate}
        />
      )}
    </div>
  );
}
