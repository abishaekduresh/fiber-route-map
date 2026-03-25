import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/RoleService.js';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const updateRoleSchema = createRoleSchema.partial();

export class RoleController {
  constructor(private readonly service: RoleService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = {
        page: req.query.page as string,
        limit: req.query.limit as string,
        status: req.query.status as string,
        name: req.query.name as string,
      };
      const result = await this.service.getAllRoles(params);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Roles retrieved successfully',
        data: result.roles.map(this.transformRole),
        meta: {
          pagination: {
            total: result.total,
            count: result.roles.length,
            perPage: Number(params.limit) || 10,
            currentPage: Number(params.page) || 1,
            totalPages: Math.ceil(result.total / (Number(params.limit) || 10))
          }
        }
      });
    } catch (error: any) {
      next(error);
    }
  };

  getByUuid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.getRoleByUuid(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        data: this.transformRole(role)
      });
    } catch (error: any) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createRoleSchema.parse(req.body);
      const role = await this.service.createRole(data as any);
      res.json({
        success: true,
        statusCode: 201,
        message: 'Role created successfully',
        data: this.transformRole(role)
      });
    } catch (error: any) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateRoleSchema.parse(req.body);
      const role = await this.service.updateRole(req.params.uuid as string, data as any);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Role updated successfully',
        data: this.transformRole(role)
      });
    } catch (error: any) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteRole(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Role deleted successfully'
      });
    } catch (error: any) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.restoreRole(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Role restored successfully',
        data: this.transformRole(role)
      });
    } catch (error: any) {
      next(error);
    }
  };

  private transformRole = (role: any) => {
    const { uuid, name, slug, description, status, createdAt, updatedAt } = role;
    return {
      id: uuid,
      type: 'role',
      attributes: {
        name,
        slug,
        description,
        status
      },
      meta: {
        createdAt,
        updatedAt
      }
    };
  };
}
