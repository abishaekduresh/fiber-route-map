'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantLoginData } from '@/lib/api';

interface TenantAuthContextType {
  tenant: TenantLoginData['tenant'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  setTenant: (tenant: TenantLoginData['tenant'] | null) => void;
  logout: () => void;
  exitImpersonation: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantLoginData['tenant'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Initialize tenant from localStorage on mount
    const storedTenant = localStorage.getItem('fiber_tenant_data');
    if (storedTenant) {
      try {
        setTenantState(JSON.parse(storedTenant));
      } catch (e) {
        console.error('Failed to parse stored tenant:', e);
        localStorage.removeItem('fiber_tenant_data');
      }
    }
    setIsImpersonating(localStorage.getItem('fiber_tenant_impersonating') === 'true');
    setIsLoading(false);
  }, []);

  const setTenant = (tenant: TenantLoginData['tenant'] | null) => {
    setTenantState(tenant);
    if (tenant) {
      localStorage.setItem('fiber_tenant_data', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('fiber_tenant_data');
      localStorage.removeItem('fiber_tenant_token');
      localStorage.removeItem('fiber_tenant_refresh');
      localStorage.removeItem('fiber_tenant_impersonating');
      localStorage.removeItem('fiber_impersonation_return');
      setIsImpersonating(false);
    }
  };

  const logout = async () => {
    try {
      const { tenantLogout: apiTenantLogout } = await import('@/lib/api');
      await apiTenantLogout();
    } catch (e) {
      console.error('Failed to logout on server:', e);
    }
    setTenant(null);
    window.location.href = '/login';
  };

  const exitImpersonation = () => {
    // Restore the admin session from stashed credentials
    const returnData = localStorage.getItem('fiber_impersonation_return');
    if (returnData) {
      try {
        const { token, user } = JSON.parse(returnData);
        if (token) localStorage.setItem('fiber_auth_token', token);
        if (user) localStorage.setItem('fiber_auth_user', user);
      } catch (e) {
        console.error('Failed to restore admin session:', e);
      }
    }

    // Clear tenant impersonation state
    localStorage.removeItem('fiber_tenant_token');
    localStorage.removeItem('fiber_tenant_refresh');
    localStorage.removeItem('fiber_tenant_data');
    localStorage.removeItem('fiber_tenant_impersonating');
    localStorage.removeItem('fiber_impersonation_return');
    setTenantState(null);
    setIsImpersonating(false);

    window.location.href = '/manage/tenants';
  };

  return (
    <TenantAuthContext.Provider value={{
      tenant,
      isAuthenticated: !!tenant,
      isLoading,
      isImpersonating,
      setTenant,
      logout,
      exitImpersonation,
    }}>
      {children}
    </TenantAuthContext.Provider>
  );
}

export function useTenantAuth() {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
}
