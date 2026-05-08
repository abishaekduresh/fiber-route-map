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
