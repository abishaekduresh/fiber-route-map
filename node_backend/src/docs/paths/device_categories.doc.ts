/**
 * @openapi
 * /device-categories:
 *   get:
 *     tags:
 *       - Device Categories
 *     summary: List global device categories
 *     description: Returns all global device categories. Requires `device_categories.view`.
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
 *                     code: "DC0001"
 *                     name: "Fiber Terminal"
 *                     description: "FAT and FDH terminal devices"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-14T10:00:00.000Z"
 *                     updatedAt: "2026-05-14T10:00:00.000Z"
 *                   links:
 *                     self: "/api/device-categories/019f1ab2-0000-7000-0000-000000000001"
 *               meta:
 *                 requestId: "req-001"
 *                 timestamp: "2026-05-14T10:00:00.000Z"
 *                 version: "1.64.0"
 *                 pagination:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *   post:
 *     tags:
 *       - Device Categories
 *     summary: Create a device category
 *     description: Creates a new global device category. Requires `device_categories.create`.
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
 *               name:
 *                 type: string
 *                 example: "Fiber Terminal"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "FAT and FDH terminal devices"
 *     responses:
 *       201:
 *         description: Device category created
 *       422:
 *         description: Validation error
 *
 * /device-categories/{uuid}:
 *   get:
 *     tags:
 *       - Device Categories
 *     summary: Get a device category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device category retrieved
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Device Categories
 *     summary: Update a device category
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
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Device category updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags:
 *       - Device Categories
 *     summary: Delete a device category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device category deleted
 *       404:
 *         description: Not found
 */

export default {};
