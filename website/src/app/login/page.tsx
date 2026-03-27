'use client';

import { useState, FormEvent } from 'react';
import { login, terminateSession, checkHealth, type ApiResponse, type LoginData, type SessionLimitData, type ActiveSession } from '@/lib/api';
import styles from './login.module.css';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mgmtToken, setMgmtToken] = useState<string | null>(null);
  const [sessionLimit, setSessionLimit] = useState<number>(1);
  const [terminatingUuid, setTerminatingUuid] = useState<string | null>(null);
  const [isSystemOnline, setIsSystemOnline] = useState(true);

  // Check system health on load
  useState(() => {
    const initHealth = async () => {
      try {
        const res = await checkHealth();
        setIsSystemOnline(res.success !== false && res.services?.database === 'connected');
      } catch (e) {
        setIsSystemOnline(false);
      }
    };
    initHealth();
  });

  /**
   * Handle form submission — calls the login API
   */
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result: ApiResponse<LoginData | SessionLimitData> = await login(identifier, password);

      if (result.success) {
        // Login successful — show success message then redirect
        setSuccess(`Welcome back, ${(result.data as LoginData).user.attributes.name}!`);
        setIsModalOpen(false);
        setMgmtToken(null);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Handle specific error codes from the backend
        setError(result.message);

        // If session limit is reached, display the active sessions modal
        if (result.statusCode === 403 && result.data && 'activeSessions' in result.data) {
          const limitData = result.data as SessionLimitData;
          setActiveSessions(limitData.activeSessions);
          setMgmtToken(limitData.mgmtToken);
          setSessionLimit(limitData.sessionLimit || 1);
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      // Network or unexpected error
      setError('Unable to connect to the server. Please check your connection and try again.');
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
        // Remove the session from the local list
        const updatedSessions = activeSessions.filter(s => s.uuid !== uuid);
        setActiveSessions(updatedSessions);
        
        // If there's now space, try logging in again automatically
        if (updatedSessions.length < sessionLimit) {
          handleSubmit();
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Termination error:', err);
      setError('Failed to terminate session. Please try again.');
    } finally {
      setTerminatingUuid(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Animated background elements */}
      <div className={styles.bgMesh} />
      <div className={styles.gridLines} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      {/* Login Card */}
      <div className={styles.card}>
        {/* Brand / Logo */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg className={styles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className={styles.brandTitle}>Fiber Route Map</h1>
          <p className={styles.brandSubtitle}>Sign in to your control center</p>
        </div>

        {/* Login Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && !isModalOpen && (
            <div className={styles.error}>
              <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={styles.success}>
              <svg className={styles.successIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Email, Username or Phone
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="identifier"
                type="text"
                className={styles.input}
                placeholder="Enter your email, username or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !identifier || !password}
          >
            <span className={styles.btnContent}>
              {isLoading && <span className={styles.spinner} />}
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>Fiber Route Map Control Center</p>
          <div className={styles.version}>
            <span className={styles.versionDot} style={{ backgroundColor: isSystemOnline ? '#10b981' : '#ef4444' }} />
            <span>v1.13.0 • {isSystemOnline ? 'System Online' : 'System Offline'}</span>
          </div>
        </div>
      </div>

      {/* Session Limit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Session Limit Reached</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                You have reached the maximum limit of {sessionLimit} {sessionLimit === 1 ? 'active session' : 'active sessions'}. 
                Please terminate one of your active sessions below to continue logging in.
              </p>
              
              <div className={styles.sessionList}>
                {activeSessions.map((session) => (
                  <div key={session.uuid} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionDevice}>{session.deviceName}</span>
                      <span className={styles.sessionTime}>
                        Active since {new Date(session.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className={styles.terminateBtn}
                      onClick={() => handleTerminateSession(session.uuid)}
                      disabled={terminatingUuid !== null}
                    >
                      {terminatingUuid === session.uuid ? (
                        <>
                          <span className={styles.spinner} style={{ width: 14, height: 14 }} />
                          <span>Terminating...</span>
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                          <span>Terminate</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
