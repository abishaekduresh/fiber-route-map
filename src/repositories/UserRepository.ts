import db from '../config/database.js';
import { User, UpdateUserDTO } from '../models/User.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class UserRepository {
  private readonly table = 'users';

  async create(data: { email: string; name: string; phone: string | number; password: string }): Promise<User> {
    const uuid = generateUuidV7();
    const now = nowDb();
    
    const newUser: User = {
      uuid,
      email: data.email,
      name: data.name,
      phone: data.phone,
      password: data.password,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await db(this.table).insert(newUser);
    
    // Cast to any to safely destructure internal fields (id, password) not in User interface
    const { id, password, ...userWithoutInternalFields } = newUser as any;
    return userWithoutInternalFields as User;
  }

  async getAll(params: any = {}): Promise<{ users: User[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    let query = db(this.table);
    let countQuery = db(this.table);

    // Unify Direct filters and filter/filters object
    const filterObj = params.filter || params.filters || {};
    const filters = {
      ...filterObj,
      ...(params.status && !filterObj.status ? { status: params.status } : {}),
      ...(params.name && !filterObj.name ? { name: params.name } : {}),
      ...(params.email && !filterObj.email ? { email: params.email } : {}),
      ...(params.phone && !filterObj.phone ? { phone: params.phone } : {}),
    };

    // Apply Filters
    const statusVal = filters.status ? String(filters.status) : '';
    if (statusVal === 'all') {
      // No status filter
    } else if (statusVal && ['active', 'blocked', 'deleted'].includes(statusVal)) {
      query = query.where('status', statusVal);
      countQuery = countQuery.where('status', statusVal);
    } else if (!statusVal) {
      query = query.where('status', 'active');
      countQuery = countQuery.where('status', 'active');
    }

    ['name', 'email', 'phone'].forEach(field => {
      if (filters[field] && !['status'].includes(field)) {
        query = query.where(field, 'like', `%${String(filters[field])}%`);
        countQuery = countQuery.where(field, 'like', `%${String(filters[field])}%`);
      }
    });

    // Handle other arbitrary filters
    Object.entries(filters).forEach(([field, value]) => {
      if (!['status', 'name', 'email', 'phone'].includes(field)) {
        if (field === 'createdAt' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          // Handle YYYY-MM-DD date filter
          query = query.whereRaw('DATE(createdAt) = ?', [value]);
          countQuery = countQuery.whereRaw('DATE(createdAt) = ?', [value]);
        } else if (value !== undefined && value !== null && value !== '') {
          query = query.where(field, value);
          countQuery = countQuery.where(field, value);
        }
      }
    });

    // Get total count
    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    // Apply Sorting
    const allowedSortFields = ['uuid', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'];
    
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
        // Handle sort[field]=... or sort[order]=...
        const field = params.sort.field || 'createdAt';
        const order = params.sort.order || 'desc';
        
        if (allowedSortFields.includes(field)) {
          query = query.orderBy(field, order);
        }
      }
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // Get paginated results
    if (limit !== -1) {
      query = query.limit(limit).offset(offset);
    }
    
    const users = await query.select('*');
    
    const sanitizedUsers = users.map((user: any) => {
      const { id, password, ...userWithoutInternalFields } = user;
      return userWithoutInternalFields as User;
    });

    return { users: sanitizedUsers, total };
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const user = await db(this.table).where('uuid', uuid).first();
    if (!user) return null;
    
    const { id, password, ...userWithoutInternalFields } = user as any;
    return userWithoutInternalFields as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await db(this.table).where('email', email).first();
    if (!user) return null;
    
    const { id, password, ...userWithoutInternalFields } = user as any;
    return userWithoutInternalFields as User;
  }

  async findByPhone(phone: string | number): Promise<User | null> {
    const user = await db(this.table).where('phone', phone).first();
    if (!user) return null;
    
    const { id, password, ...userWithoutInternalFields } = user as any;
    return userWithoutInternalFields as User;
  }

  async update(uuid: string, data: UpdateUserDTO): Promise<boolean> {
    const now = nowDb();
    const result = await db(this.table)
      .where('uuid', uuid)
      .update({
        ...data,
        updatedAt: now,
      });
    return result > 0;
  }

  async updateStatus(uuid: string, status: string): Promise<boolean> {
    const now = nowDb();
    const result = await db(this.table)
      .where('uuid', uuid)
      .update({
        status,
        updatedAt: now,
      });
    return result > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const now = nowDb();
    const result = await db(this.table)
      .where('uuid', uuid)
      .update({
        status: 'deleted',
        updatedAt: now,
      });
    return result > 0;
  }
}
