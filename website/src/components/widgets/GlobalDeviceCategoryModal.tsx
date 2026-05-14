'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createGlobalDeviceCategory, updateGlobalDeviceCategory, type GlobalDeviceCategoryData } from '@/lib/api';

interface Props { category: GlobalDeviceCategoryData | null; onClose: () => void; onSuccess: () => void; }

export default function GlobalDeviceCategoryModal({ category, onClose, onSuccess }: Props) {
  const isEdit = !!category;
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState<'active' | 'inactive'>('active');
  const [saving, setSaving]           = useState(false);
  const [nameErr, setNameErr]         = useState('');

  useEffect(() => {
    if (category) {
      setName(category.attributes.name);
      setDescription(category.attributes.description ?? '');
      setStatus(category.attributes.status === 'inactive' ? 'inactive' : 'active');
    } else {
      setName(''); setDescription(''); setStatus('active');
    }
    setNameErr('');
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name is required'); return; }
    setSaving(true);
    try {
      const body: any = { name: name.trim(), description: description.trim() || null };
      if (isEdit) body.status = status;
      const res = isEdit
        ? await updateGlobalDeviceCategory(category!.id, body)
        : await createGlobalDeviceCategory(body);
      if (res.success) { toast.success(isEdit ? 'Category updated' : 'Category created'); onSuccess(); }
      else toast.error(res.message || 'Save failed');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' };
  const modalStyle: React.CSSProperties  = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' };
  const inputStyle: React.CSSProperties  = { width: '100%', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '0.85rem', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties  = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{isEdit ? 'Edit Category' : 'Add Device Category'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={{ ...inputStyle, borderColor: nameErr ? '#ef4444' : undefined }} value={name} onChange={e => { setName(e.target.value); setNameErr(''); }} placeholder="e.g. Fiber Terminal" />
            {nameErr && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{nameErr}</span>}
          </div>
          <div>
            <label style={labelStyle}>Description <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" />
          </div>
          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as 'active' | 'inactive')}>
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
