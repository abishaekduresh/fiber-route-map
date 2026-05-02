import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TenantRepository } from '../repositories/TenantRepository.js';

export const tenantAuth = (tenantRepo: TenantRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new Error('Authentication token is required');
        (error as any).status = 401;
        throw error;
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';

      try {
        const payload = jwt.verify(token, secret) as any;
        
        if (payload.type !== 'tenant') {
          const error = new Error('Invalid token type');
          (error as any).status = 401;
          throw error;
        }

        const tenant = await tenantRepo.findByUuid(payload.id);

        if (!tenant) {
          const error = new Error('Tenant not found');
          (error as any).status = 401;
          throw error;
        }

        if (tenant.status !== 'active') {
          const error = new Error(`Your account is ${tenant.status}. Please contact support.`);
          (error as any).status = 403;
          throw error;
        }

        if (tenant.business && tenant.business.status && tenant.business.status !== 'active') {
          const error = new Error(`Your business account is ${tenant.business.status}. Please contact support.`);
          (error as any).status = 403;
          throw error;
        }

        // Attach tenant to request
        (req as any).user = { id: tenant.uuid, ...tenant };
        next();
      } catch (err) {
        const error = new Error('Invalid or expired token');
        (error as any).status = 401;
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
};
