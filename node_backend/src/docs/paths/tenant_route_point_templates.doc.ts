/**
 * @openapi
 * /tenant/route-point-templates:
 *   get:
 *     tags:
 *       - Tenant — Route Point Templates
 *     summary: List active route point templates (tenant)
 *     description: >
 *       Returns all globally active Route Point Templates for use by tenant map clients.
 *       Protected by tenant JWT (`fiber_tenant_token`). Used to populate the RPT selector
 *       in the Draw / Edit Route panel and to drive dynamic per-point field rendering based
 *       on the 36 boolean field flags defined on each template.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Active route point templates retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Route point templates retrieved successfully"
 *               data:
 *                 - id: "019f1ab2-0000-7000-0000-000000000010"
 *                   type: "route_point_template"
 *                   attributes:
 *                     code: "RPT0001"
 *                     name: "OLT Site"
 *                     iconSvgTemplate: null
 *                     iconUrl: null
 *                     iconFileType: null
 *                     iconName: null
 *                     iconCode: null
 *                     deviceTypeName: "OLT"
 *                     deviceTypeCode: "DT0001"
 *                     isDevice: true
 *                     isPointNameRequired: true
 *                     isDescriptionRequired: false
 *                     isRemarksRequired: false
 *                     isModelNumberRequired: true
 *                     isSerialNumberRequired: true
 *                     isAssetTagRequired: false
 *                     isMacAddressRequired: true
 *                     isIpv4AddressRequired: true
 *                     isIpv6AddressRequired: false
 *                     isSubnetRequired: true
 *                     isGatewayRequired: true
 *                     isVlanRequired: false
 *                     isUsernameRequired: true
 *                     isPasswordRequired: true
 *                     isSnmpRequired: true
 *                     isGpsLocationRequired: true
 *                     isPoleNumberRequired: false
 *                     isLandmarkRequired: false
 *                     isAddressRequired: false
 *                     isHeightRequired: false
 *                     isRackNumberRequired: true
 *                     isPortRequired: true
 *                     isPowerSourceRequired: false
 *                     isElectricityRequired: false
 *                     isPhotoRequired: false
 *                     isDocumentRequired: false
 *                     isSignalInputRequired: true
 *                     isSignalOutputRequired: true
 *                     isAttenuationRequired: false
 *                     isFiberCoreRequired: false
 *                     isMonitoringEnabled: true
 *                     isSnmpMonitoringEnabled: true
 *                     isRealtimeStatusEnabled: false
 *                     isCustomerMappingRequired: false
 *                     supportsInputPorts: true
 *                     supportsOutputPorts: true
 *                     supportsBidirectionalPorts: false
 *                     supportsSignalFlow: true
 *                     supportsOpticalCalculation: false
 *                     description: "Optical Line Terminal site template"
 *                     status: "active"
 *                 - id: "019f1ab2-0000-7000-0000-000000000011"
 *                   type: "route_point_template"
 *                   attributes:
 *                     code: "RPT0002"
 *                     name: "Pole Junction"
 *                     iconSvgTemplate: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">…</svg>"
 *                     iconUrl: null
 *                     iconFileType: "svg"
 *                     iconName: "Pole Icon"
 *                     iconCode: "ICO0005"
 *                     deviceTypeName: null
 *                     deviceTypeCode: null
 *                     isDevice: false
 *                     isPointNameRequired: true
 *                     isDescriptionRequired: false
 *                     isRemarksRequired: false
 *                     isModelNumberRequired: false
 *                     isSerialNumberRequired: false
 *                     isAssetTagRequired: false
 *                     isMacAddressRequired: false
 *                     isIpv4AddressRequired: false
 *                     isIpv6AddressRequired: false
 *                     isSubnetRequired: false
 *                     isGatewayRequired: false
 *                     isVlanRequired: false
 *                     isUsernameRequired: false
 *                     isPasswordRequired: false
 *                     isSnmpRequired: false
 *                     isGpsLocationRequired: true
 *                     isPoleNumberRequired: true
 *                     isLandmarkRequired: true
 *                     isAddressRequired: false
 *                     isHeightRequired: true
 *                     isRackNumberRequired: false
 *                     isPortRequired: false
 *                     isPowerSourceRequired: false
 *                     isElectricityRequired: false
 *                     isPhotoRequired: false
 *                     isDocumentRequired: false
 *                     isSignalInputRequired: false
 *                     isSignalOutputRequired: false
 *                     isAttenuationRequired: false
 *                     isFiberCoreRequired: false
 *                     isMonitoringEnabled: false
 *                     isSnmpMonitoringEnabled: false
 *                     isRealtimeStatusEnabled: false
 *                     isCustomerMappingRequired: false
 *                     supportsInputPorts: false
 *                     supportsOutputPorts: false
 *                     supportsBidirectionalPorts: false
 *                     supportsSignalFlow: false
 *                     supportsOpticalCalculation: false
 *                     description: "Utility pole junction point"
 *                     status: "active"
 *       401:
 *         description: Unauthorized — invalid or missing tenant JWT
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "Unauthorized"
 */
