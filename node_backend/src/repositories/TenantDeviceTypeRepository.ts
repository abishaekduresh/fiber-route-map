import { generateUuidV7 } from '../utils/uuid.js';
import db from '../config/database.js';
import {
  TenantDeviceType,
  CreateDeviceTypeDTO,
  UpdateDeviceTypeDTO,
} from '../models/TenantDeviceType.js';
import { nowDb } from '../utils/time.js';

export class TenantDeviceTypeRepository {
  private table = 'tenant_device_types';
  private catTable = 'tenant_device_categories';

  async getAll(
    tenantBusinessId: number,
    params: {
      page?: number;
      limit?: number;
      filter?: {
        status?: string;
        categoryId?: number | string;
        search?: string;
      };
    } = {},
  ): Promise<{ deviceTypes: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;
    const f = params.filter || {};

    const base = () => {
      let q = db(this.table)
        .leftJoin(`${this.catTable}`, `${this.table}.tenantDeviceCategoryId`, `${this.catTable}.id`)
        .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
        .whereNot(`${this.table}.status`, 'deleted');

      if (f.status && f.status !== 'all') q = q.where(`${this.table}.status`, f.status);
      if (f.categoryId && f.categoryId !== 'all') {
        q = q.where(`${this.table}.tenantDeviceCategoryId`, f.categoryId);
      }
      if (f.search) {
        q = q.where((b: any) => {
          b.where(`${this.table}.name`, 'like', `%${f.search}%`)
            .orWhere(`${this.table}.code`, 'like', `%${f.search}%`)
            .orWhere(`${this.table}.description`, 'like', `%${f.search}%`);
        });
      }
      return q;
    };

    const countResult = await base().count(`${this.table}.id as total`).first();
    const total = Number(countResult?.total || 0);

    let query = base()
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.uuid as categoryUuid`,
      )
      .orderBy(`${this.table}.createdAt`, 'desc');

    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const deviceTypes = await query;
    return { deviceTypes, total };
  }

  async findByUuid(uuid: string, tenantBusinessId: number): Promise<TenantDeviceType | null> {
    return db(this.table)
      .leftJoin(`${this.catTable}`, `${this.table}.tenantDeviceCategoryId`, `${this.catTable}.id`)
      .where(`${this.table}.uuid`, uuid)
      .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.uuid as categoryUuid`,
      )
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

  async create(data: CreateDeviceTypeDTO & { tenantBusinessId: number; code: string }): Promise<TenantDeviceType> {
    const uuid = generateUuidV7();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      tenantBusinessId: data.tenantBusinessId,
      tenantDeviceCategoryId: data.tenantDeviceCategoryId,
      name: data.name,
      code: data.code,
      isModelNumberRequired: data.isModelNumberRequired ? 1 : 0,
      isSerialNumberRequired: data.isSerialNumberRequired ? 1 : 0,
      isMacAddressRequired: data.isMacAddressRequired ? 1 : 0,
      isIPAddressRequired: data.isIPAddressRequired ? 1 : 0,
      isGpsLocationRequired: data.isGpsLocationRequired ? 1 : 0,
      description: data.description ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, data.tenantBusinessId) as Promise<TenantDeviceType>;
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceTypeDTO): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    // coerce booleans to 0/1 for MySQL
    const bools = [
      'isModelNumberRequired', 'isSerialNumberRequired', 'isMacAddressRequired',
      'isIPAddressRequired', 'isGpsLocationRequired',
    ] as const;
    for (const key of bools) {
      if (payload[key] !== undefined) payload[key] = payload[key] ? 1 : 0;
    }
    const result = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .update(payload);
    return result > 0;
  }

  async delete(uuid: string, tenantBusinessId: number): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return result > 0;
  }
}
