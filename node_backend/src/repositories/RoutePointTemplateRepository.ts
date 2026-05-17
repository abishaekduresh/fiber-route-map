import db from '../config/database.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';
import type { RoutePointTemplate, CreateRoutePointTemplateDTO, UpdateRoutePointTemplateDTO } from '../models/RoutePointTemplate.js';

export class RoutePointTemplateRepository {
  private table = 'route_point_templates';

  private baseQuery() {
    return db(this.table)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .leftJoin('device_types', `${this.table}.deviceTypeId`, 'device_types.id')
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
        'device_types.name as deviceTypeName',
        'device_types.code as deviceTypeCode',
      );
  }

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ templates: RoutePointTemplate[]; total: number }> {
    const page   = params.page  ?? 1;
    const limit  = params.limit ?? 10;
    const offset = (page - 1) * limit;

    let countQ = db(this.table).whereNot('status', 'deleted');
    if (params.status) countQ = countQ.where('status', params.status);
    if (params.search) countQ = countQ.where((b: any) => {
      b.where('name', 'like', `%${params.search}%`).orWhere('code', 'like', `%${params.search}%`);
    });
    const [{ count }] = await countQ.count('id as count');

    let q = this.baseQuery();
    if (params.status) q = q.where(`${this.table}.status`, params.status);
    if (params.search) q = q.where((b: any) => {
      b.where(`${this.table}.name`, 'like', `%${params.search}%`).orWhere(`${this.table}.code`, 'like', `%${params.search}%`);
    });
    const templates = await q.orderBy(`${this.table}.id`, 'asc').limit(limit).offset(offset);
    return { templates, total: Number(count) };
  }

  async findByUuid(uuid: string): Promise<RoutePointTemplate | null> {
    return this.baseQuery().where(`${this.table}.uuid`, uuid).first() ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'RPT%')
      .orderByRaw("CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC")
      .select('code').first();
    return row?.code ?? null;
  }

  async create(data: CreateRoutePointTemplateDTO & { code: string; uuid: string }): Promise<RoutePointTemplate> {
    const now = nowDb();
    const insertData: any = {
      uuid: data.uuid,
      code: data.code,
      name: data.name,
      iconId:       data.iconId       ?? null,
      deviceTypeId: data.deviceTypeId ?? null,
      // Classification flag
      isDevice:                    data.isDevice                    ? 1 : 0,
      // Basic Information
      isPointNameRequired:         data.isPointNameRequired         ? 1 : 0,
      isDescriptionRequired:       data.isDescriptionRequired       ? 1 : 0,
      isRemarksRequired:           data.isRemarksRequired           ? 1 : 0,
      // Identification
      isModelNumberRequired:       data.isModelNumberRequired       ? 1 : 0,
      isSerialNumberRequired:      data.isSerialNumberRequired      ? 1 : 0,
      isAssetTagRequired:          data.isAssetTagRequired          ? 1 : 0,
      // Networking
      isMacAddressRequired:        data.isMacAddressRequired        ? 1 : 0,
      isIpv4AddressRequired:       data.isIpv4AddressRequired       ? 1 : 0,
      isIpv6AddressRequired:       data.isIpv6AddressRequired       ? 1 : 0,
      isSubnetRequired:            data.isSubnetRequired            ? 1 : 0,
      isGatewayRequired:           data.isGatewayRequired           ? 1 : 0,
      isVlanRequired:              data.isVlanRequired              ? 1 : 0,
      // Authentication
      isUsernameRequired:          data.isUsernameRequired          ? 1 : 0,
      isPasswordRequired:          data.isPasswordRequired          ? 1 : 0,
      isSnmpRequired:              data.isSnmpRequired              ? 1 : 0,
      // GIS / Location
      isGpsLocationRequired:       data.isGpsLocationRequired       ? 1 : 0,
      isPoleNumberRequired:        data.isPoleNumberRequired        ? 1 : 0,
      isLandmarkRequired:          data.isLandmarkRequired          ? 1 : 0,
      isAddressRequired:           data.isAddressRequired           ? 1 : 0,
      isHeightRequired:            data.isHeightRequired            ? 1 : 0,
      // Device Installation
      isRackNumberRequired:        data.isRackNumberRequired        ? 1 : 0,
      isPortRequired:              data.isPortRequired              ? 1 : 0,
      isPowerSourceRequired:       data.isPowerSourceRequired       ? 1 : 0,
      isElectricityRequired:       data.isElectricityRequired       ? 1 : 0,
      // Media / Files
      isPhotoRequired:             data.isPhotoRequired             ? 1 : 0,
      isDocumentRequired:          data.isDocumentRequired          ? 1 : 0,
      // Optical / Signal
      isSignalInputRequired:       data.isSignalInputRequired       ? 1 : 0,
      isSignalOutputRequired:      data.isSignalOutputRequired      ? 1 : 0,
      isAttenuationRequired:       data.isAttenuationRequired       ? 1 : 0,
      isFiberCoreRequired:         data.isFiberCoreRequired         ? 1 : 0,
      // Monitoring
      isMonitoringEnabled:         data.isMonitoringEnabled         ? 1 : 0,
      isSnmpMonitoringEnabled:     data.isSnmpMonitoringEnabled     ? 1 : 0,
      isRealtimeStatusEnabled:     data.isRealtimeStatusEnabled     ? 1 : 0,
      // Customer Mapping
      isCustomerMappingRequired:   data.isCustomerMappingRequired   ? 1 : 0,
      // Topology
      supportsInputPorts:          data.supportsInputPorts          ? 1 : 0,
      supportsOutputPorts:         data.supportsOutputPorts         ? 1 : 0,
      supportsBidirectionalPorts:  data.supportsBidirectionalPorts  ? 1 : 0,
      supportsSignalFlow:          data.supportsSignalFlow          ? 1 : 0,
      supportsOpticalCalculation:  data.supportsOpticalCalculation  ? 1 : 0,
      description: data.description ?? null,
      status: 'active',
      createdAt: now, updatedAt: now,
    };
    await db(this.table).insert(insertData);
    return this.findByUuid(data.uuid) as Promise<RoutePointTemplate>;
  }

  async update(uuid: string, data: UpdateRoutePointTemplateDTO): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    const bools = [
      'isDevice',
      'isPointNameRequired','isDescriptionRequired','isRemarksRequired',
      'isModelNumberRequired','isSerialNumberRequired','isAssetTagRequired',
      'isMacAddressRequired','isIpv4AddressRequired','isIpv6AddressRequired','isSubnetRequired','isGatewayRequired','isVlanRequired',
      'isUsernameRequired','isPasswordRequired','isSnmpRequired',
      'isGpsLocationRequired','isPoleNumberRequired','isLandmarkRequired','isAddressRequired','isHeightRequired',
      'isRackNumberRequired','isPortRequired','isPowerSourceRequired','isElectricityRequired',
      'isPhotoRequired','isDocumentRequired',
      'isSignalInputRequired','isSignalOutputRequired','isAttenuationRequired','isFiberCoreRequired',
      'isMonitoringEnabled','isSnmpMonitoringEnabled','isRealtimeStatusEnabled',
      'isCustomerMappingRequired',
      'supportsInputPorts','supportsOutputPorts','supportsBidirectionalPorts','supportsSignalFlow','supportsOpticalCalculation',
    ];
    for (const k of bools) { if (k in payload) payload[k] = payload[k] ? 1 : 0; }
    const rows = await db(this.table).where({ uuid }).update(payload);
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
