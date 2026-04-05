import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { Tenant, CreateTenantDTO, UpdateTenantDTO } from '../models/Tenant.js';
import { nowDb } from '../utils/time.js';

const SAFE_COLUMNS = [
  'tenants.uuid',
  'tenants.email',
  'tenants.username',
  'tenants.name',
  'tenants.address',
  'tenants.status',
  'tenants.createdAt',
  'tenants.updatedAt',
  'tenants.deletedAt',
  'countries.uuid as countryUuid',
  'countries.name as countryName',
  'countries.code as countryCode',
  'countries.phoneCode as countryPhoneCode',
  'roles.uuid as roleUuid',
  'roles.name as roleName',
  'roles.slug as roleSlug',
];

function mapRow(row: any): Tenant {
  const {
    countryUuid, countryName, countryCode, countryPhoneCode,
    roleUuid, roleName, roleSlug,
    ...rest
  } = row;
  return {
    ...rest,
    country: countryUuid
      ? { uuid: countryUuid, name: countryName, code: countryCode, phoneCode: countryPhoneCode }
      : null,
    role: roleUuid
      ? { uuid: roleUuid, name: roleName, slug: roleSlug }
      : null,
  } as Tenant;
}

export class TenantRepository {
  private table = 'tenants';

  async getAll(params: any = {}): Promise<{ tenants: Tenant[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    let query = db(this.table)
      .leftJoin('countries', 'tenants.countryId', 'countries.id')
      .leftJoin('roles', 'tenants.roleId', 'roles.id')
      .select(SAFE_COLUMNS);
    let countQuery = db(this.table);

    const filterObj = params.filter || params.filters || {};
    const filters = {
      ...filterObj,
      ...(params.status && !filterObj.status ? { status: params.status } : {}),
      ...(params.name && !filterObj.name ? { name: params.name } : {}),
      ...(params.email && !filterObj.email ? { email: params.email } : {}),
      ...(params.username && !filterObj.username ? { username: params.username } : {}),
    };

    const statusVal = filters.status ? String(filters.status) : '';
    const validStatuses = ['active', 'blocked', 'suspended', 'deleted'];
    if (statusVal === 'all') {
      query = query.whereNot('tenants.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    } else if (statusVal && validStatuses.includes(statusVal)) {
      query = query.where('tenants.status', statusVal);
      countQuery = countQuery.where('status', statusVal);
    } else {
      query = query.whereNot('tenants.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    }

    if (filters.name) {
      query = query.where('tenants.name', 'like', `%${filters.name}%`);
      countQuery = countQuery.where('name', 'like', `%${filters.name}%`);
    }
    if (filters.email) {
      query = query.where('tenants.email', 'like', `%${filters.email}%`);
      countQuery = countQuery.where('email', 'like', `%${filters.email}%`);
    }
    if (filters.username) {
      query = query.where('tenants.username', 'like', `%${filters.username}%`);
      countQuery = countQuery.where('username', 'like', `%${filters.username}%`);
    }
    if (filters.createdAt && /^\d{4}-\d{2}-\d{2}$/.test(String(filters.createdAt))) {
      query = query.whereRaw('DATE(tenants.createdAt) = ?', [filters.createdAt]);
      countQuery = countQuery.whereRaw('DATE(createdAt) = ?', [filters.createdAt]);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    const allowedSortFields = ['uuid', 'email', 'username', 'name', 'status', 'createdAt', 'updatedAt'];
    if (params.sort) {
      if (typeof params.sort === 'string') {
        params.sort.split(',').forEach((s: string) => {
          const desc = s.trim().startsWith('-');
          const field = desc ? s.trim().substring(1) : s.trim();
          if (allowedSortFields.includes(field)) {
            query = query.orderBy(`tenants.${field}`, desc ? 'desc' : 'asc');
          }
        });
      } else if (typeof params.sort === 'object') {
        const field = params.sort.field || 'name';
        const order = params.sort.order || 'asc';
        if (allowedSortFields.includes(field)) {
          query = query.orderBy(`tenants.${field}`, order);
        }
      }
    } else {
      query = query.orderBy('tenants.name', 'asc');
    }

    if (limit !== -1) query = query.limit(limit).offset(offset);

    const rows = await query;
    return { tenants: rows.map(mapRow), total };
  }

  async findByUuid(uuid: string): Promise<Tenant | null> {
    const row = await db(this.table)
      .leftJoin('countries', 'tenants.countryId', 'countries.id')
      .leftJoin('roles', 'tenants.roleId', 'roles.id')
      .select(SAFE_COLUMNS)
      .where('tenants.uuid', uuid)
      .first();
    return row ? mapRow(row) : null;
  }

  async findInternalIdByUuid(uuid: string): Promise<number | null> {
    const row = await db(this.table).where('uuid', uuid).select('id').first();
    return row ? row.id : null;
  }

  async findByEmail(email: string): Promise<{ uuid: string } | null> {
    return db(this.table).where('email', email).select('uuid').first() ?? null;
  }

  async findByUsername(username: string): Promise<{ uuid: string } | null> {
    return db(this.table).where('username', username).select('uuid').first() ?? null;
  }

  async create(data: {
    email: string; username: string; name: string; address: string;
    password: string; countryId: number | null; roleId: number | null;
  }): Promise<Tenant> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      email: data.email,
      username: data.username,
      name: data.name,
      address: data.address,
      password: data.password,
      countryId: data.countryId,
      roleId: data.roleId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid) as Promise<Tenant>;
  }

  async update(uuid: string, data: Omit<UpdateTenantDTO, 'countryUuid' | 'roleUuid'> & {
    countryId?: number | null; roleId?: number | null;
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
