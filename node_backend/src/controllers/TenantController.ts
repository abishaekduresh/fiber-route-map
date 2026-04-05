import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/TenantService.js';
import { Tenant } from '../models/Tenant.js';

export class TenantController {
  private service: TenantService;

  constructor(service: TenantService) {
    this.service = service;
  }

  private transformTenant = (tenant: Tenant) => {
    const { uuid, email, username, name, address, status, createdAt, updatedAt, country, role } = tenant;
    return {
      id: uuid,
      type: 'tenant',
      attributes: { email, username, name, address, status, country: country ?? null, role: role ?? null },
      meta: { createdAt, updatedAt },
      links: { self: `/api/tenants/${uuid}` },
    };
  };

  private getMeta = (req: Request, filterObj: any, sortParam: any, extra = {}) => {
    let sort: { field: string; order: string }[] = [];
    if (typeof sortParam === 'string') {
      sort = sortParam.split(',').map((s: string) => {
        const desc = s.trim().startsWith('-');
        const field = desc ? s.trim().substring(1) : s.trim();
        return { field, order: desc ? 'desc' : 'asc' };
      });
    } else if (sortParam && typeof sortParam === 'object') {
      sort = [{ field: sortParam.field || 'name', order: String(sortParam.order || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc' }];
    } else {
      sort = [{ field: 'name', order: 'asc' }];
    }
    return { requestId: (req as any).requestId, timestamp: new Date().toISOString(), version: 'v1', filters: { ...filterObj }, sort, ...extra };
  };

  private buildLink = (req: Request, params: any) => {
    const url = new URL(req.baseUrl, 'http://localhost');
    const filters = typeof params.filters === 'object' ? params.filters : {};
    const filter = typeof params.filter === 'object' ? params.filter : {};
    const mergedFilter = { ...filters, ...filter };
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || key === 'filter' || key === 'filters') return;
      if (typeof value !== 'object') url.searchParams.append(key, String(value));
    });
    Object.entries(mergedFilter).forEach(([fKey, fVal]) => {
      url.searchParams.append(`filter[${fKey}]`, String(fVal));
    });
    return `${url.pathname}${url.search}`;
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filterObj = { ...(req.query.filters as any || {}), ...(req.query.filter as any || {}) };
      const sortParam = req.query.sort;

      const { tenants, total } = await this.service.getAllTenants({ ...req.query, filter: filterObj, page, limit });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
      const data = tenants.map(t => this.transformTenant(t));

      res.json({
        success: true,
        statusCode: 200,
        message: data.length > 0 ? 'Tenants retrieved successfully' : 'No tenants found matching the criteria',
        data,
        meta: this.getMeta(req, filterObj, sortParam, {
          pagination: { total, count: data.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
        links: {
          self: this.buildLink(req, { ...req.query, page, limit }),
          next: page < totalPages ? this.buildLink(req, { ...req.query, page: page + 1, limit }) : null,
          prev: page > 1 ? this.buildLink(req, { ...req.query, page: page - 1, limit }) : null,
        },
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.getTenantByUuid(req.params.uuid);
      res.json({ success: true, statusCode: 200, data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        const error = new Error('Tenant data is required in request body');
        (error as any).status = 400;
        (error as any).errorType = 'BAD_REQUEST';
        throw error;
      }
      const tenant = await this.service.createTenant(req.body);
      res.json({ success: true, statusCode: 201, message: 'Tenant created successfully', data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.updateTenant(req.params.uuid, req.body);
      res.json({ success: true, statusCode: 200, message: 'Tenant updated successfully', data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteTenant(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant deleted successfully', meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.blockTenant(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant blocked successfully', data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.unblockTenant(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant unblocked successfully', data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  suspend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.suspendTenant(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant suspended successfully', data: this.transformTenant(tenant), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };
}
