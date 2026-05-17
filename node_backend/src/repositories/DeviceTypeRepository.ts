import { generateUuidV7 } from '../utils/uuid.js';
import db from '../config/database.js';
import { DeviceType, CreateDeviceTypeDTO, UpdateDeviceTypeDTO } from '../models/DeviceType.js';
import { nowDb } from '../utils/time.js';

export class DeviceTypeRepository {
  private table = 'device_types';
  private catTable = 'device_categories';

  private baseQuery() {
    return db(this.table)
      .leftJoin(`${this.catTable}`, `${this.table}.deviceCategoryId`, `${this.catTable}.id`)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.code as categoryCode`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
      );
  }

  async getAll(params: {
    page?: number; limit?: number; search?: string; status?: string; categoryId?: number | string;
  }): Promise<{ deviceTypes: DeviceType[]; total: number }> {
    const page   = Number(params.page)  || 1;
    const limit  = Number(params.limit) || 10;
    const offset = (page - 1) * limit;

    let q = db(this.table).whereNot(`${this.table}.status`, 'deleted');
    if (params.status)     q = q.where(`${this.table}.status`, params.status);
    if (params.categoryId) q = q.where(`${this.table}.deviceCategoryId`, params.categoryId);
    if (params.search) q = q.where((b: any) => {
      b.where(`${this.table}.name`, 'like', `%${params.search}%`)
       .orWhere(`${this.table}.code`, 'like', `%${params.search}%`);
    });

    const [{ count }] = await q.clone().count(`${this.table}.id as count`);

    const deviceTypes = await q.clone()
      .leftJoin(`${this.catTable}`, `${this.table}.deviceCategoryId`, `${this.catTable}.id`)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.code as categoryCode`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
      )
      .orderBy(`${this.table}.id`, 'asc')
      .limit(limit).offset(offset);

    return { deviceTypes, total: Number(count) };
  }

  async findByUuid(uuid: string): Promise<DeviceType | null> {
    return this.baseQuery().where(`${this.table}.uuid`, uuid).first() ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'DT%')
      .orderByRaw("CAST(SUBSTRING(code, 3) AS UNSIGNED) DESC")
      .select('code').first();
    return row?.code ?? null;
  }

  async create(data: CreateDeviceTypeDTO & { code: string }): Promise<DeviceType> {
    const uuid = generateUuidV7();
    const now  = nowDb();
    const [id] = await db(this.table).insert({
      uuid,
      name:             data.name,
      code:             data.code,
      deviceCategoryId: data.deviceCategoryId ?? null,
      iconId:           data.iconId ?? null,
      description:      data.description ?? null,
      status:           'active',
      createdAt: now, updatedAt: now,
    });
    return this.findByUuid(uuid) as Promise<DeviceType>;
  }

  async update(uuid: string, data: UpdateDeviceTypeDTO): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    const rows = await db(this.table).where({ uuid }).update(payload);
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
