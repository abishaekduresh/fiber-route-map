import { generateUuidV7 } from '../utils/uuid.js';
import db from '../config/database.js';
import { DeviceCategory, CreateDeviceCategoryDTO, UpdateDeviceCategoryDTO } from '../models/DeviceCategory.js';
import { nowDb } from '../utils/time.js';

export class DeviceCategoryRepository {
  private table = 'device_categories';

  async getAll(params: {
    page?: number; limit?: number; search?: string; status?: string;
  }): Promise<{ categories: DeviceCategory[]; total: number }> {
    const page   = Number(params.page)  || 1;
    const limit  = Number(params.limit) || 10;
    const offset = (page - 1) * limit;

    let q = db(this.table).whereNot('status', 'deleted');
    if (params.status) q = q.where('status', params.status);
    if (params.search) q = q.where((b: any) => {
      b.where('name', 'like', `%${params.search}%`)
       .orWhere('code', 'like', `%${params.search}%`)
       .orWhere('description', 'like', `%${params.search}%`);
    });

    const [{ count }] = await q.clone().count('id as count');
    const categories  = await q.clone().orderBy('id', 'asc').limit(limit).offset(offset);
    return { categories, total: Number(count) };
  }

  async findByUuid(uuid: string): Promise<DeviceCategory | null> {
    return db(this.table).where({ uuid }).whereNot('status', 'deleted').first() ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'DC%')
      .orderByRaw("CAST(SUBSTRING(code, 3) AS UNSIGNED) DESC")
      .select('code').first();
    return row?.code ?? null;
  }

  async create(data: CreateDeviceCategoryDTO & { code: string }): Promise<DeviceCategory> {
    const uuid = generateUuidV7();
    const now  = nowDb();
    const [id] = await db(this.table).insert({ uuid, ...data, status: 'active', createdAt: now, updatedAt: now });
    return db(this.table).where({ id }).first();
  }

  async update(uuid: string, data: UpdateDeviceCategoryDTO): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ ...data, updatedAt: nowDb() });
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
