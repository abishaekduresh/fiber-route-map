/**
 * @openapi
 * /tenant/cable-types:
 *   get:
 *     tags:
 *       - Tenant Cable Types
 *     summary: List Cable Types
 *     description: Returns all cable types scoped to the authenticated tenant's business. Requires `cable_type.view`.
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
 *         schema: { type: string, example: "G.652" }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive, blocked, all] }
 *     responses:
 *       200:
 *         description: Cable types listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Cable types retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000060"
 *                   type: "cable_type"
 *                   attributes:
 *                     name: "G.652D Single Mode"
 *                     code: "xF12"
 *                     tubeCount: 1
 *                     fiberCoreCount: 12
 *                     cableDiameter: 8.50
 *                     description: "Standard single-mode fiber cable"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-05T10:00:00.000Z"
 *                     updatedAt: "2026-05-05T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/cable-types/019d1eb5-0000-7000-0000-000000000060"
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
 *       - Tenant Cable Types
 *     summary: Create Cable Type
 *     description: |
 *       Creates a new cable type scoped to the authenticated tenant's business.
 *       - `code` is a user-supplied value (e.g. `xF12`) and must be unique within the business.
 *       - `status` is forced to `active` on creation.
 *       Requires `cable_type.create`.
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
 *             required: [name, code, fiberCoreCount, cableDiameter]
 *             properties:
 *               name:           { type: string, example: "G.652D Single Mode" }
 *               code:           { type: string, example: "xF12", description: "Unique code per business, user-supplied" }
 *               tubeCount:      { type: integer, example: 1, default: 1, description: "Number of tubes in the cable" }
 *               fiberCoreCount: { type: integer, example: 12 }
 *               cableDiameter:  { type: number, format: float, example: 8.50 }
 *               description:    { type: string, example: "Standard single-mode fiber cable" }
 *     responses:
 *       200:
 *         description: Cable type created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Cable type created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000060"
 *                 type: "cable_type"
 *                 attributes:
 *                   name: "G.652D Single Mode"
 *                   code: "xF12"
 *                   tubeCount: 1
 *                   fiberCoreCount: 12
 *                   cableDiameter: 8.50
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       409:
 *         description: Duplicate code within the business
 *
 * /tenant/cable-types/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Cable Types
 *     summary: Get Cable Type
 *     description: Retrieves a single cable type by UUID, scoped to the tenant's business. Requires `cable_type.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000060"
 *     responses:
 *       200:
 *         description: Cable type retrieved
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Tenant Cable Types
 *     summary: Update Cable Type
 *     description: Updates cable type details. All fields optional. `code` must remain unique within the business if changed. Requires `cable_type.update`.
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
 *               name:           { type: string }
 *               code:           { type: string }
 *               tubeCount:      { type: integer }
 *               fiberCoreCount: { type: integer }
 *               cableDiameter:  { type: number, format: float }
 *               description:    { type: string }
 *               status:         { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Cable type updated
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   delete:
 *     tags:
 *       - Tenant Cable Types
 *     summary: Delete Cable Type
 *     description: Soft-deletes the cable type (sets status to `deleted`). Requires `cable_type.delete`.
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
 *         description: Cable type deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Cable type deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/cable-types/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Cable Types
 *     summary: Block Cable Type
 *     description: Sets cable type status to `blocked`. Requires `cable_type.update`.
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
 *         description: Cable type blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Cable type blocked"
 *               data:
 *                 attributes:
 *                   status: "blocked"
 *
 * /tenant/cable-types/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Cable Types
 *     summary: Unblock Cable Type
 *     description: Restores cable type status to `active`. Requires `cable_type.update`.
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
 *         description: Cable type unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Cable type unblocked"
 *               data:
 *                 attributes:
 *                   status: "active"
 */
