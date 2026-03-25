import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';
import { nowDb } from '../utils/time.js';
import { z } from 'zod';
import { User } from '../models/User.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.union([z.string(), z.number()]).transform(val => String(val)).refine(val => /^\d{10}$/.test(val), 'Phone must be exactly 10 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  countryUuid: z.string().uuid('Invalid country selection'),
  roleUuids: z.array(z.string().uuid()).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.union([z.string(), z.number()]).transform(val => String(val)).refine(val => /^\d{10}$/.test(val), 'Phone must be exactly 10 digits').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  confirmPassword: z.string().optional(),
  countryUuid: z.string().uuid('Invalid country selection').optional(),
  roleUuids: z.array(z.string().uuid()).optional(),
}).refine(data => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export class UserController {
  private service: UserService;

  constructor(service: UserService) {
    this.service = service;
  }

  /**
   * Transforms a user database object into the new API response format.
   */
  private transformUser = (user: User) => {
    const { uuid, createdAt, updatedAt, email, username, name, phone, status, country, roles } = user;
    return {
      id: uuid,
      type: 'user',
      attributes: {
        email,
        username,
        name,
        phone,
        status,
        country,
        roles
      },
      meta: {
        createdAt,
        updatedAt
      },
      links: {
        self: `/api/users/${uuid}`
      }
    };
  };

  /**
   * Extracts common metadata for the response.
   * Accepts explicit filter and sort values already normalized by the caller.
   */
  private getMeta = (req: Request, filterObj: any, sortParam: any, extra = {}) => {
    // Build filter summary
    const appliedFilters = { ...filterObj };

    // Build sort summary — handles string or object
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
      // Default
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

  /**
   * Helper to build a URL with query parameters.
   * Handles nested filter/filters objects by serializing to bracket notation.
   * Normalizes both styles to singular 'filter' in produced links.
   */
  private buildLink = (req: Request, params: any) => {
    const url = new URL(req.baseUrl, 'http://localhost');
    
    // First, merge any filter/filters from params to normalize output
    const filters = typeof params.filters === 'object' ? params.filters : {};
    const filter = typeof params.filter === 'object' ? params.filter : {};
    const mergedFilter = { ...filters, ...filter };

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      // Skip the filter objects; we'll append the normalized one at the end
      if (key === 'filter' || key === 'filters') return;
      
      if (typeof value !== 'object') {
        url.searchParams.append(key, String(value));
      }
    });

    // Append merged filters using singular 'filter' key for consistency
    Object.entries(mergedFilter).forEach(([fKey, fVal]) => {
      url.searchParams.append(`filter[${fKey}]`, String(fVal));
    });

    return `${url.pathname}${url.search}`;
  };

  // GET /api/users
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);

      // Normalize: support both filter[...] and filters[...] syntax and merge them
      const filters = typeof req.query.filters === 'object' ? req.query.filters as any : {};
      const filter = typeof req.query.filter === 'object' ? req.query.filter as any : {};
      
      const filterObj = {
        ...filters,
        ...filter
      };

      const sortParam = req.query.sort;

      // Add top-level status to filterObj if provided without bracket syntax
      if (req.query.status && !filterObj.status) {
        filterObj.status = req.query.status;
      }

      const serviceParams = {
        filter: filterObj,
        sort: sortParam,
        page,
        limit,
      };

      const { users, total } = await this.service.getAllUsers(serviceParams);
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      const transformedUsers = users.map(user => this.transformUser(user));

      res.json({
        success: true,
        statusCode: 200,
        message: transformedUsers.length > 0 ? 'Users retrieved successfully' : 'No users found matching the criteria',
        data: transformedUsers,
        meta: this.getMeta(req, filterObj, sortParam, {
          pagination: {
            total,
            count: transformedUsers.length,
            perPage: limit === -1 ? total : limit,
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
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createUserSchema.parse(req.body);
      const { confirmPassword, ...userData } = body;
      const user = await this.service.createUser(userData);
      res.json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getUserByUuid(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User retrieved successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = updateUserSchema.parse(req.body);
      const { confirmPassword, ...updateData } = body;
      const user = await this.service.updateUser(req.params.uuid as string, updateData);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User updated successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/:uuid
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteUser(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User deleted successfully',
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.blockUser(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User blocked successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.unblockUser(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User activated successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users/:uuid/reset-password
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.resetPassword(req.params.uuid as string, req.body);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Password reset successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req, {}, null, { action: 'reset-password' })
      });
    } catch (error) {
      next(error);
    }
  };
}
