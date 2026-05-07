import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantDeviceTypeService } from '../services/TenantDeviceTypeService.js';

const VERSION = '1.50.0';

export class TenantDeviceTypeController {
  constructor(private service: TenantDeviceTypeService) {}

  private transform = (dt: any) => ({
    id: dt.uuid,
    type: 'device_type',
    attributes: {
      name: dt.name,
      code: dt.code,
      tenantDeviceCategoryId: dt.tenantDeviceCategoryId,
      categoryName: dt.categoryName ?? null,
      categoryUuid: dt.categoryUuid ?? null,
      isModelNumberRequired: Boolean(dt.isModelNumberRequired),
      isSerialNumberRequired: Boolean(dt.isSerialNumberRequired),
      isMacAddressRequired: Boolean(dt.isMacAddressRequired),
      isIPAddressRequired: Boolean(dt.isIPAddressRequired),
      isPortRequired: Boolean(dt.isPortRequired),
      isGpsLocationRequired: Boolean(dt.isGpsLocationRequired),
      isMonitoringEnabled: Boolean(dt.isMonitoringEnabled),
      icon: dt.icon ?? null,
      description: dt.description ?? null,
      status: dt.status,
    },
    meta: { createdAt: dt.createdAt, updatedAt: dt.updatedAt },
    links: { self: `/api/tenant/device-types/${dt.uuid}` },
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

      const { deviceTypes, total } = await this.service.getAll(tenantBusinessId, { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: deviceTypes.length ? 'Device types retrieved successfully' : 'No device types found',
        data: deviceTypes.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: deviceTypes.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const dt = await this.service.getOne(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: this.transform(dt), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const body = { ...req.body };
      if (body.code) body.code = String(body.code).toUpperCase();
      const dt = await this.service.create(tenantBusinessId, body);
      return res.status(201).json({
        success: true, statusCode: 201,
        message: 'Device type created successfully',
        data: this.transform(dt),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const body = { ...req.body };
      if (body.code) body.code = String(body.code).toUpperCase();
      const dt = await this.service.update(req.params.uuid, tenantBusinessId, body);
      return res.json({
        success: true, statusCode: 200,
        message: 'Device type updated successfully',
        data: this.transform(dt),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      await this.service.delete(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, message: 'Device type deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
