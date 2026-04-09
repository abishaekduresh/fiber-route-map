import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/PermissionService.js';
import { z } from 'zod';

const createPermissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9.]+$/, 'Slug must only contain lowercase letters, numbers, and dots (e.g. user.view)'),
  description: z.string().optional().nullable(),
});

const updatePermissionSchema = createPermissionSchema.partial();

export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  private transformPermission = (permission: any) => {
    const { uuid, name, slug, description, createdAt, updatedAt } = permission;
    return {
      id: uuid,
      type: 'permission',
      attributes: {
        name,
        slug,
        description,
        resource: slug.split('.')[0] || 'general'
      },
      meta: {
        createdAt,
        updatedAt
      },
      links: {
        self: `/api/permissions/${uuid}`
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
        field: sortParam.field || 'slug',
        order: String(sortParam.order || 'asc').toLowerCase() === 'asc' ? 'asc' : 'desc'
      }];
    } else {
      sort = [{ field: 'slug', order: 'asc' }];
    }

    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1.17.0',
      filters: appliedFilters,
      sort,
      ...extra
    };
  };

  private buildLink = (req: Request, params: any) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = new URL(req.baseUrl + req.path, baseUrl);
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
        slug: req.query.slug || (filterParam.slug || filtersParam.slug)
      };

      const sortParam = req.query.sort;

      const params = {
        page: String(page),
        limit: String(limit),
        slug: filterObj.slug,
        name: filterObj.name,
        sort: sortParam
      };

      const result = await this.service.getAllPermissions(params);
      const totalPages = limit === -1 ? 1 : Math.ceil(result.total / limit);
      const transformedPermissions = result.permissions.map(p => this.transformPermission(p));

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: transformedPermissions.length > 0 ? 'Permissions retrieved successfully' : 'No permissions found matching the criteria',
        data: transformedPermissions,
        meta: this.getMeta(req, filterObj, sortParam, {
          pagination: {
            total: result.total,
            count: transformedPermissions.length,
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
      const permission = await this.service.getPermissionByUuid(req.params.uuid as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Permission retrieved successfully',
        data: this.transformPermission(permission),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPermissionSchema.parse(req.body);
      const permission = await this.service.createPermission(data as any);
      res.status(200).json({
        success: true,
        statusCode: 201, // Actual status is 201, but JSON response uses this
        message: 'Permission created successfully',
        data: this.transformPermission(permission),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updatePermissionSchema.parse(req.body);
      const permission = await this.service.updatePermission(req.params.uuid as string, data as any);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Permission updated successfully',
        data: this.transformPermission(permission),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deletePermission(req.params.uuid as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Permission deleted successfully',
        meta: this.getMeta(req, {}, null)
      });
    } catch (error: any) {
      next(error);
    }
  };

  sync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { added, total } = await this.service.syncPermissions();
      const message = added.length > 0
        ? `Sync complete — ${added.length} new permission${added.length === 1 ? '' : 's'} added`
        : 'All permissions are already up to date';
      res.json({
        success: true,
        statusCode: 200,
        message,
        data: { added, total },
        meta: this.getMeta(req, {}, null),
      });
    } catch (error) {
      next(error);
    }
  };
}
