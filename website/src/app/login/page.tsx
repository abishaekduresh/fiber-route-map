'use client';

import { useState, useEffect, FormEvent } from 'react';
import { tenantLogin, terminateTenantSession, checkHealth, type ApiResponse, type TenantLoginData, type SessionLimitData, type ActiveSession } from '@/lib/api';
import styles from './login.module.css';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import { toast } from 'sonner';

/**
 * Tenant Login Page — Premium Emerald Glassmorphism Design
 * 
 * Authenticates tenants using phone number and password.
 * Handles session limits by allowing termination of active sessions.
 */
export default function TenantLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mgmtToken, setMgmtToken] = useState<string | null>(null);
  const [sessionLimit, setSessionLimit] = useState<number>(1);
  const [terminatingUuid, setTerminatingUuid] = useState<string | null>(null);
  const { setTenant } = useTenantAuth();

  // Check backend health on mount
  useEffect(() => {
    const ping = async () => {
      const health = await checkHealth();
      if (!health.success) {
        toast.error(`System Notice: ${health.errorType || 'Backend Offline'}`, {
          description: health.error || 'The server is currently unreachable.'
        });
      }
    };
    ping();
  }, []);

  /**
   * Handle the tenant login form submission
   */
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!phone || !password) {
      toast.error('Validation Error', {
        description: 'Please enter both phone number and password.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await tenantLogin(phone, password);

      if (result.success && result.data) {
        const loginData = result.data as TenantLoginData;
        toast.success('Login Successful', {
          description: `Welcome to your dashboard, ${loginData.tenant.attributes.name}!`
        });
        
        setIsModalOpen(false);
        setMgmtToken(null);

        // Use TenantAuthContext to store tenant data
        setTenant(loginData.tenant);

        setTimeout(() => {
          window.location.href = '/tenant/dashboard';
        }, 1500);
      } else {
        // Handle session limit error
        if (result.statusCode === 403 && result.data && 'activeSessions' in result.data) {
          const limitData = result.data as SessionLimitData;
          setActiveSessions(limitData.activeSessions);
          setMgmtToken(limitData.mgmtToken);
          setSessionLimit(limitData.sessionLimit || 1);
          setIsModalOpen(true);
          toast.warning('Session Limit Reached', {
            description: 'You have too many active sessions. Please terminate one to proceed.'
          });
        } else {
          toast.error('Authentication Failed', {
            description: result.message || 'Invalid phone number or password.'
          });
        }
      }
    } catch (err) {
      toast.error('Connection Error', {
        description: 'Unable to reach the server. Please check your internet connection.'
      });
      console.error('Tenant login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Terminate a specific session to free up space
   */
  const handleTerminateSession = async (uuid: string) => {
    setTerminatingUuid(uuid);
    try {
      const result = await terminateTenantSession(uuid, mgmtToken || undefined);
      if (result.success) {
        toast.success('Session Terminated', {
          description: 'The selected session has been closed successfully.'
        });
        
        // Remove from local list
        const updatedSessions = activeSessions.filter(s => s.uuid !== uuid);
        setActiveSessions(updatedSessions);
        
        // If now under limit, try logging in again
        if (updatedSessions.length < sessionLimit) {
          setIsModalOpen(false);
          handleSubmit();
        }
      } else {
        toast.error('Termination Failed', {
          description: result.message || 'Could not terminate the session.'
        });
      }
    } catch (err: any) {
      console.error('Termination error:', err);
      toast.error('Error', {
        description: err.message || 'An unexpected error occurred during session termination.'
      });
    } finally {
      setTerminatingUuid(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.themeToggleWrapper}>
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className={styles.bgMesh} />
      <div className={styles.gridLines} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <img 
              src="/assets/app/logo.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className={styles.brandTitle}>
            Tenant Portal
          </h1>
          <p className={styles.brandSubtitle}>Secure access to your business center</p>
        </div>

        {/* Login Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Phone Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone Number
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input
                id="phone"
                type="tel"
                className={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            <div className={styles.btnContent}>
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </div>
          </button>
        </form>

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            Fiber Route Map • Tenant Control
          </p>
          <div className={styles.version}>
            <div className={styles.versionDot} />
            <span>v1.36.0 • Secure Session</span>
          </div>
        </footer>
      </div>

      {/* Session Limit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Session Limit Reached</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                You have reached your maximum of {sessionLimit} active session(s). 
                Please terminate an existing session below to continue.
              </p>

              <div className={styles.sessionList}>
                {activeSessions.map((session) => (
                  <div key={session.uuid} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionDevice}>
                        {session.deviceName}
                      </span>
                      <span className={styles.sessionTime}>
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className={styles.terminateBtn}
                      onClick={() => handleTerminateSession(session.uuid)}
                      disabled={terminatingUuid !== null}
                    >
                      {terminatingUuid === session.uuid ? 'Closing...' : 'Terminate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
