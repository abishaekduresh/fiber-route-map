'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LoginData } from '@/lib/api';

interface AuthContextType {
  user: LoginData['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  setUser: (user: LoginData['user'] | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<LoginData['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize user from localStorage on mount
    const storedUser = localStorage.getItem('fiber_auth_user');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('fiber_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = (user: LoginData['user'] | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('fiber_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fiber_auth_user');
      localStorage.removeItem('fiber_auth_token');
    }
  };

  const logout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin bypass: If user has 'admin' role slug, they have all permissions
    const isAdmin = user.attributes.roles?.some(role => role.slug === 'admin');
    if (isAdmin) return true;

    return user.attributes.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      hasPermission, 
      setUser, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { hasPermission } = useAuth();
  return { hasPermission };
}
