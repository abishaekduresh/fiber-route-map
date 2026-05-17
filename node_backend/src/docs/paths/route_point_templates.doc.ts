/**
 * @openapi
 * /route-point-templates:
 *   get:
 *     tags:
 *       - Route Point Templates
 *     summary: List route point templates
 *     description: Returns all global route point templates with linked icon and device type details. Requires `route_point_templates.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Templates listed
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
 *                     iconId: null
 *                     iconName: null
 *                     iconCode: null
 *                     iconFileType: null
 *                     iconSvgTemplate: null
 *                     iconUrl: null
 *                     deviceTypeId: 1
 *                     deviceTypeName: "OLT"
 *                     deviceTypeCode: "DT0001"
 *                     deviceTypeIconSvgTemplate: "<svg>…</svg>"
 *                     deviceTypeIconUrl: null
 *                     deviceTypeIconFileType: "svg"
 *                     deviceTypeIconName: "OLT Icon"
 *                     isDevice: true
 *                     isPointNameRequired: true
 *                     isDescriptionRequired: false
 *                     isRemarksRequired: false
 *                     isModelNumberRequired: false
 *                     isSerialNumberRequired: true
 *                     isAssetTagRequired: false
 *                     isMacAddressRequired: true
 *                     isIpv4AddressRequired: true
 *                     isIpv6AddressRequired: false
 *                     isSubnetRequired: false
 *                     isGatewayRequired: false
 *                     isVlanRequired: false
 *                     isUsernameRequired: false
 *                     isPasswordRequired: false
 *                     isSnmpRequired: false
 *                     isGpsLocationRequired: false
 *                     isPoleNumberRequired: false
 *                     isLandmarkRequired: false
 *                     isAddressRequired: false
 *                     isHeightRequired: false
 *                     isRackNumberRequired: true
 *                     isPortRequired: false
 *                     isPowerSourceRequired: false
 *                     isElectricityRequired: false
 *                     isPhotoRequired: false
 *                     isDocumentRequired: false
 *                     isSignalInputRequired: false
 *                     isSignalOutputRequired: true
 *                     isAttenuationRequired: false
 *                     isFiberCoreRequired: false
 *                     isMonitoringEnabled: false
 *                     isSnmpMonitoringEnabled: false
 *                     isRealtimeStatusEnabled: false
 *                     isCustomerMappingRequired: false
 *                     supportsInputPorts: false
 *                     supportsOutputPorts: true
 *                     supportsBidirectionalPorts: false
 *                     supportsSignalFlow: true
 *                     supportsOpticalCalculation: false
 *                     description: "Optical Line Terminal site template"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-17T10:00:00.000Z"
 *                     updatedAt: "2026-05-17T10:00:00.000Z"
 *               meta:
 *                 pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
 *   post:
 *     tags:
 *       - Route Point Templates
 *     summary: Create a route point template
 *     description: Creates a new global route point template with optional icon, device type, and 36 dynamic field flags. Requires `route_point_templates.create`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "OLT Site" }
 *               iconId: { type: integer, nullable: true }
 *               deviceTypeId: { type: integer, nullable: true }
 *               description: { type: string, nullable: true }
 *               isDevice: { type: boolean, default: false }
 *               isPointNameRequired:       { type: boolean, default: true }
 *               isDescriptionRequired:     { type: boolean, default: false }
 *               isRemarksRequired:         { type: boolean, default: false }
 *               isModelNumberRequired:     { type: boolean, default: false }
 *               isSerialNumberRequired:    { type: boolean, default: false }
 *               isAssetTagRequired:        { type: boolean, default: false }
 *               isMacAddressRequired:      { type: boolean, default: false }
 *               isIpv4AddressRequired:     { type: boolean, default: false }
 *               isIpv6AddressRequired:     { type: boolean, default: false }
 *               isSubnetRequired:          { type: boolean, default: false }
 *               isGatewayRequired:         { type: boolean, default: false }
 *               isVlanRequired:            { type: boolean, default: false }
 *               isUsernameRequired:        { type: boolean, default: false }
 *               isPasswordRequired:        { type: boolean, default: false }
 *               isSnmpRequired:            { type: boolean, default: false }
 *               isGpsLocationRequired:     { type: boolean, default: false }
 *               isPoleNumberRequired:      { type: boolean, default: false }
 *               isLandmarkRequired:        { type: boolean, default: false }
 *               isAddressRequired:         { type: boolean, default: false }
 *               isHeightRequired:          { type: boolean, default: false }
 *               isRackNumberRequired:      { type: boolean, default: false }
 *               isPortRequired:            { type: boolean, default: false }
 *               isPowerSourceRequired:     { type: boolean, default: false }
 *               isElectricityRequired:     { type: boolean, default: false }
 *               isPhotoRequired:           { type: boolean, default: false }
 *               isDocumentRequired:        { type: boolean, default: false }
 *               isSignalInputRequired:     { type: boolean, default: false }
 *               isSignalOutputRequired:    { type: boolean, default: false }
 *               isAttenuationRequired:     { type: boolean, default: false }
 *               isFiberCoreRequired:       { type: boolean, default: false }
 *               isMonitoringEnabled:       { type: boolean, default: false }
 *               isSnmpMonitoringEnabled:   { type: boolean, default: false }
 *               isRealtimeStatusEnabled:   { type: boolean, default: false }
 *               isCustomerMappingRequired: { type: boolean, default: false }
 *               supportsInputPorts:           { type: boolean, default: false }
 *               supportsOutputPorts:          { type: boolean, default: false }
 *               supportsBidirectionalPorts:   { type: boolean, default: false }
 *               supportsSignalFlow:           { type: boolean, default: false }
 *               supportsOpticalCalculation:   { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Template created
 *       422:
 *         description: Validation error
 *
 * /route-point-templates/{uuid}:
 *   get:
 *     tags:
 *       - Route Point Templates
 *     summary: Get a route point template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template retrieved
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Route Point Templates
 *     summary: Update a route point template
 *     description: Updates an existing route point template. All flag fields are optional. Requires `route_point_templates.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               iconId: { type: integer, nullable: true }
 *               deviceTypeId: { type: integer, nullable: true }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [active, inactive] }
 *               isDevice: { type: boolean }
 *               isPointNameRequired:       { type: boolean }
 *               isDescriptionRequired:     { type: boolean }
 *               isRemarksRequired:         { type: boolean }
 *               isModelNumberRequired:     { type: boolean }
 *               isSerialNumberRequired:    { type: boolean }
 *               isAssetTagRequired:        { type: boolean }
 *               isMacAddressRequired:      { type: boolean }
 *               isIpv4AddressRequired:     { type: boolean }
 *               isIpv6AddressRequired:     { type: boolean }
 *               isSubnetRequired:          { type: boolean }
 *               isGatewayRequired:         { type: boolean }
 *               isVlanRequired:            { type: boolean }
 *               isUsernameRequired:        { type: boolean }
 *               isPasswordRequired:        { type: boolean }
 *               isSnmpRequired:            { type: boolean }
 *               isGpsLocationRequired:     { type: boolean }
 *               isPoleNumberRequired:      { type: boolean }
 *               isLandmarkRequired:        { type: boolean }
 *               isAddressRequired:         { type: boolean }
 *               isHeightRequired:          { type: boolean }
 *               isRackNumberRequired:      { type: boolean }
 *               isPortRequired:            { type: boolean }
 *               isPowerSourceRequired:     { type: boolean }
 *               isElectricityRequired:     { type: boolean }
 *               isPhotoRequired:           { type: boolean }
 *               isDocumentRequired:        { type: boolean }
 *               isSignalInputRequired:     { type: boolean }
 *               isSignalOutputRequired:    { type: boolean }
 *               isAttenuationRequired:     { type: boolean }
 *               isFiberCoreRequired:       { type: boolean }
 *               isMonitoringEnabled:       { type: boolean }
 *               isSnmpMonitoringEnabled:   { type: boolean }
 *               isRealtimeStatusEnabled:   { type: boolean }
 *               isCustomerMappingRequired: { type: boolean }
 *               supportsInputPorts:           { type: boolean }
 *               supportsOutputPorts:          { type: boolean }
 *               supportsBidirectionalPorts:   { type: boolean }
 *               supportsSignalFlow:           { type: boolean }
 *               supportsOpticalCalculation:   { type: boolean }
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags:
 *       - Route Point Templates
 *     summary: Delete a route point template
 *     description: Soft-deletes a route point template. Requires `route_point_templates.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         description: Not found
 */

export default {};
