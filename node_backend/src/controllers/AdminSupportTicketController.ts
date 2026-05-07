import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { TenantSupportTicketService } from '../services/TenantSupportTicketService.js';

const VERSION = '1.47.0';

export class AdminSupportTicketController {
  constructor(private service: TenantSupportTicketService) {}

  private transform = (t: any) => ({
    id: t.uuid,
    type: 'support_ticket',
    attributes: {
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      impactLevel: t.impactLevel,
      status: t.status,
      slaResponseTime: t.slaResponseTime,
      slaResolutionTime: t.slaResolutionTime,
      dueAt: t.dueAt,
      assignedTo: t.assignedTo ?? null,
      assigneeName: t.assigneeName ?? null,
      assigneeUuid: t.assigneeUuid ?? null,
      relatedNodeId: t.relatedNodeId ?? null,
      relatedRouteId: t.relatedRouteId ?? null,
      relatedCustomerId: t.relatedCustomerId ?? null,
      attachments: t.attachments ? (typeof t.attachments === 'string' ? JSON.parse(t.attachments) : t.attachments) : null,
      resolutionNotes: t.resolutionNotes ?? null,
      resolvedAt: t.resolvedAt ?? null,
      closedAt: t.closedAt ?? null,
    },
    meta: {
      tenantName: t.tenantName ?? null,
      tenantUuid: t.tenantUuid ?? null,
      businessName: t.businessName ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    },
    links: { self: `/api/support-tickets/${t.uuid}` },
  });

  private getMeta = (req: Request, extra: any = {}) => ({
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    version: VERSION,
    ...extra,
  });

  private getAdmin = async (req: Request): Promise<{ id: number | null; name: string | null }> => {
    const userUuid = (req as any).user?.uuid || (req as any).user?.id;
    if (!userUuid) return { id: null, name: null };
    const row = await db('users').where('uuid', userUuid).select('id', 'name').first();
    return { id: row?.id ?? null, name: row?.name ?? null };
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filter = (req.query.filter as any) || {};

      const { tickets, total } = await this.service.adminGetAll({ page, limit, filter });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

      return res.json({
        success: true, statusCode: 200,
        message: tickets.length ? 'Tickets retrieved successfully' : 'No tickets found',
        data: tickets.map(this.transform),
        meta: this.getMeta(req, {
          pagination: { total, count: tickets.length, perPage: limit === -1 ? total : limit, currentPage: page, totalPages },
        }),
      });
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.service.adminGetOne(req.params.uuid);
      return res.json({ success: true, statusCode: 200, data: this.transform(ticket), meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: adminId, name: adminName } = await this.getAdmin(req);
      const ticket = await this.service.adminUpdate(req.params.uuid, req.body, adminId, adminName);
      return res.json({
        success: true, statusCode: 200,
        message: 'Ticket updated successfully',
        data: this.transform(ticket),
        meta: this.getMeta(req),
      });
    } catch (error) { next(error); }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await this.service.adminGetMessages(req.params.uuid);
      return res.json({ success: true, statusCode: 200, data: messages, meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  addMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: adminId } = await this.getAdmin(req);
      const message = await this.service.adminAddMessage(
        req.params.uuid, adminId!, req.body.message, req.body.attachments,
      );
      return res.status(201).json({ success: true, statusCode: 201, data: message, meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };

  getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await this.service.adminGetLogs(req.params.uuid);
      return res.json({ success: true, statusCode: 200, data: logs, meta: this.getMeta(req) });
    } catch (error) { next(error); }
  };
}
