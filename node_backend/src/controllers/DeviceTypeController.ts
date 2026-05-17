import { Request, Response, NextFunction } from 'express';
import { DeviceTypeService } from '../services/DeviceTypeService.js';

const VERSION = '1.67.0';

export class DeviceTypeController {
  constructor(private service: DeviceTypeService) {}

  private transform(dt: any) {
    return {
      id: dt.uuid,
      type: 'device_type',
      attributes: {
        numericId:       dt.id,
        code:            dt.code,
        name:            dt.name,
        deviceCategoryId: dt.deviceCategoryId,
        categoryName:    dt.categoryName ?? null,
        categoryCode:    dt.categoryCode ?? null,
        iconId:          dt.iconId,
        iconName:        dt.iconName        ?? null,
        iconCode:        dt.iconCode        ?? null,
        iconFileType:    dt.iconFileType    ?? null,
        iconSvgTemplate: dt.iconSvgTemplate ?? null,
        iconUrl:         dt.iconUrl         ?? null,
        description:     dt.description    ?? null,
        status:          dt.status,
      },
      meta:  { createdAt: dt.createdAt, updatedAt: dt.updatedAt },
      links: { self: `/api/device-types/${dt.uuid}` },
    };
  }

  private getMeta(req: Request, extra?: Record<string, unknown>) {
    return { requestId: (req as any).requestId, timestamp: new Date().toISOString(), version: VERSION, ...extra };
  }

  private parseBody(raw: any) {
    const out: any = { ...raw };
    if ('deviceCategoryId' in raw) out.deviceCategoryId = raw.deviceCategoryId ? Number(raw.deviceCategoryId) : null;
    if ('iconId' in raw)           out.iconId           = raw.iconId           ? Number(raw.iconId)           : null;
    return out;
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page       = parseInt(req.query.page       as string) || 1;
      const limit      = parseInt(req.query.limit      as string) || 10;
      const search     = (req.query.search              as string) || '';
      const status     = ((req.query['filter[status]']     || req.query.status)     as string) || '';
      const categoryId = ((req.query['filter[categoryId]'] || req.query.categoryId) as string) || '';
      const { deviceTypes, total } = await this.service.getAll({ page, limit, search, status, categoryId: categoryId || undefined });
      res.json({
        success: true, statusCode: 200,
        message: deviceTypes.length ? 'Device types retrieved successfully' : 'No device types found',
        data: deviceTypes.map(dt => this.transform(dt)),
        meta: this.getMeta(req, { pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dt = await this.service.getOne(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device type retrieved successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      if (!body.name?.trim()) { res.status(422).json({ success: false, statusCode: 422, message: 'Name is required' }); return; }
      const dt = await this.service.create(body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Device type created successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      const dt   = await this.service.update(req.params.uuid, body);
      res.json({ success: true, statusCode: 200, message: 'Device type updated successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device type deleted successfully', data: null, meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };
}
