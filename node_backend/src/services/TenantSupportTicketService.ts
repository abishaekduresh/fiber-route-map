import { TenantSupportTicketRepository } from '../repositories/TenantSupportTicketRepository.js';
import { CreateTicketDTO, UpdateTicketDTO, SLA_TIMES, TicketPriority } from '../models/TenantSupportTicket.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  open:        ['assigned', 'closed'],
  assigned:    ['in_progress', 'on_hold', 'closed'],
  in_progress: ['on_hold', 'resolved', 'closed'],
  on_hold:     ['in_progress', 'closed'],
  resolved:    ['closed', 'reopened'],
  closed:      ['reopened'],
  reopened:    ['assigned', 'in_progress', 'on_hold', 'closed'],
};

export class TenantSupportTicketService {
  constructor(private repo: TenantSupportTicketRepository) {}

  // ─── Ticket Number ─────────────────────────────────────────────────────────

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.repo.getLastTicketNumber(year);
    let seq = 1;
    if (last) {
      const parts = last.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `TKT-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ─── Tenant-facing ─────────────────────────────────────────────────────────

  async getAll(tenantId: number, params: any) {
    return this.repo.getAll({ tenantId, ...params });
  }

  async getOne(uuid: string, tenantId: number) {
    const ticket = await this.repo.findByUuid(uuid, tenantId);
    if (!ticket) {
      const e = new Error('Ticket not found'); (e as any).status = 404; throw e;
    }
    return ticket;
  }

  async create(
    tenantId: number,
    tenantBusinessId: number,
    data: CreateTicketDTO,
    performedBy: number | null,
    performerName?: string | null,
  ) {
    const priority = (data.priority ?? 'medium') as TicketPriority;
    const impactLevel = data.impactLevel ?? 'medium';
    const sla = SLA_TIMES[priority];
    const ticketNumber = await this.generateTicketNumber();
    const dueAt = new Date(Date.now() + sla.resolution * 60 * 1000);

    const ticket = await this.repo.create({
      ...data,
      tenantId,
      tenantBusinessId,
      ticketNumber,
      slaResponseTime: sla.response,
      slaResolutionTime: sla.resolution,
      dueAt,
      priority,
      impactLevel,
      category: data.category,
    });

    await this.repo.addLog({
      ticketId: ticket.id,
      action: 'created',
      newValue: ticket.ticketNumber,
      performedBy,
      performerName: performerName ?? null,
    });

    return ticket;
  }

  async update(
    uuid: string,
    tenantId: number,
    data: UpdateTicketDTO,
    performedBy: number | null,
    performerName?: string | null,
  ) {
    const current = await this.getOne(uuid, tenantId);

    if (data.status && data.status !== current.status) {
      const allowed = VALID_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(data.status)) {
        const e = new Error(`Cannot transition from '${current.status}' to '${data.status}'`);
        (e as any).status = 422; throw e;
      }
    }

    await this.repo.update(uuid, data, tenantId);

    if (data.status && data.status !== current.status) {
      await this.repo.addLog({
        ticketId: current.id,
        action: 'status_changed',
        oldValue: current.status,
        newValue: data.status,
        performedBy,
        performerName: performerName ?? null,
      });
    }

    return this.getOne(uuid, tenantId);
  }

  async addMessage(uuid: string, tenantId: number, senderId: number, message: string, attachments?: any) {
    const ticket = await this.getOne(uuid, tenantId);
    return this.repo.addMessage({
      ticketId: ticket.id,
      senderType: 'tenant',
      senderId,
      message,
      attachments,
    });
  }

  async getMessages(uuid: string, tenantId: number) {
    const ticket = await this.getOne(uuid, tenantId);
    return this.repo.getMessages(ticket.id);
  }

  async getLogs(uuid: string, tenantId: number) {
    const ticket = await this.getOne(uuid, tenantId);
    return this.repo.getLogs(ticket.id);
  }

  async close(uuid: string, tenantId: number, performedBy: number | null, performerName?: string | null) {
    return this.update(uuid, tenantId, { status: 'closed' }, performedBy, performerName);
  }

  // ─── Admin-facing ──────────────────────────────────────────────────────────

  async adminGetAll(params: any) {
    return this.repo.getAll(params);
  }

  async adminGetOne(uuid: string) {
    const ticket = await this.repo.findByUuid(uuid);
    if (!ticket) {
      const e = new Error('Ticket not found'); (e as any).status = 404; throw e;
    }
    return ticket;
  }

  async adminUpdate(
    uuid: string,
    data: UpdateTicketDTO,
    performedBy: number | null,
    performerName?: string | null,
  ) {
    const current = await this.adminGetOne(uuid);

    if (data.status && data.status !== current.status) {
      const allowed = VALID_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(data.status)) {
        const e = new Error(`Cannot transition from '${current.status}' to '${data.status}'`);
        (e as any).status = 422; throw e;
      }
    }

    await this.repo.update(uuid, data);

    if (data.status && data.status !== current.status) {
      await this.repo.addLog({
        ticketId: current.id,
        action: 'status_changed',
        oldValue: current.status,
        newValue: data.status,
        performedBy,
        performerName: performerName ?? null,
      });
    }

    if (data.assignedTo !== undefined && data.assignedTo !== current.assignedTo) {
      await this.repo.addLog({
        ticketId: current.id,
        action: 'assigned',
        oldValue: current.assignedTo ? String(current.assignedTo) : null,
        newValue: data.assignedTo ? String(data.assignedTo) : null,
        performedBy,
        performerName: performerName ?? null,
      });
    }

    return this.adminGetOne(uuid);
  }

  async adminAddMessage(uuid: string, senderId: number, message: string, attachments?: any) {
    const ticket = await this.adminGetOne(uuid);
    return this.repo.addMessage({
      ticketId: ticket.id,
      senderType: 'admin',
      senderId,
      message,
      attachments,
    });
  }

  async adminGetMessages(uuid: string) {
    const ticket = await this.adminGetOne(uuid);
    return this.repo.getMessages(ticket.id);
  }

  async adminGetLogs(uuid: string) {
    const ticket = await this.adminGetOne(uuid);
    return this.repo.getLogs(ticket.id);
  }
}
