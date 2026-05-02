'use client';

import React, { useState } from 'react';
import TenantSidebar from './TenantSidebar';
import TenantTopBar from './TenantTopBar';
import TenantAuthGuard from '../auth/TenantAuthGuard';
import styles from './DashboardLayout.module.css';

/**
 * TenantDashboardLayout Component
 * 
 * Provides the main structure for all protected tenant dashboard pages.
 */
export default function TenantDashboardLayout({ 
  children, 
  title = 'Tenant Dashboard' 
}: { 
  children: React.ReactNode;
  title?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <TenantAuthGuard>
      <div className={styles.layout}>
        {/* Futuristic Background Elements — Emerald Tint */}
        <div className={styles.bgMesh} style={{ 
          background: 'radial-gradient(circle at 18% 45%, rgba(16, 185, 129, 0.04) 0%, transparent 50%), radial-gradient(circle at 82% 75%, rgba(6, 182, 212, 0.04) 0%, transparent 50%)' 
        }} />
        <div className={styles.orb1} style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }} />
        <div className={styles.orb2} style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)' }} />
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={closeSidebar} />
        )}

        <TenantSidebar 
          className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`} 
          onClose={closeSidebar}
        />
        
        <div className={styles.mainContent}>
          <TenantTopBar title={title} onMenuClick={toggleSidebar} />
          <main className={styles.pageBody} id="main-content">
            {children}
          </main>
        </div>
      </div>
    </TenantAuthGuard>
  );
}
