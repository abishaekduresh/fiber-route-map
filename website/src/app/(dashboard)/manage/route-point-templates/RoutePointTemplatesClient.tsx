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

const ALL_FLAGS = [
  'isPointNameRequired','isDescriptionRequired','isRemarksRequired',
  'isModelNumberRequired','isSerialNumberRequired','isAssetTagRequired',
  'isMacAddressRequired','isIpv4AddressRequired','isIpv6AddressRequired','isSubnetRequired','isGatewayRequired','isVlanRequired',
  'isUsernameRequired','isPasswordRequired','isSnmpRequired',
  'isGpsLocationRequired','isPoleNumberRequired','isLandmarkRequired','isAddressRequired','isHeightRequired',
  'isRackNumberRequired','isPortRequired','isPowerSourceRequired','isElectricityRequired',
  'isPhotoRequired','isDocumentRequired',
  'isSignalInputRequired','isSignalOutputRequired','isAttenuationRequired','isFiberCoreRequired',
  'isMonitoringEnabled','isSnmpMonitoringEnabled','isRealtimeStatusEnabled',
  'isCustomerMappingRequired',
  'supportsInputPorts','supportsOutputPorts','supportsBidirectionalPorts','supportsSignalFlow','supportsOpticalCalculation',
] as const;

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
  const [viewTemplate, setViewTemplate] = useState<RoutePointTemplateData | null>(null);

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
                <th>Icon</th>
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
                      {(() => {
                        const svgTpl  = a.isDevice ? a.deviceTypeIconSvgTemplate : a.iconSvgTemplate;
                        const imgUrl  = a.isDevice ? a.deviceTypeIconUrl         : a.iconUrl;
                        const label   = a.isDevice ? a.deviceTypeIconName        : a.iconName;
                        if (svgTpl) return (
                          <span title={label ?? undefined} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                            <span dangerouslySetInnerHTML={{ __html: svgTpl.replace(/<svg([^>]*)>/i, (_, at) => `<svg${at.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:18px;height:18px">`) }} style={{ display: 'flex', width: 18, height: 18 }} />
                          </span>
                        );
                        if (imgUrl) return (
                          <span title={label ?? undefined} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                            <img src={imgUrl} alt={label ?? ''} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                          </span>
                        );
                        return <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>—</span>;
                      })()}
                    </td>
                    <td>
                      {a.isDevice
                        ? <span className={styles.statusBadge} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>Device</span>
                        : <span className={styles.statusBadge} style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>Passive</span>}
                    </td>
                    <td>
                      {(() => {
                        const flagCount = ALL_FLAGS.filter(k => (a as any)[k]).length;
                        return flagCount > 0
                          ? <span className={styles.statusBadge} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
                          : <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>—</span>;
                      })()}
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
                        <button className={styles.actionBtn} title="View" onClick={() => setViewTemplate(t)}
                          style={{ color: 'var(--color-text-secondary)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
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
      {/* View Modal */}
      {viewTemplate && (() => {
        const a = viewTemplate.attributes;
        const svgTpl = a.isDevice ? a.deviceTypeIconSvgTemplate : a.iconSvgTemplate;
        const imgUrl = a.isDevice ? a.deviceTypeIconUrl         : a.iconUrl;
        const iconLabel = a.isDevice ? a.deviceTypeIconName     : a.iconName;
        const FLAG_GROUPS: { label: string; flags: { label: string; key: string }[] }[] = [
          { label: 'Basic Information', flags: [
            { label: 'Point Name Required',  key: 'isPointNameRequired'  },
            { label: 'Description Required', key: 'isDescriptionRequired' },
            { label: 'Remarks Required',     key: 'isRemarksRequired'    },
          ]},
          { label: 'Identification', flags: [
            { label: 'Model Number Required',  key: 'isModelNumberRequired'  },
            { label: 'Serial Number Required', key: 'isSerialNumberRequired' },
            { label: 'Asset Tag Required',     key: 'isAssetTagRequired'     },
          ]},
          { label: 'Networking', flags: [
            { label: 'MAC Address Required',  key: 'isMacAddressRequired'  },
            { label: 'IPv4 Address Required', key: 'isIpv4AddressRequired' },
            { label: 'IPv6 Address Required', key: 'isIpv6AddressRequired' },
            { label: 'Subnet Required',       key: 'isSubnetRequired'      },
            { label: 'Gateway Required',      key: 'isGatewayRequired'     },
            { label: 'VLAN Required',         key: 'isVlanRequired'        },
          ]},
          { label: 'Authentication', flags: [
            { label: 'Username Required', key: 'isUsernameRequired' },
            { label: 'Password Required', key: 'isPasswordRequired' },
            { label: 'SNMP Required',     key: 'isSnmpRequired'     },
          ]},
          { label: 'GIS / Location', flags: [
            { label: 'GPS Location Required', key: 'isGpsLocationRequired' },
            { label: 'Pole Number Required',  key: 'isPoleNumberRequired'  },
            { label: 'Landmark Required',     key: 'isLandmarkRequired'    },
            { label: 'Address Required',      key: 'isAddressRequired'     },
            { label: 'Height Required',       key: 'isHeightRequired'      },
          ]},
          { label: 'Device Installation', flags: [
            { label: 'Rack Number Required',  key: 'isRackNumberRequired'  },
            { label: 'Port Required',         key: 'isPortRequired'        },
            { label: 'Power Source Required', key: 'isPowerSourceRequired' },
            { label: 'Electricity Required',  key: 'isElectricityRequired' },
          ]},
          { label: 'Media / Files', flags: [
            { label: 'Photo Required',    key: 'isPhotoRequired'    },
            { label: 'Document Required', key: 'isDocumentRequired' },
          ]},
          { label: 'Optical / Signal', flags: [
            { label: 'Signal Input Required',  key: 'isSignalInputRequired'  },
            { label: 'Signal Output Required', key: 'isSignalOutputRequired' },
            { label: 'Attenuation Required',   key: 'isAttenuationRequired'  },
            { label: 'Fiber Core Required',    key: 'isFiberCoreRequired'    },
          ]},
          { label: 'Monitoring', flags: [
            { label: 'Monitoring Enabled',      key: 'isMonitoringEnabled'     },
            { label: 'SNMP Monitoring Enabled', key: 'isSnmpMonitoringEnabled' },
            { label: 'Realtime Status Enabled', key: 'isRealtimeStatusEnabled' },
          ]},
          { label: 'Customer & Topology', flags: [
            { label: 'Customer Mapping Required',    key: 'isCustomerMappingRequired'  },
            { label: 'Supports Input Ports',         key: 'supportsInputPorts'         },
            { label: 'Supports Output Ports',        key: 'supportsOutputPorts'        },
            { label: 'Supports Bidirectional Ports', key: 'supportsBidirectionalPorts' },
            { label: 'Supports Signal Flow',         key: 'supportsSignalFlow'         },
            { label: 'Supports Optical Calculation', key: 'supportsOpticalCalculation' },
          ]},
        ];
        return (
          <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setViewTemplate(null)}>
            <div className={styles.modal} style={{ maxWidth: 600 }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Template Details</h3>
                <button type="button" className={styles.closeBtn} onClick={() => setViewTemplate(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className={styles.modalContent}>
                {/* Name + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {(svgTpl || imgUrl) && (
                    <span style={{ width: 40, height: 40, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
                      {svgTpl
                        ? <span dangerouslySetInnerHTML={{ __html: svgTpl.replace(/<svg([^>]*)>/i, (_, at) => `<svg${at.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:26px;height:26px">`) }} style={{ display: 'flex', width: 26, height: 26 }} />
                        : <img src={imgUrl!} alt={iconLabel ?? ''} style={{ width: 26, height: 26, objectFit: 'contain' }} />}
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{a.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <code style={{ fontSize: '0.75rem', background: 'var(--color-bg-primary)', padding: '0.1rem 0.35rem', borderRadius: 4, border: '1px solid var(--color-border)' }}>{a.code}</code>
                      <span className={`${styles.statusBadge} ${a.status === 'active' ? styles['status-active'] : styles['status-pending']}`}>{a.status}</span>
                      {a.isDevice
                        ? <span className={styles.statusBadge} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>Device</span>
                        : <span className={styles.statusBadge} style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>Passive</span>}
                    </div>
                  </div>
                </div>

                {/* Meta rows */}
                {[
                  a.iconName       && !a.isDevice && { label: 'Icon',        value: `${a.iconName} (${a.iconCode})` },
                  a.deviceTypeName && a.isDevice  && { label: 'Device Type', value: `${a.deviceTypeName} (${a.deviceTypeCode})` },
                  a.description                   && { label: 'Description', value: a.description },
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', minWidth: 100 }}>{row.label}</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{row.value}</span>
                  </div>
                ))}

                {/* Field Flags */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Field Flags</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {FLAG_GROUPS.map(group => {
                      const active = group.flags.filter(f => (a as any)[f.key]);
                      const inactive = group.flags.filter(f => !(a as any)[f.key]);
                      return (
                        <div key={group.label} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{group.label}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {active.map(f => (
                              <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                {f.label}
                              </span>
                            ))}
                            {inactive.map(f => (
                              <span key={f.key} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 999, background: 'rgba(100,116,139,0.08)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                {f.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                {canUpdate && (
                  <button className={styles.submitBtn} onClick={() => { setViewTemplate(null); openEdit(viewTemplate); }}>Edit</button>
                )}
                <button className={styles.cancelBtn} onClick={() => setViewTemplate(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

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
