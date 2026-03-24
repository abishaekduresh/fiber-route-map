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

  async getAll(filters: { status?: string; name?: string; email?: string; phone?: string } = {}): Promise<User[]> {
    let query = db(this.table).select('*');

    if (filters.status === 'all') {
      // No status filter
    } else if (filters.status && ['active', 'blocked', 'deleted'].includes(filters.status)) {
      query = query.where('status', filters.status);
    } else {
      query = query.where('status', 'active');
    }

    if (filters.name) {
      query = query.where('name', 'like', `%${filters.name}%`);
    }

    if (filters.email) {
      query = query.where('email', 'like', `%${filters.email}%`);
    }

    if (filters.phone) {
      query = query.where('phone', 'like', `%${filters.phone}%`);
    }

    const users = await query.orderBy('createdAt', 'desc');
    
    return users.map((user: any) => {
      const { id, password, ...userWithoutInternalFields } = user;
      return userWithoutInternalFields as User;
    });
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
