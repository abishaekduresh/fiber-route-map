import { LcoRepository } from '../repositories/LcoRepository.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { CreateLcoDTO, UpdateLcoDTO, Lco } from '../models/Lco.js';

export class LcoService {
  constructor(
    private lcoRepo: LcoRepository,
    private tenantRepo: TenantRepository,
  ) {}

  async getLcos(tenantId: number, params: any) {
    return this.lcoRepo.getAll(tenantId, params);
  }

  async getLco(uuid: string, tenantId: number) {
    const lco = await this.lcoRepo.findByUuid(uuid, tenantId);
    if (!lco) throw new Error('LCO not found');
    return lco;
  }

  async createLco(tenantId: number, tenantBusinessId: number, businessName: string, data: CreateLcoDTO) {
    // Phone uniqueness check
    if (data.phone) {
      const existingLco = await this.lcoRepo.findByPhone(data.phone);
      if (existingLco) {
        const error = new Error('Phone number is already registered to another LCO');
        (error as any).status = 409;
        throw error;
      }
      const existingTenant = await this.tenantRepo.findByPhone(data.phone);
      if (existingTenant) {
        const error = new Error('Phone number is already registered to a tenant');
        (error as any).status = 409;
        throw error;
      }
    }

    // Generate code: LCO000X
    const lastCode = await this.lcoRepo.getLastCodeForBusiness(tenantBusinessId);
    let nextNum = 1;
    if (lastCode) {
      if (lastCode.includes('-')) {
        const parts = lastCode.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      } else if (lastCode.startsWith('LCO')) {
        const numPart = lastCode.substring(3);
        const lastNum = parseInt(numPart, 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
    }
    const code = `LCO${String(nextNum).padStart(4, '0')}`;

    return this.lcoRepo.create({
      ...data,
      tenantId,
      tenantBusinessId,
      businessName,
      code,
    });
  }

  async updateLco(uuid: string, tenantId: number, data: UpdateLcoDTO) {
    const current = await this.getLco(uuid, tenantId);

    if (data.phone && data.phone !== current.phone) {
      const existingLco = await this.lcoRepo.findByPhone(data.phone);
      if (existingLco) {
        const error = new Error('Phone number is already registered to another LCO');
        (error as any).status = 409;
        throw error;
      }
      const existingTenant = await this.tenantRepo.findByPhone(data.phone);
      if (existingTenant) {
        const error = new Error('Phone number is already registered to a tenant');
        (error as any).status = 409;
        throw error;
      }
    }

    const success = await this.lcoRepo.update(uuid, tenantId, data);
    if (!success) throw new Error('LCO not found or update failed');
    return this.getLco(uuid, tenantId);
  }

  async deleteLco(uuid: string, tenantId: number) {
    const success = await this.lcoRepo.delete(uuid, tenantId);
    if (!success) throw new Error('LCO not found or delete failed');
    return true;
  }
}
