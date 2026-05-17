import { Request, Response, NextFunction } from 'express';
import { DeviceCategoryService } from '../services/DeviceCategoryService.js';

const VERSION = '1.64.0';

export class DeviceCategoryController {
  constructor(private service: DeviceCategoryService) {}

  private transform(c: any) {
    return {
      id: c.uuid,
      type: 'device_category',
      attributes: { numericId: c.id, code: c.code, name: c.name, description: c.description ?? null, status: c.status },
      meta: { createdAt: c.createdAt, updatedAt: c.updatedAt },
      links: { self: `/api/device-categories/${c.uuid}` },
    };
  }

  private getMeta(req: Request, extra?: Record<string, unknown>) {
    return { requestId: (req as any).requestId, timestamp: new Date().toISOString(), version: VERSION, ...extra };
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 10;
      const search = (req.query.search          as string) || '';
      const status = ((req.query['filter[status]'] || req.query.status) as string) || '';
      const { categories, total } = await this.service.getAll({ page, limit, search, status });
      res.json({
        success: true, statusCode: 200,
        message: categories.length ? 'Device categories retrieved successfully' : 'No device categories found',
        data: categories.map(c => this.transform(c)),
        meta: this.getMeta(req, { pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await this.service.getOne(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device category retrieved successfully', data: this.transform(cat), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      if (!name?.trim()) { res.status(422).json({ success: false, statusCode: 422, message: 'Name is required' }); return; }
      const cat = await this.service.create({ name: name.trim(), description: description?.trim() || null });
      res.status(201).json({ success: true, statusCode: 201, message: 'Device category created successfully', data: this.transform(cat), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, status } = req.body;
      const cat = await this.service.update(req.params.uuid, {
        ...(name !== undefined      && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined    && { status }),
      });
      res.json({ success: true, statusCode: 200, message: 'Device category updated successfully', data: this.transform(cat), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device category deleted successfully', data: null, meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };
}
