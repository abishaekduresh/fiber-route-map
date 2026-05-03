import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { Tenant } from '../models/Tenant.js';

export class TenantUserController {
  constructor(private tenantRepo: TenantRepository) {}

  private transform = (tenant: Tenant) => ({
    id: tenant.uuid,
    type: 'tenant_user',
    attributes: {
      name: tenant.name,
      username: tenant.username,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      role: tenant.role || null,
      status: tenant.status,
      country: tenant.country ? { uuid: tenant.country.uuid, name: tenant.country.name } : null,
      business: tenant.business ? { uuid: tenant.business.uuid, name: tenant.business.name } : null,
    },
    meta: { createdAt: tenant.createdAt, updatedAt: tenant.updatedAt },
    links: { self: `/api/tenant/users/${tenant.uuid}` },
  });

  private getMeta = (req: Request, extra: any = {}) => ({
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    version: '1.42.0',
    ...extra,
  });

  private authUuid = (req: Request): string => (req as any).user.uuid || (req as any).user.id;

  private getParentInternals = async (tenantUuid: string) => {
    const row = await db('tenants').where('uuid', tenantUuid).select('tenantBusinessId', 'countryId').first();
    return {
      tenantBusinessId: (row?.tenantBusinessId as number | null) ?? null,
      countryId: (row?.countryId as number | null) ?? null,
    };
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = this.authUuid(req);
      const { tenantBusinessId } = await this.getParentInternals(uuid);

      if (!tenantBusinessId) {
        return res.json({
          success: true, statusCode: 200, message: 'No users found', data: [],
          meta: this.getMeta(req, { pagination: { total: 0, count: 0, perPage: 10, currentPage: 1, totalPages: 0 } }),
        });
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const { tenants, total } = await this.tenantRepo.getAllByBusiness(tenantBusinessId, uuid, { page, limit });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: tenants.length > 0 ? 'Users retrieved successfully' : 'No users found',
        data: tenants.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: tenants.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = this.authUuid(req);
      const { tenantBusinessId } = await this.getParentInternals(uuid);
      if (!tenantBusinessId) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      const tenant = await this.tenantRepo.findByUuidInBusiness(req.params.uuid as string, tenantBusinessId, uuid);
      if (!tenant) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      return res.json({ success: true, statusCode: 200, data: this.transform(tenant), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, username, email, phone, address, countryUuid, roleUuid, password } = req.body;

      if (!name || !email || !password) {
        const e = new Error('name, email, and password are required'); (e as any).status = 400; throw e;
      }

      const authUuid = this.authUuid(req);
      const { tenantBusinessId, countryId: parentCountryId } = await this.getParentInternals(authUuid);

      if (!tenantBusinessId) {
        const e = new Error('Your account is not linked to a business'); (e as any).status = 400; throw e;
      }

      const existingEmail = await this.tenantRepo.findByEmail(email);
      if (existingEmail) { const e = new Error('A user with this email already exists'); (e as any).status = 409; throw e; }

      if (phone) {
        const existingPhone = await this.tenantRepo.findByPhone(phone);
        if (existingPhone) { const e = new Error('This phone number is already registered'); (e as any).status = 409; throw e; }
      }

      let finalUsername = username;
      if (!finalUsername) {
        const emailLocal = email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();
        finalUsername = `${emailLocal}_${Math.random().toString(36).slice(2, 6)}`;
      } else {
        const existingUsername = await this.tenantRepo.findByUsername(finalUsername);
        if (existingUsername) { const e = new Error('Username is already taken'); (e as any).status = 409; throw e; }
      }

      let countryId: number | null = parentCountryId;
      if (countryUuid) {
        const row = await db('countries').where('uuid', countryUuid).select('id').first();
        countryId = row?.id ?? null;
      }

      let roleId: number | null = null;
      if (roleUuid) {
        const row = await db('roles').where('uuid', roleUuid).whereNull('deletedAt').select('id').first();
        roleId = row?.id ?? null;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const tenant = await this.tenantRepo.create({
        email, username: finalUsername, name, phone: phone || '', address: address || '',
        password: hashedPassword, countryId, roleId, tenantBusinessId, sessionLimit: 1,
      });

      return res.status(201).json({
        success: true, statusCode: 201, message: 'User created successfully',
        data: this.transform(tenant), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, username, email, phone, address, countryUuid, roleUuid, password } = req.body;
      const authUuid = this.authUuid(req);
      const targetUuid = req.params.uuid as string;
      const { tenantBusinessId } = await this.getParentInternals(authUuid);
      if (!tenantBusinessId) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      const current = await this.tenantRepo.findByUuidInBusiness(targetUuid, tenantBusinessId, authUuid);
      if (!current) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      if (email && email !== current.email) {
        const dup = await this.tenantRepo.findByEmail(email);
        if (dup) { const e = new Error('A user with this email already exists'); (e as any).status = 409; throw e; }
      }

      if (phone && phone !== current.phone) {
        const dup = await this.tenantRepo.findByPhone(phone);
        if (dup) { const e = new Error('This phone number is already registered'); (e as any).status = 409; throw e; }
      }

      if (username && username !== current.username) {
        const dup = await this.tenantRepo.findByUsername(username);
        if (dup) { const e = new Error('Username is already taken'); (e as any).status = 409; throw e; }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      if (countryUuid !== undefined) {
        if (countryUuid) {
          const row = await db('countries').where('uuid', countryUuid).select('id').first();
          updateData.countryId = row?.id ?? null;
        } else {
          updateData.countryId = null;
        }
      }

      if (roleUuid !== undefined) {
        if (roleUuid) {
          const row = await db('roles').where('uuid', roleUuid).whereNull('deletedAt').select('id').first();
          updateData.roleId = row?.id ?? null;
        } else {
          updateData.roleId = null;
        }
      }

      await this.tenantRepo.update(targetUuid, updateData);
      const updated = await this.tenantRepo.findByUuid(targetUuid);

      return res.json({
        success: true, statusCode: 200, message: 'User updated successfully',
        data: this.transform(updated!), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUuid = this.authUuid(req);
      const { tenantBusinessId } = await this.getParentInternals(authUuid);
      if (!tenantBusinessId) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      const target = await this.tenantRepo.findByUuidInBusiness(req.params.uuid as string, tenantBusinessId, authUuid);
      if (!target) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      await this.tenantRepo.delete(req.params.uuid as string);
      return res.json({ success: true, statusCode: 200, message: 'User deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUuid = this.authUuid(req);
      const { tenantBusinessId } = await this.getParentInternals(authUuid);
      if (!tenantBusinessId) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      const target = await this.tenantRepo.findByUuidInBusiness(req.params.uuid as string, tenantBusinessId, authUuid);
      if (!target) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      await this.tenantRepo.updateStatus(req.params.uuid as string, 'blocked');
      const updated = await this.tenantRepo.findByUuid(req.params.uuid as string);
      return res.json({ success: true, statusCode: 200, message: 'User blocked', data: this.transform(updated!), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUuid = this.authUuid(req);
      const { tenantBusinessId } = await this.getParentInternals(authUuid);
      if (!tenantBusinessId) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      const target = await this.tenantRepo.findByUuidInBusiness(req.params.uuid as string, tenantBusinessId, authUuid);
      if (!target) { const e = new Error('User not found'); (e as any).status = 404; throw e; }

      await this.tenantRepo.updateStatus(req.params.uuid as string, 'active');
      const updated = await this.tenantRepo.findByUuid(req.params.uuid as string);
      return res.json({ success: true, statusCode: 200, message: 'User unblocked', data: this.transform(updated!), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
