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
    const rows = await db(this.pointsTable)
      .leftJoin('tenant_route_point_details as d', `${this.pointsTable}.tenantRoutePointDetailId`, 'd.id')
      .where({ [`${this.pointsTable}.tenantRouteId`]: routeId })
      .orderBy(`${this.pointsTable}.sequenceNumber`, 'asc')
      .select(
        `${this.pointsTable}.*`,
        'd.pointName as d_pointName',
        'd.poleNumber as d_poleNumber',
        'd.landmark as d_landmark',
        'd.addressLine1 as d_addressLine1',
        'd.ownerName as d_ownerName',
        'd.contactNumber as d_contactNumber',
        'd.heightMeters as d_heightMeters',
        'd.electricityAvailable as d_electricityAvailable',
        'd.remarks as d_remarks',
        'd.metadata as d_metadata',
      );

    return rows.map((r: any) => {
      // Reconstruct fieldData from detail row if present
      let fieldData: Record<string, string> | null = null;
      if (r.tenantRoutePointDetailId != null) {
        const fd: Record<string, string> = {};
        if (r.d_pointName)        fd.pointName     = r.d_pointName;
        if (r.d_poleNumber)       fd.poleNumber    = r.d_poleNumber;
        if (r.d_landmark)         fd.landmark      = r.d_landmark;
        if (r.d_addressLine1)     fd.address       = r.d_addressLine1;
        if (r.d_ownerName)        fd.ownerName     = r.d_ownerName;
        if (r.d_contactNumber)    fd.contactNumber = r.d_contactNumber;
        if (r.d_heightMeters != null) fd.height    = String(r.d_heightMeters);
        if (r.d_electricityAvailable != null) fd.electricity = r.d_electricityAvailable ? 'true' : 'false';
        if (r.d_remarks)          fd.remarks       = r.d_remarks;
        const meta = r.d_metadata
          ? (typeof r.d_metadata === 'string' ? JSON.parse(r.d_metadata) : r.d_metadata)
          : {};
        Object.assign(fd, meta);
        if (Object.keys(fd).length > 0) fieldData = fd;
      }

      const {
        d_pointName, d_poleNumber, d_landmark, d_addressLine1,
        d_ownerName, d_contactNumber, d_heightMeters,
        d_electricityAvailable, d_remarks, d_metadata,
        ...point
      } = r;
      return { ...point, fieldData } as TenantRoutePoint;
    });
  }

  // fieldData keys that map to named columns in tenant_route_point_details
  private readonly NAMED_FD_KEYS = new Set([
    'pointName', 'poleNumber', 'landmark', 'address',
    'ownerName', 'contactNumber', 'height', 'electricity', 'remarks',
  ]);

  async upsertPoints(routeId: number, points: CreateRoutePointDTO[]): Promise<void> {
    // Clean up detail rows for old points before deleting them
    const oldPointIds: number[] = await db(this.pointsTable)
      .where({ tenantRouteId: routeId })
      .pluck('id');
    if (oldPointIds.length > 0) {
      await db('tenant_route_point_details')
        .whereIn('tenantRoutePointId', oldPointIds)
        .delete();
    }

    // Delete old points then re-insert
    await db(this.pointsTable).where({ tenantRouteId: routeId }).delete();
    if (points.length === 0) return;

    const now = nowDb();
    const rows = points.map(p => ({
      uuid:                    generateUuidV7(),
      tenantRouteId:           routeId,
      sequenceNumber:          p.sequenceNumber,
      latitude:                p.latitude,
      longitude:               p.longitude,
      altitude:                p.altitude                ?? null,
      pointType:               p.pointType,
      pointIcon:               p.pointIcon               ?? null,
      deviceTypeUuid:          p.deviceTypeUuid          ?? null,
      routePointTemplateUuid:  p.routePointTemplateUuid  ?? null,
      pointName:               p.pointName               ?? null,
      pointDescription:        p.pointDescription        ?? null,
      remarks:                 p.remarks                 ?? null,
      createdAt:               now,
      updatedAt:               now,
    }));
    await db(this.pointsTable).insert(rows);

    // Insert tenant_route_point_details for points that have a template + fieldData
    const pointsWithDetails = points.filter(
      p => p.routePointTemplateUuid && p.fieldData && Object.keys(p.fieldData).length > 0,
    );
    if (pointsWithDetails.length === 0) return;

    // Resolve template uuid → id in one query
    const templateUuids = [...new Set(pointsWithDetails.map(p => p.routePointTemplateUuid!))];
    const templateRows: { id: number; uuid: string }[] = await db('route_point_templates')
      .whereIn('uuid', templateUuids)
      .select('id', 'uuid');
    const templateIdMap = new Map(templateRows.map(r => [r.uuid, r.id]));

    // Fetch newly inserted point ids by sequenceNumber
    const insertedPoints: { id: number; sequenceNumber: number }[] = await db(this.pointsTable)
      .where({ tenantRouteId: routeId })
      .select('id', 'sequenceNumber');
    const seqToPointId = new Map(insertedPoints.map(r => [r.sequenceNumber, r.id]));

    for (const p of pointsWithDetails) {
      const templateId = templateIdMap.get(p.routePointTemplateUuid!);
      if (!templateId) continue;
      const pointId = seqToPointId.get(p.sequenceNumber);
      if (!pointId) continue;

      const fd = p.fieldData!;

      // Metadata: all keys NOT in named columns
      const metadata: Record<string, string> = {};
      for (const [k, v] of Object.entries(fd)) {
        if (!this.NAMED_FD_KEYS.has(k) && v != null && v !== '') {
          metadata[k] = v;
        }
      }

      const [detailId] = await db('tenant_route_point_details').insert({
        uuid:                 generateUuidV7(),
        tenantRoutePointId:   pointId,
        routePointTemplateId: templateId,
        pointName:            fd.pointName     ?? null,
        poleNumber:           fd.poleNumber    ?? null,
        landmark:             fd.landmark      ?? null,
        addressLine1:         fd.address       ?? null,
        ownerName:            fd.ownerName     ?? null,
        contactNumber:        fd.contactNumber ?? null,
        heightMeters:         fd.height        ? (parseFloat(fd.height) || null) : null,
        electricityAvailable: fd.electricity === 'true' || fd.electricity === '1' ? 1 : 0,
        remarks:              fd.remarks       ?? null,
        metadata:             Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        createdAt:            now,
        updatedAt:            now,
      });

      await db(this.pointsTable)
        .where({ id: pointId })
        .update({ tenantRoutePointDetailId: detailId });
    }
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
