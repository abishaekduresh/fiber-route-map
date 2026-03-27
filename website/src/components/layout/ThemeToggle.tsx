'use client';

import { useTheme } from '../providers/ThemeContext';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.css';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ 
      display: 'flex', 
      background: 'rgba(255, 255, 255, 0.03)', 
      padding: '4px', 
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      gap: '4px'
    }}>
      <button
        onClick={() => setTheme('light')}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid ' + (theme === 'light' ? 'var(--color-accent-blue)' : 'transparent'),
          background: theme === 'light' ? 'var(--color-bg-elevated)' : 'transparent',
          color: theme === 'light' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
        title="Light Mode"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      <button
        onClick={() => setTheme('dark')}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid ' + (theme === 'dark' ? 'var(--color-accent-blue)' : 'transparent'),
          background: theme === 'dark' ? 'var(--color-bg-elevated)' : 'transparent',
          color: theme === 'dark' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
        title="Dark Mode"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </button>

      <button
        onClick={() => setTheme('system')}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid ' + (theme === 'system' ? 'var(--color-accent-blue)' : 'transparent'),
          background: theme === 'system' ? 'var(--color-bg-elevated)' : 'transparent',
          color: theme === 'system' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
        title="System Preference"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </button>
    </div>
  );
}
