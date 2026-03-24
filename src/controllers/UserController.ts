import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';
import { nowDb } from '../utils/time.js';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.union([
    z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    z.number().refine(val => String(val).length === 10, 'Phone number must be exactly 10 digits')
  ]),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  phone: z.union([
    z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    z.number().refine(val => String(val).length === 10, 'Phone number must be exactly 10 digits')
  ]).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export class UserController {
  private service: UserService;

  constructor(service: UserService) {
    this.service = service;
  }

  // GET /api/users
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      
      const { users, total } = await this.service.getAllUsers({ ...req.query, page, limit });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      // Success response following SKILL.md standards: error: false, code: 200
      res.json({
        error: false,
        code: 200,
        message: 'Users retrieved successfully',
        data: users,
        meta: { 
          pagination: {
            total,
            page,
            limit,
            totalPages
          },
          timestamp: nowDb(), 
          version: 'v1' 
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = userSchema.parse(req.body);
      const { confirmPassword, ...userData } = body;
      const user = await this.service.createUser(userData);
      // Success response following SKILL.md standards: error: false, code: 201
      res.json({
        error: false,
        code: 201,
        message: 'User created successfully',
        data: user,
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getUserByUuid(req.params.uuid as string);
      res.json({
        error: false,
        code: 200,
        message: 'User retrieved successfully',
        data: user,
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = updateSchema.parse(req.body);
      const { confirmPassword, ...updateData } = body;
      const user = await this.service.updateUser(req.params.uuid as string, updateData);
      res.json({
        error: false,
        code: 200,
        message: 'User updated successfully',
        data: user,
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/:uuid
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteUser(req.params.uuid as string);
      // Always return 200 OK and a descriptive message for successful deletion
      res.json({
        error: false,
        code: 200,
        message: 'User deleted successfully',
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.blockUser(req.params.uuid as string);
      res.json({
        error: false,
        code: 200,
        message: 'User blocked successfully',
        data: user,
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.unblockUser(req.params.uuid as string);
      res.json({
        error: false,
        code: 200,
        message: 'User activated successfully',
        data: user,
        meta: { timestamp: nowDb(), version: 'v1' }
      });
    } catch (error) {
      next(error);
    }
  };
}
