'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createIcon, updateIcon, IconData as WidgetData, IconType as WidgetType, IconFileType as WidgetIconType } from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'active_device',  label: 'Active Device' },
  { value: 'passive_device', label: 'Passive Device' },
  { value: 'power_device',   label: 'Power Device' },
  { value: 'junction',       label: 'Junction' },
  { value: 'fiber_terminal', label: 'Fiber Terminal' },
  { value: 'splitter',       label: 'Splitter' },
  { value: 'coupler',        label: 'Coupler' },
  { value: 'route_point',   label: 'Route Point' },
];

interface FormState {
  name:        string;
  type:        WidgetType;
  iconType:    WidgetIconType;
  svgTemplate: string;
  iconUrl:     string;
  width:       string;
  height:      string;
  status:      'active' | 'inactive';
}

const EMPTY: FormState = {
  name: '', type: 'active_device', iconType: 'svg',
  svgTemplate: '', iconUrl: '', width: '48', height: '48', status: 'active',
};

interface Props {
  widget:    WidgetData | null;
  onClose:   () => void;
  onSuccess: () => void;
}

function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

export default function WidgetModal({ widget, onClose, onSuccess }: Props) {
  const isEdit = !!widget;
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState<Partial<FormState>>({});

  useEffect(() => {
    if (widget) {
      const a = widget.attributes;
      setForm({
        name:        a.name,
        type:        a.type,
        iconType:    a.iconType,
        svgTemplate: a.svgTemplate ?? '',
        iconUrl:     a.iconUrl     ?? '',
        width:       String(a.width),
        height:      String(a.height),
        status:      a.status === 'inactive' ? 'inactive' : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [widget]);

  const set = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.width || isNaN(Number(form.width)) || Number(form.width) < 1)   e.width  = 'Enter a valid width';
    if (!form.height || isNaN(Number(form.height)) || Number(form.height) < 1) e.height = 'Enter a valid height';
    if (form.iconType === 'svg' && !form.svgTemplate.trim())  e.svgTemplate = 'SVG template is required for SVG icons';
    if (form.iconType !== 'svg' && !form.iconUrl.trim())      e.iconUrl     = 'Icon URL is required for PNG/WebP icons';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: any = {
        name:    form.name.trim(),
        type:    form.type,
        iconType: form.iconType,
        svgTemplate: form.iconType === 'svg' ? form.svgTemplate.trim() : null,
        iconUrl:     form.iconType !== 'svg' ? form.iconUrl.trim()     : null,
        width:  Number(form.width),
        height: Number(form.height),
      };
      if (isEdit) payload.status = form.status;

      const res = isEdit
        ? await updateIcon(widget!.id, payload)
        : await createIcon(payload);

      if (res.success) {
        toast.success(isEdit ? 'Widget updated' : 'Widget created');
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

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{isEdit ? 'Edit Widget' : 'Add Widget'}</h3>
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
                <input
                  className={styles.input}
                  placeholder="e.g. OLT Terminal"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              {/* Type */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Type *</label>
                <select className={styles.select} value={form.type} onChange={e => set('type', e.target.value)}>
                  {WIDGET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Icon Type */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Icon Type *</label>
                <select className={styles.select} value={form.iconType} onChange={e => set('iconType', e.target.value)}>
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              {/* Width */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Width (px) *</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  placeholder="48"
                  value={form.width}
                  onChange={e => set('width', e.target.value)}
                />
                {errors.width && <span className={styles.errorText}>{errors.width}</span>}
              </div>

              {/* Height */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Height (px) *</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  placeholder="48"
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                />
                {errors.height && <span className={styles.errorText}>{errors.height}</span>}
              </div>

              {/* SVG Template — only when iconType = svg */}
              {form.iconType === 'svg' && (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>SVG Template *</label>
                  <textarea
                    className={styles.input}
                    rows={6}
                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">…</svg>'
                    value={form.svgTemplate}
                    onChange={e => set('svgTemplate', e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}
                  />
                  {errors.svgTemplate && <span className={styles.errorText}>{errors.svgTemplate}</span>}
                  {/* Live preview */}
                  {form.svgTemplate.trim() && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div
                        style={{ width: Number(form.width) || 48, height: Number(form.height) || 48, flexShrink: 0, overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: fitSvg(form.svgTemplate) }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Preview ({form.width || '?'} × {form.height || '?'} px)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Icon URL — only when iconType = png / webp */}
              {form.iconType !== 'svg' && (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Icon URL *</label>
                  <input
                    className={styles.input}
                    placeholder="https://…/icon.png"
                    value={form.iconUrl}
                    onChange={e => set('iconUrl', e.target.value)}
                  />
                  {errors.iconUrl && <span className={styles.errorText}>{errors.iconUrl}</span>}
                  {form.iconUrl.trim() && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.iconUrl} alt="preview" width={Number(form.width) || 48} height={Number(form.height) || 48} style={{ objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Preview ({form.width || '?'} × {form.height || '?'} px)
                      </span>
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
