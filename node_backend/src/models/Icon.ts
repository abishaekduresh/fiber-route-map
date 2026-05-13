export type IconType =
  | 'active_device'
  | 'passive_device'
  | 'power_device'
  | 'junction'
  | 'fiber_terminal'
  | 'splitter'
  | 'coupler'
  | 'route_point'
  | 'customer_end'
  | 'flag';

export type IconFileType = 'svg' | 'png' | 'webp';

export type IconStatus = 'active' | 'inactive' | 'deleted';

export interface Icon {
  id: number;
  uuid: string;
  code: string;
  name: string;
  type: IconType;
  iconType: IconFileType;
  svgTemplate: string | null;
  iconUrl: string | null;
  width: number;
  height: number;
  status: IconStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateIconDTO {
  name: string;
  type: IconType;
  iconType: IconFileType;
  svgTemplate?: string | null;
  iconUrl?: string | null;
  width: number;
  height: number;
}

export interface UpdateIconDTO {
  name?: string;
  type?: IconType;
  iconType?: IconFileType;
  svgTemplate?: string | null;
  iconUrl?: string | null;
  width?: number;
  height?: number;
  status?: IconStatus;
}
