import { TenantDeviceTypeRepository } from '../repositories/TenantDeviceTypeRepository.js';
import { CreateDeviceTypeDTO, UpdateDeviceTypeDTO } from '../models/TenantDeviceType.js';

export class TenantDeviceTypeService {
  constructor(private repo: TenantDeviceTypeRepository) {}

  private async generateCode(tenantBusinessId: number): Promise<string> {
    const lastCode = await this.repo.getLastCode(tenantBusinessId);
    let nextNum = 1;
    if (lastCode && lastCode.startsWith('TDT')) {
      const n = parseInt(lastCode.substring(3), 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    return `TDT${String(nextNum).padStart(2, '0')}`;
  }

  async getAll(tenantBusinessId: number, params: any) {
    return this.repo.getAll(tenantBusinessId, params);
  }

  async getOne(uuid: string, tenantBusinessId: number) {
    const dt = await this.repo.findByUuid(uuid, tenantBusinessId);
    if (!dt) {
      const e = new Error('Device type not found'); (e as any).status = 404; throw e;
    }
    return dt;
  }

  async create(tenantBusinessId: number, data: CreateDeviceTypeDTO) {
    const code = await this.generateCode(tenantBusinessId);
    return this.repo.create({ ...data, tenantBusinessId, code });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceTypeDTO) {
    await this.getOne(uuid, tenantBusinessId);
    await this.repo.update(uuid, tenantBusinessId, data);
    return this.getOne(uuid, tenantBusinessId);
  }

  async delete(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.delete(uuid, tenantBusinessId);
    if (!ok) { const e = new Error('Delete failed'); (e as any).status = 500; throw e; }
  }
}
