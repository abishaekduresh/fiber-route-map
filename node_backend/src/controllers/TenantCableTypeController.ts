import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantCableTypeService } from '../services/TenantCableTypeService.js';

const VERSION = '1.45.0';

export class TenantCableTypeController {
  constructor(private service: TenantCableTypeService) {}

  private transform = (ct: any) => ({
    id: ct.uuid,
    type: 'cable_type',
    attributes: {
      name: ct.name,
      code: ct.code,
      fiberCoreCount: ct.fiberCoreCount,
      cableDiameter: ct.cableDiameter,
      description: ct.description,
      status: ct.status,
    },
    meta: { createdAt: ct.createdAt, updatedAt: ct.updatedAt },
    links: { self: `/api/tenant/cable-types/${ct.uuid}` },
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

      const { cableTypes, total } = await this.service.getAll(tenantBusinessId, { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: cableTypes.length ? 'Cable types retrieved successfully' : 'No cable types found',
        data: cableTypes.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: cableTypes.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const ct = await this.service.getOne((req.params.uuid as string), tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: this.transform(ct), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const ct = await this.service.create(tenantBusinessId, req.body);
      return res.status(201).json({
        success: true, statusCode: 201,
        message: 'Cable type created successfully',
        data: this.transform(ct),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const ct = await this.service.update((req.params.uuid as string), tenantBusinessId, req.body);
      return res.json({
        success: true, statusCode: 200,
        message: 'Cable type updated successfully',
        data: this.transform(ct),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const ct = await this.service.block((req.params.uuid as string), tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Cable type blocked',
        data: this.transform(ct), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const ct = await this.service.unblock((req.params.uuid as string), tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Cable type unblocked',
        data: this.transform(ct), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      await this.service.delete((req.params.uuid as string), tenantBusinessId);
      return res.json({ success: true, statusCode: 200, message: 'Cable type deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
