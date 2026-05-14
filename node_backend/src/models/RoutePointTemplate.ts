export type RoutePointTemplateStatus = 'active' | 'inactive' | 'deleted';

export interface RoutePointTemplate {
  id: number;
  uuid: string;
  code: string;
  name: string;
  iconId: number | null;
  deviceTypeId: number | null;
  isDevice: boolean;
  isPointNameRequired: boolean;
  isPoleNumberRequired: boolean;
  isLandmarkRequired: boolean;
  isAddressRequired: boolean;
  isPhotoRequired: boolean;
  isHeightRequired: boolean;
  isOwnerNameRequired: boolean;
  isContactNumberRequired: boolean;
  isElectricityAvailable: boolean;
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
  isDevice?: boolean;
  isPointNameRequired?: boolean;
  isPoleNumberRequired?: boolean;
  isLandmarkRequired?: boolean;
  isAddressRequired?: boolean;
  isPhotoRequired?: boolean;
  isHeightRequired?: boolean;
  isOwnerNameRequired?: boolean;
  isContactNumberRequired?: boolean;
  isElectricityAvailable?: boolean;
  description?: string | null;
}

export interface UpdateRoutePointTemplateDTO extends Partial<CreateRoutePointTemplateDTO> {
  status?: RoutePointTemplateStatus;
}
