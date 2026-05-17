export type RoutePointTemplateStatus = 'active' | 'inactive' | 'deleted';

export interface RoutePointTemplate {
  id: number;
  uuid: string;
  code: string;
  name: string;
  iconId: number | null;
  deviceTypeId: number | null;
  // Classification flag
  isDevice: boolean;
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
  // Media / Files
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
  status: RoutePointTemplateStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // joined fields
  iconName?: string | null;
  iconCode?: string | null;
  iconFileType?: string | null;
  iconSvgTemplate?: string | null;
  iconUrl?: string | null;
  deviceTypeName?: string | null;
  deviceTypeCode?: string | null;
}

export interface CreateRoutePointTemplateDTO {
  name: string;
  iconId?: number | null;
  deviceTypeId?: number | null;
  // Classification flag
  isDevice?: boolean;
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
  // Media / Files
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

export interface UpdateRoutePointTemplateDTO extends Partial<CreateRoutePointTemplateDTO> {
  status?: RoutePointTemplateStatus;
}
