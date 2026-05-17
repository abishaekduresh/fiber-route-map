import { generateUuidV7 } from '../utils/uuid.js';
import db from '../config/database.js';
import { DeviceType, CreateDeviceTypeDTO, UpdateDeviceTypeDTO } from '../models/DeviceType.js';
import { nowDb } from '../utils/time.js';

export class DeviceTypeRepository {
  private table = 'device_types';
  private catTable = 'device_categories';

  private baseQuery() {
    return db(this.table)
      .leftJoin(`${this.catTable}`, `${this.table}.deviceCategoryId`, `${this.catTable}.id`)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .whereNot(`${this.table}.status`, 'deleted')
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.code as categoryCode`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
      );
  }

  async getAll(params: {
    page?: number; limit?: number; search?: string; status?: string; categoryId?: number | string;
  }): Promise<{ deviceTypes: DeviceType[]; total: number }> {
    const page   = Number(params.page)  || 1;
    const limit  = Number(params.limit) || 10;
    const offset = (page - 1) * limit;

    let q = db(this.table).whereNot(`${this.table}.status`, 'deleted');
    if (params.status)     q = q.where(`${this.table}.status`, params.status);
    if (params.categoryId) q = q.where(`${this.table}.deviceCategoryId`, params.categoryId);
    if (params.search) q = q.where((b: any) => {
      b.where(`${this.table}.name`, 'like', `%${params.search}%`)
       .orWhere(`${this.table}.code`, 'like', `%${params.search}%`);
    });

    const [{ count }] = await q.clone().count(`${this.table}.id as count`);

    const deviceTypes = await q.clone()
      .leftJoin(`${this.catTable}`, `${this.table}.deviceCategoryId`, `${this.catTable}.id`)
      .leftJoin('icons', `${this.table}.iconId`, 'icons.id')
      .select(
        `${this.table}.*`,
        `${this.catTable}.name as categoryName`,
        `${this.catTable}.code as categoryCode`,
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
      )
      .orderBy(`${this.table}.id`, 'asc')
      .limit(limit).offset(offset);

    return { deviceTypes, total: Number(count) };
  }

  async findByUuid(uuid: string): Promise<DeviceType | null> {
    return this.baseQuery().where(`${this.table}.uuid`, uuid).first() ?? null;
  }

  async getLastCode(): Promise<string | null> {
    const row = await db(this.table)
      .where('code', 'like', 'DT%')
      .orderByRaw("CAST(SUBSTRING(code, 3) AS UNSIGNED) DESC")
      .select('code').first();
    return row?.code ?? null;
  }

  async create(data: CreateDeviceTypeDTO & { code: string }): Promise<DeviceType> {
    const uuid = generateUuidV7();
    const now  = nowDb();
    const [id] = await db(this.table).insert({
      uuid,
      name:                      data.name,
      code:                      data.code,
      deviceCategoryId:          data.deviceCategoryId ?? null,
      iconId:                    data.iconId ?? null,
      // Basic Information
      isPointNameRequired:       data.isPointNameRequired       ? 1 : 0,
      isDescriptionRequired:     data.isDescriptionRequired     ? 1 : 0,
      isRemarksRequired:         data.isRemarksRequired         ? 1 : 0,
      // Identification
      isModelNumberRequired:     data.isModelNumberRequired     ? 1 : 0,
      isSerialNumberRequired:    data.isSerialNumberRequired    ? 1 : 0,
      isAssetTagRequired:        data.isAssetTagRequired        ? 1 : 0,
      // Networking
      isMacAddressRequired:      data.isMacAddressRequired      ? 1 : 0,
      isIpv4AddressRequired:     data.isIpv4AddressRequired     ? 1 : 0,
      isIpv6AddressRequired:     data.isIpv6AddressRequired     ? 1 : 0,
      isSubnetRequired:          data.isSubnetRequired          ? 1 : 0,
      isGatewayRequired:         data.isGatewayRequired         ? 1 : 0,
      isVlanRequired:            data.isVlanRequired            ? 1 : 0,
      // Authentication
      isUsernameRequired:        data.isUsernameRequired        ? 1 : 0,
      isPasswordRequired:        data.isPasswordRequired        ? 1 : 0,
      isSnmpRequired:            data.isSnmpRequired            ? 1 : 0,
      // GIS / Location
      isGpsLocationRequired:     data.isGpsLocationRequired     ? 1 : 0,
      isPoleNumberRequired:      data.isPoleNumberRequired      ? 1 : 0,
      isLandmarkRequired:        data.isLandmarkRequired        ? 1 : 0,
      isAddressRequired:         data.isAddressRequired         ? 1 : 0,
      isHeightRequired:          data.isHeightRequired          ? 1 : 0,
      // Device Installation
      isRackNumberRequired:      data.isRackNumberRequired      ? 1 : 0,
      isPortRequired:            data.isPortRequired            ? 1 : 0,
      isPowerSourceRequired:     data.isPowerSourceRequired     ? 1 : 0,
      isElectricityRequired:     data.isElectricityRequired     ? 1 : 0,
      // Media / File
      isPhotoRequired:           data.isPhotoRequired           ? 1 : 0,
      isDocumentRequired:        data.isDocumentRequired        ? 1 : 0,
      // Optical / Signal
      isSignalInputRequired:     data.isSignalInputRequired     ? 1 : 0,
      isSignalOutputRequired:    data.isSignalOutputRequired    ? 1 : 0,
      isAttenuationRequired:     data.isAttenuationRequired     ? 1 : 0,
      isFiberCoreRequired:       data.isFiberCoreRequired       ? 1 : 0,
      // Monitoring
      isMonitoringEnabled:       data.isMonitoringEnabled       ? 1 : 0,
      isSnmpMonitoringEnabled:   data.isSnmpMonitoringEnabled   ? 1 : 0,
      isRealtimeStatusEnabled:   data.isRealtimeStatusEnabled   ? 1 : 0,
      // Customer Mapping
      isCustomerMappingRequired: data.isCustomerMappingRequired ? 1 : 0,
      // Topology
      supportsInputPorts:           data.supportsInputPorts           ? 1 : 0,
      supportsOutputPorts:          data.supportsOutputPorts          ? 1 : 0,
      supportsBidirectionalPorts:   data.supportsBidirectionalPorts   ? 1 : 0,
      supportsSignalFlow:           data.supportsSignalFlow           ? 1 : 0,
      supportsOpticalCalculation:   data.supportsOpticalCalculation   ? 1 : 0,
      description:               data.description ?? null,
      status:                    'active',
      createdAt: now, updatedAt: now,
    });
    return this.findByUuid(uuid) as Promise<DeviceType>;
  }

  async update(uuid: string, data: UpdateDeviceTypeDTO): Promise<boolean> {
    const payload: any = { ...data, updatedAt: nowDb() };
    const bools = [
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
    ] as const;
    for (const k of bools) { if (k in payload) payload[k] = payload[k] ? 1 : 0; }
    const rows = await db(this.table).where({ uuid }).update(payload);
    return rows > 0;
  }

  async delete(uuid: string): Promise<boolean> {
    const rows = await db(this.table).where({ uuid }).update({ status: 'deleted', deletedAt: nowDb(), updatedAt: nowDb() });
    return rows > 0;
  }
}
