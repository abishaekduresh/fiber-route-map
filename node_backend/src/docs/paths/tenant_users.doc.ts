/**
 * @openapi
 * /tenant/users/roles:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: List Available Roles
 *     description: Returns roles marked as `showForTenants=true` (active only). Used to populate the role picker when creating/editing a sub-user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Roles retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000010"
 *                   name: "Operator"
 *                   slug: "operator"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *
 * /tenant/users/countries:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: List Countries
 *     description: Returns all countries ordered by name. Used to populate the country picker in the user form.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Countries listed
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000020"
 *                   attributes:
 *                     name: "India"
 *                     code: "IN"
 *                     phoneCode: "+91"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *
 * /tenant/users/businesses:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: Get Tenant Business
 *     description: Returns the authenticated tenant's own business — used to display the auto-assigned business on the user form.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Business info
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000030"
 *                   name: "ACME ISP"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *
 * /tenant/users:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: List Sub-Users
 *     description: Returns all sub-users belonging to the authenticated tenant's business (excludes the authenticated tenant itself).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, example: -1 }
 *         description: Use -1 to return all records
 *     responses:
 *       200:
 *         description: Users listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Users retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000040"
 *                   type: "tenant_user"
 *                   attributes:
 *                     name: "John Doe"
 *                     username: "john_doe"
 *                     email: "john@acme.com"
 *                     phone: "+91 98765 43210"
 *                     address: "456 Sub St, Mumbai"
 *                     role: { uuid: "019d1eb5-0000-7000-0000-000000000010", name: "Operator", slug: "operator" }
 *                     status: "active"
 *                     country: { uuid: "019d1eb5-0000-7000-0000-000000000020", name: "India" }
 *                     business: { uuid: "019d1eb5-0000-7000-0000-000000000030", name: "ACME ISP" }
 *                   meta:
 *                     createdAt: "2026-05-03T10:00:00.000Z"
 *                     updatedAt: "2026-05-03T10:00:00.000Z"
 *                   links:
 *                     self: "/api/tenant/users/019d1eb5-0000-7000-0000-000000000040"
 *               meta:
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   post:
 *     tags:
 *       - Tenant Users
 *     summary: Create Sub-User
 *     description: |
 *       Creates a new sub-user scoped to the authenticated tenant's business.
 *       - `tenantBusinessId` is inherited automatically from the parent tenant — do not pass it.
 *       - `countryId` falls back to the parent tenant's country if `countryUuid` is omitted.
 *       - `username` is auto-generated (`emaillocal_xxxx`) if not provided.
 *       - `sessionLimit` is hardcoded to **1**.
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
 *             required: [name, email, password]
 *             properties:
 *               name:       { type: string, example: "John Doe" }
 *               username:   { type: string, example: "john_doe", description: "Auto-generated if omitted" }
 *               email:      { type: string, format: email, example: "john@acme.com" }
 *               phone:      { type: string, example: "+91 98765 43210" }
 *               address:    { type: string, example: "456 Sub St, Mumbai" }
 *               password:   { type: string, format: password, example: "SecurePass123!" }
 *               countryUuid: { type: string, example: "019d1eb5-0000-7000-0000-000000000020", description: "Defaults to parent tenant country" }
 *               roleUuid:   { type: string, example: "019d1eb5-0000-7000-0000-000000000010" }
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "User created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000040"
 *                 type: "tenant_user"
 *                 attributes:
 *                   name: "John Doe"
 *                   username: "john_doe"
 *                   email: "john@acme.com"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       409:
 *         description: Email or username already in use
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               message: "A user with this email already exists"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenant/users/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: Get Sub-User
 *     description: Retrieves a single sub-user by UUID, scoped to the authenticated tenant's business.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000040"
 *     responses:
 *       200:
 *         description: User retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000040"
 *                 type: "tenant_user"
 *                 attributes:
 *                   name: "John Doe"
 *                   email: "john@acme.com"
 *                   status: "active"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Tenant Users
 *     summary: Update Sub-User
 *     description: Updates a sub-user's profile. All fields are optional. Password cannot be changed via this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000040"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string, example: "Jane Doe" }
 *               username:    { type: string, example: "jane_doe" }
 *               email:       { type: string, format: email, example: "jane@acme.com" }
 *               phone:       { type: string, example: "+91 99999 00000" }
 *               address:     { type: string, example: "789 Updated Rd" }
 *               countryUuid: { type: string, example: "019d1eb5-0000-7000-0000-000000000020" }
 *               roleUuid:    { type: string, example: "019d1eb5-0000-7000-0000-000000000010" }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User updated successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       409:
 *         description: Email or username conflict
 *
 *   delete:
 *     tags:
 *       - Tenant Users
 *     summary: Delete Sub-User
 *     description: Permanently deletes a sub-user from the authenticated tenant's business.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000040"
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/users/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Users
 *     summary: Block Sub-User
 *     description: Sets the sub-user's status to `blocked`, preventing them from logging in.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000040"
 *     responses:
 *       200:
 *         description: User blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User blocked"
 *               data:
 *                 attributes:
 *                   status: "blocked"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/users/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Users
 *     summary: Unblock Sub-User
 *     description: Restores the sub-user's status to `active`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *         example: "019d1eb5-0000-7000-0000-000000000040"
 *     responses:
 *       200:
 *         description: User unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User unblocked"
 *               data:
 *                 attributes:
 *                   status: "active"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
