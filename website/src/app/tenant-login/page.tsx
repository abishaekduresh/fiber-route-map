'use client';

import { useState, useEffect, FormEvent } from 'react';
import { tenantLogin, checkHealth, type ApiResponse, type TenantLoginData } from '@/lib/api';
import styles from './tenant-login.module.css';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import { toast } from 'sonner';

/**
 * Tenant Login Page — Premium Emerald Glassmorphism Design
 * 
 * Authenticates tenants using phone number and password.
 * Securely stores access and refresh tokens.
 */
export default function TenantLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
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
        const loginData = result.data;
        toast.success('Login Successful', {
          description: `Welcome to your dashboard, ${loginData.tenant.attributes.name}!`
        });
        
        // Use TenantAuthContext to store tenant data
        setTenant(loginData.tenant);

        setTimeout(() => {
          window.location.href = '/tenant/dashboard';
        }, 1500);
      } else {
        toast.error('Authentication Failed', {
          description: result.message || 'Invalid phone number or password.'
        });
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
            <svg className={styles.logoSvg} width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
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
            <span>v1.32.0 • Secure Session</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
