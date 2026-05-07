import { generateUuidV7 } from '../utils/uuid.js';
import db from '../config/database.js';
import {
  TenantDeviceCategory,
  CreateDeviceCategoryDTO,
  UpdateDeviceCategoryDTO,
} from '../models/TenantDeviceCategory.js';
import { nowDb } from '../utils/time.js';

export class TenantDeviceCategoryRepository {
  private table = 'tenant_device_categories';

  async getAll(
    tenantBusinessId: number,
    params: { page?: number; limit?: number; filter?: { name?: string; status?: string; search?: string } } = {},
  ): Promise<{ deviceCategories: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;
    const f = params.filter || {};

    const base = () => {
      let q = db(this.table)
        .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
        .whereNot(`${this.table}.status`, 'deleted');
      if (f.status && f.status !== 'all') q = q.where(`${this.table}.status`, f.status);
      if (f.search) {
        q = q.where((b: any) => {
          b.where(`${this.table}.name`, 'like', `%${f.search}%`)
            .orWhere(`${this.table}.code`, 'like', `%${f.search}%`)
            .orWhere(`${this.table}.description`, 'like', `%${f.search}%`);
        });
      }
      return q;
    };

    const countResult = await base().count('* as total').first();
    const total = Number(countResult?.total || 0);

    let query = base()
      .select(`${this.table}.*`)
      .orderBy(`${this.table}.createdAt`, 'desc');

    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const deviceCategories = await query;
    return { deviceCategories, total };
  }

  async findByUuid(uuid: string, tenantBusinessId: number): Promise<TenantDeviceCategory | null> {
    return db(this.table)
      .where({ uuid, tenantBusinessId })
      .whereNot('status', 'deleted')
      .first() ?? null;
  }

  async findByCode(code: string, tenantBusinessId: number, excludeUuid?: string): Promise<{ uuid: string } | null> {
    let q = db(this.table)
      .where({ code, tenantBusinessId })
      .whereNot('status', 'deleted')
      .select('uuid');
    if (excludeUuid) q = q.whereNot('uuid', excludeUuid);
    return q.first() ?? null;
  }

  async create(data: CreateDeviceCategoryDTO & { tenantBusinessId: number }): Promise<TenantDeviceCategory> {
    const uuid = generateUuidV7();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      tenantBusinessId: data.tenantBusinessId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, data.tenantBusinessId) as Promise<TenantDeviceCategory>;
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceCategoryDTO): Promise<boolean> {
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
