'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, terminateSession, type LoginData, type ActiveSession } from '@/lib/api';
import styles from './profile.module.css';

import DashboardLayout from '@/components/layout/DashboardLayout';

/**
 * Profile Page — Premium User Management View
 * 
 * Displays user profile details and allows management of active sessions.
 * Uses /api/auth/me for data fetching.
 */
export default function ProfilePage() {
  const [user, setUser] = useState<LoginData['user'] | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminatingUuid, setTerminatingUuid] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success && result.data) {
          // result.data is { user, sessions } based on AuthController.me
          const data = result.data as any;
          setUser(data.user);
          // sessions are returned in JSON:API format: { id, type, attributes: { deviceName, lastActive, isCurrent } }
          const mappedSessions = data.sessions.map((s: any) => ({
            uuid: s.id,
            deviceName: s.attributes.deviceName,
            lastActive: s.attributes.lastActive,
            isCurrent: s.attributes.isCurrent
          }));
          setSessions(mappedSessions);
        } else {
          setError(result.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTerminateSession = async (session: ActiveSession) => {
    const { uuid, isCurrent } = session;
    setTerminatingUuid(uuid);
    try {
      const result = await terminateSession(uuid);
      if (result.success) {
        if (isCurrent) {
          // If the current session was terminated, logout
          localStorage.removeItem('fiber_auth_token');
          localStorage.removeItem('fiber_auth_user');
          window.location.href = '/login';
          return;
        }
        setSessions(prev => prev.filter(s => s.uuid !== uuid));
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Termination error:', err);
      alert('Failed to terminate session.');
    } finally {
      setTerminatingUuid(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Profile">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Retrieving your secure profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout title="Profile">
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>!</div>
          <h3>Access Denied</h3>
          <p>{error || 'User not found'}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Account Settings">
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Manage your profile and active devices across the network.</p>
        </div>

        <div className={styles.grid}>
          {/* Profile Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Personal Information</h2>
            </div>
            
            <div className={styles.profileFields}>
              <div className={styles.field}>
                <label>Full Name</label>
                <div className={styles.value}>{user.attributes.name}</div>
              </div>
              <div className={styles.field}>
                <label>Username</label>
                <div className={styles.value}>@{user.attributes.username}</div>
              </div>
              <div className={styles.field}>
                <label>Email Address</label>
                <div className={styles.value}>{user.attributes.email}</div>
              </div>
              <div className={styles.field}>
                <label>Phone Number</label>
                <div className={styles.value}>{user.attributes.phone}</div>
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <div className={styles.roleBadge}>{user.attributes.roles?.[0]?.name || 'Member'}</div>
              </div>
              <div className={styles.field}>
                <label>Account Status</label>
                <div className={`${styles.statusBadge} ${styles[user.attributes.status]}`}>
                  {user.attributes.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ background: 'rgba(147, 51, 234, 0.1)', color: 'var(--color-accent-purple)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Active Sessions</h2>
            </div>
            
            <p className={styles.cardDescription}>
              You are currently allowed up to <b>{(user.attributes as any).sessionLimit || 1}</b> concurrent {((user.attributes as any).sessionLimit === 1) ? 'session' : 'sessions'}.
            </p>

            <div className={styles.sessionList}>
              {sessions.map((session) => (
                <div key={session.uuid} className={styles.sessionItem}>
                  <div className={styles.sessionIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className={styles.sessionInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.deviceName}>{session.deviceName}</div>
                      {session.isCurrent && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          background: 'rgba(59, 130, 246, 0.2)', 
                          color: 'var(--color-accent-blue)', 
                          padding: '2px 6px', 
                          borderRadius: '10px',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.05em'
                        }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className={styles.lastActive}>
                      Last seen {session.lastActive ? new Date(session.lastActive.replace(' ', 'T')).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  <button 
                    className={styles.terminateBtn}
                    onClick={() => handleTerminateSession(session)}
                    disabled={terminatingUuid !== null}
                    title={session.isCurrent ? "Logout" : "Terminate Session"}
                  >
                    {terminatingUuid === session.uuid ? (
                      <div className={styles.miniSpinner} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
