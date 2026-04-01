import { PermissionRepository } from '../repositories/PermissionRepository.js';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../models/Permission.js';

export class PermissionService {
  constructor(private readonly repository: PermissionRepository) {}

  async getAllPermissions(params: any): Promise<{ permissions: Permission[]; total: number }> {
    return this.repository.getAll(params);
  }

  async getPermissionByUuid(uuid: string): Promise<Permission> {
    const permission = await this.repository.findByUuid(uuid);
    if (!permission) {
      const error = new Error('Permission not found');
      (error as any).status = 404;
      throw error;
    }
    return permission;
  }

  async createPermission(data: CreatePermissionDTO): Promise<Permission> {
    // Check if slug already exists
    const existing = await this.repository.findBySlug(data.slug);
    if (existing) {
      const error = new Error(`Permission with slug "${data.slug}" already exists`);
      (error as any).status = 409;
      throw error;
    }
    return this.repository.create(data);
  }

  async updatePermission(uuid: string, data: UpdatePermissionDTO): Promise<Permission> {
    const success = await this.repository.update(uuid, data);
    if (!success) {
      const error = new Error('Permission not found');
      (error as any).status = 404;
      throw error;
    }
    return this.getPermissionByUuid(uuid);
  }

  async deletePermission(uuid: string): Promise<void> {
    const success = await this.repository.delete(uuid);
    if (!success) {
      const error = new Error('Permission not found');
      (error as any).status = 404;
      throw error;
    }
  }
}
