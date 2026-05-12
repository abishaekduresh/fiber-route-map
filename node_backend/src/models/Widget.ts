export type WidgetType =
  | 'active_device'
  | 'passive_device'
  | 'power_device'
  | 'junction'
  | 'fiber_terminal'
  | 'splitter'
  | 'coupler'
  | 'route_point';

export type WidgetIconType = 'svg' | 'png' | 'webp';

export type WidgetStatus = 'active' | 'inactive' | 'deleted';

export interface Widget {
  id: number;
  uuid: string;
  code: string;
  name: string;
  type: WidgetType;
  iconType: WidgetIconType;
  svgTemplate: string | null;
  iconUrl: string | null;
  width: number;
  height: number;
  status: WidgetStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateWidgetDTO {
  name: string;
  type: WidgetType;
  iconType: WidgetIconType;
  svgTemplate?: string | null;
  iconUrl?: string | null;
  width: number;
  height: number;
}

export interface UpdateWidgetDTO {
  name?: string;
  type?: WidgetType;
  iconType?: WidgetIconType;
  svgTemplate?: string | null;
  iconUrl?: string | null;
  width?: number;
  height?: number;
  status?: WidgetStatus;
}
