import { TenantDeviceCategoryRepository } from '../repositories/TenantDeviceCategoryRepository.js';
import { CreateDeviceCategoryDTO, UpdateDeviceCategoryDTO } from '../models/TenantDeviceCategory.js';

export class TenantDeviceCategoryService {
  constructor(private repo: TenantDeviceCategoryRepository) {}

  private async generateCode(tenantBusinessId: number): Promise<string> {
    const lastCode = await this.repo.getLastCode(tenantBusinessId);
    let nextNum = 1;
    if (lastCode && lastCode.startsWith('TDC')) {
      const n = parseInt(lastCode.substring(3), 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    return `TDC${String(nextNum).padStart(2, '0')}`;
  }

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
    const code = await this.generateCode(tenantBusinessId);
    return this.repo.create({ ...data, tenantBusinessId, code });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceCategoryDTO) {
    await this.getOne(uuid, tenantBusinessId);
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
