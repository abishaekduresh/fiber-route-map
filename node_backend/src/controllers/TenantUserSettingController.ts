import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantUserSettingService } from '../services/TenantUserSettingService.js';

const VERSION = '1.51.0';

export class TenantUserSettingController {
  constructor(private service: TenantUserSettingService) {}

  private transform = (s: any) => ({
    id: s.uuid,
    type: 'user_setting',
    attributes: {
      key: s.key,
      name: s.name,
      value: s.value,
      status: s.status,
    },
    meta: { createdAt: s.createdAt, updatedAt: s.updatedAt },
  });

  private getMeta = (req: Request, extra: any = {}) => ({
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    version: VERSION,
    ...extra,
  });

  private getAuthContext = async (req: Request) => {
    const userUuid = (req as any).user?.uuid || (req as any).user?.id;
    const row = await db('tenants')
      .leftJoin('tenant_business', 'tenants.tenantBusinessId', 'tenant_business.id')
      .where('tenants.uuid', userUuid)
      .select('tenants.id as tenantId', 'tenants.tenantBusinessId')
      .first();
    if (!row || !row.tenantBusinessId) {
      const e = new Error('Tenant has no associated business'); (e as any).status = 403; throw e;
    }
    return { tenantId: row.tenantId as number, tenantBusinessId: row.tenantBusinessId as number };
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      const settings = await this.service.getAll(tenantBusinessId, tenantId);
      return res.json({
        success: true, statusCode: 200,
        data: settings.map(this.transform),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  upsert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      const settings = await this.service.upsertMany(tenantBusinessId, tenantId, req.body.settings);
      return res.json({
        success: true, statusCode: 200,
        message: 'Settings saved successfully',
        data: settings.map(this.transform),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  deleteKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      await this.service.deleteByKey(tenantBusinessId, tenantId, req.params.key);
      return res.json({ success: true, statusCode: 200, message: 'Setting deleted', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
