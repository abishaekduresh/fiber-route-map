import { Request, Response, NextFunction } from 'express';
import { TenantBusinessService } from '../services/TenantBusinessService.js';
import { TenantBusiness } from '../models/TenantBusiness.js';

export class TenantBusinessController {
  private service: TenantBusinessService;

  constructor(service: TenantBusinessService) {
    this.service = service;
  }

  private transformBusiness = (b: TenantBusiness) => {
    const { uuid, name, address, email, phone, type, status, createdAt, updatedAt, country } = b;
    return {
      id: uuid,
      type: 'tenant_business',
      attributes: { name, address, email, phone, type, status, country: country ?? null },
      meta: { createdAt, updatedAt },
      links: { self: `/api/tenant-business/${uuid}` },
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

      const { businesses, total } = await this.service.getAllBusinesses({ ...req.query, filter: filterObj, page, limit });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
      const data = businesses.map(b => this.transformBusiness(b));

      res.json({
        success: true,
        statusCode: 200,
        message: data.length > 0 ? 'Tenant businesses retrieved successfully' : 'No tenant businesses found matching the criteria',
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
      const business = await this.service.getBusinessByUuid(req.params.uuid);
      res.json({ success: true, statusCode: 200, data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        const error = new Error('Tenant business data is required in request body');
        (error as any).status = 400;
        (error as any).errorType = 'BAD_REQUEST';
        throw error;
      }
      const business = await this.service.createBusiness(req.body);
      res.json({ success: true, statusCode: 201, message: 'Tenant business created successfully', data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await this.service.updateBusiness(req.params.uuid, req.body);
      res.json({ success: true, statusCode: 200, message: 'Tenant business updated successfully', data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteBusiness(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant business deleted successfully', meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await this.service.blockBusiness(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant business blocked successfully', data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await this.service.unblockBusiness(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant business unblocked successfully', data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };

  suspend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await this.service.suspendBusiness(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Tenant business suspended successfully', data: this.transformBusiness(business), meta: this.getMeta(req, {}, null) });
    } catch (error) { next(error); }
  };
}
