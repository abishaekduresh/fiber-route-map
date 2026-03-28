import { RoleRepository } from '../repositories/RoleRepository.js';
import { PermissionRepository } from '../repositories/PermissionRepository.js';
import { CreateRoleDTO, UpdateRoleDTO, Role } from '../models/Role.js';

export class RoleService {
  constructor(
    private readonly repo: RoleRepository,
    private readonly permissionRepo: PermissionRepository
  ) {}

  async createRole(data: CreateRoleDTO): Promise<Role> {
    // Check if slug is unique (including deleted roles due to DB constraint)
    const existing = await this.repo.findBySlugIncludeDeleted(data.slug);
    if (existing) {
      const error = new Error('Role with this slug already exists');
      (error as any).status = 400;
      throw error;
    }
    return this.repo.create(data);
  }

  async getAllRoles(params: any) {
    return this.repo.getAll(params);
  }

  async getRoleByUuid(uuid: string): Promise<Role> {
    const role = await this.repo.findByUuid(uuid);
    if (!role) {
      const error = new Error('Role not found');
      (error as any).status = 404;
      throw error;
    }
    return role;
  }

  async updateRole(uuid: string, data: UpdateRoleDTO): Promise<Role> {
    const role = await this.getRoleByUuid(uuid);
    
    if (data.slug && data.slug !== role.slug) {
      const existing = await this.repo.findBySlugIncludeDeleted(data.slug);
      if (existing) {
        const error = new Error('Role with this slug already exists');
        (error as any).status = 400;
        throw error;
      }
    }

    const updated = await this.repo.update(uuid, data);
    if (!updated) {
      throw new Error('Failed to update role');
    }
    return this.getRoleByUuid(uuid);
  }

  async deleteRole(uuid: string): Promise<void> {
    await this.getRoleByUuid(uuid);
    const deleted = await this.repo.delete(uuid);
    if (!deleted) {
      throw new Error('Failed to delete role');
    }
  }

  async restoreRole(uuid: string): Promise<Role> {
    const role = await this.repo.findByUuidIncludeDeleted(uuid);
    if (!role) {
      const error = new Error('Role not found');
      (error as any).status = 404;
      throw error;
    }

    const restored = await this.repo.restore(uuid);
    if (!restored) {
      throw new Error('Failed to restore role');
    }

    const updatedRole = await this.repo.findByUuid(uuid);
    return updatedRole!;
  }

  async syncPermissions(roleUuid: string, permissionUuids: string[]): Promise<Role> {
    const roleId = await this.repo.getInternalIdByUuid(roleUuid);
    if (!roleId) {
      const error = new Error('Role not found');
      (error as any).status = 404;
      throw error;
    }

    const permissionIds = await this.permissionRepo.findIdsByUuids(permissionUuids);
    await this.repo.syncPermissions(roleId, permissionIds);

    return this.getRoleByUuid(roleUuid);
  }
}
