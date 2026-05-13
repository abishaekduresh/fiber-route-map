import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/utils → go up two levels to reach the backend root
const BACKEND_ROOT = path.resolve(__dirname, '../../');

/**
 * Returns the absolute path to the icons upload directory.
 * - development: <backend_root>/upload/icons/
 * - production:  $UPLOAD_PATH/icons/   (persistent volume, e.g. Coolify)
 * Creates the directory if it doesn't exist.
 */
export function getIconUploadDir(): string {
  const dir = path.join(getUploadBaseDir(), 'icons');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Returns the absolute path to the upload base directory.
 */
export function getUploadBaseDir(): string {
  const env = process.env.APP_ENV || 'development';
  if (env === 'production') {
    const base = process.env.UPLOAD_PATH || '';
    if (!base) throw new Error('UPLOAD_PATH env var must be set in production');
    return base;
  }
  return path.join(BACKEND_ROOT, 'upload');
}

/**
 * Returns the public URL path for an uploaded icon filename.
 */
export function getIconPublicUrl(filename: string): string {
  return `/uploads/icons/${filename}`;
}

/**
 * Extracts the filename from an icon public URL.
 * e.g. /uploads/icons/ICO0001.png → ICO0001.png
 */
export function getFilenameFromIconUrl(iconUrl: string): string | null {
  const match = iconUrl?.match(/\/uploads\/icons\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Deletes an icon file from disk by its public URL if it's a locally stored file.
 */
export function deleteIconFile(iconUrl: string | null): void {
  if (!iconUrl || !iconUrl.startsWith('/uploads/icons/')) return;
  const filename = getFilenameFromIconUrl(iconUrl);
  if (!filename) return;
  const filepath = path.join(getIconUploadDir(), filename);
  if (fs.existsSync(filepath)) {
    try { fs.unlinkSync(filepath); } catch { /* ignore */ }
  }
}
