import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantUpstreamProviderService } from '../services/TenantUpstreamProviderService.js';

const VERSION = '1.41.0';

export class TenantUpstreamProviderController {
  constructor(private service: TenantUpstreamProviderService) {}

  private transform = (p: any) => ({
    id: p.uuid,
    type: 'upstream_provider',
    attributes: {
      name: p.name,
      code: p.code,
      serviceCategory: p.serviceCategory,
      contactPerson: p.contactPerson,
      phone: p.phone,
      email: p.email,
      addressLine1: p.addressLine1,
      city: p.city,
      state: p.state,
      country: p.countryUuid ? { uuid: p.countryUuid, name: p.countryName } : null,
      status: p.status,
    },
    meta: { createdAt: p.createdAt, updatedAt: p.updatedAt },
    links: { self: `/api/tenant/upstream-providers/${p.uuid}` },
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

      const { providers, total } = await this.service.getAll(tenantBusinessId, { page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: providers.length ? 'Upstream providers retrieved successfully' : 'No upstream providers found',
        data: providers.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: providers.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const provider = await this.service.getOne((req.params.uuid as string), tenantBusinessId);
      return res.json({ success: true, statusCode: 200, data: this.transform(provider), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const { countryUuid, ...rest } = req.body;

      let countryId: number | null = null;
      if (countryUuid) {
        const row = await db('countries').where('uuid', countryUuid).select('id').first();
        countryId = row?.id ?? null;
      }

      const provider = await this.service.create(tenantBusinessId, { ...rest, countryId });
      return res.status(201).json({
        success: true, statusCode: 201,
        message: 'Upstream provider created successfully',
        data: this.transform(provider),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const { countryUuid, ...rest } = req.body;

      const updateData: any = { ...rest };
      if (countryUuid !== undefined) {
        if (countryUuid) {
          const row = await db('countries').where('uuid', countryUuid).select('id').first();
          updateData.countryId = row?.id ?? null;
        } else {
          updateData.countryId = null;
        }
      }

      const provider = await this.service.update((req.params.uuid as string), tenantBusinessId, updateData);
      return res.json({
        success: true, statusCode: 200,
        message: 'Upstream provider updated successfully',
        data: this.transform(provider),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const provider = await this.service.block((req.params.uuid as string), tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Upstream provider blocked',
        data: this.transform(provider), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      const provider = await this.service.unblock((req.params.uuid as string), tenantBusinessId);
      return res.json({
        success: true, statusCode: 200, message: 'Upstream provider unblocked',
        data: this.transform(provider), meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantBusinessId } = await this.getAuthContext(req);
      await this.service.delete((req.params.uuid as string), tenantBusinessId);
      return res.json({ success: true, statusCode: 200, message: 'Upstream provider deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
