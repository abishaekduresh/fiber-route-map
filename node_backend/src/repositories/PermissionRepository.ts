import db from '../config/database.js';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../models/Permission.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class PermissionRepository {
  private readonly table = 'permissions';

  async create(data: CreatePermissionDTO): Promise<Permission> {
    const uuid = generateUuidV7();
    const now = nowDb();
    
    const newPermission: any = {
      uuid,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };

    await db(this.table).insert(newPermission);
    
    return this.findByUuid(uuid) as Promise<Permission>;
  }

  async getAll(params: any = {}): Promise<{ permissions: Permission[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);

    let query = db(this.table);
    let countQuery = db(this.table);

    if (params.name) {
      query = query.where('name', 'like', `%${params.name}%`);
      countQuery = countQuery.where('name', 'like', `%${params.name}%`);
    }

    if (params.slug) {
      query = query.where('slug', 'like', `%${params.slug}%`);
      countQuery = countQuery.where('slug', 'like', `%${params.slug}%`);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    // Apply sorting
    if (params.sort) {
      if (typeof params.sort === 'string') {
        const sortFields = params.sort.split(',');
        sortFields.forEach((s: string) => {
          const desc = s.trim().startsWith('-');
          const field = desc ? s.trim().substring(1) : s.trim();
          query = query.orderBy(field, desc ? 'desc' : 'asc');
        });
      } else if (typeof params.sort === 'object') {
        const field = params.sort.field || 'slug';
        const order = params.sort.order || 'asc';
        query = query.orderBy(field, order);
      }
    } else {
      query = query.orderBy('slug', 'asc');
    }

    if (limit !== -1) {
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);
    }

    const permissions = await query;

    const sanitizedPermissions = permissions.map((perm: any) => {
      const { id, ...permWithoutInternalFields } = perm;
      return permWithoutInternalFields as Permission;
    });

    return { permissions: sanitizedPermissions, total };
  }

  async findByUuid(uuid: string): Promise<Permission | null> {
    const perm = await db(this.table).where('uuid', uuid).first();
    if (!perm) return null;
    const { id, ...permWithoutInternalFields } = perm;
    return permWithoutInternalFields as Permission;
  }

  async findBySlug(slug: string): Promise<Permission | null> {
    const perm = await db(this.table).where('slug', slug).first();
    if (!perm) return null;
    const { id, ...permWithoutInternalFields } = perm;
    return permWithoutInternalFields as Permission;
  }

  async findIdsByUuids(uuids: string[]): Promise<number[]> {
    const perms = await db(this.table).select('id').whereIn('uuid', uuids);
    return perms.map((p: { id: number }) => p.id);
  }

  async update(uuid: string, data: UpdatePermissionDTO): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      ...data,
      updatedAt: nowDb()
    });
    return result > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).del();
    return result > 0;
  }
}
