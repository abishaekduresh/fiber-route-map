'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AuthGuard from '../auth/AuthGuard';
import styles from './DashboardLayout.module.css';

/**
 * DashboardLayout Component
 * 
 * Provides the main structure for all protected dashboard pages.
 * Includes the Sidebar, TopBar, and a scrollable content area.
 */
export default function DashboardLayout({ 
  children, 
  title = 'Dashboard' 
}: { 
  children: React.ReactNode;
  title?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <AuthGuard>
      <div className={styles.layout}>
        {/* Futuristic Background Elements */}
        <div className={styles.bgMesh} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={closeSidebar} />
        )}

        <Sidebar 
          className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`} 
          onClose={closeSidebar}
        />
        
        <div className={styles.mainContent}>
          <TopBar title={title} onMenuClick={toggleSidebar} />
          <main className={styles.pageBody} id="main-content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
