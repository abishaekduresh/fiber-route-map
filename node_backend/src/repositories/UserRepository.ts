import db from '../config/database.js';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class UserRepository {
  private readonly table = 'users';

  async create(data: CreateUserDTO): Promise<User> {
    const uuid = generateUuidV7();
    const now = nowDb();
    
    const newUser: any = {
      uuid,
      email: data.email,
      username: data.username,
      name: data.name,
      phone: String(data.phone),
      password: data.password,
      status: 'active',
      countryId: (data as any).countryId,
      createdAt: now,
      updatedAt: now,
    };

    await db(this.table).insert(newUser);
    
    return this.findByUuid(uuid) as Promise<User>;
  }

  async getAll(params: any = {}): Promise<{ users: User[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);

    let query = db(this.table)
      .leftJoin('countries', 'users.countryId', 'countries.id')
      .select(
        'users.*', 
        'countries.uuid as countryUuid',
        'countries.name as countryName',
        'countries.code as countryCode',
        'countries.phoneCode as countryPhoneCode'
      );
    let countQuery = db(this.table);

    const filterObj = params.filter || params.filters || {};
    const filters = {
      ...filterObj,
      ...(params.status && !filterObj.status ? { status: params.status } : {}),
      ...(params.name && !filterObj.name ? { name: params.name } : {}),
      ...(params.email && !filterObj.email ? { email: params.email } : {}),
      ...(params.username && !filterObj.username ? { username: params.username } : {}),
      ...(params.phone && !filterObj.phone ? { phone: params.phone } : {}),
    };

    const statusVal = filters.status ? String(filters.status) : '';
    if (statusVal === 'all') {
      query = query.whereNot('users.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    } else if (statusVal && ['active', 'blocked', 'deleted'].includes(statusVal)) {
      query = query.where('users.status', statusVal);
      countQuery = countQuery.where('status', statusVal);
    } else {
      query = query.whereNot('users.status', 'deleted');
      countQuery = countQuery.whereNot('status', 'deleted');
    }

    if (filters.name) {
      query = query.where('users.name', 'like', `%${filters.name}%`);
      countQuery = countQuery.where('name', 'like', `%${filters.name}%`);
    }
    if (filters.email) {
      query = query.where('email', 'like', `%${filters.email}%`);
      countQuery = countQuery.where('email', 'like', `%${filters.email}%`);
    }
    if (filters.username) {
      query = query.where('username', 'like', `%${filters.username}%`);
      countQuery = countQuery.where('username', 'like', `%${filters.username}%`);
    }
    if (filters.phone) {
      query = query.where('phone', 'like', `%${filters.phone}%`);
      countQuery = countQuery.where('phone', 'like', `%${filters.phone}%`);
    }

    if (filters.createdAt && typeof filters.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(filters.createdAt)) {
      query = query.whereRaw('DATE(users.createdAt) = ?', [filters.createdAt]);
      countQuery = countQuery.whereRaw('DATE(createdAt) = ?', [filters.createdAt]);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    const allowedSortFields = ['uuid', 'email', 'username', 'name', 'phone', 'status', 'createdAt', 'updatedAt'];
    
    if (params.sort) {
      if (typeof params.sort === 'string') {
        const sortFields = String(params.sort).split(',');
        sortFields.forEach(s => {
          const desc = s.trim().startsWith('-');
          const field = desc ? s.trim().substring(1) : s.trim();
          if (allowedSortFields.includes(field)) {
            const qualifiedField = ['uuid', 'name', 'status', 'createdAt', 'updatedAt'].includes(field) 
              ? `users.${field}` 
              : field;
            query = query.orderBy(qualifiedField, desc ? 'desc' : 'asc');
          }
        });
      } else if (typeof params.sort === 'object') {
        const sortObj = params.sort as any;
        const field = sortObj.field || 'createdAt';
        const order = String(sortObj.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
        if (allowedSortFields.includes(field)) {
          const qualifiedField = ['uuid', 'name', 'status', 'createdAt', 'updatedAt'].includes(field) 
            ? `users.${field}` 
            : field;
          query = query.orderBy(qualifiedField, order);
        }
      }
    } else {
      query = query.orderBy('users.createdAt', 'desc');
    }

    const offset = (page - 1) * limit;
    const users = limit === -1 ? await query : await query.offset(offset).limit(limit);

    const sanitizedUsers = users.map((user: any) => {
      const { id, countryId, password, countryName, countryCode, countryPhoneCode, countryUuid, ...userWithoutInternalFields } = user;
      return {
        ...userWithoutInternalFields,
        country: countryUuid ? {
          id: countryUuid,
          name: countryName,
          code: countryCode,
          phoneCode: countryPhoneCode
        } : null
      } as User;
    });

    return { users: sanitizedUsers, total };
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const user = await db(this.table)
      .leftJoin('countries', 'users.countryId', 'countries.id')
      .select(
        'users.*', 
        'countries.uuid as countryUuid',
        'countries.name as countryName',
        'countries.code as countryCode',
        'countries.phoneCode as countryPhoneCode'
      )
      .where('users.uuid', uuid)
      .first();
    if (!user) return null;
    const { id, countryId, password, ...userWithoutInternalFields } = user as any;
    return {
      ...userWithoutInternalFields,
      country: user.countryUuid ? {
        id: user.countryUuid,
        name: user.countryName,
        code: user.countryCode,
        phoneCode: user.countryPhoneCode
      } : null
    } as any;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await db(this.table)
      .leftJoin('countries', 'users.countryId', 'countries.id')
      .select(
        'users.*', 
        'countries.uuid as countryUuid',
        'countries.name as countryName',
        'countries.code as countryCode',
        'countries.phoneCode as countryPhoneCode'
      )
      .where('email', email)
      .first();
    if (!user) return null;
    const { id, countryId, password, ...userWithoutInternalFields } = user as any;
    return {
      ...userWithoutInternalFields,
      country: user.countryUuid ? {
        id: user.countryUuid,
        name: user.countryName,
        code: user.countryCode,
        phoneCode: user.countryPhoneCode
      } : null
    } as any;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await db(this.table)
      .leftJoin('countries', 'users.countryId', 'countries.id')
      .select(
        'users.*', 
        'countries.uuid as countryUuid',
        'countries.name as countryName',
        'countries.code as countryCode',
        'countries.phoneCode as countryPhoneCode'
      )
      .where('username', username)
      .first();
    if (!user) return null;
    const { id, countryId, password, ...userWithoutInternalFields } = user as any;
    return {
      ...userWithoutInternalFields,
      country: user.countryUuid ? {
        id: user.countryUuid,
        name: user.countryName,
        code: user.countryCode,
        phoneCode: user.countryPhoneCode
      } : null
    } as any;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await db(this.table)
      .leftJoin('countries', 'users.countryId', 'countries.id')
      .select(
        'users.*', 
        'countries.uuid as countryUuid',
        'countries.name as countryName',
        'countries.code as countryCode',
        'countries.phoneCode as countryPhoneCode'
      )
      .where('phone', String(phone))
      .first();
    if (!user) return null;
    const { id, countryId, password, ...userWithoutInternalFields } = user as any;
    return {
      ...userWithoutInternalFields,
      country: user.countryUuid ? {
        id: user.countryUuid,
        name: user.countryName,
        code: user.countryCode,
        phoneCode: user.countryPhoneCode
      } : null
    } as any;
  }

  async update(uuid: string, data: UpdateUserDTO): Promise<boolean> {
    const { countryUuid, ...rest } = data as any;
    const updateData: any = { ...rest, updatedAt: nowDb() };
    if (updateData.phone) updateData.phone = String(updateData.phone);
    const result = await db(this.table).where('uuid', uuid).update(updateData);
    return result > 0;
  }

  async updateStatus(uuid: string, status: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      status,
      updatedAt: nowDb()
    });
    return result > 0;
  }

  async updatePassword(uuid: string, password: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      password,
      updatedAt: nowDb()
    });
    return result > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const now = nowDb();
    const result = await db(this.table).where('uuid', uuid).update({
      status: 'deleted',
      updatedAt: now,
      deletedAt: now
    });
    return result > 0;
  }
}
