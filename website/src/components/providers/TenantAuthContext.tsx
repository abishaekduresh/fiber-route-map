'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantLoginData } from '@/lib/api';

interface TenantAuthContextType {
  tenant: TenantLoginData['tenant'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTenant: (tenant: TenantLoginData['tenant'] | null) => void;
  logout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantLoginData['tenant'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    window.location.href = '/tenant-login';
  };

  return (
    <TenantAuthContext.Provider value={{ 
      tenant, 
      isAuthenticated: !!tenant, 
      isLoading, 
      setTenant, 
      logout 
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
