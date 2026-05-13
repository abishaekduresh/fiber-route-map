import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { IconService } from '../services/IconService.js';
import { getIconUploadDir, getIconPublicUrl, deleteIconFile } from '../utils/uploadPath.js';

const VERSION = '1.62.0';

export class IconController {
  constructor(private service: IconService) {}

  private transform(w: any, req: Request) {
    return {
      id: w.uuid,
      type: 'icon',
      attributes: {
        code:        w.code,
        name:        w.name,
        type:        w.type,
        iconType:    w.iconType,
        svgTemplate: w.svgTemplate,
        iconUrl:     w.iconUrl,
        width:       w.width,
        height:      w.height,
        status:      w.status,
      },
      meta: { createdAt: w.createdAt, updatedAt: w.updatedAt },
      links: { self: `/api/icons/${w.uuid}` },
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

  /**
   * Processes an uploaded file (if any) and returns the resolved body fields.
   * - SVG file  → reads content into svgTemplate, clears iconUrl
   * - PNG/WebP  → writes to disk, sets iconUrl, clears svgTemplate
   */
  private handleUploadedFile(
    file: Express.Multer.File | undefined,
    body: Record<string, any>
  ): Record<string, any> {
    if (!file) return body;

    if (file.mimetype === 'image/svg+xml') {
      return {
        ...body,
        iconType: 'svg',
        svgTemplate: file.buffer.toString('utf-8'),
        iconUrl: null,
      };
    }

    // PNG or WebP — write buffer to disk
    const ext      = file.mimetype === 'image/png' ? '.png' : '.webp';
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const dir      = getIconUploadDir();
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    return {
      ...body,
      iconType: file.mimetype === 'image/png' ? 'png' : 'webp',
      iconUrl:  getIconPublicUrl(filename),
      svgTemplate: null,
    };
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 10;
      const search = (req.query.search          as string) || '';
      const status = ((req.query['filter[status]'] || req.query.status) as string) || '';
      const type   = ((req.query['filter[type]']   || req.query.type)   as string) || '';

      const { icons, total } = await this.service.getAll({ page, limit, search, status, type });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: icons.length ? 'Icons retrieved successfully' : 'No icons found',
        data: icons.map(w => this.transform(w, req)),
        meta: this.getMeta(req, {
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const icon = await this.service.getOne(req.params.uuid);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Icon retrieved successfully',
        data: this.transform(icon, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const raw  = { ...req.body };

      // Coerce numeric fields sent as form-data strings
      if (raw.width)  raw.width  = Number(raw.width);
      if (raw.height) raw.height = Number(raw.height);

      const body = this.handleUploadedFile(file, raw);

      const icon = await this.service.create(body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Icon created successfully',
        data: this.transform(icon, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file    = (req as any).file as Express.Multer.File | undefined;
      const raw     = { ...req.body };

      if (raw.width)  raw.width  = Number(raw.width);
      if (raw.height) raw.height = Number(raw.height);

      // If a new image file is uploaded, delete the old one from disk first
      if (file && (file.mimetype === 'image/png' || file.mimetype === 'image/webp')) {
        const existing = await this.service.getOne(req.params.uuid);
        deleteIconFile((existing as any).iconUrl);
      }

      const body = this.handleUploadedFile(file, raw);

      const icon = await this.service.update(req.params.uuid, body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Icon updated successfully',
        data: this.transform(icon, req),
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Delete file from disk if it's a locally uploaded PNG/WebP
      const existing = await this.service.getOne(req.params.uuid);
      deleteIconFile((existing as any).iconUrl);

      await this.service.delete(req.params.uuid);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Icon deleted successfully',
        data: null,
        meta: this.getMeta(req),
      });
    } catch (err) { next(err); }
  };
}
