import db from '../config/database.js';
import { Role, CreateRoleDTO, UpdateRoleDTO } from '../models/Role.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class RoleRepository {
  private readonly table = 'roles';

  async create(data: CreateRoleDTO): Promise<Role> {
    const uuid = generateUuidV7();
    const now = nowDb();
    
    const newRole: any = {
      uuid,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    await db(this.table).insert(newRole);
    
    const { id, ...roleWithoutInternalFields } = newRole;
    return roleWithoutInternalFields as Role;
  }

  async getAll(params: any = {}): Promise<{ roles: Role[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);

    let query = db(this.table).whereNull('deletedAt');
    let countQuery = db(this.table).whereNull('deletedAt');

    if (params.status) {
      query = query.where('status', params.status);
      countQuery = countQuery.where('status', params.status);
    }

    if (params.name) {
      query = query.where('name', 'like', `%${params.name}%`);
      countQuery = countQuery.where('name', 'like', `%${params.name}%`);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    query = query.orderBy('name', 'asc');

    const offset = (page - 1) * limit;
    const roles = limit === -1 ? await query : await query.offset(offset).limit(limit);

    const sanitizedRoles = roles.map((role: any) => {
      const { id, ...roleWithoutInternalFields } = role;
      return roleWithoutInternalFields as Role;
    });

    return { roles: sanitizedRoles, total };
  }

  async findByUuid(uuid: string): Promise<Role | null> {
    const role = await db(this.table).where('uuid', uuid).whereNull('deletedAt').first();
    if (!role) return null;
    const { id, ...roleWithoutInternalFields } = role;
    return roleWithoutInternalFields as Role;
  }

  async findByUuidIncludeDeleted(uuid: string): Promise<Role | null> {
    const role = await db(this.table).where('uuid', uuid).first();
    if (!role) return null;
    const { id, ...roleWithoutInternalFields } = role;
    return roleWithoutInternalFields as Role;
  }

  async findBySlug(slug: string): Promise<Role | null> {
    const role = await db(this.table).where('slug', slug).whereNull('deletedAt').first();
    if (!role) return null;
    const { id, ...roleWithoutInternalFields } = role;
    return roleWithoutInternalFields as Role;
  }

  async findBySlugIncludeDeleted(slug: string): Promise<Role | null> {
    const role = await db(this.table).where('slug', slug).first();
    if (!role) return null;
    const { id, ...roleWithoutInternalFields } = role;
    return roleWithoutInternalFields as Role;
  }

  async findManyByUuids(uuids: string[]): Promise<Role[]> {
    const roles = await db(this.table).whereIn('uuid', uuids).whereNull('deletedAt');
    return roles.map((role: any) => {
      const { id, ...roleWithoutInternalFields } = role;
      return roleWithoutInternalFields as Role;
    });
  }

  async findIdsByUuids(uuids: string[]): Promise<number[]> {
    const roles = await db(this.table).select('id').whereIn('uuid', uuids).whereNull('deletedAt');
    return roles.map((r: { id: number }) => r.id);
  }

  async update(uuid: string, data: UpdateRoleDTO): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      ...data,
      updatedAt: nowDb()
    });
    return result > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      deletedAt: nowDb(),
      status: 'inactive'
    });
    return result > 0;
  }

  async restore(uuid: string): Promise<boolean> {
    const result = await db(this.table).where('uuid', uuid).update({
      deletedAt: null,
      status: 'active',
      updatedAt: nowDb()
    });
    return result > 0;
  }
}
