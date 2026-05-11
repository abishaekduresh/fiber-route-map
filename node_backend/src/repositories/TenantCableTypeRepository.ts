import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import {
  TenantCableType,
  CreateCableTypeDTO,
  UpdateCableTypeDTO,
} from '../models/TenantCableType.js';
import { nowDb } from '../utils/time.js';

export class TenantCableTypeRepository {
  private table = 'tenant_cable_types';

  async getAll(
    tenantBusinessId: number,
    params: { page?: number; limit?: number; filter?: { name?: string; status?: string } } = {},
  ): Promise<{ cableTypes: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    const base = () =>
      db(this.table)
        .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
        .whereNot(`${this.table}.status`, 'deleted');

    let query = base().select(`${this.table}.*`);

    if (params.filter?.name) {
      query = query.where(`${this.table}.name`, 'like', `%${params.filter.name}%`);
    }
    if (params.filter?.status && params.filter.status !== 'all') {
      query = query.where(`${this.table}.status`, params.filter.status);
    }

    const countResult = await base().count('* as total').first();
    const total = Number(countResult?.total || 0);

    query = (query as any).orderBy(`${this.table}.createdAt`, 'desc');
    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const cableTypes = await query;
    return { cableTypes, total };
  }

  async findByUuid(uuid: string, tenantBusinessId: number): Promise<TenantCableType | null> {
    return db(this.table)
      .where({ uuid, tenantBusinessId })
      .whereNot('status', 'deleted')
      .first() ?? null;
  }

  async findByCode(code: string, tenantBusinessId: number): Promise<{ uuid: string } | null> {
    return db(this.table)
      .where({ code, tenantBusinessId })
      .whereNot('status', 'deleted')
      .select('uuid')
      .first() ?? null;
  }

  async create(data: CreateCableTypeDTO & { tenantBusinessId: number; name: string; code: string }): Promise<TenantCableType> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      ...data,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, data.tenantBusinessId) as Promise<TenantCableType>;
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateCableTypeDTO & { name?: string; code?: string }): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .update({ ...data, updatedAt: nowDb() });
    return result > 0;
  }

  async updateStatus(uuid: string, tenantBusinessId: number, status: string): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .update({ status, updatedAt: nowDb() });
    return result > 0;
  }

  async delete(uuid: string, tenantBusinessId: number): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return result > 0;
  }
}
