'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkSetupStatus,
  testDbConnection,
  runSetup,
  type EnvConfig,
  type AdminConfig,
  type StepResult,
} from '@/lib/setupApi';
import styles from './setup.module.css';

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Database' },
  { id: 3, label: 'Admin Account' },
  { id: 4, label: 'Review' },
  { id: 5, label: 'Install' },
];

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_ENV: EnvConfig = {
  dbHost: 'localhost',
  dbPort: 3306,
  dbName: 'fiber_route_map',
  dbUser: 'root',
  dbPass: '',
  dbCharset: 'utf8mb4',
  timezone: 'Asia/Kolkata',
  port: 3001,
  apiVersion: 'v1',
  nodeEnv: 'development',
};

const DEFAULT_ADMIN: AdminConfig = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

// ─── Step icons ───────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StepResultIcon({ success }: { success: boolean }) {
  return success ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [envConfig, setEnvConfig] = useState<EnvConfig>(DEFAULT_ENV);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(DEFAULT_ADMIN);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // DB test state
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Install state
  const [isInstalling, setIsInstalling] = useState(false);
  const [setupLog, setSetupLog] = useState<StepResult[]>([]);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Checking status on mount
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSetupStatus()
      .then((res) => {
        if (res?.data?.isComplete) {
          router.replace('/login');
        }
      })
      .catch(() => {/* backend offline — show wizard anyway */})
      .finally(() => setIsChecking(false));
  }, [router]);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateDb(): boolean {
    const errs: Record<string, string> = {};
    if (!envConfig.dbHost.trim()) errs.dbHost = 'Host is required';
    if (!envConfig.dbName.trim()) errs.dbName = 'Database name is required';
    if (!envConfig.dbUser.trim()) errs.dbUser = 'Username is required';
    if (!envConfig.timezone.trim()) errs.timezone = 'Timezone is required';
    if (!connectionStatus?.ok) errs.connection = 'Please test and verify the database connection first';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateAdmin(): boolean {
    const errs: Record<string, string> = {};
    if (!adminConfig.name.trim() || adminConfig.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^[a-zA-Z0-9_]{3,}$/.test(adminConfig.username)) errs.username = 'Username: 3+ chars, letters/numbers/_';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminConfig.email)) errs.email = 'Valid email required';
    if (!/^\d{10}$/.test(adminConfig.phone)) errs.phone = 'Phone must be exactly 10 digits';
    if (adminConfig.password.length < 8) errs.password = 'At least 8 characters required';
    else if (!/[A-Z]/.test(adminConfig.password)) errs.password = 'Must contain at least one uppercase letter';
    else if (!/[a-z]/.test(adminConfig.password)) errs.password = 'Must contain at least one lowercase letter';
    else if (!/[0-9]/.test(adminConfig.password)) errs.password = 'Must contain at least one number';
    if (adminConfig.password !== adminConfig.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    setErrors((prev) => ({ ...prev, connection: '' }));
    try {
      const res = await testDbConnection(envConfig);
      setConnectionStatus({ ok: res.success, message: res.message });
    } catch {
      setConnectionStatus({ ok: false, message: 'Could not reach the backend server' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleNextFromDb = () => {
    if (validateDb()) {
      setErrors({});
      setStep(3);
    }
  };

  const handleNextFromAdmin = () => {
    if (validateAdmin()) {
      setErrors({});
      setStep(4);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setSetupLog([]);
    setSetupError(null);
    setStep(5);

    try {
      const result = await runSetup(envConfig, adminConfig);
      setSetupLog(result.data?.steps || []);
      if (result.success) {
        setSetupSuccess(true);
        // Set cookie so middleware knows setup is done
        document.cookie = 'setup_complete=true; path=/; max-age=31536000';
      } else {
        setSetupError(result.message || 'Setup failed');
      }
    } catch {
      setSetupError('Could not reach the backend server. Make sure the backend is running.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleEnvChange = (field: keyof EnvConfig, value: string | number) => {
    setEnvConfig((prev) => ({ ...prev, [field]: value }));
    setConnectionStatus(null); // Reset test when credentials change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAdminChange = (field: keyof AdminConfig, value: string) => {
    setAdminConfig((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Loading screen ─────────────────────────────────────────────────────────

  if (isChecking) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.bgMesh} />
        <div className={styles.gridLines} />
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={styles.card} style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div className="spinner" />
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Checking setup status…</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgMesh} />
      <div className={styles.gridLines} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <div className={styles.card}>
        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={styles.logoSvg}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className={styles.brandTitle}>Fiber Route Map</h1>
          <p className={styles.brandSubtitle}>First-time Setup Wizard</p>
        </div>

        {/* Progress indicator (steps 1-5 only, not on success) */}
        {step <= 5 && (
          <div className={styles.progressBar}>
            {STEPS.map((s, i) => (
              <div key={s.id} className={styles.progressStep}>
                <div className={`${styles.stepDot} ${step > s.id ? styles.completed : ''} ${step === s.id ? styles.active : ''}`}>
                  {step > s.id ? <CheckIcon /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${step > s.id ? styles.completedLine : ''}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Welcome ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Welcome to Setup</h2>
            <p className={styles.stepDesc}>
              This wizard will configure your Fiber Route Map application in a few simple steps.
              It only needs to run once.
            </p>

            <div className={styles.featureList}>
              {[
                { icon: '🗄️', label: 'Configure database connection & create all tables' },
                { icon: '🔑', label: 'Auto-generate all system permissions from API routes' },
                { icon: '👑', label: 'Create a Super Admin role with full access' },
                { icon: '👤', label: 'Set up your first admin account' },
              ].map((f, i) => (
                <div key={i} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <span className={styles.featureLabel}>{f.label}</span>
                </div>
              ))}
            </div>

            <button className={styles.submitBtn} onClick={() => setStep(2)}>
              Start Setup
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Step 2: Database ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Database Configuration</h2>
            <p className={styles.stepDesc}>Enter your MySQL database credentials. The database will be created if it doesn't exist.</p>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.label}>Database Host</label>
                <input className={`${styles.input} ${errors.dbHost ? styles.inputError : ''}`}
                  value={envConfig.dbHost}
                  onChange={(e) => handleEnvChange('dbHost', e.target.value)}
                  placeholder="localhost" />
                {errors.dbHost && <span className={styles.errorMsg}>{errors.dbHost}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Port</label>
                <input className={styles.input} type="number"
                  value={envConfig.dbPort}
                  onChange={(e) => handleEnvChange('dbPort', Number(e.target.value))}
                  placeholder="3306" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Database Name</label>
                <input className={`${styles.input} ${errors.dbName ? styles.inputError : ''}`}
                  value={envConfig.dbName}
                  onChange={(e) => handleEnvChange('dbName', e.target.value)}
                  placeholder="fiber_route_map" />
                {errors.dbName && <span className={styles.errorMsg}>{errors.dbName}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input className={`${styles.input} ${errors.dbUser ? styles.inputError : ''}`}
                  value={envConfig.dbUser}
                  onChange={(e) => handleEnvChange('dbUser', e.target.value)}
                  placeholder="root" />
                {errors.dbUser && <span className={styles.errorMsg}>{errors.dbUser}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <input className={styles.input} type="password"
                  value={envConfig.dbPass}
                  onChange={(e) => handleEnvChange('dbPass', e.target.value)}
                  placeholder="Leave blank if none" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Timezone</label>
                <input className={`${styles.input} ${errors.timezone ? styles.inputError : ''}`}
                  value={envConfig.timezone}
                  onChange={(e) => handleEnvChange('timezone', e.target.value)}
                  placeholder="Asia/Kolkata" />
                {errors.timezone && <span className={styles.errorMsg}>{errors.timezone}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>App Port</label>
                <input className={styles.input} type="number"
                  value={envConfig.port}
                  onChange={(e) => handleEnvChange('port', Number(e.target.value))}
                  placeholder="3001" />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Environment</label>
                <select className={styles.input}
                  value={envConfig.nodeEnv}
                  onChange={(e) => handleEnvChange('nodeEnv', e.target.value)}>
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            {/* Test connection */}
            <div className={styles.testRow}>
              <button className={styles.testBtn} onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? (
                  <><div className={styles.spinnerSm} /> Testing…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14h0" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>
              {connectionStatus && (
                <div className={`${styles.connectionStatus} ${connectionStatus.ok ? styles.statusOk : styles.statusFail}`}>
                  <StepResultIcon success={connectionStatus.ok} />
                  <span>{connectionStatus.message}</span>
                </div>
              )}
            </div>
            {errors.connection && <span className={styles.errorMsg}>{errors.connection}</span>}

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button className={styles.submitBtn} onClick={handleNextFromDb}>
                Next: Admin Account →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Admin Account ────────────────────────────────────── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Admin Account</h2>
            <p className={styles.stepDesc}>Create your Super Admin account. This user will have full access to the system.</p>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.label}>Full Name</label>
                <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={adminConfig.name}
                  onChange={(e) => handleAdminChange('name', e.target.value)}
                  placeholder="John Doe" />
                {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                  value={adminConfig.username}
                  onChange={(e) => handleAdminChange('username', e.target.value)}
                  placeholder="admin" />
                {errors.username && <span className={styles.errorMsg}>{errors.username}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <input className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  type="email"
                  value={adminConfig.email}
                  onChange={(e) => handleAdminChange('email', e.target.value)}
                  placeholder="admin@example.com" />
                {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
              </div>

              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.label}>Phone (10 digits)</label>
                <input className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  type="tel"
                  value={adminConfig.phone}
                  onChange={(e) => handleAdminChange('phone', e.target.value)}
                  placeholder="9876543210" maxLength={10} />
                {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <input className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  type="password"
                  value={adminConfig.password}
                  onChange={(e) => handleAdminChange('password', e.target.value)}
                  placeholder="Min 8 chars, uppercase, number" />
                {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  type="password"
                  value={adminConfig.confirmPassword}
                  onChange={(e) => handleAdminChange('confirmPassword', e.target.value)}
                  placeholder="Repeat password" />
                {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
              <button className={styles.submitBtn} onClick={handleNextFromAdmin}>
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ───────────────────────────────────────────── */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Review Configuration</h2>
            <p className={styles.stepDesc}>Confirm the details below before initializing the system.</p>

            <div className={styles.reviewSection}>
              <h3 className={styles.reviewHeading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                Database
              </h3>
              <div className={styles.reviewGrid}>
                {[
                  ['Host', envConfig.dbHost],
                  ['Port', String(envConfig.dbPort)],
                  ['Database', envConfig.dbName],
                  ['User', envConfig.dbUser],
                  ['Password', envConfig.dbPass ? '••••••••' : '(none)'],
                  ['Timezone', envConfig.timezone],
                  ['App Port', String(envConfig.port)],
                  ['Environment', envConfig.nodeEnv],
                ].map(([k, v]) => (
                  <div key={k} className={styles.reviewRow}>
                    <span className={styles.reviewKey}>{k}</span>
                    <span className={styles.reviewVal}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.reviewSection}>
              <h3 className={styles.reviewHeading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Admin Account
              </h3>
              <div className={styles.reviewGrid}>
                {[
                  ['Name', adminConfig.name],
                  ['Username', adminConfig.username],
                  ['Email', adminConfig.email],
                  ['Phone', adminConfig.phone],
                  ['Password', '••••••••'],
                  ['Role', 'Super Admin (all permissions)'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.reviewRow}>
                    <span className={styles.reviewKey}>{k}</span>
                    <span className={styles.reviewVal}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(3)}>← Back</button>
              <button className={styles.submitBtn} onClick={handleInstall}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Initialize System
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Installing / Complete ─────────────────────────────── */}
        {step === 5 && (
          <div className={styles.stepContent}>
            {!setupSuccess && !setupError && isInstalling ? (
              <>
                <h2 className={styles.stepTitle}>Installing…</h2>
                <p className={styles.stepDesc}>Setting up your application. Please wait.</p>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
                  <div className="spinner" />
                </div>
              </>
            ) : setupSuccess ? (
              <>
                {/* Success */}
                <div className={styles.successIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className={styles.stepTitle} style={{ textAlign: 'center' }}>Setup Complete!</h2>
                <p className={styles.stepDesc} style={{ textAlign: 'center' }}>
                  Your application is ready. Login with the admin credentials you just created.
                </p>

                <div className={styles.logList}>
                  {setupLog.map((item, i) => (
                    <div key={i} className={`${styles.logItem} ${item.success ? styles.logSuccess : styles.logError}`}>
                      <StepResultIcon success={item.success} />
                      <div>
                        <span className={styles.logStep}>{item.step}</span>
                        <span className={styles.logMsg}>{item.message}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className={styles.submitBtn} style={{ width: '100%', marginTop: '1.5rem' }}
                  onClick={() => router.push('/login')}>
                  Go to Login
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Error */}
                <div className={styles.errorIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h2 className={styles.stepTitle} style={{ textAlign: 'center', color: 'var(--color-danger)' }}>Setup Failed</h2>
                <p className={styles.stepDesc} style={{ textAlign: 'center' }}>{setupError}</p>

                {setupLog.length > 0 && (
                  <div className={styles.logList}>
                    {setupLog.map((item, i) => (
                      <div key={i} className={`${styles.logItem} ${item.success ? styles.logSuccess : styles.logError}`}>
                        <StepResultIcon success={item.success} />
                        <div>
                          <span className={styles.logStep}>{item.step}</span>
                          <span className={styles.logMsg}>{item.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.btnRow}>
                  <button className={styles.backBtn} onClick={() => { setStep(4); setSetupError(null); setSetupLog([]); }}>
                    ← Back to Review
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
