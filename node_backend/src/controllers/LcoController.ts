import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { LcoService } from '../services/LcoService.js';
import { Lco } from '../models/Lco.js';

export class LcoController {
  constructor(private lcoService: LcoService) {}

  private transform = (lco: Lco) => ({
    id: lco.uuid,
    type: 'lco',
    attributes: {
      businessName: lco.businessName,
      code: lco.code,
      lcoName: lco.lcoName,
      phone: lco.phone,
      email: lco.email,
      address_line1: lco.address_line1,
      city: lco.city,
      state: lco.state,
      pincode: lco.pincode,
      status: lco.status,
      countryUuid: (lco as any).countryUuid,
    },
    meta: { createdAt: lco.createdAt, updatedAt: lco.updatedAt },
    links: { self: `/api/tenant/lcos/${lco.uuid}` },
  });

  private getMeta = (req: Request, extra: any = {}) => ({
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    version: '1.42.0',
    ...extra,
  });

  private getAuthContext = async (req: Request) => {
    const userUuid = (req as any).user.uuid || (req as any).user.id;
    const row = await db('tenants')
      .leftJoin('tenant_business', 'tenants.tenantBusinessId', 'tenant_business.id')
      .where('tenants.uuid', userUuid)
      .select('tenants.id as tenantId', 'tenants.tenantBusinessId', 'tenant_business.name as businessName')
      .first();
    
    if (!row) throw new Error('Tenant not found');
    return {
      tenantId: row.tenantId as number,
      tenantBusinessId: row.tenantBusinessId as number,
      businessName: row.businessName as string,
    };
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = await this.getAuthContext(req);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const lcoName = req.query.filter ? (req.query.filter as any).lcoName : undefined;

      const { lcos, total } = await this.lcoService.getLcos(tenantId, { page, limit, filter: { lcoName } });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true,
        statusCode: 200,
        message: lcos.length > 0 ? 'LCOs retrieved successfully' : 'No LCOs found',
        data: lcos.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: lcos.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = await this.getAuthContext(req);
      const lco = await this.lcoService.getLco(req.params.uuid, tenantId);
      return res.json({ success: true, statusCode: 200, data: this.transform(lco), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, tenantBusinessId, businessName } = await this.getAuthContext(req);
      const { countryUuid, ...rest } = req.body;

      let countryId: number | null = null;
      if (countryUuid) {
        const row = await db('countries').where('uuid', countryUuid).select('id').first();
        countryId = row?.id ?? null;
      }

      const lco = await this.lcoService.createLco(tenantId, tenantBusinessId, businessName, {
        ...rest,
        countryId,
        status: 'active', // Force status to active in backend
      });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'LCO created successfully',
        data: this.transform(lco),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = await this.getAuthContext(req);
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

      const lco = await this.lcoService.updateLco(req.params.uuid, tenantId, updateData);
      return res.json({
        success: true,
        statusCode: 200,
        message: 'LCO updated successfully',
        data: this.transform(lco),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = await this.getAuthContext(req);
      await this.lcoService.deleteLco(req.params.uuid, tenantId);
      return res.json({ success: true, statusCode: 200, message: 'LCO deleted successfully', meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
