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
 *         description: Filter by device_categories.id
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
 *                     name: "FAT Box"
 *                     deviceCategoryId: 1
 *                     categoryName: "Fiber Terminal"
 *                     categoryCode: "DC0001"
 *                     iconId: 3
 *                     iconName: "FAT Icon"
 *                     iconCode: "ICO0003"
 *                     iconFileType: "svg"
 *                     iconSvgTemplate: "<svg>…</svg>"
 *                     iconUrl: null
 *                     isModelNumberRequired: false
 *                     isSerialNumberRequired: true
 *                     isMacAddressRequired: false
 *                     isIPAddressRequired: false
 *                     isGpsLocationRequired: true
 *                     description: "Fiber Access Terminal"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-14T10:00:00.000Z"
 *                     updatedAt: "2026-05-14T10:00:00.000Z"
 *                   links:
 *                     self: "/api/device-types/019f1ab2-0000-7000-0000-000000000002"
 *               meta:
 *                 pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
 *   post:
 *     tags:
 *       - Device Types
 *     summary: Create a device type
 *     description: Creates a new global device type. Requires `device_types.create`.
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
 *               name: { type: string, example: "FAT Box" }
 *               deviceCategoryId: { type: integer, nullable: true, example: 1 }
 *               iconId: { type: integer, nullable: true, example: 3 }
 *               isModelNumberRequired:  { type: boolean, default: false }
 *               isSerialNumberRequired: { type: boolean, default: false }
 *               isMacAddressRequired:   { type: boolean, default: false }
 *               isIPAddressRequired:    { type: boolean, default: false }
 *               isGpsLocationRequired:  { type: boolean, default: false }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Device type created
 *       422:
 *         description: Validation error
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
 *               isModelNumberRequired:  { type: boolean }
 *               isSerialNumberRequired: { type: boolean }
 *               isMacAddressRequired:   { type: boolean }
 *               isIPAddressRequired:    { type: boolean }
 *               isGpsLocationRequired:  { type: boolean }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Device type updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags:
 *       - Device Types
 *     summary: Delete a device type
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
