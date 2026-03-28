import { Request, Response, NextFunction } from 'express';
import { PermissionRepository } from '../repositories/PermissionRepository.js';

export class PermissionController {
  constructor(private permissionRepo: PermissionRepository) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.permissionRepo.getAll(req.query);
      res.json({
        status: 'success',
        data: result.permissions,
        pagination: {
          total: result.total,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getByUuid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const permission = await this.permissionRepo.findByUuid(uuid as string);
      if (!permission) {
        const error = new Error('Permission not found');
        (error as any).status = 404;
        throw error;
      }
      res.json({
        status: 'success',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permission = await this.permissionRepo.create(req.body);
      res.status(201).json({
        status: 'success',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const success = await this.permissionRepo.update(uuid as string, req.body);
      if (!success) {
        const error = new Error('Permission not found');
        (error as any).status = 404;
        throw error;
      }
      const permission = await this.permissionRepo.findByUuid(uuid as string);
      res.json({
        status: 'success',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const success = await this.permissionRepo.delete(uuid as string);
      if (!success) {
        const error = new Error('Permission not found');
        (error as any).status = 404;
        throw error;
      }
      res.json({
        status: 'success',
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
