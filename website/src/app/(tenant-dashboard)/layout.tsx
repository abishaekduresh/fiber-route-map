import TenantDashboardLayout from '@/components/layout/TenantDashboardLayout';

/**
 * Tenant Dashboard Route Group Layout
 * 
 * Applies the TenantDashboardLayout to all pages within the (tenant-dashboard) group.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TenantDashboardLayout>
      {children}
    </TenantDashboardLayout>
  );
}
