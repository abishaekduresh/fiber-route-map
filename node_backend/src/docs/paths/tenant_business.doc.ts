/**
 * @openapi
 * /tenant-business:
 *   get:
 *     tags:
 *       - Tenant Business
 *     summary: List Tenant Businesses
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
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked, suspended, deleted, all] }
 *       - in: query
 *         name: filter[type]
 *         schema: { type: string, enum: [operator, distributor] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "name" }
 *         description: "Prefix with - for descending. E.g. -createdAt"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 statusCode: { type: integer, example: 200 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TenantBusiness' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *
 *   post:
 *     tags:
 *       - Tenant Business
 *     summary: Create Tenant Business
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
 *             required: [name, address, email, phone, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "ACME ISP"
 *               address:
 *                 type: string
 *                 example: "456 Network Ave, City"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@acme-isp.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               type:
 *                 type: string
 *                 enum: [operator, distributor]
 *                 example: "operator"
 *               countryUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Tenant business created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 201 }
 *                 data: { $ref: '#/components/schemas/TenantBusiness' }
 *
 * /tenant-business/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Business
 *     summary: Get Tenant Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/TenantBusiness' }
 *       404:
 *         description: Tenant business not found
 *
 *   put:
 *     tags:
 *       - Tenant Business
 *     summary: Update Tenant Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               type: { type: string, enum: [operator, distributor] }
 *               countryUuid: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant business updated
 *
 *   delete:
 *     tags:
 *       - Tenant Business
 *     summary: Delete Tenant Business (soft)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant business deleted
 *
 * /tenant-business/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Business
 *     summary: Block Tenant Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant business blocked
 *
 * /tenant-business/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Business
 *     summary: Unblock Tenant Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant business unblocked
 *
 * /tenant-business/{uuid}/suspend:
 *   post:
 *     tags:
 *       - Tenant Business
 *     summary: Suspend Tenant Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant business suspended
 */
export const TenantBusinessPathDoc = {};
