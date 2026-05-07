import { TenantDeviceCategoryRepository } from '../repositories/TenantDeviceCategoryRepository.js';
import { CreateDeviceCategoryDTO, UpdateDeviceCategoryDTO } from '../models/TenantDeviceCategory.js';

export class TenantDeviceCategoryService {
  constructor(private repo: TenantDeviceCategoryRepository) {}

  async getAll(tenantBusinessId: number, params: any) {
    return this.repo.getAll(tenantBusinessId, params);
  }

  async getOne(uuid: string, tenantBusinessId: number) {
    const dc = await this.repo.findByUuid(uuid, tenantBusinessId);
    if (!dc) {
      const e = new Error('Device category not found'); (e as any).status = 404; throw e;
    }
    return dc;
  }

  async create(tenantBusinessId: number, data: CreateDeviceCategoryDTO) {
    const dup = await this.repo.findByCode(data.code, tenantBusinessId);
    if (dup) {
      const e = new Error('A device category with this code already exists in your business');
      (e as any).status = 409; throw e;
    }
    return this.repo.create({ ...data, tenantBusinessId });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceCategoryDTO) {
    const current = await this.getOne(uuid, tenantBusinessId);

    if (data.code && data.code !== current.code) {
      const dup = await this.repo.findByCode(data.code, tenantBusinessId, uuid);
      if (dup) {
        const e = new Error('A device category with this code already exists in your business');
        (e as any).status = 409; throw e;
      }
    }

    await this.repo.update(uuid, tenantBusinessId, data);
    return this.getOne(uuid, tenantBusinessId);
  }

  async setInactive(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.updateStatus(uuid, tenantBusinessId, 'inactive');
    if (!ok) { const e = new Error('Deactivate failed'); (e as any).status = 500; throw e; }
    return this.getOne(uuid, tenantBusinessId);
  }

  async setActive(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.updateStatus(uuid, tenantBusinessId, 'active');
    if (!ok) { const e = new Error('Activate failed'); (e as any).status = 500; throw e; }
    return this.getOne(uuid, tenantBusinessId);
  }

  async delete(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.delete(uuid, tenantBusinessId);
    if (!ok) { const e = new Error('Delete failed'); (e as any).status = 500; throw e; }
  }
}
