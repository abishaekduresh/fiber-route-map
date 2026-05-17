import express from 'express';
import db from '../config/database.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const auth = tenantAuth(tenantRepo);
router.use(auth);

// GET /api/tenant/route-point-templates — active global RPTs for tenant use
router.get('/', async (_req, res, next) => {
  try {
    const rows = await db('route_point_templates')
      .leftJoin('icons', 'route_point_templates.iconId', 'icons.id')
      .leftJoin('device_types', 'route_point_templates.deviceTypeId', 'device_types.id')
      .where('route_point_templates.status', 'active')
      .orderBy('route_point_templates.name', 'asc')
      .select(
        'route_point_templates.*',
        'icons.name as iconName',
        'icons.code as iconCode',
        'icons.iconType as iconFileType',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl as iconUrl',
        'device_types.name as deviceTypeName',
        'device_types.code as deviceTypeCode',
      );

    return res.json({
      success: true,
      statusCode: 200,
      message: rows.length ? 'Route point templates retrieved successfully' : 'No active route point templates found',
      data: rows.map((t: any) => ({
        id: t.uuid,
        type: 'route_point_template',
        attributes: {
          code:            t.code,
          name:            t.name,
          iconSvgTemplate: t.iconSvgTemplate  ?? null,
          iconUrl:         t.iconUrl          ?? null,
          iconFileType:    t.iconFileType      ?? null,
          iconName:        t.iconName         ?? null,
          iconCode:        t.iconCode         ?? null,
          deviceTypeName:  t.deviceTypeName   ?? null,
          deviceTypeCode:  t.deviceTypeCode   ?? null,
          // Classification
          isDevice:                    !!t.isDevice,
          // Basic Information
          isPointNameRequired:         !!t.isPointNameRequired,
          isDescriptionRequired:       !!t.isDescriptionRequired,
          isRemarksRequired:           !!t.isRemarksRequired,
          // Identification
          isModelNumberRequired:       !!t.isModelNumberRequired,
          isSerialNumberRequired:      !!t.isSerialNumberRequired,
          isAssetTagRequired:          !!t.isAssetTagRequired,
          // Networking
          isMacAddressRequired:        !!t.isMacAddressRequired,
          isIpv4AddressRequired:       !!t.isIpv4AddressRequired,
          isIpv6AddressRequired:       !!t.isIpv6AddressRequired,
          isSubnetRequired:            !!t.isSubnetRequired,
          isGatewayRequired:           !!t.isGatewayRequired,
          isVlanRequired:              !!t.isVlanRequired,
          // Authentication
          isUsernameRequired:          !!t.isUsernameRequired,
          isPasswordRequired:          !!t.isPasswordRequired,
          isSnmpRequired:              !!t.isSnmpRequired,
          // GIS / Location
          isGpsLocationRequired:       !!t.isGpsLocationRequired,
          isPoleNumberRequired:        !!t.isPoleNumberRequired,
          isLandmarkRequired:          !!t.isLandmarkRequired,
          isAddressRequired:           !!t.isAddressRequired,
          isHeightRequired:            !!t.isHeightRequired,
          // Device Installation
          isRackNumberRequired:        !!t.isRackNumberRequired,
          isPortRequired:              !!t.isPortRequired,
          isPowerSourceRequired:       !!t.isPowerSourceRequired,
          isElectricityRequired:       !!t.isElectricityRequired,
          // Media / Files
          isPhotoRequired:             !!t.isPhotoRequired,
          isDocumentRequired:          !!t.isDocumentRequired,
          // Optical / Signal
          isSignalInputRequired:       !!t.isSignalInputRequired,
          isSignalOutputRequired:      !!t.isSignalOutputRequired,
          isAttenuationRequired:       !!t.isAttenuationRequired,
          isFiberCoreRequired:         !!t.isFiberCoreRequired,
          // Monitoring
          isMonitoringEnabled:         !!t.isMonitoringEnabled,
          isSnmpMonitoringEnabled:     !!t.isSnmpMonitoringEnabled,
          isRealtimeStatusEnabled:     !!t.isRealtimeStatusEnabled,
          // Customer Mapping
          isCustomerMappingRequired:   !!t.isCustomerMappingRequired,
          // Topology
          supportsInputPorts:          !!t.supportsInputPorts,
          supportsOutputPorts:         !!t.supportsOutputPorts,
          supportsBidirectionalPorts:  !!t.supportsBidirectionalPorts,
          supportsSignalFlow:          !!t.supportsSignalFlow,
          supportsOpticalCalculation:  !!t.supportsOpticalCalculation,
          description:                 t.description ?? null,
          status:                      t.status,
        },
      })),
    });
  } catch (err) { next(err); }
});

export default router;
