import db from '../config/database.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';
import type { RoutePointTemplate, CreateRoutePointTemplateDTO, UpdateRoutePointTemplateDTO } from '../models/RoutePointTemplate.js';

export class RoutePointTemplateRepository {
  private table = 'route_point_templates';

  private baseQuery() {
    return db(this.table)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .leftJoin('device_types', `${this.table}.deviceTypeId`, 'device_types.id')
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
        'device_types.name as deviceTypeName',
        'device_types.code as deviceTypeCode',
      );
  }

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ templates: RoutePointTemplate[]; total: number }> {
    const page   = params.page  ?? 1;
    const limit  = params.limit ?? 10;
    const offset = (page - 1) * limit;

    let countQ = db(this.table).whereNot('status', 'deleted');
    if (params.status) countQ = countQ.where('status', params.status);
    if (params.search) countQ = countQ.where((b: any) => {
      b.where('name', 'like', `%${params.search}%`).orWhere('code', 'like', `%${params.search}%`);
    });
    const [{ count }] = await countQ.count('id as count');

    let q = this.baseQuery();
    if (params.status) q = q.where(`${this.table}.status`, params.status);
    if (params.search) q = q.where((b: any) => {
      b.where(`${this.table}.name`, 'like', `%${params.search}%`).orWhere(`${this.table}.code`, 'like', `%${params.search}%`);
    });
    const templates = await q.orderBy(`${this.table}.id`, 'asc').limit(limit).offset(offset);
    return { templates, total: Number(count) };
  }

  async findByUuid(uuid: string): Promise<RoutePointTemplate | null> {
    return this.baseQuery().where(`${this.table}.uuid`, uuid).first() ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'RPT%')
      .orderByRaw("CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC")
      .select('code').first();
    return row?.code ?? null;
  }

  async create(data: CreateRoutePointTemplateDTO & { code: string; uuid: string }): Promise<RoutePointTemplate> {
    const now = nowDb();
    const insertData: any = {
      uuid: data.uuid,
      code: data.code,
      name: data.name,
      iconId:       data.iconId       ?? null,
      deviceTypeId: data.deviceTypeId ?? null,
      isDevice:                data.isDevice                ? 1 : 0,
      isPointNameRequired:     data.isPointNameRequired     ? 1 : 0,
      isPoleNumberRequired:    data.isPoleNumberRequired     ? 1 : 0,
      isLandmarkRequired:      data.isLandmarkRequired      ? 1 : 0,
      isAddressRequired:       data.isAddressRequired       ? 1 : 0,
      isPhotoRequired:         data.isPhotoRequired         ? 1 : 0,
      isHeightRequired:        data.isHeightRequired        ? 1 : 0,
      isOwnerNameRequired:     data.isOwnerNameRequired     ? 1 : 0,
      isContactNumberRequired: data.isContactNumberRequired ? 1 : 0,
      isElectricityAvailable:  data.isElectricityAvailable  ? 1 : 0,
      description: data.description ?? null,
      status: 'active',
      createdAt: now, updatedAt: now,
    };
    await db(this.table).insert(insertData);
    return this.findByUuid(data.uuid) as Promise<RoutePointTemplate>;
  }

  async update(uuid: string, data: UpdateRoutePointTemplateDTO): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    const bools = ['isDevice','isPointNameRequired','isPoleNumberRequired','isLandmarkRequired',
      'isAddressRequired','isPhotoRequired','isHeightRequired','isOwnerNameRequired',
      'isContactNumberRequired','isElectricityAvailable'];
    for (const k of bools) { if (k in payload) payload[k] = payload[k] ? 1 : 0; }
    const rows = await db(this.table).where({ uuid }).update(payload);
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
