'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkHealth } from '@/lib/api';

/**
 * HealthStatus Component
 * 
 * Monitors the backend health and displays a warning banner if the system is unhealthy or unreachable.
 */
// Pages where health checks should never run
const SKIP_HEALTH_CHECK_PATHS = ['/setup', '/login', '/unhealthy'];

export default function HealthStatus() {
  const [isUnhealthy, setIsUnhealthy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't interfere with setup/login/unhealthy flows
    if (SKIP_HEALTH_CHECK_PATHS.some((p) => pathname?.startsWith(p))) return;

    const performCheck = async () => {
      try {
        const res = await checkHealth();
        
        // Requirements:
        // 1. services.database != connected
        // 2. errorType exists and statusCode != 200
        const isDbDisconnected = res.services?.database !== 'connected';
        const hasApiError = res.errorType && res.statusCode !== 200;
        const isUnsuccessful = res.success === false;

        if (isDbDisconnected || hasApiError || isUnsuccessful) {
          setIsUnhealthy(true);
          const msg = res.errorType || res.error || 'The system is experiencing technical difficulties.';
          setErrorMessage(msg);
          
          if (!SKIP_HEALTH_CHECK_PATHS.some((p) => pathname?.startsWith(p))) {
            window.location.href = `/unhealthy?error=${encodeURIComponent(msg)}`;
          }
        } else {
          setIsUnhealthy(false);
          // If we recovered and are on the unhealthy page, return to dashboard
          if (pathname === '/unhealthy') {
            window.location.href = '/';
          }
        }
      } catch (err) {
        setIsUnhealthy(true);
        const msg = 'Unable to connect to the backend server.';
        setErrorMessage(msg);
        if (!SKIP_HEALTH_CHECK_PATHS.some((p) => pathname?.startsWith(p))) {
          window.location.href = `/unhealthy?error=${encodeURIComponent(msg)}`;
        }
      }
    };

    // Initial check
    performCheck();

    // Poll every 30 seconds
    const interval = setInterval(performCheck, 30000);

    return () => clearInterval(interval);
  }, []);

  // Don't show the banner on setup/login/unhealthy or if system is healthy
  if (!isUnhealthy || SKIP_HEALTH_CHECK_PATHS.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      borderBottom: '1px solid #fecaca',
      padding: '0.75rem 1rem',
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      color: '#991b1b',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span><strong>System Alert:</strong> {errorMessage}</span>
    </div>
  );
}
