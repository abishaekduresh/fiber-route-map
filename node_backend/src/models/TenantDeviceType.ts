export type DeviceTypeStatus = 'active' | 'inactive' | 'deleted';

export interface TenantDeviceType {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  tenantDeviceCategoryId: number;
  name: string;
  code: string;
  widgetUuid: string | null;
  isModelNumberRequired: boolean;
  isSerialNumberRequired: boolean;
  isMacAddressRequired: boolean;
  isIPAddressRequired: boolean;
  isGpsLocationRequired: boolean;
  description: string | null;
  status: DeviceTypeStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // joined
  categoryName?: string | null;
}

export interface CreateDeviceTypeDTO {
  tenantDeviceCategoryId: number;
  name: string;
  widgetUuid?: string | null;
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isMacAddressRequired?: boolean;
  isIPAddressRequired?: boolean;
  isGpsLocationRequired?: boolean;
  description?: string | null;
}

export interface UpdateDeviceTypeDTO {
  tenantDeviceCategoryId?: number;
  name?: string;
  widgetUuid?: string | null;
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isMacAddressRequired?: boolean;
  isIPAddressRequired?: boolean;
  isGpsLocationRequired?: boolean;
  description?: string | null;
  status?: DeviceTypeStatus;
}
