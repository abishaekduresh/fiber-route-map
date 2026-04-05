import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { TenantBusiness, CreateTenantBusinessDTO, UpdateTenantBusinessDTO } from '../models/TenantBusiness.js';
import { nowDb } from '../utils/time.js';

const SAFE_COLUMNS = [
  'tenant_business.uuid',
  'tenant_business.name',
  'tenant_business.address',
  'tenant_business.email',
  'tenant_business.phone',
  'tenant_business.type',
  'tenant_business.status',
  'tenant_business.createdAt',
  'tenant_business.updatedAt',
  'tenant_business.deletedAt',
  'countries.uuid as countryUuid',
  'countries.name as countryName',
  'countries.code as countryCode',
  'countries.phoneCode as countryPhoneCode',
];

function mapRow(row: any): TenantBusiness {
  const { countryUuid, countryName, countryCode, countryPhoneCode, phone, ...rest } = row;
  return {
    ...rest,
    phone: String(phone ?? ''),
    country: countryUuid
      ? { uuid: countryUuid, name: countryName, code: countryCode, phoneCode: countryPhoneCode }
      : null,
  } as TenantBusiness;
}

export class TenantBusinessRepository {
  private table = 'tenant_business';

  async getAll(params: any = {}): Promise<{ businesses: TenantBusiness[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    let query = db(this.table)
      .leftJoin('countries', 'tenant_business.countryId', 'countries.id')
      .select(SAFE_COLUMNS);
    let countQuery = db(this.table);

    const filterObj = params.filter || params.filters || {};
    const filters = {
      ...filterObj,
      ...(params.status && !filterObj.status ? { status: params.status } : {}),
      ...(params.name && !filterObj.name ? { name: params.name } : {}),
      ...(params.email && !filterObj.email ? { email: params.email } : {}),
      ...(params.type && !filterObj.type ? { type: params.type } : {}),
    };

    const statusVal = filters.status ? String(filters.status) : '';
    const validStatuses = ['active', 'blocked', 'suspended', 'deleted'];
    if (statusVal === 'all') {
      query = query.whereNot('tenant_business.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    } else if (statusVal && validStatuses.includes(statusVal)) {
      query = query.where('tenant_business.status', statusVal);
      countQuery = countQuery.where('status', statusVal);
    } else {
      query = query.whereNot('tenant_business.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    }

    if (filters.name) {
      query = query.where('tenant_business.name', 'like', `%${filters.name}%`);
      countQuery = countQuery.where('name', 'like', `%${filters.name}%`);
    }
    if (filters.email) {
      query = query.where('tenant_business.email', 'like', `%${filters.email}%`);
      countQuery = countQuery.where('email', 'like', `%${filters.email}%`);
    }
    if (filters.type && ['operator', 'distributor'].includes(String(filters.type))) {
      query = query.where('tenant_business.type', filters.type);
      countQuery = countQuery.where('type', filters.type);
    }
    if (filters.createdAt && /^\d{4}-\d{2}-\d{2}$/.test(String(filters.createdAt))) {
      query = query.whereRaw('DATE(tenant_business.createdAt) = ?', [filters.createdAt]);
      countQuery = countQuery.whereRaw('DATE(createdAt) = ?', [filters.createdAt]);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    const allowedSortFields = ['uuid', 'name', 'email', 'type', 'status', 'createdAt', 'updatedAt'];
    if (params.sort) {
      if (typeof params.sort === 'string') {
        params.sort.split(',').forEach((s: string) => {
          const desc = s.trim().startsWith('-');
          const field = desc ? s.trim().substring(1) : s.trim();
          if (allowedSortFields.includes(field)) {
            query = query.orderBy(`tenant_business.${field}`, desc ? 'desc' : 'asc');
          }
        });
      } else if (typeof params.sort === 'object') {
        const field = params.sort.field || 'name';
        const order = params.sort.order || 'asc';
        if (allowedSortFields.includes(field)) {
          query = query.orderBy(`tenant_business.${field}`, order);
        }
      }
    } else {
      query = query.orderBy('tenant_business.name', 'asc');
    }

    if (limit !== -1) query = query.limit(limit).offset(offset);

    const rows = await query;
    return { businesses: rows.map(mapRow), total };
  }

  async findByUuid(uuid: string): Promise<TenantBusiness | null> {
    const row = await db(this.table)
      .leftJoin('countries', 'tenant_business.countryId', 'countries.id')
      .select(SAFE_COLUMNS)
      .where('tenant_business.uuid', uuid)
      .first();
    return row ? mapRow(row) : null;
  }

  async findByEmail(email: string): Promise<{ uuid: string } | null> {
    return db(this.table).where('email', email).select('uuid').first() ?? null;
  }

  async create(data: {
    name: string; address: string; email: string; phone: string;
    type: string; countryId: number | null;
  }): Promise<TenantBusiness> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      name: data.name,
      address: data.address,
      email: data.email,
      phone: data.phone,
      type: data.type,
      countryId: data.countryId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid) as Promise<TenantBusiness>;
  }

  async update(uuid: string, data: Omit<UpdateTenantBusinessDTO, 'countryUuid'> & {
    countryId?: number | null;
  }): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      ...data,
      updatedAt: nowDb(),
    });
    return result > 0;
  }

  async updateStatus(uuid: string, status: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      status,
      updatedAt: nowDb(),
    });
    return result > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      status: 'deleted',
      deletedAt: nowDb(),
      updatedAt: nowDb(),
    });
    return result > 0;
  }
}
