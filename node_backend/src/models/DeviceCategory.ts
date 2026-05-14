export type DeviceCategoryStatus = 'active' | 'inactive' | 'deleted';

export interface DeviceCategory {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  status: DeviceCategoryStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDeviceCategoryDTO {
  name: string;
  description?: string | null;
}

export interface UpdateDeviceCategoryDTO {
  name?: string;
  description?: string | null;
  status?: DeviceCategoryStatus;
}
