import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/AuditLogService.js';
import { AuditLog } from '../models/AuditLog.js';

export class AuditLogController {
  private service: AuditLogService;

  constructor(service: AuditLogService) {
    this.service = service;
  }

  private transformLog(log: AuditLog) {
    return {
      id: log.uuid,
      type: 'audit_log',
      attributes: {
        actorType: log.actorType,
        actorUuid: log.actorUuid,
        actorName: log.actorName,
        actorEmail: log.actorEmail,
        actorRoles: log.actorRoles,
        action: log.action,
        resource: log.resource,
        resourceUuid: log.resourceUuid,
        resourceName: log.resourceName,
        httpMethod: log.httpMethod,
        endpoint: log.endpoint,
        statusCode: log.statusCode,
        success: log.success,
        requestBody: log.requestBody,
        responseBody: log.responseBody,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        requestId: log.requestId,
        sessionUuid: log.sessionUuid,
        durationMs: log.durationMs,
        errorMessage: log.errorMessage,
      },
      meta: {
        createdAt: log.createdAt,
      },
      links: {
        self: `/api/audit-logs/${log.uuid}`,
      },
    };
  }

  private getMeta(req: Request, extra: Record<string, unknown> = {}) {
    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.42.0',
      ...extra,
    };
  }

  // GET /api/audit-logs
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 20);
      const filter = typeof req.query.filter === 'object' ? req.query.filter as any : {};
      const sort = req.query.sort as string | undefined;

      const { logs, total } = await this.service.getAllLogs({ page, limit, filter, sort });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      res.json({
        success: true,
        statusCode: 200,
        message: logs.length > 0 ? 'Audit logs retrieved successfully' : 'No audit log entries found',
        data: logs.map(l => this.transformLog(l)),
        meta: this.getMeta(req, {
          pagination: {
            total,
            count: logs.length,
            perPage: limit === -1 ? total : limit,
            currentPage: page,
            totalPages,
          },
          filters: filter,
          sort: sort || '-createdAt',
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/audit-logs/:uuid
  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await this.service.getLogByUuid(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Audit log entry retrieved successfully',
        data: this.transformLog(log),
        meta: this.getMeta(req),
      });
    } catch (error) {
      next(error);
    }
  };
}
