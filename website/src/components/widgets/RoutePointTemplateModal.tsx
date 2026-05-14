'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  createRoutePointTemplate,
  updateRoutePointTemplate,
  getIcons,
  getGlobalDeviceTypes,
  type RoutePointTemplateData,
  type IconData,
  type GlobalDeviceTypeData,
} from '@/lib/api';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

interface Props {
  template: RoutePointTemplateData | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name:                    string;
  description:             string;
  iconId:                  number | null;
  deviceTypeId:            number | null;
  isDevice:                boolean;
  isPointNameRequired:     boolean;
  isPoleNumberRequired:    boolean;
  isLandmarkRequired:      boolean;
  isAddressRequired:       boolean;
  isPhotoRequired:         boolean;
  isHeightRequired:        boolean;
  isOwnerNameRequired:     boolean;
  isContactNumberRequired: boolean;
  isElectricityAvailable:  boolean;
  status:                  'active' | 'inactive';
}

const EMPTY: FormState = {
  name:                    '',
  description:             '',
  iconId:                  null,
  deviceTypeId:            null,
  isDevice:                false,
  isPointNameRequired:     true,
  isPoleNumberRequired:    false,
  isLandmarkRequired:      false,
  isAddressRequired:       false,
  isPhotoRequired:         false,
  isHeightRequired:        false,
  isOwnerNameRequired:     false,
  isContactNumberRequired: false,
  isElectricityAvailable:  false,
  status:                  'active',
};

const BOOL_FIELDS: { key: keyof FormState; label: string; hint?: string }[] = [
  { key: 'isDevice',                label: 'Is a Device', hint: 'Enables device mapping in the field' },
  { key: 'isPointNameRequired',     label: 'Point Name Required' },
  { key: 'isPoleNumberRequired',    label: 'Pole Number Required' },
  { key: 'isLandmarkRequired',      label: 'Landmark Required' },
  { key: 'isAddressRequired',       label: 'Address Required' },
  { key: 'isPhotoRequired',         label: 'Photo Required' },
  { key: 'isHeightRequired',        label: 'Height (m) Required' },
  { key: 'isOwnerNameRequired',     label: 'Owner Name Required' },
  { key: 'isContactNumberRequired', label: 'Contact Number Required' },
  { key: 'isElectricityAvailable',  label: 'Electricity Available' },
];

export default function RoutePointTemplateModal({ template, onClose, onSuccess }: Props) {
  const isEdit = !!template;
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [icons, setIcons]         = useState<IconData[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<GlobalDeviceTypeData[]>([]);

  useEffect(() => {
    getIcons({ limit: 100, status: 'active' }).then(r => { if (r.success && Array.isArray(r.data)) setIcons(r.data); }).catch(() => {});
    getGlobalDeviceTypes({ limit: 100, status: 'active' }).then(r => { if (r.success && Array.isArray(r.data)) setDeviceTypes(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (template) {
      const a = template.attributes;
      setForm({
        name:                    a.name,
        description:             a.description ?? '',
        iconId:                  (a as any).iconId ?? null,
        deviceTypeId:            (a as any).deviceTypeId ?? null,
        isDevice:                a.isDevice,
        isPointNameRequired:     a.isPointNameRequired,
        isPoleNumberRequired:    a.isPoleNumberRequired,
        isLandmarkRequired:      a.isLandmarkRequired,
        isAddressRequired:       a.isAddressRequired,
        isPhotoRequired:         a.isPhotoRequired,
        isHeightRequired:        a.isHeightRequired,
        isOwnerNameRequired:     a.isOwnerNameRequired,
        isContactNumberRequired: a.isContactNumberRequired,
        isElectricityAvailable:  a.isElectricityAvailable,
        status:                  a.status === 'inactive' ? 'inactive' : 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [template]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        name:                    form.name.trim(),
        description:             form.description.trim() || null,
        iconId:                  form.iconId,
        deviceTypeId:            form.deviceTypeId,
        isDevice:                form.isDevice,
        isPointNameRequired:     form.isPointNameRequired,
        isPoleNumberRequired:    form.isPoleNumberRequired,
        isLandmarkRequired:      form.isLandmarkRequired,
        isAddressRequired:       form.isAddressRequired,
        isPhotoRequired:         form.isPhotoRequired,
        isHeightRequired:        form.isHeightRequired,
        isOwnerNameRequired:     form.isOwnerNameRequired,
        isContactNumberRequired: form.isContactNumberRequired,
        isElectricityAvailable:  form.isElectricityAvailable,
      };
      if (isEdit) body.status = form.status;

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

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 560 }}>
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
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              {/* Icon */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Icon <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    className={styles.select}
                    style={{ flex: 1 }}
                    value={form.iconId !== null ? String(form.iconId) : ''}
                    onChange={e => set('iconId', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— No icon —</option>
                    {icons.map(ic => <option key={ic.id} value={String(ic.id)}>{ic.attributes.name} ({ic.attributes.code})</option>)}
                  </select>
                  {form.iconId && (() => {
                    const ic = icons.find(x => String(x.id) === String(form.iconId));
                    if (!ic) return null;
                    return (
                      <span style={{ width: 28, height: 28, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                        {ic.attributes.iconType === 'svg'
                          ? <span dangerouslySetInnerHTML={{ __html: ic.attributes.svgTemplate?.replace(/<svg([^>]*)>/i, (_, a) => `<svg${a.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`) || '' }} style={{ display: 'flex', width: 20, height: 20 }} />
                          : <img src={ic.attributes.iconUrl || ''} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Device Type */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Device Type <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <select
                  className={styles.select}
                  value={form.deviceTypeId !== null ? String(form.deviceTypeId) : ''}
                  onChange={e => set('deviceTypeId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— No device type —</option>
                  {deviceTypes.map(dt => <option key={dt.id} value={String(dt.id)}>{dt.attributes.name} ({dt.attributes.code})</option>)}
                </select>
              </div>

              {/* Description */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span></label>
                <textarea
                  className={styles.input}
                  placeholder="Brief description of this template…"
                  rows={2}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  style={{ resize: 'vertical', minHeight: '3rem' }}
                />
              </div>

              {/* Boolean flags */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Field Flags</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {BOOL_FIELDS.map(({ key, label, hint }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={form[key] as boolean}
                        onChange={e => set(key, e.target.checked)}
                        style={{ width: 15, height: 15, accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                      {hint && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>— {hint}</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={form.status}
                    onChange={e => set('status', e.target.value as 'active' | 'inactive')}
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
