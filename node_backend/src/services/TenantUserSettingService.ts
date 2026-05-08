import { TenantUserSettingRepository } from '../repositories/TenantUserSettingRepository.js';
import { UpsertSettingDTO } from '../models/TenantUserSetting.js';

export class TenantUserSettingService {
  constructor(private repo: TenantUserSettingRepository) {}

  async getAll(tenantBusinessId: number, tenantUserId: number) {
    return this.repo.findAll(tenantBusinessId, tenantUserId);
  }

  async upsertMany(tenantBusinessId: number, tenantUserId: number, settings: UpsertSettingDTO[]) {
    if (!Array.isArray(settings) || settings.length === 0) {
      const e = new Error('settings array is required'); (e as any).status = 400; throw e;
    }
    await this.repo.upsertMany(tenantBusinessId, tenantUserId, settings);
    return this.repo.findAll(tenantBusinessId, tenantUserId);
  }

  async deleteByKey(tenantBusinessId: number, tenantUserId: number, key: string) {
    const ok = await this.repo.deleteByKey(tenantBusinessId, tenantUserId, key);
    if (!ok) { const e = new Error('Setting not found'); (e as any).status = 404; throw e; }
  }
}
