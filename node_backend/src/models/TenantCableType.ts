export type CableTypeStatus = 'active' | 'inactive' | 'blocked' | 'deleted';

export interface TenantCableType {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  name: string;
  code: string;
  tubeCount: number;
  fiberCoreCount: number;
  cableDiameter: number;
  description: string | null;
  status: CableTypeStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCableTypeDTO {
  name: string;
  code: string;
  tubeCount?: number;
  fiberCoreCount: number;
  cableDiameter: number;
  description?: string | null;
}

export interface UpdateCableTypeDTO {
  name?: string;
  code?: string;
  tubeCount?: number;
  fiberCoreCount?: number;
  cableDiameter?: number;
  description?: string | null;
  status?: CableTypeStatus;
}
