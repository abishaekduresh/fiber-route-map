import { Request, Response, NextFunction } from 'express';
import { RoutePointTemplateService } from '../services/RoutePointTemplateService.js';

const VERSION = '1.64.0';

export class RoutePointTemplateController {
  constructor(private service: RoutePointTemplateService) {}

  private transform(t: any, req: Request) {
    return {
      id: t.uuid,
      type: 'route_point_template',
      attributes: {
        code:                    t.code,
        name:                    t.name,
        iconId:                  t.iconId ?? null,
        iconName:                t.iconName ?? null,
        iconCode:                t.iconCode ?? null,
        iconFileType:            t.iconFileType ?? null,
        iconSvgTemplate:         t.iconSvgTemplate ?? null,
        iconUrl:                 t.iconUrl ?? null,
        deviceTypeId:            t.deviceTypeId ?? null,
        deviceTypeName:          t.deviceTypeName ?? null,
        deviceTypeCode:          t.deviceTypeCode ?? null,
        isDevice:                Boolean(t.isDevice),
        isPointNameRequired:     Boolean(t.isPointNameRequired),
        isPoleNumberRequired:    Boolean(t.isPoleNumberRequired),
        isLandmarkRequired:      Boolean(t.isLandmarkRequired),
        isAddressRequired:       Boolean(t.isAddressRequired),
        isPhotoRequired:         Boolean(t.isPhotoRequired),
        isHeightRequired:        Boolean(t.isHeightRequired),
        isOwnerNameRequired:     Boolean(t.isOwnerNameRequired),
        isContactNumberRequired: Boolean(t.isContactNumberRequired),
        isElectricityAvailable:  Boolean(t.isElectricityAvailable),
        description:             t.description ?? null,
        status:                  t.status,
      },
      meta:  { createdAt: t.createdAt, updatedAt: t.updatedAt },
      links: { self: `/api/route-point-templates/${t.uuid}` },
    };
  }

  private getMeta(req: Request, extra?: Record<string, unknown>) {
    return { requestId: (req as any).requestId, timestamp: new Date().toISOString(), version: VERSION, ...extra };
  }

  private parseBool(val: any): boolean {
    return val === true || val === 'true' || val === '1' || val === 1;
  }

  private parseBody(raw: Record<string, any>) {
    const boolFields = ['isDevice','isPointNameRequired','isPoleNumberRequired','isLandmarkRequired',
      'isAddressRequired','isPhotoRequired','isHeightRequired','isOwnerNameRequired',
      'isContactNumberRequired','isElectricityAvailable'];
    const out: Record<string, any> = { ...raw };
    for (const f of boolFields) { if (f in raw) out[f] = this.parseBool(raw[f]); }
    if ('iconId'       in raw) out.iconId       = raw.iconId       ? Number(raw.iconId)       : null;
    if ('deviceTypeId' in raw) out.deviceTypeId = raw.deviceTypeId ? Number(raw.deviceTypeId) : null;
    // strip removed field if accidentally sent
    delete out.tenantDeviceCategoryId;
    return out;
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 10;
      const search = (req.query.search          as string) || '';
      const status = ((req.query['filter[status]'] || req.query.status) as string) || '';
      const { templates, total } = await this.service.getAll({ page, limit, search, status });
      res.status(200).json({
        success: true, statusCode: 200,
        message: templates.length ? 'Route point templates retrieved successfully' : 'No route point templates found',
        data: templates.map(t => this.transform(t, req)),
        meta: this.getMeta(req, { pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tpl = await this.service.getOne(req.params.uuid);
      res.status(200).json({ success: true, statusCode: 200, message: 'Route point template retrieved successfully', data: this.transform(tpl, req), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      if (!body.name?.trim()) { res.status(422).json({ success: false, statusCode: 422, message: 'Name is required' }); return; }
      const tpl = await this.service.create(body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Route point template created successfully', data: this.transform(tpl, req), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      const tpl  = await this.service.update(req.params.uuid, body);
      res.status(200).json({ success: true, statusCode: 200, message: 'Route point template updated successfully', data: this.transform(tpl, req), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.uuid);
      res.status(200).json({ success: true, statusCode: 200, message: 'Route point template deleted successfully', data: null, meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };
}
