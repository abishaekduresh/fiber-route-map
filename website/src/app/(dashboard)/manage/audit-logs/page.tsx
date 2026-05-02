'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAuditLogs } from '@/lib/api';
import { Can } from '@/components/auth/Can';
import { toast } from 'sonner';
import styles from '../../dashboard/dashboard.module.css';

interface AuditLogEntry {
  id: string;
  type: string;
  attributes: {
    actorType: 'user' | 'system' | 'anonymous';
    actorUuid: string | null;
    actorName: string | null;
    actorEmail: string | null;
    actorRoles: string[];
    action: string;
    resource: string;
    resourceUuid: string | null;
    resourceName: string | null;
    httpMethod: string;
    endpoint: string;
    statusCode: number;
    success: boolean;
    requestBody: Record<string, unknown> | null;
    responseBody: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    requestId: string | null;
    sessionUuid: string | null;
    durationMs: number;
    errorMessage: string | null;
  };
  meta: { createdAt: string };
}

const METHOD_COLORS: Record<string, string> = {
  GET:    '#3b82f6',
  POST:   '#10b981',
  PUT:    '#f59e0b',
  PATCH:  '#f59e0b',
  DELETE: '#ef4444',
};

const ACTION_ICONS: Record<string, string> = {
  'auth.login':          '🔑',
  'auth.logout':         '🚪',
  'auth.sessions.list':  '📋',
  'auth.session.delete': '🗑️',
  'user.create':         '👤',
  'user.update':         '✏️',
  'user.delete':         '🗑️',
  'user.block':          '🚫',
  'user.unblock':        '✅',
  'user.reset-password': '🔒',
  'role.create':         '🎭',
  'role.update':         '✏️',
  'role.delete':         '🗑️',
  'permission.create':   '🔐',
  'permission.update':   '✏️',
  'permission.delete':   '🗑️',
  'tenant.create':       '🏢',
  'tenant.update':       '✏️',
  'tenant.delete':       '🗑️',
  'tenant_business.create': '🏭',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

function StatusBadge({ success, statusCode }: { success: boolean; statusCode: number }) {
  const color = success ? '#10b981' : statusCode >= 500 ? '#ef4444' : '#f59e0b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {statusCode}
    </span>
  );
}

function DetailModal({ log, onClose }: { log: AuditLogEntry; onClose: () => void }) {
  const a = log.attributes;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-bg-card)', borderRadius: '12px',
        border: '1px solid var(--color-border)', width: '100%', maxWidth: '760px',
        maxHeight: '90vh', overflowY: 'auto', padding: '24px',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>{ACTION_ICONS[a.action] || '📝'}</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {a.action}
              </h2>
              <StatusBadge success={a.success} statusCode={a.statusCode} />
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {formatDate(log.meta.createdAt)}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary, #888)', fontSize: '20px', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Actor */}
          <Section title="Actor">
            <Field label="Type" value={a.actorType} />
            <Field label="Name" value={a.actorName || '—'} />
            <Field label="Email" value={a.actorEmail || '—'} />
            <Field label="Roles" value={a.actorRoles.length ? a.actorRoles.join(', ') : '—'} />
            <Field label="Actor UUID" value={a.actorUuid || '—'} mono />
            <Field label="Session UUID" value={a.sessionUuid || '—'} mono />
          </Section>

          {/* Request */}
          <Section title="Request">
            <Field label="Method" value={
              <span style={{ color: METHOD_COLORS[a.httpMethod] || '#fff', fontWeight: 700 }}>
                {a.httpMethod}
              </span>
            } />
            <Field label="Endpoint" value={a.endpoint} mono />
            <Field label="IP Address" value={a.ipAddress || '—'} mono />
            <Field label="Duration" value={formatDuration(a.durationMs)} />
            <Field label="Request ID" value={a.requestId || '—'} mono />
          </Section>

          {/* Resource */}
          <Section title="Resource">
            <Field label="Resource" value={a.resource} />
            <Field label="Resource UUID" value={a.resourceUuid || '—'} mono />
            <Field label="Resource Name" value={a.resourceName || '—'} />
          </Section>

          {/* Response */}
          <Section title="Response">
            <Field label="Status Code" value={<StatusBadge success={a.success} statusCode={a.statusCode} />} />
            <Field label="Success" value={a.success ? '✅ Yes' : '❌ No'} />
            {a.errorMessage && <Field label="Error" value={a.errorMessage} />}
          </Section>

          {/* Request Body */}
          {a.requestBody && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Section title="Request Body (sanitized)">
                <JsonBlock value={a.requestBody} />
              </Section>
            </div>
          )}

          {/* Response Body */}
          {a.responseBody && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Section title="Response Summary">
                <JsonBlock value={a.responseBody} />
              </Section>
            </div>
          )}

          {/* User Agent */}
          {a.userAgent && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Section title="User Agent">
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #888)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {a.userAgent}
                </p>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-bg-secondary)', borderRadius: '8px',
      padding: '14px', border: '1px solid var(--color-border)',
    }}>
      <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent-primary)' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', fontSize: '13px' }}>
      <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', textAlign: 'right', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '11px' : undefined }}>
        {value}
      </span>
    </div>
  );
}

function JsonBlock({ value }: { value: Record<string, unknown> }) {
  return (
    <pre style={{
      margin: 0, padding: '10px', borderRadius: '6px',
      background: 'rgba(0,0,0,0.3)', color: '#a5f3fc',
      fontSize: '11px', overflowX: 'auto', fontFamily: 'monospace',
      maxHeight: '200px', overflowY: 'auto',
    }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const filter: any = {};
      if (filterAction)   filter.action    = filterAction;
      if (filterResource) filter.resource  = filterResource;
      if (filterSuccess !== '') filter.success = filterSuccess;
      if (filterEmail)    filter.actorEmail = filterEmail;
      if (filterIp)       filter.ipAddress  = filterIp;
      if (filterDateFrom) filter.dateFrom   = filterDateFrom;
      if (filterDateTo)   filter.dateTo     = filterDateTo;

      const result = await getAuditLogs({
        page,
        limit: itemsPerPage,
        sort: '-createdAt',
        filter,
      });

      if (result.success && result.data) {
        setLogs(result.data as AuditLogEntry[]);
        const pagination = (result.meta as any)?.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalCount(pagination.total || 0);
        }
      } else {
        toast.error(result.message || 'Failed to fetch audit logs');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, filterResource, filterSuccess, filterEmail, filterIp, filterDateFrom, filterDateTo]);

  useEffect(() => {
    setCurrentPage(1);
    fetchLogs(1);
  }, [filterAction, filterResource, filterSuccess, filterEmail, filterIp, filterDateFrom, filterDateTo]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLogs(page);
  };

  const handleClearFilters = () => {
    setFilterAction('');
    setFilterResource('');
    setFilterSuccess('');
    setFilterEmail('');
    setFilterIp('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterAction || filterResource || filterSuccess !== '' || filterEmail || filterIp || filterDateFrom || filterDateTo;

  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.attributes.resource));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <DashboardLayout title="Audit Logs">
      <Can I="audit_log.view">
        <div style={{ padding: '0 0 40px' }}>

          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Audit Logs
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Detailed record of every action performed — who, when, what, and from where.
              {totalCount > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                  {totalCount.toLocaleString()} entries
                </span>
              )}
            </p>
          </div>

          {/* Filters */}
          <div style={{
            background: 'var(--color-bg-card)', borderRadius: '12px',
            border: '1px solid var(--color-border)', padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FilterInput label="Action" placeholder="e.g. user.create" value={filterAction} onChange={setFilterAction} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Resource</label>
                <select
                  value={filterResource}
                  onChange={e => setFilterResource(e.target.value)}
                  style={filterSelectStyle}
                >
                  <option value="">All resources</option>
                  {['user','role','permission','country','tenant','tenant_business','audit_log','auth'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Outcome</label>
                <select
                  value={filterSuccess}
                  onChange={e => setFilterSuccess(e.target.value)}
                  style={filterSelectStyle}
                >
                  <option value="">All</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              <FilterInput label="Actor Email" placeholder="email@example.com" value={filterEmail} onChange={setFilterEmail} />
              <FilterInput label="IP Address" placeholder="192.168.1.1" value={filterIp} onChange={setFilterIp} />
              <FilterInput label="Date From" type="date" value={filterDateFrom} onChange={setFilterDateFrom} />
              <FilterInput label="Date To" type="date" value={filterDateTo} onChange={setFilterDateTo} />
              {hasActiveFilters && (
                <button onClick={handleClearFilters} style={{
                  alignSelf: 'flex-end', padding: '8px 16px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: 'var(--color-bg-card)', borderRadius: '12px',
            border: '1px solid var(--color-border)', overflow: 'hidden',
          }}>
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p style={{ margin: 0 }}>No audit log entries found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Timestamp', 'Actor', 'Action', 'Resource', 'Method', 'Status', 'IP', 'Duration', ''].map(h => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left', fontWeight: 700,
                          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'var(--color-text-secondary)',
                          background: 'var(--color-bg-secondary)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => {
                      const a = log.attributes;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          style={{
                            borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            background: idx % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-glass-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)')}
                        >
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                            {formatDate(log.meta.createdAt)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                              {a.actorName || a.actorEmail || 'Anonymous'}
                            </div>
                            {a.actorEmail && a.actorName && (
                              <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{a.actorEmail}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{ACTION_ICONS[a.action] || '📝'}</span>
                              <span style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>
                                {a.action}
                              </span>
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {a.resource}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontWeight: 700, fontSize: '11px', padding: '2px 8px',
                              borderRadius: '4px', fontFamily: 'monospace',
                              color: METHOD_COLORS[a.httpMethod] || '#fff',
                              background: `${METHOD_COLORS[a.httpMethod] || '#fff'}18`,
                            }}>
                              {a.httpMethod}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <StatusBadge success={a.success} statusCode={a.statusCode} />
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {a.ipAddress || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatDuration(a.durationMs)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button 
                              title="View Details"
                              style={{
                                background: 'none', border: '1px solid var(--color-border)',
                                borderRadius: '6px', padding: '6px', cursor: 'pointer',
                                color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-bg-glass-hover)';
                                e.currentTarget.style.color = 'var(--color-accent-primary)';
                                e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
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
              {totalPages > 7 && <span style={{ color: 'var(--text-secondary, #888)' }}>...</span>}
              <PaginationBtn disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next →</PaginationBtn>
            </div>
          )}
        </div>
      </Can>

      {/* Detail Modal */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </DashboardLayout>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

const filterSelectStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)', outline: 'none',
};

function FilterInput({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...filterSelectStyle, minWidth: type === 'date' ? '140px' : '160px' }}
      />
    </div>
  );
}

function PaginationBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px', borderRadius: '8px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
        border: `1px solid ${active ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
        color: active ? '#fff' : 'var(--color-text-secondary)',
        opacity: disabled ? 0.4 : 1,
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}
