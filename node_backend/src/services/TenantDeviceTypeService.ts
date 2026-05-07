import { TenantDeviceTypeRepository } from '../repositories/TenantDeviceTypeRepository.js';
import { CreateDeviceTypeDTO, UpdateDeviceTypeDTO } from '../models/TenantDeviceType.js';

export class TenantDeviceTypeService {
  constructor(private repo: TenantDeviceTypeRepository) {}

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
    const dup = await this.repo.findByCode(data.code, tenantBusinessId);
    if (dup) {
      const e = new Error('A device type with this code already exists in your business');
      (e as any).status = 409; throw e;
    }
    return this.repo.create({ ...data, tenantBusinessId });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateDeviceTypeDTO) {
    const current = await this.getOne(uuid, tenantBusinessId);

    if (data.code && data.code !== current.code) {
      const dup = await this.repo.findByCode(data.code, tenantBusinessId, uuid);
      if (dup) {
        const e = new Error('A device type with this code already exists in your business');
        (e as any).status = 409; throw e;
      }
    }

    await this.repo.update(uuid, tenantBusinessId, data);
    return this.getOne(uuid, tenantBusinessId);
  }

  async delete(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.delete(uuid, tenantBusinessId);
    if (!ok) { const e = new Error('Delete failed'); (e as any).status = 500; throw e; }
  }
}
