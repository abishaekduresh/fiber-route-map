/**
 * @openapi
 * /tenant-business:
 *   get:
 *     tags:
 *       - Tenant Business
 *     summary: List Tenant Businesses
 *     description: Paginated list of tenant businesses with filtering. Requires `tenant_business.view`.
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
 *         name: filter[type]
 *         schema: { type: string, enum: [operator, distributor] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string, example: "ACME ISP" }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string, example: "contact@acme-isp.com" }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *         description: "Prefix with - for descending"
 *     responses:
 *       200:
 *         description: Businesses listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant businesses retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000002"
 *                   type: "tenant_business"
 *                   attributes:
 *                     name: "ACME ISP"
 *                     address: "456 Network Ave, City"
 *                     email: "contact@acme-isp.com"
 *                     phone: "9876543210"
 *                     type: "operator"
 *                     status: "active"
 *                     country: { name: "India", code: "IN", phoneCode: "+91" }
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
 *       - Tenant Business
 *     summary: Create Tenant Business
 *     description: Register a new tenant business (ISP operator or distributor). Requires `tenant_business.create`.
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
 *               name: { type: string, example: "ACME ISP" }
 *               address: { type: string, example: "456 Network Ave, City" }
 *               email: { type: string, format: email, example: "contact@acme-isp.com" }
 *               phone: { type: string, example: "9876543210" }
 *               type: { type: string, enum: [operator, distributor], example: "operator" }
 *               countryUuid: { type: string, format: uuid, example: "019d1eb5-0000-7000-0000-000000000001" }
 *           example:
 *             name: "ACME ISP"
 *             address: "456 Network Ave, City"
 *             email: "contact@acme-isp.com"
 *             phone: "9876543210"
 *             type: "operator"
 *             countryUuid: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       201:
 *         description: Business created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Tenant business created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000020"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP"
 *                   address: "456 Network Ave, City"
 *                   email: "contact@acme-isp.com"
 *                   phone: "9876543210"
 *                   type: "operator"
 *                   status: "active"
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       409:
 *         description: Business email already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A tenant business with email 'contact@acme-isp.com' already exists."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenant-business/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Business
 *     summary: Get Tenant Business Details
 *     description: Retrieve a specific tenant business. Requires `tenant_business.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Business retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP"
 *                   address: "456 Network Ave, City"
 *                   email: "contact@acme-isp.com"
 *                   phone: "9876543210"
 *                   type: "operator"
 *                   status: "active"
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *                 meta:
 *                   createdAt: "2026-03-24T06:44:05.000Z"
 *                   updatedAt: "2026-03-24T06:44:05.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Tenant business not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Tenant business not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Tenant Business
 *     summary: Update Tenant Business
 *     description: Update a business's details. Requires `tenant_business.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "ACME ISP Updated" }
 *               address: { type: string, example: "789 Updated Ave, Mumbai" }
 *               email: { type: string, format: email, example: "new@acme-isp.com" }
 *               phone: { type: string, example: "1234567890" }
 *               type: { type: string, enum: [operator, distributor], example: "distributor" }
 *               countryUuid: { type: string, format: uuid }
 *           example:
 *             name: "ACME ISP Updated"
 *             phone: "1234567890"
 *             type: "distributor"
 *     responses:
 *       200:
 *         description: Business updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant business updated successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP Updated"
 *                   address: "456 Network Ave, City"
 *                   email: "contact@acme-isp.com"
 *                   phone: "1234567890"
 *                   type: "distributor"
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
 *         description: Email conflict
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A tenant business with that email already exists."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Tenant Business
 *     summary: Delete Tenant Business (Soft)
 *     description: Soft-deletes a tenant business. Requires `tenant_business.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Business deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant business deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenant-business/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Business
 *     summary: Block Tenant Business
 *     description: Sets status to `blocked`. Requires `tenant_business.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Business blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant business blocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP"
 *                   email: "contact@acme-isp.com"
 *                   phone: "9876543210"
 *                   type: "operator"
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
 * /tenant-business/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Business
 *     summary: Unblock Tenant Business
 *     description: Restores a blocked business to `active`. Requires `tenant_business.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Business unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant business unblocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP"
 *                   email: "contact@acme-isp.com"
 *                   phone: "9876543210"
 *                   type: "operator"
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
 * /tenant-business/{uuid}/suspend:
 *   post:
 *     tags:
 *       - Tenant Business
 *     summary: Suspend Tenant Business
 *     description: Sets status to `suspended`. Requires `tenant_business.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Business suspended
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tenant business suspended successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "tenant_business"
 *                 attributes:
 *                   name: "ACME ISP"
 *                   email: "contact@acme-isp.com"
 *                   phone: "9876543210"
 *                   type: "operator"
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
export const TenantBusinessPathDoc = {};
