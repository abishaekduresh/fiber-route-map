import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { Country, CreateCountryDTO, UpdateCountryDTO } from '../models/Country.js';
import { nowDb } from '../utils/time.js';

export class CountryRepository {
  private table = 'countries';

  async getAll(params: any = {}): Promise<{ countries: Country[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    let query = db(this.table);
    let countQuery = db(this.table);

    // Normalize: support both filter[...] and filters[...] syntax
    const filterObj = params.filter || params.filters || {};
    const filters = {
      ...filterObj,
      ...(params.status && !filterObj.status ? { status: params.status } : {}),
      ...(params.name && !filterObj.name ? { name: params.name } : {}),
      ...(params.code && !filterObj.code ? { code: params.code } : {}),
      ...(params.phone_code && !filterObj.phone_code ? { phone_code: params.phone_code } : {}),
    };

    // Apply status filter
    const statusVal = filters.status ? String(filters.status) : '';
    if (statusVal === 'all') {
      // Include all (including deleted?) usually all except deleted
      query = query.whereNot('status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    } else if (statusVal && ['active', 'blocked', 'deleted'].includes(statusVal)) {
      query = query.where('status', statusVal);
      countQuery = countQuery.where('status', statusVal);
    } else {
      // Default: exclude deleted
      query = query.whereNot('status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    }

    // Partial matches
    if (filters.name) {
      query = query.where('name', 'like', `%${filters.name}%`);
      countQuery = countQuery.where('name', 'like', `%${filters.name}%`);
    }
    if (filters.code) {
      query = query.where('code', 'like', `%${filters.code}%`);
      countQuery = countQuery.where('code', 'like', `%${filters.code}%`);
    }
    if (filters.phone_code) {
      query = query.where('phone_code', 'like', `%${filters.phone_code}%`);
      countQuery = countQuery.where('phone_code', 'like', `%${filters.phone_code}%`);
    }

    // Date filtering (YYYY-MM-DD)
    if (filters.createdAt && /^\d{4}-\d{2}-\d{2}$/.test(String(filters.createdAt))) {
      query = query.whereRaw('DATE(createdAt) = ?', [filters.createdAt]);
      countQuery = countQuery.whereRaw('DATE(createdAt) = ?', [filters.createdAt]);
    }

    // Count total
    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    // Sorting
    const allowedSortFields = ['uuid', 'name', 'code', 'phone_code', 'status', 'createdAt', 'updatedAt'];
    if (params.sort) {
      if (typeof params.sort === 'string') {
        const sortFields = String(params.sort).split(',');
        sortFields.forEach(sortField => {
          const desc = sortField.trim().startsWith('-');
          const field = desc ? sortField.trim().substring(1) : sortField.trim();
          if (allowedSortFields.includes(field)) {
            query = query.orderBy(field, desc ? 'desc' : 'asc');
          }
        });
      } else if (typeof params.sort === 'object') {
        const field = params.sort.field || 'name';
        const order = params.sort.order || 'asc';
        if (allowedSortFields.includes(field)) {
          query = query.orderBy(field, order);
        }
      }
    } else {
      query = query.orderBy('name', 'asc');
    }

    // Pagination
    if (limit !== -1) {
      query = query.limit(limit).offset(offset);
    }

    const countries = await query.select('*');
    return {
      countries: countries.map((c: any) => {
        const { id, ...rest } = c;
        return rest as Country;
      }),
      total
    };
  }

  async findByUuid(uuid: string): Promise<Country | null> {
    const country = await db(this.table).where('uuid', uuid).first();
    if (!country) return null;
    const { id, ...rest } = country;
    return rest as Country;
  }

  async findByCode(code: string): Promise<Country | null> {
    const country = await db(this.table).where('code', code).first();
    if (!country) return null;
    const { id, ...rest } = country;
    return rest as Country;
  }

  async create(data: CreateCountryDTO): Promise<Country> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      ...data,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid) as Promise<Country>;
  }

  async update(uuid: string, data: UpdateCountryDTO): Promise<boolean> {
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
