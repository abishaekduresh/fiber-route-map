import { TenantRouteRepository } from '../repositories/TenantRouteRepository.js';
import { CreateTenantRouteDTO, UpdateTenantRouteDTO } from '../models/TenantRoute.js';

export class TenantRouteService {
  constructor(private repo: TenantRouteRepository) {}

  async getAll(tenantBusinessId: number, params: any) {
    return this.repo.getAll(tenantBusinessId, params);
  }

  async getOne(uuid: string, tenantBusinessId: number) {
    const route = await this.repo.findByUuid(uuid, tenantBusinessId);
    if (!route) {
      const e = new Error('Route not found'); (e as any).status = 404; throw e;
    }
    return route;
  }

  private async generateCode(): Promise<string> {
    const last = await this.repo.getLastCode();
    let next = 1;
    if (last) {
      const n = parseInt(last.substring(3), 10); // strip 'TRT'
      if (!isNaN(n)) next = n + 1;
    }
    return `TRT${String(next).padStart(4, '0')}`;
  }

  async create(
    tenantBusinessId: number,
    data: CreateTenantRouteDTO,
    userId: number | null,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const code = await this.generateCode();

    // Resolve parentRouteUuid → parentRouteId
    let parentRouteId: number | null = null;
    if (data.parentRouteUuid) {
      parentRouteId = await this.repo.findIdByUuid(data.parentRouteUuid);
      if (!parentRouteId) {
        const e = new Error('Parent route not found'); (e as any).status = 404; throw e;
      }
    }

    const route = await this.repo.create({ ...data, code, tenantBusinessId, parentRouteId });

    await this.repo.logHistory({
      tenantRouteId:   route.id,
      actionType:      'created',
      changedByUserId: userId,
      newData:         { name: route.name, code: route.code, type: route.type, status: route.status },
      ipAddress:       meta.ipAddress,
      userAgent:       meta.userAgent,
    });

    return route;
  }

  async update(
    uuid: string,
    tenantBusinessId: number,
    data: UpdateTenantRouteDTO,
    userId: number | null,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const current = await this.getOne(uuid, tenantBusinessId);

    // Resolve parentRouteUuid → parentRouteId
    let parentRouteId: number | null | undefined = undefined;
    if ('parentRouteUuid' in data) {
      if (data.parentRouteUuid) {
        // Prevent self-referential parent
        if (data.parentRouteUuid === uuid) {
          const e = new Error('A route cannot be its own parent'); (e as any).status = 422; throw e;
        }
        parentRouteId = await this.repo.findIdByUuid(data.parentRouteUuid);
        if (!parentRouteId) {
          const e = new Error('Parent route not found'); (e as any).status = 404; throw e;
        }
      } else {
        parentRouteId = null;
      }
    }

    // Handle points upsert
    const points = data.points;
    const { points: _p, parentRouteUuid: _puuid, ...updateFields } = data;

    const updateData: any = { ...updateFields };
    if (parentRouteId !== undefined) updateData.parentRouteId = parentRouteId;

    await this.repo.update(uuid, tenantBusinessId, updateData);

    if (points !== undefined) {
      await this.repo.upsertPoints(current.id, points);

      await this.repo.logHistory({
        tenantRouteId:   current.id,
        actionType:      'point_updated',
        changedByUserId: userId,
        newData:         { pointsCount: points.length },
        ipAddress:       meta.ipAddress,
        userAgent:       meta.userAgent,
      });
    }

    await this.repo.logHistory({
      tenantRouteId:   current.id,
      actionType:      'updated',
      changedByUserId: userId,
      oldData:         { name: current.name, code: current.code, type: current.type, status: current.status },
      newData:         updateFields,
      ipAddress:       meta.ipAddress,
      userAgent:       meta.userAgent,
    });

    return this.getOne(uuid, tenantBusinessId);
  }

  async delete(
    uuid: string,
    tenantBusinessId: number,
    userId: number | null,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const current = await this.getOne(uuid, tenantBusinessId);
    const ok = await this.repo.delete(uuid, tenantBusinessId);
    if (!ok) { const e = new Error('Delete failed'); (e as any).status = 500; throw e; }

    await this.repo.logHistory({
      tenantRouteId:   current.id,
      actionType:      'deleted',
      changedByUserId: userId,
      oldData:         { name: current.name, code: current.code, type: current.type },
      ipAddress:       meta.ipAddress,
      userAgent:       meta.userAgent,
    });
  }

  async getHistory(uuid: string, tenantBusinessId: number) {
    const route = await this.getOne(uuid, tenantBusinessId);
    return this.repo.getHistory(route.id);
  }
}
