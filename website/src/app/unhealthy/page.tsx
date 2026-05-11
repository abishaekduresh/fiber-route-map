'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { checkHealth } from '@/lib/api';
import { checkSetupStatus } from '@/lib/setupApi';

async function needsSetup(): Promise<boolean> {
  try {
    const res = await checkSetupStatus();
    return res?.data?.isComplete === false;
  } catch {
    return false;
  }
}

// ---- Error code → human-readable copy ----
interface ErrorInfo {
  title: string;
  description: string;
  hint: string;
  icon: 'warning' | 'database' | 'network' | 'server';
}

const ERROR_MAP: Record<string, ErrorInfo> = {
  DATABASE_ERROR: {
    title: 'Database Connection Failed',
    description: 'The application cannot reach the database server.',
    hint: 'Check that the database service is running and reachable from the backend.',
    icon: 'database',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Unavailable',
    description: 'The server is temporarily unable to handle this request.',
    hint: 'This is usually due to a restart or scheduled maintenance. Try again in a moment.',
    icon: 'server',
  },
  SERVER_ERROR: {
    title: 'Internal Server Error',
    description: 'An unexpected error occurred on the server.',
    hint: 'Check the backend logs for details. Retrying may resolve transient issues.',
    icon: 'server',
  },
  NETWORK_ERROR: {
    title: 'Network Unreachable',
    description: 'The frontend cannot reach the backend server.',
    hint: 'Verify the backend is running and that network connectivity is available.',
    icon: 'network',
  },
};

function resolveError(raw: string): ErrorInfo & { raw: string } {
  if (ERROR_MAP[raw]) return { ...ERROR_MAP[raw], raw };
  for (const [key, info] of Object.entries(ERROR_MAP)) {
    if (raw.toUpperCase().includes(key)) return { ...info, raw };
  }
  if (/database|db|mongo|mysql|postgres|connection/i.test(raw)) {
    return { ...ERROR_MAP.DATABASE_ERROR, raw };
  }
  if (/connect|network|unreachable|econnrefused|fetch/i.test(raw)) {
    return { ...ERROR_MAP.NETWORK_ERROR, raw };
  }
  return {
    title: 'System Unavailable',
    description: raw || 'The system is currently unavailable.',
    hint: 'If the problem persists, please contact technical support.',
    icon: 'warning',
    raw,
  };
}

// ---- Debug payload shape (from HealthController when APP_ENV=development & DEBUG=true) ----
interface DebugInfo {
  appEnv: string;
  debugFlag: string;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbCharset: string;
  errorMessage: string;
  errorCode: string;
  suggestions: string[];
}

// ---- Icons ----
function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function ErrorIcon({ type }: { type: ErrorInfo['icon'] }) {
  switch (type) {
    case 'database': return <DatabaseIcon />;
    case 'network':  return <NetworkIcon />;
    case 'server':   return <ServerIcon />;
    default:         return <WarningIcon />;
  }
}

// ---- Debug Panel ----
function DebugPanel({ debug }: { debug: DebugInfo }) {
  const [open, setOpen] = useState(true);

  const row = (label: string, value: string, mono = false) => (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid #fde68a', alignItems: 'baseline' }}>
      <span style={{ minWidth: '110px', fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.8125rem', color: '#78350f', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value || <em style={{ opacity: 0.5 }}>not set</em>}
      </span>
    </div>
  );

  return (
    <div style={{
      marginTop: '1.25rem',
      border: '1px solid #fde68a',
      borderRadius: '0.625rem',
      background: '#fffbeb',
      overflow: 'hidden',
      textAlign: 'left',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: '#fef3c7',
          border: 'none',
          borderBottom: open ? '1px solid #fde68a' : 'none',
          cursor: 'pointer',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>Debug Info</span>
          <span style={{ fontSize: '0.7rem', color: '#a16207', background: '#fde68a', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace' }}>
            APP_ENV=development · DEBUG=true
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0.75rem 1rem' }}>
          {/* Connection details */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Connection Attempted
          </p>
          {row('DB Host', debug.dbHost)}
          {row('DB Port', debug.dbPort)}
          {row('DB Name', debug.dbName)}
          {row('DB User', debug.dbUser)}
          {row('Charset', debug.dbCharset)}

          {/* Error details */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0.875rem 0 0.5rem' }}>
            Error Detail
          </p>
          {row('Error Code', debug.errorCode, true)}
          {row('Message', debug.errorMessage)}

          {/* Suggestions */}
          {debug.suggestions.length > 0 && (
            <>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0.875rem 0 0.5rem' }}>
                How to Fix
              </p>
              <ol style={{ margin: 0, padding: '0 0 0 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {debug.suggestions.map((s, i) => (
                  <li key={i} style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.55 }}>
                    {s}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Page ----
function UnhealthyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawError = searchParams.get('error') || 'SERVICE_UNAVAILABLE';
  const info = resolveError(rawError);
  const [isRetrying, setIsRetrying] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // On mount: redirect if setup incomplete; also fetch debug payload
  useEffect(() => {
    needsSetup().then((required) => {
      if (required) router.replace('/setup');
    });

    checkHealth().then((res) => {
      if (res?.debug) setDebugInfo(res.debug as DebugInfo);
    }).catch(() => {/* ignore — no debug panel shown on network failure */});
  }, [router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (await needsSetup()) {
        router.push('/setup');
        return;
      }

      const res = await checkHealth();

      // Update debug info if available
      if (res?.debug) setDebugInfo(res.debug as DebugInfo);

      if (res.statusCode === 0) return; // Network still down

      const isHealthy =
        res.success !== false &&
        res.services?.database === 'connected' &&
        !res.errorType;

      if (isHealthy) {
        router.push('/');
      } else {
        const newError = res.errorType || res.error || rawError;
        router.replace(`/unhealthy?error=${encodeURIComponent(newError)}&t=${Date.now()}`);
      }
    } catch {
      // Still failed — stay on page
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  const isNetworkError = info.icon === 'network';
  const iconColor = isNetworkError ? '#f59e0b' : '#ef4444';
  const iconBg   = isNetworkError ? '#fffbeb' : '#fef2f2';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f6f8',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        padding: '2.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          backgroundColor: iconBg,
          borderRadius: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.75rem',
          color: iconColor,
        }}>
          <ErrorIcon type={info.icon} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#0f1117',
          marginBottom: '0.625rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}>
          {info.title}
        </h1>

        {/* Description */}
        <p style={{
          color: '#4b5568',
          fontSize: '0.9375rem',
          lineHeight: 1.65,
          marginBottom: '0.75rem',
        }}>
          {info.description}
        </p>

        {/* Hint */}
        <p style={{
          color: '#9ca3af',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          textAlign: 'left',
        }}>
          {info.hint}
        </p>

        {/* Debug panel — only when backend returns debug payload */}
        {debugInfo && <DebugPanel debug={debugInfo} />}

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            width: '100%',
            backgroundColor: isRetrying ? '#6b7280' : '#3b82f6',
            color: '#ffffff',
            padding: '0.75rem',
            borderRadius: '0.625rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            border: 'none',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            transition: 'background 0.15s ease',
            marginTop: '1.5rem',
          }}
        >
          {isRetrying ? (
            <>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Checking connection…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Try Again
            </>
          )}
        </button>

        {/* Error code badge */}
        <p style={{
          marginTop: '1.25rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.04em',
        }}>
          error code: {rawError.replace(/\s+/g, '_').toUpperCase()}
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          background: #2563eb !important;
        }
      `}</style>
    </div>
  );
}

export default function UnhealthyPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <UnhealthyContent />
    </Suspense>
  );
}
