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

  private transformRole = (role: any) => {
    const { uuid, name, slug, description, status, permissions, createdAt, updatedAt } = role;
    return {
      id: uuid,
      type: 'role',
      attributes: {
        name,
        slug,
        description,
        status,
        permissions: permissions?.map((p: any) => ({
          id: p.uuid,
          name: p.name,
          slug: p.slug
        })) || []
      },
      meta: {
        createdAt,
        updatedAt
      },
      links: {
        self: `/api/roles/${uuid}`
      }
    };
  };

  private getMeta = (req: Request, filterObj: any, sortParam: any, extra = {}) => {
    const appliedFilters = { ...filterObj };
    let sort: { field: string; order: string }[] = [];
    if (typeof sortParam === 'string') {
      sort = sortParam.split(',').map((s: string) => {
        const desc = s.trim().startsWith('-');
        const field = desc ? s.trim().substring(1) : s.trim();
        return { field, order: desc ? 'desc' : 'asc' };
      });
    } else if (sortParam && typeof sortParam === 'object') {
      sort = [{
        field: sortParam.field || 'createdAt',
        order: String(sortParam.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
      }];
    } else {
      sort = [{ field: 'createdAt', order: 'desc' }];
    }

    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1.7.0',
      filters: appliedFilters,
      sort,
      ...extra
    };
  };

  private buildLink = (req: Request, params: any) => {
    const url = new URL(req.baseUrl + req.path, 'http://localhost');
    const filters = typeof params.filters === 'object' ? params.filters : {};
    const filter = typeof params.filter === 'object' ? params.filter : {};
    const mergedFilter = { ...filters, ...filter };

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || key === 'filter' || key === 'filters' || key === 'page' || key === 'limit') return;
      if (typeof value !== 'object') {
        url.searchParams.append(key, String(value));
      }
    });

    Object.entries(mergedFilter).forEach(([fKey, fVal]) => {
      url.searchParams.append(`filter[${fKey}]`, String(fVal));
    });
    
    if (params.page) url.searchParams.append('page', String(params.page));
    if (params.limit) url.searchParams.append('limit', String(params.limit));

    return `${url.pathname}${url.search}`;
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      
      const filtersParam = typeof req.query.filters === 'object' ? req.query.filters as any : {};
      const filterParam = typeof req.query.filter === 'object' ? req.query.filter as any : {};
      const filterObj = {
        ...filtersParam,
        ...filterParam,
        name: req.query.name || (filterParam.name || filtersParam.name),
        status: req.query.status || (filterParam.status || filtersParam.status)
      };

      const sortParam = req.query.sort;

      const params = {
        page: String(page),
        limit: String(limit),
        status: filterObj.status,
        name: filterObj.name,
        sort: sortParam
      };

      const result = await this.service.getAllRoles(params);
      const totalPages = limit === -1 ? 1 : Math.ceil(result.total / limit);
      const transformedRoles = result.roles.map(role => this.transformRole(role));

      res.json({
        success: true,
        statusCode: 200,
        message: transformedRoles.length > 0 ? 'Roles retrieved successfully' : 'No roles found matching the criteria',
        data: transformedRoles,
        meta: this.getMeta(req, filterObj, sortParam, {
          pagination: {
            total: result.total,
            count: transformedRoles.length,
            perPage: limit === -1 ? result.total : limit,
            currentPage: page,
            totalPages
          }
        }),
        links: {
          self: this.buildLink(req, { ...req.query, page, limit }),
          next: page < totalPages ? this.buildLink(req, { ...req.query, page: page + 1, limit }) : null,
          prev: page > 1 ? this.buildLink(req, { ...req.query, page: page - 1, limit }) : null
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
        message: 'Role retrieved successfully',
        data: this.transformRole(role),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createRoleSchema.parse(req.body);
      const role = await this.service.createRole(data as any);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Role created successfully',
        data: this.transformRole(role),
        meta: this.getMeta(req, {}, null)
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
        data: this.transformRole(role),
        meta: this.getMeta(req, {}, null)
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
        message: 'Role deleted successfully',
        meta: this.getMeta(req, {}, null)
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
        data: this.transformRole(role),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  syncPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissionUuids = z.array(z.string()).parse(req.body.permissions);
      const role = await this.service.syncPermissions(req.params.uuid as string, permissionUuids);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Role permissions synchronized successfully',
        data: this.transformRole(role),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };
}
