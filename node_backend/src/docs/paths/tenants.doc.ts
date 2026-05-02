/**
 * @openapi
 * /tenants:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: List Tenants
 *     description: Paginated list of tenants with filtering. Requires `tenant.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, example: 10 }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked, suspended, deleted, all] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string, example: "ACME" }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string, example: "tenant@example.com" }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *         description: "Prefix with - for descending"
 *     responses:
 *       200:
 *         description: Tenants listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenants retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000001"
 *                   type: "tenant"
 *                   attributes:
 *                     name: "ACME Corporation"
 *                     email: "tenant@acme.com"
 *                     username: "acme_corp"
 *                     address: "123 Main St, Mumbai"
 *                     status: "active"
 *                     country: { name: "India", code: "IN", phoneCode: "+91" }
 *                     role: { name: "Tenant Business Super Admin", slug: "tenant-business-super-admin" }
 *                   meta:
 *                     createdAt: "2026-03-24T06:44:05.000Z"
 *               meta:
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Create Tenant
 *     description: Create a new tenant account. Requires `tenant.create`.
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
 *               email: { type: string, format: email, example: "tenant@acme.com" }
 *               username: { type: string, example: "acme_corp" }
 *               name: { type: string, example: "ACME Corporation" }
 *               address: { type: string, example: "123 Main St, Mumbai" }
 *               password: { type: string, format: password, example: "Tenant@1234" }
 *               countryUuid: { type: string, format: uuid, example: "019d1eb5-0000-7000-0000-000000000001" }
 *               roleUuid: { type: string, format: uuid, example: "019d1eb5-cccc-7000-0000-000000000001" }
 *           example:
 *             email: "tenant@acme.com"
 *             username: "acme_corp"
 *             name: "ACME Corporation"
 *             address: "123 Main St, Mumbai"
 *             password: "Tenant@1234"
 *             countryUuid: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       201:
 *         description: Tenant created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Tenant created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000010"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corporation"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   address: "123 Main St, Mumbai"
 *                   status: "active"
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             examples:
 *               emailConflict:
 *                 summary: Email already taken
 *                 value:
 *                   success: false
 *                   statusCode: 409
 *                   errorType: "CONFLICT"
 *                   message: "A tenant with email 'tenant@acme.com' already exists."
 *               usernameConflict:
 *                 summary: Username already taken
 *                 value:
 *                   success: false
 *                   statusCode: 409
 *                   errorType: "CONFLICT"
 *                   message: "A tenant with username 'acme_corp' already exists."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenants/{uuid}:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get Tenant Details
 *     description: Retrieve a specific tenant. Requires `tenant.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Tenant retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corporation"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   address: "123 Main St, Mumbai"
 *                   status: "active"
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *                   role: { name: "Tenant Business Super Admin", slug: "tenant-business-super-admin" }
 *                 meta:
 *                   createdAt: "2026-03-24T06:44:05.000Z"
 *                   updatedAt: "2026-03-24T06:44:05.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Tenant not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Tenants
 *     summary: Update Tenant
 *     description: Update tenant profile fields. Requires `tenant.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "ACME Corp Updated" }
 *               email: { type: string, format: email, example: "newemail@acme.com" }
 *               username: { type: string, example: "acme_corp_v2" }
 *               address: { type: string, example: "456 New Street, Delhi" }
 *               countryUuid: { type: string, format: uuid }
 *               roleUuid: { type: string, format: uuid }
 *           example:
 *             name: "ACME Corp Updated"
 *             address: "456 New Street, Delhi"
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant updated successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corp Updated"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   address: "456 New Street, Delhi"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       409:
 *         description: Email or username conflict
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A tenant with that email already exists."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Tenants
 *     summary: Delete Tenant (Soft)
 *     description: Soft-deletes a tenant. Requires `tenant.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Tenant deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenants/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Block Tenant
 *     description: Sets tenant status to `blocked`. Requires `tenant.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Tenant blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant blocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corporation"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   status: "blocked"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenants/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenants
 *     summary: Unblock Tenant
 *     description: Restores a blocked tenant to `active`. Requires `tenant.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Tenant unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant unblocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corporation"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   status: "active"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenants/{uuid}/suspend:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Suspend Tenant
 *     description: Sets tenant status to `suspended`. Requires `tenant.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Tenant suspended
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant suspended successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "tenant"
 *                 attributes:
 *                   name: "ACME Corporation"
 *                   email: "tenant@acme.com"
 *                   username: "acme_corp"
 *                   status: "suspended"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export const TenantPathDoc = {};
