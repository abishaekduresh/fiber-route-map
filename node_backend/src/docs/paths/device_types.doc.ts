/**
 * @openapi
 * /device-types:
 *   get:
 *     tags:
 *       - Device Types
 *     summary: List global device types
 *     description: Returns all global device types with category and icon details. Requires `device_types.view`.
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
 *       - in: query
 *         name: filter[categoryId]
 *         schema: { type: integer }
 *         description: Filter by device_categories.id (numeric)
 *     responses:
 *       200:
 *         description: Device types listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Device types retrieved successfully"
 *               data:
 *                 - id: "019f1ab2-0000-7000-0000-000000000002"
 *                   type: "device_type"
 *                   attributes:
 *                     code: "DT0001"
 *                     name: "OLT"
 *                     deviceCategoryId: 1
 *                     categoryName: "Active Equipment"
 *                     categoryCode: "DC0001"
 *                     iconId: 3
 *                     iconName: "OLT Icon"
 *                     iconCode: "ICO0003"
 *                     iconFileType: "svg"
 *                     iconSvgTemplate: "<svg>…</svg>"
 *                     iconUrl: null
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
 *                     description: "Optical Line Terminal"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-17T10:00:00.000Z"
 *                     updatedAt: "2026-05-17T10:00:00.000Z"
 *                   links:
 *                     self: "/api/device-types/019f1ab2-0000-7000-0000-000000000002"
 *               meta:
 *                 pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
 *   post:
 *     tags:
 *       - Device Types
 *     summary: Create a device type
 *     description: Creates a new global device type with dynamic field flags. Requires `device_types.create`.
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
 *               name: { type: string, example: "OLT" }
 *               deviceCategoryId: { type: integer, nullable: true, example: 1 }
 *               iconId: { type: integer, nullable: true, example: 3 }
 *               description: { type: string, nullable: true }
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
 *         description: Device type created
 *       422:
 *         description: Validation error — name is required
 *
 * /device-types/{uuid}:
 *   get:
 *     tags:
 *       - Device Types
 *     summary: Get a device type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device type retrieved
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Device Types
 *     summary: Update a device type
 *     description: Updates an existing device type. All flag fields are optional. Requires `device_types.update`.
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
 *               deviceCategoryId: { type: integer, nullable: true }
 *               iconId: { type: integer, nullable: true }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [active, inactive] }
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
 *         description: Device type updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags:
 *       - Device Types
 *     summary: Delete a device type
 *     description: Soft-deletes a device type (status set to deleted). Requires `device_types.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device type deleted
 *       404:
 *         description: Not found
 */

export default {};
