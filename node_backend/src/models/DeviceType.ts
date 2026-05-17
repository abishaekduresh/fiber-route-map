export type DeviceTypeStatus = 'active' | 'inactive' | 'deleted';

export interface DeviceType {
  id: number;
  uuid: string;
  code: string;
  name: string;
  deviceCategoryId: number | null;
  iconId: number | null;
  // Basic Information
  isPointNameRequired: boolean;
  isDescriptionRequired: boolean;
  isRemarksRequired: boolean;
  // Identification
  isModelNumberRequired: boolean;
  isSerialNumberRequired: boolean;
  isAssetTagRequired: boolean;
  // Networking
  isMacAddressRequired: boolean;
  isIpv4AddressRequired: boolean;
  isIpv6AddressRequired: boolean;
  isSubnetRequired: boolean;
  isGatewayRequired: boolean;
  isVlanRequired: boolean;
  // Authentication
  isUsernameRequired: boolean;
  isPasswordRequired: boolean;
  isSnmpRequired: boolean;
  // GIS / Location
  isGpsLocationRequired: boolean;
  isPoleNumberRequired: boolean;
  isLandmarkRequired: boolean;
  isAddressRequired: boolean;
  isHeightRequired: boolean;
  // Device Installation
  isRackNumberRequired: boolean;
  isPortRequired: boolean;
  isPowerSourceRequired: boolean;
  isElectricityRequired: boolean;
  // Media / File
  isPhotoRequired: boolean;
  isDocumentRequired: boolean;
  // Optical / Signal
  isSignalInputRequired: boolean;
  isSignalOutputRequired: boolean;
  isAttenuationRequired: boolean;
  isFiberCoreRequired: boolean;
  // Monitoring
  isMonitoringEnabled: boolean;
  isSnmpMonitoringEnabled: boolean;
  isRealtimeStatusEnabled: boolean;
  // Customer Mapping
  isCustomerMappingRequired: boolean;
  // Topology
  supportsInputPorts: boolean;
  supportsOutputPorts: boolean;
  supportsBidirectionalPorts: boolean;
  supportsSignalFlow: boolean;
  supportsOpticalCalculation: boolean;
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
  // Basic Information
  isPointNameRequired?: boolean;
  isDescriptionRequired?: boolean;
  isRemarksRequired?: boolean;
  // Identification
  isModelNumberRequired?: boolean;
  isSerialNumberRequired?: boolean;
  isAssetTagRequired?: boolean;
  // Networking
  isMacAddressRequired?: boolean;
  isIpv4AddressRequired?: boolean;
  isIpv6AddressRequired?: boolean;
  isSubnetRequired?: boolean;
  isGatewayRequired?: boolean;
  isVlanRequired?: boolean;
  // Authentication
  isUsernameRequired?: boolean;
  isPasswordRequired?: boolean;
  isSnmpRequired?: boolean;
  // GIS / Location
  isGpsLocationRequired?: boolean;
  isPoleNumberRequired?: boolean;
  isLandmarkRequired?: boolean;
  isAddressRequired?: boolean;
  isHeightRequired?: boolean;
  // Device Installation
  isRackNumberRequired?: boolean;
  isPortRequired?: boolean;
  isPowerSourceRequired?: boolean;
  isElectricityRequired?: boolean;
  // Media / File
  isPhotoRequired?: boolean;
  isDocumentRequired?: boolean;
  // Optical / Signal
  isSignalInputRequired?: boolean;
  isSignalOutputRequired?: boolean;
  isAttenuationRequired?: boolean;
  isFiberCoreRequired?: boolean;
  // Monitoring
  isMonitoringEnabled?: boolean;
  isSnmpMonitoringEnabled?: boolean;
  isRealtimeStatusEnabled?: boolean;
  // Customer Mapping
  isCustomerMappingRequired?: boolean;
  // Topology
  supportsInputPorts?: boolean;
  supportsOutputPorts?: boolean;
  supportsBidirectionalPorts?: boolean;
  supportsSignalFlow?: boolean;
  supportsOpticalCalculation?: boolean;
  description?: string | null;
}

export interface UpdateDeviceTypeDTO extends Partial<CreateDeviceTypeDTO> {
  status?: DeviceTypeStatus;
}
