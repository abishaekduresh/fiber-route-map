'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../providers/AuthContext';

interface CanProps {
  /** The permission slug to check (e.g., 'user.view') */
  I: string;
  /** Content to show if the user has permission */
  children: ReactNode;
  /** (Optional) Content to show if permission is denied */
  otherwise?: ReactNode;
}

/**
 * Declarative component for conditional rendering based on user permissions.
 * Usage:
 * <Can I="user.create">
 *   <button>Add User</button>
 * </Can>
 */
export function Can({ I, children, otherwise = null }: CanProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading skeleton
  }

  if (hasPermission(I)) {
    return <>{children}</>;
  }

  return <>{otherwise}</>;
}
