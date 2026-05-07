/**
 * @openapi
 * /tenant/device-categories:
 *   get:
 *     tags:
 *       - Tenant Device Categories
 *     summary: List Device Categories
 *     description: Returns all device categories scoped to the authenticated tenant's business. Requires `device_category.view`.
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
 *         name: filter[search]
 *         schema: { type: string, example: "Router" }
 *     responses:
 *       200:
 *         description: Device categories listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Device categories retrieved successfully"
 *               data:
 *                 - id: "019f1ab2-0000-7000-0000-000000000001"
 *                   type: "device_category"
 *                   attributes:
 *                     name: "Router"
 *                     code: "TDC01"
 *                     description: "Network routing devices"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-08T10:00:00.000Z"
 *                     updatedAt: "2026-05-08T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/device-categories/019f1ab2-0000-7000-0000-000000000001"
 *               meta:
 *                 requestId: "req-001"
 *                 timestamp: "2026-05-08T10:00:00.000Z"
 *                 version: "1.49.0"
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *   post:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Create Device Category
 *     description: Creates a new device category scoped to the tenant's business. Code must be unique per business. Requires `device_category.create`.
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
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Router"
 *               code:
 *                 type: string
 *                 example: "TDC01"
 *                 description: User-supplied code, unique per business (e.g. TDC01, TDC02)
 *               description:
 *                 type: string
 *                 example: "Network routing devices"
 *     responses:
 *       201:
 *         description: Device category created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Device category created successfully"
 *               data:
 *                 id: "019f1ab2-0000-7000-0000-000000000001"
 *                 type: "device_category"
 *                 attributes:
 *                   name: "Router"
 *                   code: "TDC01"
 *                   description: "Network routing devices"
 *                   status: "active"
 *                 meta:
 *                   createdAt: "2026-05-08T10:00:00.000Z"
 *                   updatedAt: "2026-05-08T10:00:00.000Z"
 *       409:
 *         description: Code already exists in this business
 *
 * /tenant/device-categories/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Get Device Category
 *     description: Returns a single device category by UUID. Requires `device_category.view`.
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
 *         description: Device category found
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Update Device Category
 *     description: Updates name, code, description, or status. Requires `device_category.update`.
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Device category updated
 *       409:
 *         description: Code conflict
 *   delete:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Delete Device Category
 *     description: Soft-deletes a device category (status set to deleted). Requires `device_category.delete`.
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
 *         description: Device category deleted
 *
 * /tenant/device-categories/{uuid}/deactivate:
 *   post:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Deactivate Device Category
 *     description: Sets the device category status to inactive. Requires `device_category.update`.
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
 *         description: Device category deactivated
 *
 * /tenant/device-categories/{uuid}/activate:
 *   put:
 *     tags:
 *       - Tenant Device Categories
 *     summary: Activate Device Category
 *     description: Sets the device category status back to active. Requires `device_category.update`.
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
 *         description: Device category activated
 */

export {};
