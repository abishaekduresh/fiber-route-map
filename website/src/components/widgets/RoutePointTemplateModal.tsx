'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  createRoutePointTemplate,
  updateRoutePointTemplate,
  getIcons,
  getDeviceTypes,
  type RoutePointTemplateData,
  type IconData,
  type DeviceTypeData,
} from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';
import SearchableSelect from './SearchableSelect';

interface Props {
  template: RoutePointTemplateData | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

const FLAG_DEFAULTS: Record<string, boolean> = {
  isPointNameRequired:       true,
  isDescriptionRequired:     false,
  isRemarksRequired:         false,
  isModelNumberRequired:     false,
  isSerialNumberRequired:    false,
  isAssetTagRequired:        false,
  isMacAddressRequired:      false,
  isIpv4AddressRequired:     false,
  isIpv6AddressRequired:     false,
  isSubnetRequired:          false,
  isGatewayRequired:         false,
  isVlanRequired:            false,
  isUsernameRequired:        false,
  isPasswordRequired:        false,
  isSnmpRequired:            false,
  isGpsLocationRequired:     false,
  isPoleNumberRequired:      false,
  isLandmarkRequired:        false,
  isAddressRequired:         false,
  isHeightRequired:          false,
  isRackNumberRequired:      false,
  isPortRequired:            false,
  isPowerSourceRequired:     false,
  isElectricityRequired:     false,
  isPhotoRequired:           false,
  isDocumentRequired:        false,
  isSignalInputRequired:     false,
  isSignalOutputRequired:    false,
  isAttenuationRequired:     false,
  isFiberCoreRequired:       false,
  isMonitoringEnabled:       false,
  isSnmpMonitoringEnabled:   false,
  isRealtimeStatusEnabled:   false,
  isCustomerMappingRequired: false,
  supportsInputPorts:           false,
  supportsOutputPorts:          false,
  supportsBidirectionalPorts:   false,
  supportsSignalFlow:           false,
  supportsOpticalCalculation:   false,
};

export default function RoutePointTemplateModal({ template, onClose, onSuccess }: Props) {
  const isEdit = !!template;
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [iconId, setIconId]           = useState<number | null>(null);
  const [deviceTypeId, setDeviceTypeId] = useState<number | null>(null);
  const [isDevice, setIsDevice]       = useState(false);
  const [flags, setFlags]             = useState<Record<string, boolean>>({ ...FLAG_DEFAULTS });
  const [status, setStatus]           = useState<'active' | 'inactive'>('active');
  const [saving, setSaving]           = useState(false);
  const [nameErr, setNameErr]         = useState('');
  const [icons, setIcons]             = useState<IconData[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeData[]>([]);

  useEffect(() => {
    getIcons({ limit: 100, status: 'active' }).then(r => { if (r.success && Array.isArray(r.data)) setIcons(r.data); }).catch(() => {});
    getDeviceTypes({ limit: 100, status: 'active' }).then(r => { if (r.success && Array.isArray(r.data)) setDeviceTypes(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (template) {
      const a = template.attributes;
      setName(a.name);
      setDescription(a.description ?? '');
      setIconId((a as any).iconId ?? null);
      setDeviceTypeId((a as any).deviceTypeId ?? null);
      setIsDevice(a.isDevice);
      setStatus(a.status === 'inactive' ? 'inactive' : 'active');
      const loaded: Record<string, boolean> = { ...FLAG_DEFAULTS };
      for (const key of Object.keys(FLAG_DEFAULTS)) {
        if (key in a) loaded[key] = Boolean((a as any)[key]);
      }
      setFlags(loaded);
    } else {
      setName(''); setDescription(''); setIconId(null); setDeviceTypeId(null);
      setIsDevice(false); setStatus('active'); setFlags({ ...FLAG_DEFAULTS });
    }
    setNameErr('');
  }, [template]);

  const setFlag = (key: string, val: boolean) => setFlags(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name is required'); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = {
        name:         name.trim(),
        description:  description.trim() || null,
        iconId,
        deviceTypeId,
        isDevice,
        ...flags,
      };
      if (isEdit) body.status = status;

      const res = isEdit
        ? await updateRoutePointTemplate(template!.id, body)
        : await createRoutePointTemplate(body);

      if (res.success) {
        toast.success(isEdit ? 'Template updated' : 'Template created');
        onSuccess();
      } else {
        toast.error(res.message || 'Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const checkSt: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' };

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit ? 'Edit Template' : 'Add Route Point Template'}
          </h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>

              {/* Name */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Name *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Electric Pole, FAT Box, Tree"
                  value={name}
                  onChange={e => { setName(e.target.value); setNameErr(''); }}
                />
                {nameErr && <span className={styles.errorText}>{nameErr}</span>}
              </div>

              {/* Classification: Is Device */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Classification</label>
                <label style={checkSt}>
                  <input
                    type="checkbox"
                    checked={isDevice}
                    onChange={e => { const v = e.target.checked; setIsDevice(v); if (v) setIconId(null); else setDeviceTypeId(null); }}
                    style={{ width: 15, height: 15, accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>Is a Device</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>— Enables device mapping in the field</span>
                </label>
              </div>

              {/* Icon — hidden when isDevice is true */}
              {!isDevice && (
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Icon <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <SearchableSelect
                  placeholder="— No icon —"
                  value={iconId !== null ? String(iconId) : ''}
                  onChange={v => setIconId(v ? Number(v) : null)}
                  options={icons.map(ic => ({
                    value: String(ic.attributes.numericId),
                    label: `${ic.attributes.name} (${ic.attributes.code})`,
                    preview: ic.attributes.iconType === 'svg' && ic.attributes.svgTemplate
                      ? <span dangerouslySetInnerHTML={{ __html: ic.attributes.svgTemplate.replace(/<svg([^>]*)>/i, (_, a) => `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:18px;height:18px">`) }} style={{ display: 'flex', width: 18, height: 18 }} />
                      : ic.attributes.iconUrl ? <img src={ic.attributes.iconUrl} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : undefined,
                  }))}
                />
              </div>
              )}

              {/* Device Type — only when isDevice is true */}
              {isDevice && (
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Device Type <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <SearchableSelect
                  placeholder="— No device type —"
                  value={deviceTypeId !== null ? String(deviceTypeId) : ''}
                  onChange={v => setDeviceTypeId(v ? Number(v) : null)}
                  options={deviceTypes.map(dt => ({
                    value: String(dt.attributes.numericId),
                    label: `${dt.attributes.name} (${dt.attributes.code})`,
                    preview: dt.attributes.iconSvgTemplate
                      ? <span dangerouslySetInnerHTML={{ __html: dt.attributes.iconSvgTemplate.replace(/<svg([^>]*)>/i, (_, a) => `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:18px;height:18px">`) }} style={{ display: 'flex', width: 18, height: 18 }} />
                      : dt.attributes.iconUrl ? <img src={dt.attributes.iconUrl} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : undefined,
                  }))}
                />
              </div>
              )}

              {/* Description */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <textarea
                  className={styles.input}
                  placeholder="Brief description of this template…"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '3rem' }}
                />
              </div>

              {/* Field Flags */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Field Flags</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {FLAG_GROUPS.map(group => (
                    <div key={group.label} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>{group.label}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem' }}>
                        {group.flags.map(({ label, key }) => (
                          <label key={key} style={checkSt}>
                            <input
                              type="checkbox"
                              checked={flags[key] ?? false}
                              onChange={e => setFlag(key, e.target.checked)}
                              style={{ width: 15, height: 15, accentColor: '#6366f1', cursor: 'pointer' }}
                            />
                            <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={status}
                    onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
