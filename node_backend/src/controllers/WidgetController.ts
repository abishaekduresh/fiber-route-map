import { Request, Response, NextFunction } from 'express';
import { WidgetService } from '../services/WidgetService.js';

const VERSION = '1.56.0';

export class WidgetController {
  constructor(private service: WidgetService) {}

  private transform(w: any, req: Request) {
    return {
      id: w.uuid,
      type: 'widget',
      attributes: {
        code: w.code,
        name: w.name,
        type: w.type,
        iconType: w.iconType,
        svgTemplate: w.svgTemplate,
        iconUrl: w.iconUrl,
        width: w.width,
        height: w.height,
        status: w.status,
      },
      meta: { createdAt: w.createdAt, updatedAt: w.updatedAt },
      links: { self: `/api/widgets/${w.uuid}` },
    };
  }

  private getMeta(req: Request, extra?: Record<string, unknown>) {
    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: VERSION,
      ...extra,
    };
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 10;
      const search = (req.query.search          as string) || '';
      const status = ((req.query['filter[status]'] || req.query.status) as string) || '';
      const type   = ((req.query['filter[type]']   || req.query.type)   as string) || '';

      const { widgets, total } = await this.service.getAll({ page, limit, search, status, type });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: widgets.length ? 'Widgets retrieved successfully' : 'No widgets found',
        data: widgets.map(w => this.transform(w, req)),
        meta: this.getMeta(req, {
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const widget = await this.service.getOne(req.params.uuid);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Widget retrieved successfully',
        data: this.transform(widget, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const widget = await this.service.create(req.body);
      res.status(200).json({
        success: true,
        statusCode: 201,
        message: 'Widget created successfully',
        data: this.transform(widget, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const widget = await this.service.update(req.params.uuid, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Widget updated successfully',
        data: this.transform(widget, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.uuid);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Widget deleted successfully',
        data: null,
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };
}
