/**
 * @openapi
 * /tenants:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: List Tenants
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
 *         name: filter[name]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[username]
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
 *                   items: { $ref: '#/components/schemas/Tenant' }
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
 *       - Tenants
 *     summary: Create Tenant
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
 *             required: [email, username, name, address, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "tenant@example.com"
 *               username:
 *                 type: string
 *                 example: "acme_corp"
 *               name:
 *                 type: string
 *                 example: "ACME Corporation"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "Secret@123"
 *               countryUuid:
 *                 type: string
 *                 format: uuid
 *               roleUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Tenant created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 201 }
 *                 data: { $ref: '#/components/schemas/Tenant' }
 *
 * /tenants/{uuid}:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get Tenant
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
 *                 data: { $ref: '#/components/schemas/Tenant' }
 *       404:
 *         description: Tenant not found
 *
 *   put:
 *     tags:
 *       - Tenants
 *     summary: Update Tenant
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
 *               email: { type: string, format: email }
 *               username: { type: string }
 *               address: { type: string }
 *               countryUuid: { type: string, format: uuid }
 *               roleUuid: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant updated
 *
 *   delete:
 *     tags:
 *       - Tenants
 *     summary: Delete Tenant (soft)
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
 *         description: Tenant deleted
 *
 * /tenants/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Block Tenant
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
 *         description: Tenant blocked
 *
 * /tenants/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenants
 *     summary: Unblock Tenant
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
 *         description: Tenant unblocked
 *
 * /tenants/{uuid}/suspend:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Suspend Tenant
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
 *         description: Tenant suspended
 */
export const TenantPathDoc = {};
