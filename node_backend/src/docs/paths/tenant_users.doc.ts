/**
 * @openapi
 * /tenant/users:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: List Tenant Users
 *     description: >
 *       Returns a paginated list of users belonging to the authenticated tenant.
 *       Requires a valid tenant Bearer token (JWT). Results are scoped exclusively
 *       to the tenant derived from the token — tenants cannot see other tenants' users.
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
 *         description: Pass -1 to return all records
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked, all] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Users retrieved successfully"
 *               data:
 *                 - id: "019f1ab2-cccc-7000-0000-000000000001"
 *                   type: "tenant_user"
 *                   attributes:
 *                     name: "Jane Smith"
 *                     email: "jane@acmefiber.com"
 *                     phone: "9876500001"
 *                     role: "admin"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-03T10:00:00.000Z"
 *                     updatedAt: "2026-05-03T10:00:00.000Z"
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
 *     summary: Create Tenant User
 *     description: >
 *       Creates a new user scoped to the authenticated tenant.
 *       Email must be unique within the tenant's user list.
 *       Available roles: `admin`, `manager`, `member`, `viewer`.
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
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@acmefiber.com"
 *               phone:
 *                 type: string
 *                 example: "9876500001"
 *               role:
 *                 type: string
 *                 enum: [admin, manager, member, viewer]
 *                 default: member
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass@123"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "User created successfully"
 *               data:
 *                 id: "019f1ab2-cccc-7000-0000-000000000001"
 *                 type: "tenant_user"
 *                 attributes:
 *                   name: "Jane Smith"
 *                   email: "jane@acmefiber.com"
 *                   phone: "9876500001"
 *                   role: "admin"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       409:
 *         description: Email already exists in this tenant
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               message: "A user with this email already exists in your account"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /tenant/users/{uuid}:
 *   get:
 *     tags:
 *       - Tenant Users
 *     summary: Get Tenant User
 *     description: Returns a single tenant user by UUID. Only accessible within the authenticated tenant's scope.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019f1ab2-cccc-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Tenant Users
 *     summary: Update Tenant User
 *     description: Updates name, email, phone, or role for a tenant user. Password changes are not supported here.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Jane Smith" }
 *               email: { type: string, format: email, example: "jane@acmefiber.com" }
 *               phone: { type: string, example: "9876500001" }
 *               role: { type: string, enum: [admin, manager, member, viewer], example: "manager" }
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       409:
 *         description: Email already in use within this tenant
 *
 *   delete:
 *     tags:
 *       - Tenant Users
 *     summary: Delete Tenant User
 *     description: Permanently deletes the tenant user record.
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
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/users/{uuid}/block:
 *   post:
 *     tags:
 *       - Tenant Users
 *     summary: Block Tenant User
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
 *         description: User blocked successfully
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 * /tenant/users/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Tenant Users
 *     summary: Unblock Tenant User
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
 *         description: User unblocked successfully
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
export const TenantUserPathDoc = {};
