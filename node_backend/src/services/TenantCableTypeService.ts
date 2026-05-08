import { TenantCableTypeRepository } from '../repositories/TenantCableTypeRepository.js';
import { CreateCableTypeDTO, UpdateCableTypeDTO } from '../models/TenantCableType.js';

export class TenantCableTypeService {
  constructor(private repo: TenantCableTypeRepository) {}

  async getAll(tenantBusinessId: number, params: any) {
    return this.repo.getAll(tenantBusinessId, params);
  }

  async getOne(uuid: string, tenantBusinessId: number) {
    const ct = await this.repo.findByUuid(uuid, tenantBusinessId);
    if (!ct) {
      const e = new Error('Cable type not found'); (e as any).status = 404; throw e;
    }
    return ct;
  }

  private buildNameCode(fiberCoreCount: number, tubeCount: number) {
    const code = `${fiberCoreCount}F x ${tubeCount}T`;
    const name = `${fiberCoreCount}F x ${tubeCount}T Fiber`;
    return { name, code };
  }

  async create(tenantBusinessId: number, data: CreateCableTypeDTO) {
    const tubeCount = data.tubeCount ?? 1;
    const { name, code } = this.buildNameCode(data.fiberCoreCount, tubeCount);
    const dup = await this.repo.findByCode(code, tenantBusinessId);
    if (dup) {
      const e = new Error(`A cable type "${code}" already exists in your business`);
      (e as any).status = 409; throw e;
    }
    return this.repo.create({ ...data, name, code, tubeCount, tenantBusinessId });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateCableTypeDTO) {
    const current = await this.getOne(uuid, tenantBusinessId);
    const fiberCoreCount = data.fiberCoreCount ?? current.fiberCoreCount;
    const tubeCount = data.tubeCount ?? current.tubeCount;
    const { name, code } = this.buildNameCode(fiberCoreCount, tubeCount);

    if (code !== current.code) {
      const dup = await this.repo.findByCode(code, tenantBusinessId);
      if (dup) {
        const e = new Error(`A cable type "${code}" already exists in your business`);
        (e as any).status = 409; throw e;
      }
    }

    await this.repo.update(uuid, tenantBusinessId, { ...data, name, code });
    return this.getOne(uuid, tenantBusinessId);
  }

  async block(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.updateStatus(uuid, tenantBusinessId, 'blocked');
    if (!ok) { const e = new Error('Block failed'); (e as any).status = 500; throw e; }
    return this.getOne(uuid, tenantBusinessId);
  }

  async unblock(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.updateStatus(uuid, tenantBusinessId, 'active');
    if (!ok) { const e = new Error('Unblock failed'); (e as any).status = 500; throw e; }
    return this.getOne(uuid, tenantBusinessId);
  }

  async delete(uuid: string, tenantBusinessId: number) {
    await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.delete(uuid, tenantBusinessId);
    if (!ok) { const e = new Error('Delete failed'); (e as any).status = 500; throw e; }
  }
}
