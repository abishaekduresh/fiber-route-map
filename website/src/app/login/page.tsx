'use client';

import { useState, useEffect, FormEvent } from 'react';
import { login, terminateSession, checkHealth, type ApiResponse, type LoginData, type SessionLimitData, type ActiveSession } from '@/lib/api';
import styles from './login.module.css';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';

/**
 * Login Page — Futuristic Glassmorphism Design
 * 
 * Authenticates users against the backend API using email/username/phone + password.
 * Handles error states including session limit reached (shows active devices in a modal).
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mgmtToken, setMgmtToken] = useState<string | null>(null);
  const [sessionLimit, setSessionLimit] = useState<number>(1);
  const [terminatingUuid, setTerminatingUuid] = useState<string | null>(null);

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
   * Handle the main login form submission
   */
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please enter both identifier and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(identifier, password);

      if (result.success) {
        const loginData = result.data as LoginData;
        toast.success(`Welcome back, ${loginData.user.attributes.name}!`);
        setIsModalOpen(false);
        setMgmtToken(null);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Handle specific error codes or status codes
        if (result.statusCode === 403 && result.data && 'activeSessions' in result.data) {
          const limitData = result.data as SessionLimitData;
          setActiveSessions(limitData.activeSessions);
          setMgmtToken(limitData.mgmtToken);
          setSessionLimit(limitData.sessionLimit || 1);
          setIsModalOpen(true);
          toast.warning('Session limit reached', {
            description: 'You have too many active sessions. Please terminate one to proceed.'
          });
        } else {
          toast.error(result.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      toast.error('Unable to connect to the server. Please check your connection and try again.');
      console.error('Login error:', err);
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
      const result = await terminateSession(uuid, mgmtToken || undefined);
      if (result.success) {
        toast.success('Session terminated successfully');
        
        // Remove the session from the local list
        const updatedSessions = activeSessions.filter(s => s.uuid !== uuid);
        setActiveSessions(updatedSessions);
        
        // If there's now space, try logging in again automatically
        if (updatedSessions.length < sessionLimit) {
          setIsModalOpen(false);
          handleSubmit();
        }
      } else {
        toast.error(result.message || 'Failed to terminate session');
      }
    } catch (err) {
      console.error('Termination error:', err);
      toast.error('Failed to terminate session. Please try again.');
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
      <div className={`${styles.gridLines} ${styles.gridLinesAnimation}`} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg className={styles.logoSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className={styles.brandTitle}>Fiber Route Map</h1>
          <p className={styles.brandSubtitle}>Sign in to your control center</p>
        </div>

        {/* Login Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Identifier Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Email, Username or Phone
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                id="identifier"
                type="text"
                className={styles.input}
                placeholder="Enter your email, username or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
              <svg className={styles.inputIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </div>
          </button>
        </form>

        <footer className={styles.footer}>
          <p className={styles.footerText}>Fiber Route Map Control Center</p>
          <div className={styles.version}>
            <div className={styles.versionDot} />
            <span>v1.13.0 • System Online</span>
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
                Please logout from another device or terminate a session below to continue.
              </p>

              <div className={styles.sessionList}>
                {activeSessions.map((session) => (
                  <div key={session.uuid} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionDevice}>
                        {session.deviceName} {session.isCurrent && '(This device)'}
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
                      {terminatingUuid === session.uuid ? 'Terminating...' : 'Terminate'}
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
