import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

/**
 * Middleware to check if the authenticated user has a specific permission.
 * Requires the 'auth' middleware to be executed first.
 * 
 * @param permission The permission slug to check (e.g., 'user.view')
 */
export const rbac = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as User;

      if (!user) {
        const error = new Error('Authentication required');
        (error as any).status = 401;
        throw error;
      }

      // Check for specific permission
      const hasPermission = user.permissions?.includes(permission);

      if (!hasPermission) {
        const error = new Error(`Permission denied: ${permission} required`);
        (error as any).status = 403;
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
