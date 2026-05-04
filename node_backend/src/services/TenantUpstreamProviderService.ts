import { TenantUpstreamProviderRepository } from '../repositories/TenantUpstreamProviderRepository.js';
import { CreateUpstreamProviderDTO, UpdateUpstreamProviderDTO } from '../models/TenantUpstreamProvider.js';

export class TenantUpstreamProviderService {
  constructor(private repo: TenantUpstreamProviderRepository) {}

  async getAll(tenantBusinessId: number, params: any) {
    return this.repo.getAll(tenantBusinessId, params);
  }

  async getOne(uuid: string, tenantBusinessId: number) {
    const provider = await this.repo.findByUuid(uuid, tenantBusinessId);
    if (!provider) {
      const e = new Error('Upstream provider not found'); (e as any).status = 404; throw e;
    }
    return provider;
  }

  async create(tenantBusinessId: number, data: CreateUpstreamProviderDTO & { countryId?: number | null }) {
    if (data.email) {
      const dup = await this.repo.findByEmail(data.email, tenantBusinessId);
      if (dup) {
        const e = new Error('A provider with this email already exists in your business');
        (e as any).status = 409; throw e;
      }
    }
    if (data.phone) {
      const dup = await this.repo.findByPhone(data.phone, tenantBusinessId);
      if (dup) {
        const e = new Error('A provider with this phone number already exists in your business');
        (e as any).status = 409; throw e;
      }
    }

    // Auto-generate code: TUP0001, TUP0002, …
    const lastCode = await this.repo.getLastCode(tenantBusinessId);
    let nextNum = 1;
    if (lastCode && lastCode.startsWith('TUP')) {
      const n = parseInt(lastCode.substring(3), 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    const code = `TUP${String(nextNum).padStart(4, '0')}`;

    return this.repo.create({ ...data, tenantBusinessId, code });
  }

  async update(uuid: string, tenantBusinessId: number, data: UpdateUpstreamProviderDTO & { countryId?: number | null }) {
    const current = await this.getOne(uuid, tenantBusinessId);

    if (data.email && data.email !== current.email) {
      const dup = await this.repo.findByEmail(data.email, tenantBusinessId);
      if (dup) {
        const e = new Error('A provider with this email already exists in your business');
        (e as any).status = 409; throw e;
      }
    }
    if (data.phone && data.phone !== current.phone) {
      const dup = await this.repo.findByPhone(data.phone, tenantBusinessId);
      if (dup) {
        const e = new Error('A provider with this phone number already exists in your business');
        (e as any).status = 409; throw e;
      }
    }

    await this.repo.update(uuid, tenantBusinessId, data);
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
