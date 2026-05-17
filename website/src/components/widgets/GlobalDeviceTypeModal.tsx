'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createDeviceType, updateDeviceType, getIcons, type DeviceTypeData, type DeviceCategoryData, type IconData } from '@/lib/api';

interface Props {
  deviceType: DeviceTypeData | null;
  categories: DeviceCategoryData[];
  onClose: () => void;
  onSuccess: () => void;
}

function fitSvg(svg: string) {
  return svg.replace(/<svg([^>]*)>/i, (_, a) => `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`);
}

const FLAG_GROUPS: { label: string; flags: { label: string; key: string }[] }[] = [
  { label: 'Basic Information', flags: [
    { label: 'Point Name Required',  key: 'isPointNameRequired'  },
    { label: 'Description Required', key: 'isDescriptionRequired' },
    { label: 'Remarks Required',     key: 'isRemarksRequired'    },
  ]},
  { label: 'Identification', flags: [
    { label: 'Model Number Required', key: 'isModelNumberRequired'  },
    { label: 'Serial Number Required', key: 'isSerialNumberRequired' },
    { label: 'Asset Tag Required',    key: 'isAssetTagRequired'     },
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
    { label: 'Monitoring Enabled',       key: 'isMonitoringEnabled'     },
    { label: 'SNMP Monitoring Enabled',  key: 'isSnmpMonitoringEnabled' },
    { label: 'Realtime Status Enabled',  key: 'isRealtimeStatusEnabled' },
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

export default function GlobalDeviceTypeModal({ deviceType, categories, onClose, onSuccess }: Props) {
  const isEdit = !!deviceType;
  const [name, setName]                         = useState('');
  const [description, setDescription]           = useState('');
  const [deviceCategoryId, setDeviceCategoryId] = useState('');
  const [iconId, setIconId]                     = useState('');
  const [status, setStatus]                     = useState<'active' | 'inactive'>('active');
  const [flags, setFlags]                       = useState<Record<string, boolean>>({ ...FLAG_DEFAULTS });
  const [saving, setSaving]                     = useState(false);
  const [nameErr, setNameErr]                   = useState('');
  const [icons, setIcons]                       = useState<IconData[]>([]);

  useEffect(() => {
    getIcons({ limit: 100, status: 'active' }).then(r => { if (r.success && Array.isArray(r.data)) setIcons(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (deviceType) {
      const a = deviceType.attributes;
      setName(a.name);
      setDescription(a.description ?? '');
      setDeviceCategoryId(a.deviceCategoryId != null ? String(a.deviceCategoryId) : '');
      setIconId(a.iconId != null ? String(a.iconId) : '');
      setStatus(a.status === 'inactive' ? 'inactive' : 'active');
      const loaded: Record<string, boolean> = { ...FLAG_DEFAULTS };
      for (const key of Object.keys(FLAG_DEFAULTS)) {
        if (key in a) loaded[key] = Boolean((a as any)[key]);
      }
      setFlags(loaded);
    } else {
      setName(''); setDescription(''); setDeviceCategoryId(''); setIconId(''); setStatus('active');
      setFlags({ ...FLAG_DEFAULTS });
    }
    setNameErr('');
  }, [deviceType]);

  const selectedIcon = icons.find(ic => String(ic.attributes.numericId) === iconId);

  const setFlag = (key: string, val: boolean) => setFlags(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name is required'); return; }
    setSaving(true);
    try {
      const body: any = {
        name: name.trim(),
        description: description.trim() || null,
        deviceCategoryId: deviceCategoryId ? Number(deviceCategoryId) : null,
        iconId: iconId ? Number(iconId) : null,
        ...flags,
      };
      if (isEdit) body.status = status;
      const res = isEdit
        ? await updateDeviceType(deviceType!.id, body)
        : await createDeviceType(body);
      if (res.success) { toast.success(isEdit ? 'Device type updated' : 'Device type created'); onSuccess(); }
      else toast.error(res.message || 'Save failed');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const inputSt: React.CSSProperties  = { width: '100%', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '0.85rem', boxSizing: 'border-box' };
  const labelSt: React.CSSProperties  = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const checkSt: React.CSSProperties  = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 640, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-bg-secondary)', zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{isEdit ? 'Edit Device Type' : 'Add Device Type'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelSt}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={{ ...inputSt, borderColor: nameErr ? '#ef4444' : undefined }} value={name} onChange={e => { setName(e.target.value); setNameErr(''); }} placeholder="e.g. FAT Box" />
            {nameErr && <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginTop: '0.2rem' }}>{nameErr}</span>}
          </div>
          <div>
            <label style={labelSt}>Category</label>
            <select style={inputSt} value={deviceCategoryId} onChange={e => setDeviceCategoryId(e.target.value)}>
              <option value="">— No category —</option>
              {categories.map(c => <option key={c.id} value={String(c.attributes.numericId)}>{c.attributes.name} ({c.attributes.code})</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Icon</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select style={{ ...inputSt, flex: 1 }} value={iconId} onChange={e => setIconId(e.target.value)}>
                <option value="">— No icon —</option>
                {icons.map(ic => <option key={ic.id} value={String(ic.attributes.numericId)}>{ic.attributes.name} ({ic.attributes.code})</option>)}
              </select>
              {selectedIcon && (
                <span style={{ width: 28, height: 28, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                  {selectedIcon.attributes.iconType === 'svg'
                    ? <span dangerouslySetInnerHTML={{ __html: fitSvg(selectedIcon.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 20, height: 20 }} />
                    : <img src={selectedIcon.attributes.iconUrl || ''} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                </span>
              )}
            </div>
          </div>

          <div>
            <label style={labelSt}>Field Flags</label>
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

          <div>
            <label style={labelSt}>Description</label>
            <textarea style={{ ...inputSt, resize: 'vertical' }} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description…" />
          </div>
          {isEdit && (
            <div>
              <label style={labelSt}>Status</label>
              <select style={inputSt} value={status} onChange={e => setStatus(e.target.value as 'active' | 'inactive')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
