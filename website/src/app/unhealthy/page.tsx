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

function UnhealthyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error') || 'The system is currently unavailable.';
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-check on mount: redirect to /setup immediately if setup is incomplete
  useEffect(() => {
    needsSetup().then((required) => {
      if (required) router.replace('/setup');
    });
  }, [router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (await needsSetup()) {
        router.push('/setup');
        return;
      }

      const res = await checkHealth();

      // Network unreachable — stay on page, nothing to redirect to
      if (res.statusCode === 0) return;

      const isHealthy = res.success !== false
        && res.services?.database === 'connected'
        && !res.errorType;

      if (isHealthy) {
        router.push('/');
      } else {
        const newError = res.errorType || res.error || error;
        router.replace(`/unhealthy?error=${encodeURIComponent(newError)}&t=${Date.now()}`);
      }
    } catch {
      // Still failed — stay on page
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '3rem',
        borderRadius: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#fef2f2',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          color: '#ef4444'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          System Unavailable
        </h1>

        <p style={{
          color: '#64748b',
          fontSize: '1.125rem',
          lineHeight: 1.6,
          marginBottom: '2.5rem'
        }}>
          {error}
        </p>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            width: '100%',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '1rem',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s ease',
            opacity: isRetrying ? 0.7 : 1
          }}
        >
          {isRetrying ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Checking connection...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Try Again
            </>
          )}
        </button>

        <p style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          If the problem persists, please contact technical support.
        </p>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function UnhealthyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnhealthyContent />
    </Suspense>
  );
}
