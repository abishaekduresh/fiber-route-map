/**
 * @openapi
 * /tenant/upstream-providers:
 *   get:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: List Upstream Providers
 *     description: Returns all upstream providers scoped to the authenticated tenant's business. Requires `upstream_provider.view`.
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
 *         name: filter[name]
 *         schema: { type: string, example: "BSNL" }
 *       - in: query
 *         name: filter[serviceCategory]
 *         schema: { type: string, enum: [cabletv, bandwidth, iptv, hybrid] }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive, blocked, all] }
 *     responses:
 *       200:
 *         description: Providers listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Upstream providers retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000050"
 *                   type: "upstream_provider"
 *                   attributes:
 *                     name: "BSNL Fiber"
 *                     code: "TUP0001"
 *                     serviceCategory: "bandwidth"
 *                     contactPerson: "Rajesh Kumar"
 *                     phone: "+91 98765 43210"
 *                     email: "rajesh@bsnl.in"
 *                     addressLine1: "BSNL Tower, MG Road"
 *                     city: "Bengaluru"
 *                     state: "Karnataka"
 *                     country: { uuid: "019d1eb5-0000-7000-0000-000000000020", name: "India" }
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-04T10:00:00.000Z"
 *                     updatedAt: "2026-05-04T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/upstream-providers/019d1eb5-0000-7000-0000-000000000050"
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
 *       - Tenant Upstream Providers
 *     summary: Create Upstream Provider
 *     description: |
 *       Creates a new upstream provider scoped to the authenticated tenant's business.
 *       - `code` is auto-generated as `TUPxxxx` (e.g. TUP0001) per business — do not pass it.
 *       - `status` is forced to `active` on creation.
 *       Requires `upstream_provider.create`.
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
 *             required: [name, serviceCategory, contactPerson, phone, email, addressLine1, city, state]
 *             properties:
 *               name:            { type: string, example: "BSNL Fiber" }
 *               serviceCategory: { type: string, enum: [cabletv, bandwidth, iptv, hybrid], example: "bandwidth" }
 *               contactPerson:   { type: string, example: "Rajesh Kumar" }
 *               phone:           { type: string, example: "+91 98765 43210" }
 *               email:           { type: string, format: email, example: "rajesh@bsnl.in" }
 *               addressLine1:    { type: string, example: "BSNL Tower, MG Road" }
 *               city:            { type: string, example: "Bengaluru" }
 *               state:           { type: string, example: "Karnataka" }
 *               countryUuid:     { type: string, example: "019d1eb5-0000-7000-0000-000000000020" }
 *     responses:
 *       200:
 *         description: Provider created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Upstream provider created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000050"
 *                 type: "upstream_provider"
 *                 attributes:
 *                   name: "BSNL Fiber"
 *                   code: "TUP0001"
 *                   serviceCategory: "bandwidth"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       409:
 *         description: Duplicate email or phone within the business
 *
 * /tenant/upstream-providers/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: Get Upstream Provider
 *     description: Retrieves a single upstream provider by UUID, scoped to the tenant's business. Requires `upstream_provider.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000050"
 *     responses:
 *       200:
 *         description: Provider retrieved
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: Update Upstream Provider
 *     description: Updates provider details. All fields optional. `code` is immutable. Requires `upstream_provider.update`.
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
 *               name:            { type: string }
 *               serviceCategory: { type: string, enum: [cabletv, bandwidth, iptv, hybrid] }
 *               contactPerson:   { type: string }
 *               phone:           { type: string }
 *               email:           { type: string, format: email }
 *               addressLine1:    { type: string }
 *               city:            { type: string }
 *               state:           { type: string }
 *               countryUuid:     { type: string }
 *     responses:
 *       200:
 *         description: Provider updated
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   delete:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: Delete Upstream Provider
 *     description: Soft-deletes the provider (sets status to `deleted`). Requires `upstream_provider.delete`.
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
 *         description: Provider deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Upstream provider deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/upstream-providers/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: Block Upstream Provider
 *     description: Sets provider status to `blocked`. Requires `upstream_provider.update`.
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
 *         description: Provider blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Upstream provider blocked"
 *               data:
 *                 attributes:
 *                   status: "blocked"
 *
 * /tenant/upstream-providers/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Upstream Providers
 *     summary: Unblock Upstream Provider
 *     description: Restores provider status to `active`. Requires `upstream_provider.update`.
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
 *         description: Provider unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Upstream provider unblocked"
 *               data:
 *                 attributes:
 *                   status: "active"
 */
