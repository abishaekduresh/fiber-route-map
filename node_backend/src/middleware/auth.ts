import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import logger from '../utils/logger.js';

export const auth = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const mgmtTokenHeader = req.headers['x-mgmt-token'];
      
      let user = null;

      if (mgmtTokenHeader) {
        // Try validating as a management token
        const token = Array.isArray(mgmtTokenHeader) ? mgmtTokenHeader[0] : mgmtTokenHeader;
        user = await authService.validateMgmtToken(token);
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        // Normal session token validation
        const token = authHeader.split(' ')[1];
        user = await authService.validateSession(token);
      }

      if (!user) {
        const error = new Error('Authentication token is required or invalid');
        (error as any).status = 401;
        throw error;
      }

      if (user.status === 'blocked') {
        const error = new Error('Your account is blocked. Please contact support.');
        (error as any).status = 403;
        throw error;
      }

      if (user.status === 'deleted') {
        const error = new Error('Your account has been deleted.');
        (error as any).status = 403;
        throw error;
      }

      // Attach user to request
      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
