import db from '../config/database.js';
import { TenantUser, CreateTenantUserDTO, UpdateTenantUserDTO } from '../models/TenantUser.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class TenantUserRepository {
  private readonly table = 'tenant_users';

  private async getTenantInternalId(tenantUuid: string): Promise<number | null> {
    const row = await db('tenants').where('uuid', tenantUuid).select('id').first();
    return row ? row.id : null;
  }

  async getAll(tenantUuid: string, params: any = {}): Promise<{ users: TenantUser[]; total: number }> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return { users: [], total: 0 };

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const filter = params.filter || {};

    let query = db(this.table).where('tenantId', tenantId);
    let countQuery = db(this.table).where('tenantId', tenantId);

    const status = filter.status ? String(filter.status) : '';
    if (status && status !== 'all') {
      query = query.where('status', status);
      countQuery = countQuery.where('status', status);
    }

    if (filter.name) {
      query = query.where('name', 'like', `%${filter.name}%`);
      countQuery = countQuery.where('name', 'like', `%${filter.name}%`);
    }
    if (filter.email) {
      query = query.where('email', 'like', `%${filter.email}%`);
      countQuery = countQuery.where('email', 'like', `%${filter.email}%`);
    }

    const totalRow = await countQuery.count('id as count').first() as any;
    const total = Number(totalRow?.count || 0);

    query = query.orderBy('createdAt', 'desc');
    if (limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const rows = await query.select('*');
    return { users: rows.map(this.mapRow), total };
  }

  async findByUuid(uuid: string, tenantUuid: string): Promise<TenantUser | null> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return null;
    const row = await db(this.table).where({ uuid, tenantId }).first();
    return row ? this.mapRow(row) : null;
  }

  async findByEmailInTenant(email: string, tenantUuid: string): Promise<any | null> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return null;
    return db(this.table).where({ email, tenantId }).first();
  }

  async create(tenantUuid: string, data: CreateTenantUserDTO): Promise<TenantUser> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) {
      const error = new Error('Tenant not found');
      (error as any).status = 404;
      throw error;
    }

    const uuid = generateUuidV7();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || 'member',
      password: data.password,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, tenantUuid) as Promise<TenantUser>;
  }

  async update(uuid: string, tenantUuid: string, data: UpdateTenantUserDTO): Promise<TenantUser | null> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return null;

    const updates: any = { updatedAt: nowDb() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone || null;
    if (data.role !== undefined) updates.role = data.role;

    await db(this.table).where({ uuid, tenantId }).update(updates);
    return this.findByUuid(uuid, tenantUuid);
  }

  async updateStatus(uuid: string, tenantUuid: string, status: 'active' | 'blocked'): Promise<TenantUser | null> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return null;
    await db(this.table).where({ uuid, tenantId }).update({ status, updatedAt: nowDb() });
    return this.findByUuid(uuid, tenantUuid);
  }

  async delete(uuid: string, tenantUuid: string): Promise<boolean> {
    const tenantId = await this.getTenantInternalId(tenantUuid);
    if (!tenantId) return false;
    const affected = await db(this.table).where({ uuid, tenantId }).delete();
    return affected > 0;
  }

  private mapRow = (row: any): TenantUser => ({
    uuid: row.uuid,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    role: row.role || 'member',
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
