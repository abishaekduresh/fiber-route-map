import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import {
  TenantSupportTicket,
  TenantTicketMessage,
  TenantTicketLog,
  CreateTicketDTO,
  UpdateTicketDTO,
} from '../models/TenantSupportTicket.js';
import { nowDb } from '../utils/time.js';

export class TenantSupportTicketRepository {
  private table = 'tenant_support_tickets';
  private msgTable = 'tenant_ticket_messages';
  private logTable = 'tenant_ticket_logs';

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async getAll(params: {
    tenantId?: number;
    page?: number;
    limit?: number;
    filter?: { status?: string; priority?: string; category?: string; search?: string };
  } = {}): Promise<{ tickets: any[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;
    const f = params.filter || {};

    const base = () => {
      let q = db(this.table)
        .leftJoin('tenants', `${this.table}.tenantId`, 'tenants.id')
        .leftJoin('tenant_business', `${this.table}.tenantBusinessId`, 'tenant_business.id')
        .leftJoin('users as assignee', `${this.table}.assignedTo`, 'assignee.id')
        .whereNull(`${this.table}.deletedAt`);
      if (params.tenantId) q = q.where(`${this.table}.tenantId`, params.tenantId);
      if (f.status && f.status !== 'all') q = q.where(`${this.table}.status`, f.status);
      if (f.priority && f.priority !== 'all') q = q.where(`${this.table}.priority`, f.priority);
      if (f.category && f.category !== 'all') q = q.where(`${this.table}.category`, f.category);
      if (f.search) {
        q = q.where((b: any) => {
          b.where(`${this.table}.subject`, 'like', `%${f.search}%`)
            .orWhere(`${this.table}.ticketNumber`, 'like', `%${f.search}%`);
        });
      }
      return q;
    };

    const countResult = await base().count(`${this.table}.id as total`).first();
    const total = Number(countResult?.total || 0);

    let query = base()
      .select(
        `${this.table}.*`,
        'tenants.name as tenantName',
        'tenants.uuid as tenantUuid',
        'tenant_business.name as businessName',
        'assignee.name as assigneeName',
        'assignee.uuid as assigneeUuid',
      )
      .orderBy(`${this.table}.createdAt`, 'desc');

    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const tickets = await query;
    return { tickets, total };
  }

  async findByUuid(uuid: string, tenantId?: number): Promise<any | null> {
    let q = db(this.table)
      .leftJoin('tenants', `${this.table}.tenantId`, 'tenants.id')
      .leftJoin('tenant_business', `${this.table}.tenantBusinessId`, 'tenant_business.id')
      .leftJoin('users as assignee', `${this.table}.assignedTo`, 'assignee.id')
      .where(`${this.table}.uuid`, uuid)
      .whereNull(`${this.table}.deletedAt`);
    if (tenantId) q = q.where(`${this.table}.tenantId`, tenantId);
    return q.select(
      `${this.table}.*`,
      'tenants.name as tenantName',
      'tenants.uuid as tenantUuid',
      'tenant_business.name as businessName',
      'assignee.name as assigneeName',
      'assignee.uuid as assigneeUuid',
    ).first() ?? null;
  }

  async getLastTicketNumber(year: number): Promise<string | null> {
    const prefix = `TKT-${year}-`;
    const row = await db(this.table)
      .where('ticketNumber', 'like', `${prefix}%`)
      .orderBy('id', 'desc')
      .select('ticketNumber')
      .first();
    return row?.ticketNumber ?? null;
  }

  async create(data: CreateTicketDTO & {
    tenantId: number;
    tenantBusinessId: number;
    ticketNumber: string;
    slaResponseTime: number;
    slaResolutionTime: number;
    dueAt: Date;
    priority: string;
    impactLevel: string;
    category: string;
  }): Promise<any> {
    const uuid = uuidv4();
    const now = nowDb();
    await db(this.table).insert({
      uuid,
      tenantId: data.tenantId,
      tenantBusinessId: data.tenantBusinessId,
      ticketNumber: data.ticketNumber,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      impactLevel: data.impactLevel,
      status: 'open',
      slaResponseTime: data.slaResponseTime,
      slaResolutionTime: data.slaResolutionTime,
      dueAt: data.dueAt,
      relatedNodeId: data.relatedNodeId ?? null,
      relatedRouteId: data.relatedRouteId ?? null,
      relatedCustomerId: data.relatedCustomerId ?? null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: now,
      updatedAt: now,
    });
    return this.findByUuid(uuid, data.tenantId);
  }

  async update(uuid: string, data: UpdateTicketDTO, tenantId?: number): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    if (payload.attachments !== undefined) payload.attachments = JSON.stringify(payload.attachments);
    if (payload.metadata !== undefined) payload.metadata = JSON.stringify(payload.metadata);
    let q = db(this.table).where('uuid', uuid);
    if (tenantId) q = q.where('tenantId', tenantId);
    const result = await q.update(payload);
    return result > 0;
  }

  async softDelete(uuid: string, tenantId?: number): Promise<boolean> {
    let q = db(this.table).where('uuid', uuid);
    if (tenantId) q = q.where('tenantId', tenantId);
    const result = await q.update({ status: 'closed', deletedAt: nowDb(), updatedAt: nowDb() });
    return result > 0;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(ticketId: number): Promise<any[]> {
    return db(this.msgTable)
      .where('ticketId', ticketId)
      .orderBy('createdAt', 'asc')
      .select('*');
  }

  async addMessage(data: {
    ticketId: number;
    senderType: string;
    senderId: number;
    message: string;
    attachments?: any;
  }): Promise<any> {
    const [id] = await db(this.msgTable).insert({
      ticketId: data.ticketId,
      senderType: data.senderType,
      senderId: data.senderId,
      message: data.message,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      createdAt: nowDb(),
    });
    return db(this.msgTable).where('id', id).first();
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────

  async getLogs(ticketId: number): Promise<any[]> {
    return db(this.logTable)
      .where('ticketId', ticketId)
      .orderBy('performedAt', 'asc')
      .select('*');
  }

  async addLog(data: {
    ticketId: number;
    action: string;
    oldValue?: string | null;
    newValue?: string | null;
    performedBy: number | null;
  }): Promise<void> {
    await db(this.logTable).insert({
      ticketId: data.ticketId,
      action: data.action,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      performedBy: data.performedBy,
      performedAt: nowDb(),
    });
  }
}
