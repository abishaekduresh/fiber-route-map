export type RouteType =
  | 'fiber_route'
  | 'coaxial_route'
  | 'backbone_route'
  | 'distribution_route'
  | 'drop_route'
  | 'underground_duct'
  | 'pole_to_pole';

export type RouteStatus = 'active' | 'inactive' | 'maintenance' | 'deleted';

export type RoutePointType = 'start' | 'middle' | 'end' | 'junction' | 'pole' | 'device';

export type RouteActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'point_added'
  | 'point_updated'
  | 'point_deleted'
  | 'split'
  | 'merged';

// ─── Route ────────────────────────────────────────────────────────────────────

export interface TenantRoute {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  name: string;
  code: string;
  type: RouteType;
  routeColor: string | null;
  lineThickness: number | null;
  parentRouteId: number | null;
  description: string | null;
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTenantRouteDTO {
  name: string;
  type: RouteType;
  routeColor?: string | null;
  lineThickness?: number | null;
  parentRouteUuid?: string | null;
  description?: string | null;
  points?: CreateRoutePointDTO[];
}

export interface UpdateTenantRouteDTO {
  name?: string;
  type?: RouteType;
  routeColor?: string | null;
  lineThickness?: number | null;
  parentRouteUuid?: string | null;
  description?: string | null;
  status?: RouteStatus;
  points?: CreateRoutePointDTO[];
}

// ─── Route Point ──────────────────────────────────────────────────────────────

export interface TenantRoutePoint {
  id: number;
  uuid: string;
  tenantRouteId: number;
  sequenceNumber: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  pointType: RoutePointType;
  widgetUuid: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutePointDTO {
  uuid?: string;
  sequenceNumber: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  pointType: RoutePointType;
  widgetUuid?: string | null;
  remarks?: string | null;
}

// ─── Route History ────────────────────────────────────────────────────────────

export interface TenantRouteHistory {
  id: number;
  uuid: string;
  tenantRouteId: number;
  actionType: RouteActionType;
  changedByUserId: number | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface LogHistoryDTO {
  tenantRouteId: number;
  actionType: RouteActionType;
  changedByUserId?: number | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  remarks?: string | null;
}
