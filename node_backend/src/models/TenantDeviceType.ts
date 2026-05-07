export type DeviceTypeStatus = 'active' | 'inactive' | 'deleted';

export interface TenantDeviceType {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  tenantDeviceCategoryId: number;
  name: string;
  code: string;
  isModelNumberRequired: boolean;
  isSerialNumberRequired: boolean;
  isMacAddressRequired: boolean;
  isIPAddressRequired: boolean;
  isPortRequired: boolean;
  isGpsLocationRequired: boolean;
  isMonitoringEnabled: boolean;
  icon: string | null;
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
  code: string;
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isMacAddressRequired?: boolean;
  isIPAddressRequired?: boolean;
  isPortRequired?: boolean;
  isGpsLocationRequired?: boolean;
  isMonitoringEnabled?: boolean;
  icon?: string | null;
  description?: string | null;
}

export interface UpdateDeviceTypeDTO {
  tenantDeviceCategoryId?: number;
  name?: string;
  code?: string;
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isMacAddressRequired?: boolean;
  isIPAddressRequired?: boolean;
  isPortRequired?: boolean;
  isGpsLocationRequired?: boolean;
  isMonitoringEnabled?: boolean;
  icon?: string | null;
  description?: string | null;
  status?: DeviceTypeStatus;
}
