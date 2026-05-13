import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { Icon, CreateIconDTO, UpdateIconDTO } from '../models/Icon.js';
import { nowDb } from '../utils/time.js';

export class IconRepository {
  private table = 'icons';

  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<{ icons: Icon[]; total: number }> {
    const { page = 1, limit = 10, search, status, type } = params;

    const base = db(this.table).whereNot('status', 'deleted');

    if (search) {
      base.where((qb: any) => {
        qb.where('name', 'like', `%${search}%`).orWhere('code', 'like', `%${search}%`);
      });
    }
    if (status) base.where('status', status);
    if (type)   base.where('type', type);

    const total: number = await base.clone().count('id as count').first().then((r: any) => Number(r.count));

    let icons: Icon[];
    if (limit === -1) {
      icons = await base.clone().orderBy('createdAt', 'desc');
    } else {
      const offset = (page - 1) * limit;
      icons = await base.clone().orderBy('createdAt', 'desc').limit(limit).offset(offset);
    }

    return { icons, total };
  }

  async findByUuid(uuid: string): Promise<Icon | null> {
    return (await db(this.table).where({ uuid }).whereNot('status', 'deleted').first()) ?? null;
  }

  async findByCode(code: string): Promise<{ uuid: string } | null> {
    return (await db(this.table).where({ code }).whereNot('status', 'deleted').select('uuid').first()) ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'ICO%')
      .orderByRaw("CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC")
      .select('code')
      .first();
    return row?.code ?? null;
  }

  async create(data: CreateIconDTO & { code: string }): Promise<Icon> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      code: data.code,
      name: data.name,
      type: data.type,
      iconType: data.iconType,
      svgTemplate: data.svgTemplate ?? null,
      iconUrl: data.iconUrl ?? null,
      width: data.width,
      height: data.height,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return db(this.table).where({ uuid }).first();
  }

  async update(uuid: string, data: UpdateIconDTO): Promise<boolean> {
    const rows = await db(this.table)
      .where({ uuid })
      .whereNot('status', 'deleted')
      .update({ ...data, updatedAt: nowDb() });
    return rows > 0;
  }

  async updateStatus(uuid: string, status: string): Promise<boolean> {
    const rows = await db(this.table)
      .where({ uuid })
      .whereNot('status', 'deleted')
      .update({ status, updatedAt: nowDb() });
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table)
      .where({ uuid })
      .whereNot('status', 'deleted')
      .update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
