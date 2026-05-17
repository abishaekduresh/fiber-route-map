import { Request, Response, NextFunction } from 'express';
import { DeviceTypeService } from '../services/DeviceTypeService.js';

const VERSION = '1.66.0';

export class DeviceTypeController {
  constructor(private service: DeviceTypeService) {}

  private transform(dt: any) {
    return {
      id: dt.uuid,
      type: 'device_type',
      attributes: {
        code:                   dt.code,
        name:                   dt.name,
        deviceCategoryId:       dt.deviceCategoryId,
        categoryName:           dt.categoryName ?? null,
        categoryCode:           dt.categoryCode ?? null,
        iconId:                 dt.iconId,
        iconName:               dt.iconName  ?? null,
        iconCode:               dt.iconCode  ?? null,
        iconFileType:           dt.iconFileType ?? null,
        iconSvgTemplate:        dt.iconSvgTemplate ?? null,
        iconUrl:                dt.iconUrl ?? null,
        // Basic Information
        isPointNameRequired:       Boolean(dt.isPointNameRequired),
        isDescriptionRequired:     Boolean(dt.isDescriptionRequired),
        isRemarksRequired:         Boolean(dt.isRemarksRequired),
        // Identification
        isModelNumberRequired:     Boolean(dt.isModelNumberRequired),
        isSerialNumberRequired:    Boolean(dt.isSerialNumberRequired),
        isAssetTagRequired:        Boolean(dt.isAssetTagRequired),
        // Networking
        isMacAddressRequired:      Boolean(dt.isMacAddressRequired),
        isIpv4AddressRequired:     Boolean(dt.isIpv4AddressRequired),
        isIpv6AddressRequired:     Boolean(dt.isIpv6AddressRequired),
        isSubnetRequired:          Boolean(dt.isSubnetRequired),
        isGatewayRequired:         Boolean(dt.isGatewayRequired),
        isVlanRequired:            Boolean(dt.isVlanRequired),
        // Authentication
        isUsernameRequired:        Boolean(dt.isUsernameRequired),
        isPasswordRequired:        Boolean(dt.isPasswordRequired),
        isSnmpRequired:            Boolean(dt.isSnmpRequired),
        // GIS / Location
        isGpsLocationRequired:     Boolean(dt.isGpsLocationRequired),
        isPoleNumberRequired:      Boolean(dt.isPoleNumberRequired),
        isLandmarkRequired:        Boolean(dt.isLandmarkRequired),
        isAddressRequired:         Boolean(dt.isAddressRequired),
        isHeightRequired:          Boolean(dt.isHeightRequired),
        // Device Installation
        isRackNumberRequired:      Boolean(dt.isRackNumberRequired),
        isPortRequired:            Boolean(dt.isPortRequired),
        isPowerSourceRequired:     Boolean(dt.isPowerSourceRequired),
        isElectricityRequired:     Boolean(dt.isElectricityRequired),
        // Media / File
        isPhotoRequired:           Boolean(dt.isPhotoRequired),
        isDocumentRequired:        Boolean(dt.isDocumentRequired),
        // Optical / Signal
        isSignalInputRequired:     Boolean(dt.isSignalInputRequired),
        isSignalOutputRequired:    Boolean(dt.isSignalOutputRequired),
        isAttenuationRequired:     Boolean(dt.isAttenuationRequired),
        isFiberCoreRequired:       Boolean(dt.isFiberCoreRequired),
        // Monitoring
        isMonitoringEnabled:       Boolean(dt.isMonitoringEnabled),
        isSnmpMonitoringEnabled:   Boolean(dt.isSnmpMonitoringEnabled),
        isRealtimeStatusEnabled:   Boolean(dt.isRealtimeStatusEnabled),
        // Customer Mapping
        isCustomerMappingRequired: Boolean(dt.isCustomerMappingRequired),
        // Topology
        supportsInputPorts:           Boolean(dt.supportsInputPorts),
        supportsOutputPorts:          Boolean(dt.supportsOutputPorts),
        supportsBidirectionalPorts:   Boolean(dt.supportsBidirectionalPorts),
        supportsSignalFlow:           Boolean(dt.supportsSignalFlow),
        supportsOpticalCalculation:   Boolean(dt.supportsOpticalCalculation),
        description:            dt.description ?? null,
        status:                 dt.status,
      },
      meta:  { createdAt: dt.createdAt, updatedAt: dt.updatedAt },
      links: { self: `/api/device-types/${dt.uuid}` },
    };
  }

  private getMeta(req: Request, extra?: Record<string, unknown>) {
    return { requestId: (req as any).requestId, timestamp: new Date().toISOString(), version: VERSION, ...extra };
  }

  private parseBody(raw: any) {
    const out: any = { ...raw };
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
    ];
    for (const f of bools) {
      if (f in raw) out[f] = raw[f] === true || raw[f] === 'true' || raw[f] === 1 || raw[f] === '1';
    }
    if ('deviceCategoryId' in raw) out.deviceCategoryId = raw.deviceCategoryId ? Number(raw.deviceCategoryId) : null;
    if ('iconId' in raw)           out.iconId           = raw.iconId           ? Number(raw.iconId)           : null;
    return out;
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page       = parseInt(req.query.page       as string) || 1;
      const limit      = parseInt(req.query.limit      as string) || 10;
      const search     = (req.query.search              as string) || '';
      const status     = ((req.query['filter[status]']     || req.query.status)     as string) || '';
      const categoryId = ((req.query['filter[categoryId]'] || req.query.categoryId) as string) || '';
      const { deviceTypes, total } = await this.service.getAll({ page, limit, search, status, categoryId: categoryId || undefined });
      res.json({
        success: true, statusCode: 200,
        message: deviceTypes.length ? 'Device types retrieved successfully' : 'No device types found',
        data: deviceTypes.map(dt => this.transform(dt)),
        meta: this.getMeta(req, { pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }),
      });
    } catch (err) { next(err); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dt = await this.service.getOne(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device type retrieved successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      if (!body.name?.trim()) { res.status(422).json({ success: false, statusCode: 422, message: 'Name is required' }); return; }
      const dt = await this.service.create(body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Device type created successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(req.body);
      const dt   = await this.service.update(req.params.uuid, body);
      res.json({ success: true, statusCode: 200, message: 'Device type updated successfully', data: this.transform(dt), meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.uuid);
      res.json({ success: true, statusCode: 200, message: 'Device type deleted successfully', data: null, meta: this.getMeta(req) });
    } catch (err) { next(err); }
  };
}
