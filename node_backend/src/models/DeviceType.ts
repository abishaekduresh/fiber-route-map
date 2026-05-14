export type DeviceTypeStatus = 'active' | 'inactive' | 'deleted';

export interface DeviceType {
  id: number;
  uuid: string;
  code: string;
  name: string;
  deviceCategoryId: number | null;
  iconId: number | null;
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
  // joined fields
  categoryName?: string | null;
  categoryCode?: string | null;
  iconName?: string | null;
  iconCode?: string | null;
  iconFileType?: string | null;
  iconSvgTemplate?: string | null;
  iconUrl?: string | null;
}

export interface CreateDeviceTypeDTO {
  name: string;
  deviceCategoryId?: number | null;
  iconId?: number | null;
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isMacAddressRequired?: boolean;
  isIPAddressRequired?: boolean;
  isGpsLocationRequired?: boolean;
  description?: string | null;
}

export interface UpdateDeviceTypeDTO extends Partial<CreateDeviceTypeDTO> {
  status?: DeviceTypeStatus;
}
