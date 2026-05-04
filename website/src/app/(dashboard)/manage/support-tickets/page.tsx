'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  adminGetSupportTickets,
  adminGetSupportTicket,
  adminUpdateSupportTicket,
  adminGetTicketMessages,
  adminAddTicketMessage,
  SupportTicketData,
  TicketMessageData,
} from '@/lib/api';
import { Can } from '@/components/auth/Can';
import { toast } from 'sonner';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6', assigned: '#8b5cf6', in_progress: '#f59e0b',
  on_hold: '#94a3b8', resolved: '#10b981', closed: '#64748b', reopened: '#f97316',
};

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

const NEXT_STATUSES: Record<string, string[]> = {
  open:        ['assigned', 'closed'],
  assigned:    ['in_progress', 'on_hold', 'closed'],
  in_progress: ['on_hold', 'resolved', 'closed'],
  on_hold:     ['in_progress', 'closed'],
  resolved:    ['closed', 'reopened'],
  closed:      ['reopened'],
  reopened:    ['assigned', 'in_progress', 'on_hold', 'closed'],
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)', borderRadius: '10px',
  border: '1px solid var(--color-border)', padding: '16px',
  cursor: 'pointer', transition: 'border-color 0.15s',
};

const filterSelectStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)', outline: 'none',
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function TicketDetail({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: SupportTicketData;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [messages, setMessages] = useState<TicketMessageData[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(ticket.attributes.resolutionNotes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const a = ticket.attributes;
  const isClosed = ['resolved', 'closed'].includes(a.status);
  const nextStatuses = NEXT_STATUSES[a.status] ?? [];

  const loadMessages = useCallback(async () => {
    setMsgLoading(true);
    try {
      const res = await adminGetTicketMessages(ticket.id);
      if (res.success && Array.isArray(res.data)) setMessages(res.data);
    } catch { /* ignore */ }
    finally { setMsgLoading(false); }
  }, [ticket.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await adminAddTicketMessage(ticket.id, { message: replyText.trim() });
      if (res.success) { setReplyText(''); await loadMessages(); }
      else toast.error((res as any).message ?? 'Failed to send');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'resolved') {
        payload.resolvedAt = new Date().toISOString();
        if (resolutionNotes.trim()) payload.resolutionNotes = resolutionNotes.trim();
      }
      if (newStatus === 'closed') payload.closedAt = new Date().toISOString();
      const res = await adminUpdateSupportTicket(ticket.id, payload);
      if (res.success) { toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`); onUpdate(); }
      else toast.error((res as any).message ?? 'Update failed');
    } catch { toast.error('Failed to update status'); }
    finally { setUpdatingStatus(false); }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await adminUpdateSupportTicket(ticket.id, { resolutionNotes: resolutionNotes.trim() || null });
      if (res.success) toast.success('Notes saved');
      else toast.error((res as any).message ?? 'Failed to save notes');
    } catch { toast.error('Failed to save notes'); }
    finally { setSavingNotes(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-bg-card)', borderRadius: '12px',
        border: '1px solid var(--color-border)', width: '100%', maxWidth: '740px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {a.ticketNumber}
                </span>
                <StatusBadge status={a.status} />
                <PriorityBadge priority={a.priority} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                {a.subject}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {ticket.meta.tenantName} · {ticket.meta.businessName} · {a.category} · {a.impactLevel} impact
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontSize: '20px', lineHeight: 1, flexShrink: 0,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px' }}>
          {/* Meta */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {a.dueAt && (
              <span>Due: <strong style={{ color: new Date(a.dueAt) < new Date() && !isClosed ? '#ef4444' : 'var(--color-text-primary)' }}>
                {new Date(a.dueAt).toLocaleString()}
              </strong></span>
            )}
            {a.slaResponseTime && <span>SLA Response: <strong>{a.slaResponseTime}m</strong></span>}
            {a.slaResolutionTime && <span>SLA Resolution: <strong>{a.slaResolutionTime}m</strong></span>}
            {a.assigneeName && <span>Assigned: <strong>{a.assigneeName}</strong></span>}
          </div>

          {/* Description */}
          <div style={{
            background: 'var(--color-bg-secondary)', borderRadius: '8px',
            border: '1px solid var(--color-border)', padding: '12px',
            fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', marginBottom: '16px',
          }}>
            {a.description}
          </div>

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Update Status
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      cursor: updatingStatus ? 'not-allowed' : 'pointer',
                      background: `${STATUS_COLORS[s]}18`,
                      border: `1px solid ${STATUS_COLORS[s]}40`,
                      color: STATUS_COLORS[s],
                      opacity: updatingStatus ? 0.6 : 1,
                    }}
                  >
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Resolution Notes
            </div>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
              placeholder="Add resolution notes..."
              style={{
                ...filterSelectStyle, width: '100%', resize: 'vertical', minHeight: '60px',
                fontFamily: 'inherit', lineHeight: '1.4',
              }}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              style={{
                marginTop: '6px', padding: '5px 14px', borderRadius: '6px',
                fontSize: '12px', fontWeight: 600, cursor: savingNotes ? 'not-allowed' : 'pointer',
                background: 'var(--color-accent-primary)', border: 'none', color: '#fff',
                opacity: savingNotes ? 0.7 : 1,
              }}
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          {/* Messages */}
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Messages
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
            {msgLoading ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No messages yet.</p>
            ) : messages.map((msg) => {
              const isAdmin = msg.senderType === 'admin';
              return (
                <div key={msg.id} style={{
                  alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                  maxWidth: '78%',
                  background: isAdmin ? 'rgba(99,102,241,0.1)' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  borderRadius: '8px', padding: '8px 12px',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                    {isAdmin ? 'You (Admin)' : 'Tenant'} · {new Date(msg.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.45', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.message}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Reply footer */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--color-border)', padding: '14px 20px' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply to the tenant..."
              rows={2}
              style={{ ...filterSelectStyle, flex: 1, resize: 'none', fontFamily: 'inherit' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(e as any); }}
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: 'var(--color-accent-primary)', border: 'none', color: '#fff',
                cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !replyText.trim() ? 0.6 : 1, alignSelf: 'flex-end',
              }}
            >
              {sending ? '...' : 'Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || '#64748b';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}40`,
      textTransform: 'uppercase', fontFamily: 'monospace',
    }}>
      {priority}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketData | null>(null);

  const fetchTickets = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const filter: any = {};
      if (statusFilter !== 'all') filter.status = statusFilter;
      if (priorityFilter !== 'all') filter.priority = priorityFilter;
      if (searchFilter.trim()) filter.search = searchFilter.trim();

      const res = await adminGetSupportTickets({ page, limit: itemsPerPage, filter });
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
        const pagination = (res.meta as any)?.pagination;
        if (pagination) { setTotal(pagination.total || 0); setTotalPages(pagination.totalPages || 1); }
      } else {
        toast.error((res as any).message || 'Failed to fetch tickets');
        setTickets([]);
      }
    } catch { toast.error('Network error. Please try again.'); setTickets([]); }
    finally { setIsLoading(false); }
  }, [statusFilter, priorityFilter, searchFilter]);

  useEffect(() => { setCurrentPage(1); fetchTickets(1); }, [statusFilter, priorityFilter, searchFilter]);

  const handlePageChange = (page: number) => { setCurrentPage(page); fetchTickets(page); };

  const handleTicketUpdate = async () => {
    if (selectedTicket) {
      const res = await adminGetSupportTicket(selectedTicket.id);
      if (res.success && res.data) setSelectedTicket(res.data as SupportTicketData);
    }
    fetchTickets(currentPage);
  };

  return (
    <DashboardLayout title="Support Tickets">
      <Can I="support_ticket.view">
        <div style={{ padding: '0 0 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Support Tickets
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Manage tenant support requests across all businesses.
                {total > 0 && (
                  <span style={{ marginLeft: '8px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                    {total.toLocaleString()} total tickets
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            background: 'var(--color-bg-card)', borderRadius: '12px',
            border: '1px solid var(--color-border)', padding: '14px 16px',
            marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Search</label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Subject or ticket number..."
                style={{ ...filterSelectStyle }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Priority</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={filterSelectStyle}>
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {(statusFilter !== 'all' || priorityFilter !== 'all' || searchFilter) && (
              <button
                onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchFilter(''); }}
                style={{
                  alignSelf: 'flex-end', padding: '8px 14px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎫</div>
                <p style={{ margin: 0 }}>No support tickets found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Ticket #', 'Subject', 'Tenant', 'Category', 'Priority', 'Status', 'Due', 'Created', ''].map((h) => (
                        <th key={h} style={{
                          padding: '11px 14px', textAlign: 'left', fontWeight: 700,
                          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, idx) => {
                      const a = ticket.attributes;
                      const isOverdue = a.dueAt && new Date(a.dueAt) < new Date() && !['resolved', 'closed'].includes(a.status);
                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          style={{
                            borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                            background: idx % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-glass-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)')}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            {a.ticketNumber}
                          </td>
                          <td style={{ padding: '10px 14px', maxWidth: '240px' }}>
                            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.subject}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            {ticket.meta.tenantName || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {a.category}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <PriorityBadge priority={a.priority} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <StatusBadge status={a.status} />
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: isOverdue ? '#ef4444' : 'var(--color-text-secondary)', fontSize: '12px' }}>
                            {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : '—'}
                            {isOverdue && ' ⚠'}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                            {ticket.meta.createdAt ? new Date(ticket.meta.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button
                              title="View Details"
                              style={{
                                background: 'none', border: '1px solid var(--color-border)',
                                borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                                color: 'var(--color-text-secondary)', fontSize: '12px',
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <PaginationBtn disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>← Prev</PaginationBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationBtn key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
                    {page}
                  </PaginationBtn>
                );
              })}
              {totalPages > 7 && <span style={{ color: 'var(--color-text-secondary)' }}>...</span>}
              <PaginationBtn disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next →</PaginationBtn>
            </div>
          )}
        </div>
      </Can>

      {/* Detail panel */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </DashboardLayout>
  );
}

function PaginationBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
        border: `1px solid ${active ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
        color: active ? '#fff' : 'var(--color-text-secondary)',
        opacity: disabled ? 0.4 : 1, fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}
