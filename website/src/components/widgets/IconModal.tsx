'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createIcon, updateIcon, IconData, IconType, IconFileType } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const ICON_TYPES: { value: IconType; label: string }[] = [
  { value: 'active_device',  label: 'Active Device' },
  { value: 'passive_device', label: 'Passive Device' },
  { value: 'power_device',   label: 'Power Device' },
  { value: 'junction',       label: 'Junction' },
  { value: 'fiber_terminal', label: 'Fiber Terminal' },
  { value: 'splitter',       label: 'Splitter' },
  { value: 'coupler',        label: 'Coupler' },
  { value: 'route_point',    label: 'Route Point' },
  { value: 'customer_end',   label: 'Customer End' },
  { value: 'flag',           label: 'Flag' },
  { value: 'others',         label: 'Others' },
];

interface FormState {
  name:        string;
  type:        IconType;
  iconType:    IconFileType;
  svgTemplate: string;
  width:       string;
  height:      string;
  status:      'active' | 'inactive';
}

const EMPTY: FormState = {
  name: '', type: 'active_device', iconType: 'svg',
  svgTemplate: '', width: '48', height: '48', status: 'active',
};

interface Props {
  icon:      IconData | null;
  onClose:   () => void;
  onSuccess: () => void;
}

function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

export default function IconModal({ icon, onClose, onSuccess }: Props) {
  const isEdit = !!icon;
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [file, setFile]           = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (icon) {
      const a = icon.attributes;
      setForm({
        name:        a.name,
        type:        a.type,
        iconType:    a.iconType,
        svgTemplate: a.svgTemplate ?? '',
        width:       String(a.width),
        height:      String(a.height),
        status:      a.status === 'inactive' ? 'inactive' : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setFile(null);
    setFilePreview(null);
  }, [icon]);

  // Revoke object URL when component unmounts or preview changes
  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  const set = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); setFilePreview(null); return; }

    setFile(f);

    if (f.type === 'image/svg+xml') {
      // Read SVG content into the textarea — no server-side file storage needed for SVG
      const reader = new FileReader();
      reader.onload = ev => {
        set('svgTemplate', (ev.target?.result as string) ?? '');
        setFilePreview(null);
      };
      reader.readAsText(f);
    } else {
      // PNG / WebP — create an object URL for preview
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (filePreview) { URL.revokeObjectURL(filePreview); setFilePreview(null); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.width  || isNaN(Number(form.width))  || Number(form.width)  < 1) e.width  = 'Enter a valid width';
    if (!form.height || isNaN(Number(form.height)) || Number(form.height) < 1) e.height = 'Enter a valid height';
    if (form.iconType === 'svg' && !form.svgTemplate.trim()) e.svgTemplate = 'SVG code is required (paste or upload a .svg file)';
    if (form.iconType !== 'svg') {
      const hasExisting = isEdit && icon?.attributes.iconUrl;
      if (!file && !hasExisting) e.file = 'Please upload a file';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',     form.name.trim());
      fd.append('type',     form.type);
      fd.append('iconType', form.iconType);
      fd.append('width',    form.width);
      fd.append('height',   form.height);
      if (isEdit) fd.append('status', form.status);

      if (form.iconType === 'svg') {
        fd.append('svgTemplate', form.svgTemplate.trim());
      } else if (file) {
        fd.append('file', file);
      }
      // If editing PNG/WebP and no new file selected, skip — server keeps existing iconUrl

      const res = isEdit
        ? await updateIcon(icon!.id, fd)
        : await createIcon(fd);

      if (res.success) {
        toast.success(isEdit ? 'Icon updated' : 'Icon created');
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

  const acceptAttr = form.iconType === 'svg' ? '.svg,image/svg+xml'
    : form.iconType === 'png' ? '.png,image/png'
    : '.webp,image/webp';

  const existingUrl = icon?.attributes.iconUrl ?? null;

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{isEdit ? 'Edit Icon' : 'Add Icon'}</h3>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>

              {/* Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Name *</label>
                <input className={styles.input} placeholder="e.g. OLT Terminal" value={form.name} onChange={e => set('name', e.target.value)} />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              {/* Type */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Type *</label>
                <select className={styles.select} value={form.type} onChange={e => set('type', e.target.value)}>
                  {ICON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Icon Type */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>File Type *</label>
                <select className={styles.select} value={form.iconType} onChange={e => { set('iconType', e.target.value); clearFile(); }}>
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              {/* Width */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Width (px) *</label>
                <input className={styles.input} type="number" min={1} placeholder="48" value={form.width} onChange={e => set('width', e.target.value)} />
                {errors.width && <span className={styles.errorText}>{errors.width}</span>}
              </div>

              {/* Height */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Height (px) *</label>
                <input className={styles.input} type="number" min={1} placeholder="48" value={form.height} onChange={e => set('height', e.target.value)} />
                {errors.height && <span className={styles.errorText}>{errors.height}</span>}
              </div>

              {/* SVG — textarea + optional file upload */}
              {form.iconType === 'svg' && (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>SVG Code *</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '0.78rem', color: 'var(--color-accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Upload .svg file
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept={acceptAttr} onChange={handleFileChange} style={{ display: 'none' }} />
                  <textarea
                    className={styles.input}
                    rows={6}
                    placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">…</svg>'}
                    value={form.svgTemplate}
                    onChange={e => set('svgTemplate', e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}
                  />
                  {errors.svgTemplate && <span className={styles.errorText}>{errors.svgTemplate}</span>}
                  {form.svgTemplate.trim() && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: Number(form.width) || 48, height: Number(form.height) || 48, flexShrink: 0, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: fitSvg(form.svgTemplate) }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Preview ({form.width || '?'} × {form.height || '?'} px)</span>
                    </div>
                  )}
                </div>
              )}

              {/* PNG / WebP — file picker */}
              {form.iconType !== 'svg' && (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    {form.iconType.toUpperCase()} File {isEdit ? '' : '*'}
                  </label>

                  {/* Drop zone / picker */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${errors.file ? '#f87171' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      background: 'var(--color-bg-primary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent-blue)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = errors.file ? '#f87171' : 'var(--color-border)')}
                  >
                    <input ref={fileInputRef} type="file" accept={acceptAttr} onChange={handleFileChange} style={{ display: 'none' }} />
                    {file ? (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{file.name}</span>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Click to select a .{form.iconType} file
                        {isEdit && existingUrl && ' (leave empty to keep current)'}
                      </span>
                    )}
                  </div>
                  {errors.file && <span className={styles.errorText}>{errors.file}</span>}

                  {/* Preview: new file takes priority, otherwise show existing */}
                  {(filePreview || existingUrl) && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreview ?? existingUrl!}
                        alt="preview"
                        width={Number(form.width) || 48}
                        height={Number(form.height) || 48}
                        style={{ objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {filePreview ? `New file — ${form.width || '?'} × ${form.height || '?'} px` : 'Current file'}
                      </span>
                      {file && (
                        <button type="button" onClick={clearFile} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status — edit only */}
              {isEdit && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Icon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
