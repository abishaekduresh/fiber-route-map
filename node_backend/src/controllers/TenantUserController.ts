import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { TenantUserRepository } from '../repositories/TenantUserRepository.js';
import { TenantUser } from '../models/TenantUser.js';

export class TenantUserController {
  constructor(private repo: TenantUserRepository) {}

  private transform = (user: TenantUser) => ({
    id: user.uuid,
    type: 'tenant_user',
    attributes: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    meta: { createdAt: user.createdAt, updatedAt: user.updatedAt },
    links: { self: `/api/tenant/users/${user.uuid}` },
  });

  private getMeta = (req: Request, extra: any = {}) => ({
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    version: '1.39.0',
    ...extra,
  });

  private tenantUuid = (req: Request): string => (req as any).user.id;

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filter = { ...(req.query.filter as any || {}) };

      const { users, total } = await this.repo.getAll(this.tenantUuid(req), { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      res.json({
        success: true,
        statusCode: 200,
        message: users.length > 0 ? 'Users retrieved successfully' : 'No users found',
        data: users.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: users.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.repo.findByUuid(req.params.uuid as string, this.tenantUuid(req));
      if (!user) {
        const err = new Error('User not found');
        (err as any).status = 404;
        throw err;
      }
      res.json({ success: true, statusCode: 200, data: this.transform(user), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, role, password } = req.body;

      if (!name || !email || !password) {
        const err = new Error('name, email, and password are required');
        (err as any).status = 400;
        throw err;
      }

      const tenantUuid = this.tenantUuid(req);
      const existing = await this.repo.findByEmailInTenant(email, tenantUuid);
      if (existing) {
        const err = new Error('A user with this email already exists in your account');
        (err as any).status = 409;
        throw err;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.repo.create(tenantUuid, { name, email, phone, role, password: hashedPassword });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: this.transform(user),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, role } = req.body;
      const tenantUuid = this.tenantUuid(req);
      const uuid = req.params.uuid as string;

      // If email is changing, check for duplicates
      if (email) {
        const current = await this.repo.findByUuid(uuid, tenantUuid);
        if (!current) {
          const err = new Error('User not found');
          (err as any).status = 404;
          throw err;
        }
        if (email !== current.email) {
          const existing = await this.repo.findByEmailInTenant(email, tenantUuid);
          if (existing) {
            const err = new Error('A user with this email already exists in your account');
            (err as any).status = 409;
            throw err;
          }
        }
      }

      const user = await this.repo.update(uuid, tenantUuid, { name, email, phone, role });
      if (!user) {
        const err = new Error('User not found');
        (err as any).status = 404;
        throw err;
      }

      res.json({ success: true, statusCode: 200, message: 'User updated successfully', data: this.transform(user), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.repo.delete(req.params.uuid as string, this.tenantUuid(req));
      if (!deleted) {
        const err = new Error('User not found');
        (err as any).status = 404;
        throw err;
      }
      res.json({ success: true, statusCode: 200, message: 'User deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.repo.updateStatus(req.params.uuid as string, this.tenantUuid(req), 'blocked');
      if (!user) {
        const err = new Error('User not found');
        (err as any).status = 404;
        throw err;
      }
      res.json({ success: true, statusCode: 200, message: 'User blocked successfully', data: this.transform(user), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.repo.updateStatus(req.params.uuid as string, this.tenantUuid(req), 'active');
      if (!user) {
        const err = new Error('User not found');
        (err as any).status = 404;
        throw err;
      }
      res.json({ success: true, statusCode: 200, message: 'User unblocked successfully', data: this.transform(user), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
