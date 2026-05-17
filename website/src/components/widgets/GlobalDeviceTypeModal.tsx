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

export default function GlobalDeviceTypeModal({ deviceType, categories, onClose, onSuccess }: Props) {
  const isEdit = !!deviceType;
  const [name, setName]                         = useState('');
  const [description, setDescription]           = useState('');
  const [deviceCategoryId, setDeviceCategoryId] = useState('');
  const [iconId, setIconId]                     = useState('');
  const [status, setStatus]                     = useState<'active' | 'inactive'>('active');
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
    } else {
      setName(''); setDescription(''); setDeviceCategoryId(''); setIconId(''); setStatus('active');
    }
    setNameErr('');
  }, [deviceType]);

  const selectedIcon = icons.find(ic => String(ic.attributes.numericId) === iconId);

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
