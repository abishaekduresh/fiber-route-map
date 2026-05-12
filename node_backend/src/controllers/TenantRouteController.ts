import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantRouteService } from '../services/TenantRouteService.js';

const VERSION = '1.57.0';

export class TenantRouteController {
  constructor(private service: TenantRouteService) {}

  private transform = (r: any, includePoints = false) => ({
    id: r.uuid,
    type: 'tenant_route',
    attributes: {
      code:            r.code,
      name:            r.name,
      type:            r.type,
      routeColor:      r.routeColor,
      lineThickness:   r.lineThickness,
      parentRouteUuid: r.parentRouteUuid ?? null,
      parentRouteName: r.parentRouteName ?? null,
      description:     r.description,
      status:          r.status,
      pointsCount:     Number(r.pointsCount ?? (r.points?.length ?? 0)),
      ...(includePoints && { points: (r.points ?? []).map(this.transformPoint) }),
    },
    meta: { createdAt: r.createdAt, updatedAt: r.updatedAt },
    links: { self: `/api/tenant/routes/${r.uuid}` },
  });

  private transformPoint = (p: any) => ({
    id:             p.uuid,
    sequenceNumber: p.sequenceNumber,
    latitude:       p.latitude,
    longitude:      p.longitude,
    altitude:       p.altitude,
    pointType:      p.pointType,
    widgetUuid:     p.widgetUuid ?? null,
    remarks:        p.remarks,
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

  private getMeta2 = (req: Request) => ({
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  });

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filter = (req.query.filter as any) || {};

      const { routes, total } = await this.service.getAll(tenantBusinessId, { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: routes.length ? 'Routes retrieved successfully' : 'No routes found',
        data: routes.map(r => this.transform(r, false)),
        meta: this.getMeta(req, {
          pagination: { total, count: routes.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const route = await this.service.getOne(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: this.transform(route, true), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      const route = await this.service.create(tenantBusinessId, req.body, tenantId, this.getMeta2(req));
      return res.status(201).json({
        success: true, statusCode: 201,
        message: 'Route created successfully',
        data: this.transform(route, true),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      const route = await this.service.update(req.params.uuid, tenantBusinessId, req.body, tenantId, this.getMeta2(req));
      return res.json({
        success: true, statusCode: 200,
        message: 'Route updated successfully',
        data: this.transform(route, true),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId } = await this.getAuthContext(req);
      await this.service.delete(req.params.uuid, tenantBusinessId, tenantId, this.getMeta2(req));
      return res.json({ success: true, statusCode: 200, message: 'Route deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  history = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const logs = await this.service.getHistory(req.params.uuid, tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: logs, meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
