import db from '../config/database.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';
import { TenantUserSetting, UpsertSettingDTO } from '../models/TenantUserSetting.js';

export class TenantUserSettingRepository {
  private table = 'tenant_user_settings';

  async findAll(tenantBusinessId: number, tenantUserId: number): Promise<TenantUserSetting[]> {
    return db(this.table)
      .where({ tenantBusinessId, tenantUserId })
      .whereNot('status', 'deleted')
      .orderBy('key', 'asc');
  }

  async findByKey(tenantBusinessId: number, tenantUserId: number, key: string): Promise<TenantUserSetting | null> {
    return db(this.table)
      .where({ tenantBusinessId, tenantUserId, key })
      .whereNot('status', 'deleted')
      .first() ?? null;
  }

  async upsertMany(tenantBusinessId: number, tenantUserId: number, settings: UpsertSettingDTO[]): Promise<void> {
    const now = nowDb();
    for (const s of settings) {
      const existing = await this.findByKey(tenantBusinessId, tenantUserId, s.key);
      if (existing) {
        await db(this.table)
          .where({ id: existing.id })
          .update({ name: s.name, value: s.value, status: 'active', updatedAt: now });
      } else {
        await db(this.table).insert({
          uuid: generateUuidV7(),
          tenantBusinessId,
          tenantUserId,
          name: s.name,
          key: s.key,
          value: s.value,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  async deleteByKey(tenantBusinessId: number, tenantUserId: number, key: string): Promise<boolean> {
    const result = await db(this.table)
      .where({ tenantBusinessId, tenantUserId, key })
      .update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return result > 0;
  }
}
