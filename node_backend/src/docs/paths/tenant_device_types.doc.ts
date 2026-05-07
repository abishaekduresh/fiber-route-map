/**
 * @openapi
 * /tenant/device-types:
 *   get:
 *     tags:
 *       - Tenant Device Types
 *     summary: List Device Types
 *     description: Returns all device types scoped to the authenticated tenant's business. Requires `device_type.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, example: -1 }
 *         description: Use -1 to return all records
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive, all] }
 *       - in: query
 *         name: filter[categoryId]
 *         schema: { type: integer }
 *         description: Filter by tenantDeviceCategoryId
 *       - in: query
 *         name: filter[search]
 *         schema: { type: string, example: "OLT" }
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
 *                 - id: "019f2bc3-0000-7000-0000-000000000001"
 *                   type: "device_type"
 *                   attributes:
 *                     name: "OLT"
 *                     code: "TDTOLT"
 *                     tenantDeviceCategoryId: 1
 *                     categoryName: "Active Equipment"
 *                     categoryUuid: "019f1ab2-0000-7000-0000-000000000001"
 *                     isModelNumberRequired: true
 *                     isSerialNumberRequired: true
 *                     isMacAddressRequired: false
 *                     isIPAddressRequired: true
 *                     isGpsLocationRequired: false
 *                     icon: "server"
 *                     description: "Optical Line Terminal"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-08T10:00:00.000Z"
 *                     updatedAt: "2026-05-08T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/device-types/019f2bc3-0000-7000-0000-000000000001"
 *               meta:
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *   post:
 *     tags:
 *       - Tenant Device Types
 *     summary: Create Device Type
 *     description: Creates a new device type. Code is converted to uppercase and must be unique per business. Requires `device_type.create`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantDeviceCategoryId, name]
 *             properties:
 *               tenantDeviceCategoryId: { type: integer, example: 1 }
 *               name: { type: string, example: "OLT" }
 *               isModelNumberRequired: { type: boolean, default: false }
 *               isSerialNumberRequired: { type: boolean, default: false }
 *               isMacAddressRequired: { type: boolean, default: false }
 *               isIPAddressRequired: { type: boolean, default: false }
 *               isGpsLocationRequired: { type: boolean, default: false }
 *               icon: { type: string, example: "server" }
 *               description: { type: string, example: "Optical Line Terminal" }
 *     responses:
 *       201:
 *         description: Device type created
 *
 * /tenant/device-types/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Device Types
 *     summary: Get Device Type
 *     description: Returns a single device type by UUID. Requires `device_type.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device type found
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Tenant Device Types
 *     summary: Update Device Type
 *     description: Updates any fields including boolean flags. Code is uppercased if provided. Requires `device_type.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *               tenantDeviceCategoryId: { type: integer }
 *               name: { type: string }
 *               code: { type: string }
 *               isModelNumberRequired: { type: boolean }
 *               isSerialNumberRequired: { type: boolean }
 *               isMacAddressRequired: { type: boolean }
 *               isIPAddressRequired: { type: boolean }
 *               isGpsLocationRequired: { type: boolean }
 *               icon: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Device type updated
 *   delete:
 *     tags:
 *       - Tenant Device Types
 *     summary: Delete Device Type
 *     description: Soft-deletes a device type (status set to deleted). Requires `device_type.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device type deleted
 */

export {};
