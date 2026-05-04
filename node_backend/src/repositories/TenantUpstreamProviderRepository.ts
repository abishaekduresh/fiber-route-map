import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import {
  TenantUpstreamProvider,
  CreateUpstreamProviderDTO,
  UpdateUpstreamProviderDTO,
} from '../models/TenantUpstreamProvider.js';
import { nowDb } from '../utils/time.js';

export class TenantUpstreamProviderRepository {
  private table = 'tenant_upstream_providers';

  async getAll(
    tenantBusinessId: number,
    params: { page?: number; limit?: number; filter?: { name?: string; serviceCategory?: string; status?: string } } = {},
  ): Promise<{ providers: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    const base = () =>
      db(this.table)
        .leftJoin('countries', `${this.table}.countryId`, 'countries.id')
        .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
        .whereNot(`${this.table}.status`, 'deleted');

    let query = base().select(
      `${this.table}.*`,
      'countries.uuid as countryUuid',
      'countries.name as countryName',
    );

    if (params.filter?.name) {
      query = query.where(`${this.table}.name`, 'like', `%${params.filter.name}%`);
    }
    if (params.filter?.serviceCategory) {
      query = query.where(`${this.table}.serviceCategory`, params.filter.serviceCategory);
    }
    if (params.filter?.status && params.filter.status !== 'all') {
      query = query.where(`${this.table}.status`, params.filter.status);
    }

    const countResult = await base().count('* as total').first();
    const total = Number(countResult?.total || 0);

    query = (query as any).orderBy(`${this.table}.createdAt`, 'desc');
    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const providers = await query;
    return { providers, total };
  }

  async findByUuid(uuid: string, tenantBusinessId: number): Promise<any | null> {
    return db(this.table)
      .leftJoin('countries', `${this.table}.countryId`, 'countries.id')
      .where({ [`${this.table}.uuid`]: uuid, [`${this.table}.tenantBusinessId`]: tenantBusinessId })
      .whereNot(`${this.table}.status`, 'deleted')
      .select(`${this.table}.*`, 'countries.uuid as countryUuid', 'countries.name as countryName')
      .first() ?? null;
  }

  async findByEmail(email: string, tenantBusinessId: number): Promise<{ uuid: string } | null> {
    return db(this.table)
      .where({ email, tenantBusinessId })
      .whereNot('status', 'deleted')
      .select('uuid')
      .first() ?? null;
  }

  async findByPhone(phone: string, tenantBusinessId: number): Promise<{ uuid: string } | null> {
    return db(this.table)
      .where({ phone: String(phone), tenantBusinessId })
      .whereNot('status', 'deleted')
      .select('uuid')
      .first() ?? null;
  }

  async getLastCode(tenantBusinessId: number): Promise<string | null> {
    const last = await db(this.table)
      .where('tenantBusinessId', tenantBusinessId)
      .orderBy('id', 'desc')
      .select('code')
      .first();
    return last?.code ?? null;
  }

  async create(data: CreateUpstreamProviderDTO & {
    tenantBusinessId: number;
    code: string;
    countryId?: number | null;
  }): Promise<TenantUpstreamProvider> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      ...data,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, data.tenantBusinessId) as Promise<TenantUpstreamProvider>;
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateUpstreamProviderDTO): Promise<boolean> {
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
