import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantDeviceCategoryService } from '../services/TenantDeviceCategoryService.js';

const VERSION = '1.49.0';

export class TenantDeviceCategoryController {
  constructor(private service: TenantDeviceCategoryService) {}

  private transform = (dc: any) => ({
    id: dc.uuid,
    type: 'device_category',
    attributes: {
      name: dc.name,
      code: dc.code,
      description: dc.description ?? null,
      status: dc.status,
    },
    meta: { createdAt: dc.createdAt, updatedAt: dc.updatedAt },
    links: { self: `/api/tenant/device-categories/${dc.uuid}` },
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
      const { tenantBusinessId } = await this.getAuthContext(req);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filter = (req.query.filter as any) || {};

      const { deviceCategories, total } = await this.service.getAll(tenantBusinessId, { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: deviceCategories.length ? 'Device categories retrieved successfully' : 'No device categories found',
        data: deviceCategories.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: deviceCategories.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dc = await this.service.getOne(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: this.transform(dc), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dc = await this.service.create(tenantBusinessId, req.body);
      return res.status(201).json({
        success: true, statusCode: 201,
        message: 'Device category created successfully',
        data: this.transform(dc),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dc = await this.service.update(req.params.uuid, tenantBusinessId, req.body);
      return res.json({
        success: true, statusCode: 200,
        message: 'Device category updated successfully',
        data: this.transform(dc),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dc = await this.service.setInactive(req.params.uuid, tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Device category deactivated',
        data: this.transform(dc), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  activate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dc = await this.service.setActive(req.params.uuid, tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Device category activated',
        data: this.transform(dc), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      await this.service.delete(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, message: 'Device category deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
