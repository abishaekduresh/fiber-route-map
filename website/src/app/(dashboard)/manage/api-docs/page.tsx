'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ApiDocsViewer from '@/components/api-docs/ApiDocsViewer';
import { Can } from '@/components/auth/Can';
import styles from './api-docs.module.css';

export default function ApiDocsPage() {
  return (
    <DashboardLayout title="API Documentation">
      <Can
        I="apidoc.view"
        otherwise={
          <div className={styles.accessDenied}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <h2>Access Restricted</h2>
            <p>You don't have permission to view the API documentation.</p>
            <p className={styles.permissionHint}>
              Required permission: <code>apidoc.view</code>
            </p>
          </div>
        }
      >
        <div className={styles.viewerWrapper}>
          <ApiDocsViewer />
        </div>
      </Can>
    </DashboardLayout>
  );
}
