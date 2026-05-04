/**
 * @openapi
 * /tenant/lcos:
 *   get:
 *     tags:
 *       - Tenant LCOs
 *     summary: List LCOs
 *     description: Returns all LCOs scoped to the authenticated tenant. Requires `lco.view`.
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
 *         name: filter[lcoName]
 *         schema: { type: string, example: "Star" }
 *         description: Filter by LCO name (partial match)
 *     responses:
 *       200:
 *         description: LCOs listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "LCOs retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000030"
 *                   type: "lco"
 *                   attributes:
 *                     businessName: "Star Cables"
 *                     code: "LCO0001"
 *                     lcoName: "Ravi Kumar"
 *                     phone: "+91 98765 43210"
 *                     email: "ravi@starcables.in"
 *                     address_line1: "12 Main Street"
 *                     city: "Chennai"
 *                     state: "Tamil Nadu"
 *                     pincode: "600001"
 *                     status: "active"
 *                     countryUuid: "019d1eb5-0000-7000-0000-000000000020"
 *                   meta:
 *                     createdAt: "2026-05-01T10:00:00.000Z"
 *                     updatedAt: "2026-05-01T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/lcos/019d1eb5-0000-7000-0000-000000000030"
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
 *       - Tenant LCOs
 *     summary: Create LCO
 *     description: |
 *       Creates a new LCO scoped to the authenticated tenant.
 *       - `code` is auto-generated as `LCO0001`, `LCO0002`, … per tenant — do not pass it.
 *       - `businessName` is inherited from the tenant's business — do not pass it.
 *       - `status` is forced to `active` on creation.
 *       Requires `lco.create`.
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
 *             required: [lcoName, phone, email, address_line1, city, state, pincode]
 *             properties:
 *               lcoName:      { type: string, example: "Ravi Kumar" }
 *               phone:        { type: string, example: "+91 98765 43210" }
 *               email:        { type: string, format: email, example: "ravi@starcables.in" }
 *               address_line1: { type: string, example: "12 Main Street" }
 *               city:         { type: string, example: "Chennai" }
 *               state:        { type: string, example: "Tamil Nadu" }
 *               pincode:      { type: string, example: "600001" }
 *               countryUuid:  { type: string, example: "019d1eb5-0000-7000-0000-000000000020" }
 *     responses:
 *       200:
 *         description: LCO created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "LCO created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000030"
 *                 type: "lco"
 *                 attributes:
 *                   code: "LCO0001"
 *                   lcoName: "Ravi Kumar"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       409:
 *         description: Duplicate phone or email
 *
 * /tenant/lcos/{uuid}:
 *   get:
 *     tags:
 *       - Tenant LCOs
 *     summary: Get LCO
 *     description: Retrieves a single LCO by UUID, scoped to the authenticated tenant. Requires `lco.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000030"
 *     responses:
 *       200:
 *         description: LCO retrieved
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Tenant LCOs
 *     summary: Update LCO
 *     description: Updates LCO details. All fields optional. `code` and `businessName` are immutable. Requires `lco.update`.
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
 *               lcoName:       { type: string }
 *               phone:         { type: string }
 *               email:         { type: string, format: email }
 *               address_line1: { type: string }
 *               city:          { type: string }
 *               state:         { type: string }
 *               pincode:       { type: string }
 *               countryUuid:   { type: string }
 *               status:        { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: LCO updated
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   delete:
 *     tags:
 *       - Tenant LCOs
 *     summary: Delete LCO
 *     description: Soft-deletes the LCO (sets status to `deleted`). Requires `lco.delete`.
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
 *         description: LCO deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "LCO deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
