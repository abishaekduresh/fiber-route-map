import db from '../config/database.js';
import { AuditLog, CreateAuditLogDTO } from '../models/AuditLog.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class AuditLogRepository {
  private readonly table = 'audit_logs';

  async create(data: CreateAuditLogDTO): Promise<void> {
    const uuid = generateUuidV7();
    const now = nowDb();

    await db(this.table).insert({
      uuid,
      actorType: data.actorType,
      actorUuid: data.actorUuid ?? null,
      actorName: data.actorName ?? null,
      actorEmail: data.actorEmail ?? null,
      actorRoles: JSON.stringify(data.actorRoles ?? []),
      action: data.action,
      resource: data.resource,
      resourceUuid: data.resourceUuid ?? null,
      resourceName: data.resourceName ?? null,
      httpMethod: data.httpMethod,
      endpoint: data.endpoint,
      statusCode: data.statusCode,
      success: data.success ? 1 : 0,
      requestBody: data.requestBody ? JSON.stringify(data.requestBody) : null,
      responseBody: data.responseBody ? JSON.stringify(data.responseBody) : null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      requestId: data.requestId ?? null,
      sessionUuid: data.sessionUuid ?? null,
      durationMs: data.durationMs ?? 0,
      errorMessage: data.errorMessage ?? null,
      createdAt: now,
    });
  }

  async getAll(params: any = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 20);

    let query = db(this.table).select('*');
    let countQuery = db(this.table);

    // Filtering
    const filter = params.filter || {};

    if (filter.actorUuid) {
      query = query.where('actorUuid', filter.actorUuid);
      countQuery = countQuery.where('actorUuid', filter.actorUuid);
    }
    if (filter.actorType) {
      query = query.where('actorType', filter.actorType);
      countQuery = countQuery.where('actorType', filter.actorType);
    }
    if (filter.action) {
      query = query.where('action', 'like', `%${filter.action}%`);
      countQuery = countQuery.where('action', 'like', `%${filter.action}%`);
    }
    if (filter.resource) {
      query = query.where('resource', filter.resource);
      countQuery = countQuery.where('resource', filter.resource);
    }
    if (filter.success !== undefined && filter.success !== '') {
      const val = String(filter.success) === 'true' ? 1 : 0;
      query = query.where('success', val);
      countQuery = countQuery.where('success', val);
    }
    if (filter.statusCode) {
      query = query.where('statusCode', Number(filter.statusCode));
      countQuery = countQuery.where('statusCode', Number(filter.statusCode));
    }
    if (filter.ipAddress) {
      query = query.where('ipAddress', 'like', `%${filter.ipAddress}%`);
      countQuery = countQuery.where('ipAddress', 'like', `%${filter.ipAddress}%`);
    }
    if (filter.requestId) {
      query = query.where('requestId', filter.requestId);
      countQuery = countQuery.where('requestId', filter.requestId);
    }
    if (filter.dateFrom) {
      query = query.where('createdAt', '>=', filter.dateFrom);
      countQuery = countQuery.where('createdAt', '>=', filter.dateFrom);
    }
    if (filter.dateTo) {
      query = query.where('createdAt', '<=', filter.dateTo);
      countQuery = countQuery.where('createdAt', '<=', filter.dateTo);
    }
    if (filter.actorEmail) {
      query = query.where('actorEmail', 'like', `%${filter.actorEmail}%`);
      countQuery = countQuery.where('actorEmail', 'like', `%${filter.actorEmail}%`);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = Number(countResult?.total || 0);

    // Sorting
    const allowedSortFields = ['createdAt', 'action', 'resource', 'statusCode', 'durationMs', 'actorEmail'];
    if (params.sort && typeof params.sort === 'string') {
      const desc = params.sort.trim().startsWith('-');
      const field = desc ? params.sort.trim().substring(1) : params.sort.trim();
      if (allowedSortFields.includes(field)) {
        query = query.orderBy(field, desc ? 'desc' : 'asc');
      }
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    let rows: any[];
    if (limit === -1) {
      rows = await query;
    } else {
      rows = await query.offset((page - 1) * limit).limit(limit);
    }

    return { logs: rows.map(this.mapRow), total };
  }

  async findByUuid(uuid: string): Promise<AuditLog | null> {
    const row = await db(this.table).where('uuid', uuid).first();
    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: any): AuditLog {
    return {
      uuid: row.uuid,
      actorType: row.actorType,
      actorUuid: row.actorUuid,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      actorRoles: row.actorRoles
        ? (typeof row.actorRoles === 'string' ? JSON.parse(row.actorRoles) : row.actorRoles)
        : [],
      action: row.action,
      resource: row.resource,
      resourceUuid: row.resourceUuid,
      resourceName: row.resourceName,
      httpMethod: row.httpMethod,
      endpoint: row.endpoint,
      statusCode: Number(row.statusCode),
      success: Boolean(row.success),
      requestBody: row.requestBody
        ? (typeof row.requestBody === 'string' ? JSON.parse(row.requestBody) : row.requestBody)
        : null,
      responseBody: row.responseBody
        ? (typeof row.responseBody === 'string' ? JSON.parse(row.responseBody) : row.responseBody)
        : null,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      sessionUuid: row.sessionUuid,
      durationMs: Number(row.durationMs),
      errorMessage: row.errorMessage,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }
}
