import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { Lco, CreateLcoDTO, UpdateLcoDTO } from '../models/Lco.js';
import { nowDb } from '../utils/time.js';

export class LcoRepository {
  private table = 'tenant_lcos';

  async getAll(tenantId: number, params: any = {}): Promise<{ lcos: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    let query = db(this.table)
      .leftJoin('countries', 'tenant_lcos.countryId', 'countries.id')
      .where('tenant_lcos.tenantId', tenantId)
      .whereNot('tenant_lcos.status', 'deleted')
      .select('tenant_lcos.*', 'countries.uuid as countryUuid');

    if (params.filter?.lcoName) {
      query = query.where('tenant_lcos.lcoName', 'like', `%${params.filter.lcoName}%`);
    }

    const countResult = await db(this.table)
      .where('tenantId', tenantId)
      .whereNot('status', 'deleted')
      .count('* as total').first();
    const total = Number(countResult?.total || 0);

    query = query.orderBy('tenant_lcos.createdAt', 'desc');
    if (limit !== -1) query = query.limit(limit).offset(offset);

    const lcos = await query;
    return { lcos, total };
  }

  async findByUuid(uuid: string, tenantId: number): Promise<any | null> {
    return db(this.table)
      .leftJoin('countries', 'tenant_lcos.countryId', 'countries.id')
      .where({ 'tenant_lcos.uuid': uuid, 'tenant_lcos.tenantId': tenantId })
      .whereNot('tenant_lcos.status', 'deleted')
      .select('tenant_lcos.*', 'countries.uuid as countryUuid')
      .first();
  }

  async findByCode(code: string, tenantBusinessId: number): Promise<Lco | null> {
    return db(this.table)
      .where({ code, tenantBusinessId })
      .first();
  }

  async getLastCodeForBusiness(tenantBusinessId: number): Promise<string | null> {
    const last = await db(this.table)
      .where('tenantBusinessId', tenantBusinessId)
      .orderBy('id', 'desc')
      .select('code')
      .first();
    return last?.code || null;
  }

  async findByPhone(phone: string): Promise<{ uuid: string } | null> {
    return db(this.table)
      .where('phone', String(phone))
      .whereNot('status', 'deleted')
      .select('uuid')
      .first() ?? null;
  }

  async create(data: CreateLcoDTO & { tenantId: number; tenantBusinessId: number; code: string }): Promise<Lco> {
    const uuid = uuidv4();
    const now = nowDb();
    const [id] = await db(this.table).insert({
      uuid,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    
    return { id, uuid, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString(), deletedAt: null } as Lco;
  }

  async update(uuid: string, tenantId: number, data: UpdateLcoDTO): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantId })
      .update({
        ...data,
        updatedAt: nowDb(),
      });
    return result > 0;
  }

  async delete(uuid: string, tenantId: number): Promise<boolean> {
    const result = await db(this.table)
      .where({ uuid, tenantId })
      .update({
        status: 'deleted',
        deletedAt: nowDb(),
        updatedAt: nowDb(),
      });
    return result > 0;
  }
}
