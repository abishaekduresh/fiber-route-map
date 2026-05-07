export type DeviceCategoryStatus = 'active' | 'inactive' | 'deleted';

export interface TenantDeviceCategory {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  name: string;
  code: string;
  description: string | null;
  status: DeviceCategoryStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDeviceCategoryDTO {
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateDeviceCategoryDTO {
  name?: string;
  code?: string;
  description?: string | null;
  status?: DeviceCategoryStatus;
}
