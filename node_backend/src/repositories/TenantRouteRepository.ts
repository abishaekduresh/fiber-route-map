import db from '../config/database.js';
import {
  TenantRoute, TenantRoutePoint,
  CreateTenantRouteDTO, UpdateTenantRouteDTO,
  CreateRoutePointDTO, LogHistoryDTO,
} from '../models/TenantRoute.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class TenantRouteRepository {
  private table       = 'tenant_routes';
  private pointsTable = 'tenant_route_points';
  private histTable   = 'tenant_route_histories';

  // ── Routes ──────────────────────────────────────────────────────────────────

  async getAll(
    tenantBusinessId: number,
    params: { page?: number; limit?: number; filter?: { search?: string; type?: string; status?: string } } = {},
  ): Promise<{ routes: any[]; total: number }> {
    const page  = Number(params.page)  || 1;
    const limit = Number(params.limit) === -1 ? -1 : (Number(params.limit) || 10);
    const offset = limit === -1 ? 0 : (page - 1) * limit;

    const base = () =>
      db(this.table)
        .where(`${this.table}.tenantBusinessId`, tenantBusinessId)
        .whereNot(`${this.table}.status`, 'deleted');

    let query = base()
      .select(
        `${this.table}.*`,
        db.raw('(SELECT COUNT(*) FROM ?? WHERE tenantRouteId = ??.id) as pointsCount', [this.pointsTable, this.table]),
        db.raw('(SELECT uuid FROM ?? WHERE id = ??.parentRouteId) as parentRouteUuid', [this.table, this.table]),
        db.raw('(SELECT name FROM ?? WHERE id = ??.parentRouteId) as parentRouteName', [this.table, this.table]),
      );

    if (params.filter?.search) {
      query = query.where((qb: any) => {
        qb.where(`${this.table}.name`, 'like', `%${params.filter!.search}%`)
          .orWhere(`${this.table}.code`, 'like', `%${params.filter!.search}%`);
      });
    }
    if (params.filter?.type)   query = query.where(`${this.table}.type`,   params.filter.type);
    if (params.filter?.status && params.filter.status !== 'all') {
      query = query.where(`${this.table}.status`, params.filter.status);
    }

    const countResult = await base().count('* as total').first();
    const total = Number((countResult as any)?.total || 0);

    query = (query as any).orderBy(`${this.table}.createdAt`, 'desc');
    if (limit !== -1) query = (query as any).limit(limit).offset(offset);

    const routes = await query;
    return { routes, total };
  }

  async findByUuid(uuid: string, tenantBusinessId: number): Promise<any | null> {
    const route = await db(this.table)
      .where({ [`${this.table}.uuid`]: uuid, [`${this.table}.tenantBusinessId`]: tenantBusinessId })
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        db.raw('(SELECT uuid FROM ?? WHERE id = ??.parentRouteId) as parentRouteUuid', [this.table, this.table]),
        db.raw('(SELECT name FROM ?? WHERE id = ??.parentRouteId) as parentRouteName', [this.table, this.table]),
      )
      .first();
    if (!route) return null;
    route.points = await this.getPoints(route.id);
    return route;
  }

  async findById(id: number): Promise<TenantRoute | null> {
    return (await db(this.table).where({ id }).first()) ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'TRT%')
      .orderByRaw("CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC")
      .select('code')
      .first();
    return row?.code ?? null;
  }

  async findByCode(code: string, tenantBusinessId: number): Promise<{ uuid: string } | null> {
    return (await db(this.table)
      .where({ code, tenantBusinessId })
      .whereNot('status', 'deleted')
      .select('uuid')
      .first()) ?? null;
  }

  async findIdByUuid(uuid: string): Promise<number | null> {
    const row = await db(this.table).where({ uuid }).select('id').first();
    return row?.id ?? null;
  }

  async create(data: CreateTenantRouteDTO & { code: string; tenantBusinessId: number; parentRouteId: number | null }): Promise<any> {
    const uuid = generateUuidV7();
    const now  = nowDb();
    await db(this.table).insert({
      uuid,
      tenantBusinessId: data.tenantBusinessId,
      name:             data.name,
      code:             data.code,
      type:             data.type,
      routeColor:       data.routeColor    ?? null,
      lineThickness:    data.lineThickness ?? null,
      parentRouteId:    data.parentRouteId ?? null,
      description:      data.description   ?? null,
      status:           'active',
      createdAt:        now,
      updatedAt:        now,
    });
    const route = await db(this.table).where({ uuid }).first();

    if (data.points && data.points.length > 0) {
      await this.upsertPoints(route.id, data.points);
    }

    return this.findByUuid(uuid, data.tenantBusinessId);
  }

  async update(uuid: string, tenantBusinessId: number, data: Partial<TenantRoute> & { parentRouteId?: number | null }): Promise<boolean> {
    const rows = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .whereNot('status', 'deleted')
      .update({ ...data, updatedAt: nowDb() });
    return rows > 0;
  }

  async delete(uuid: string, tenantBusinessId: number): Promise<boolean> {
    const rows = await db(this.table)
      .where({ uuid, tenantBusinessId })
      .whereNot('status', 'deleted')
      .update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }

  // ── Points ──────────────────────────────────────────────────────────────────

  async getPoints(routeId: number): Promise<TenantRoutePoint[]> {
    return db(this.pointsTable)
      .where({ tenantRouteId: routeId })
      .orderBy('sequenceNumber', 'asc');
  }

  async upsertPoints(routeId: number, points: CreateRoutePointDTO[]): Promise<void> {
    // Delete old points then re-insert in one operation
    await db(this.pointsTable).where({ tenantRouteId: routeId }).delete();
    if (points.length === 0) return;

    const now = nowDb();
    const rows = points.map(p => ({
      uuid:             generateUuidV7(),
      tenantRouteId:    routeId,
      sequenceNumber:   p.sequenceNumber,
      latitude:         p.latitude,
      longitude:        p.longitude,
      altitude:         p.altitude         ?? null,
      pointType:        p.pointType,
      pointIcon:        p.pointIcon        ?? null,
      deviceTypeUuid:   p.deviceTypeUuid   ?? null,
      pointName:        p.pointName        ?? null,
      pointDescription: p.pointDescription ?? null,
      remarks:          p.remarks          ?? null,
      createdAt:        now,
      updatedAt:        now,
    }));
    await db(this.pointsTable).insert(rows);
  }

  // ── History ─────────────────────────────────────────────────────────────────

  async logHistory(data: LogHistoryDTO): Promise<void> {
    try {
      await db(this.histTable).insert({
        uuid:            generateUuidV7(),
        tenantRouteId:   data.tenantRouteId,
        actionType:      data.actionType,
        changedByUserId: data.changedByUserId ?? null,
        oldData:         data.oldData ? JSON.stringify(data.oldData) : null,
        newData:         data.newData ? JSON.stringify(data.newData) : null,
        ipAddress:       data.ipAddress  ?? null,
        userAgent:       data.userAgent  ?? null,
        remarks:         data.remarks    ?? null,
        createdAt:       nowDb(),
      });
    } catch {
      // History logging is best-effort — don't fail the main operation
    }
  }

  async getHistory(tenantRouteId: number): Promise<any[]> {
    return db(this.histTable)
      .where({ tenantRouteId })
      .orderBy('createdAt', 'desc');
  }
}
