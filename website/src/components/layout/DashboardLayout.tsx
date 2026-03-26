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
  return (
    <AuthGuard>
      <div className={styles.layout}>
        {/* Futuristic Background Elements */}
        <div className={styles.bgMesh} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        
        <Sidebar aria-label="Main Navigation" />
        
        <div className={styles.mainContent}>
          <TopBar title={title} />
          <main className={styles.pageBody} id="main-content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
