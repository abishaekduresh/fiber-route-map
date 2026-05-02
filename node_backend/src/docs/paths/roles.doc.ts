/**
 * @openapi
 * /roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: List Roles
 *     description: Retrieve all roles with pagination. Requires `role.view`.
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
 *         name: name
 *         schema: { type: string, example: "Admin" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Roles listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Roles retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-cccc-7000-0000-000000000001"
 *                   type: "role"
 *                   attributes:
 *                     name: "Super Admin"
 *                     slug: "super-admin"
 *                     description: "Full system access"
 *                     status: "active"
 *                     showForTenants: false
 *                     permissions:
 *                       - { slug: "user.view",   name: "View Users" }
 *                       - { slug: "user.create", name: "Create Users" }
 *                 - id: "019d1eb5-dddd-7000-0000-000000000002"
 *                   type: "role"
 *                   attributes:
 *                     name: "Manager"
 *                     slug: "manager"
 *                     description: "Manages daily operations"
 *                     status: "active"
 *                     showForTenants: true
 *                     permissions:
 *                       - { slug: "user.view", name: "View Users" }
 *               meta:
 *                 pagination:
 *                   total: 2
 *                   count: 2
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
 *       - Roles
 *     summary: Create Role
 *     description: Create a new role. Requires `role.create`.
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
 *             required: [name, slug, description]
 *             properties:
 *               name: { type: string, example: "Manager" }
 *               slug: { type: string, example: "manager" }
 *               description: { type: string, example: "Manages daily operations" }
 *               status: { type: string, enum: [active, inactive], example: "active" }
 *               showForTenants: { type: boolean, example: false }
 *           example:
 *             name: "Manager"
 *             slug: "manager"
 *             description: "Manages daily operations"
 *             status: "active"
 *             showForTenants: false
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Role created successfully"
 *               data:
 *                 id: "019d1eb5-dddd-7000-0000-000000000002"
 *                 type: "role"
 *                 attributes:
 *                   name: "Manager"
 *                   slug: "manager"
 *                   description: "Manages daily operations"
 *                   status: "active"
 *                   showForTenants: false
 *                   permissions: []
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       409:
 *         description: Role slug already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A role with slug 'manager' already exists."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /roles/{uuid}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get Role Details
 *     description: Retrieve a role with all its assigned permissions. Requires `role.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-cccc-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Role retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-cccc-7000-0000-000000000001"
 *                 type: "role"
 *                 attributes:
 *                   name: "Super Admin"
 *                   slug: "super-admin"
 *                   description: "Full system access"
 *                   status: "active"
 *                   showForTenants: false
 *                   permissions:
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772535", slug: "user.view",       name: "View Users" }
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772536", slug: "user.create",     name: "Create Users" }
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772537", slug: "user.update",     name: "Update Users" }
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772538", slug: "user.delete",     name: "Delete Users" }
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772539", slug: "role.view",       name: "View Roles" }
 *                     - { id: "019d1eb5-88ac-772d-b30c-816140772540", slug: "permission.view", name: "View Permissions" }
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Role not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Roles
 *     summary: Update Role
 *     description: Update a role's name, description, or status. Requires `role.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-dddd-7000-0000-000000000002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Senior Manager" }
 *               description: { type: string, example: "Senior level manager with extended access" }
 *               status: { type: string, enum: [active, inactive], example: "active" }
 *               showForTenants: { type: boolean, example: true }
 *           example:
 *             name: "Senior Manager"
 *             description: "Senior level manager with extended access"
 *             status: "active"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Role updated successfully"
 *               data:
 *                 id: "019d1eb5-dddd-7000-0000-000000000002"
 *                 type: "role"
 *                 attributes:
 *                   name: "Senior Manager"
 *                   slug: "manager"
 *                   description: "Senior level manager with extended access"
 *                   status: "active"
 *                   showForTenants: false
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       409:
 *         description: New slug already taken
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A role with that slug already exists."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Delete Role (Soft Delete)
 *     description: Soft-deletes a role. Requires `role.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-dddd-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Role deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Role deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /roles/{uuid}/restore:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Restore Deleted Role
 *     description: Restores a soft-deleted role back to active. Requires `role.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-dddd-7000-0000-000000000002"
 *     responses:
 *       200:
 *         description: Role restored
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Role restored successfully"
 *               data:
 *                 id: "019d1eb5-dddd-7000-0000-000000000002"
 *                 type: "role"
 *                 attributes:
 *                   name: "Manager"
 *                   slug: "manager"
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
 * /roles/{uuid}/permissions:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Sync Role Permissions
 *     description: >
 *       Replaces all permissions on a role with exactly the provided list.
 *       Pass an empty array to remove all permissions. Requires `role.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-dddd-7000-0000-000000000002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *                 description: Array of permission UUIDs to assign. Pass [] to remove all.
 *           example:
 *             permissions:
 *               - "019d1eb5-88ac-772d-b30c-816140772535"
 *               - "019d1eb5-88ac-772d-b30c-816140772536"
 *               - "019d1eb5-88ac-772d-b30c-816140772537"
 *     responses:
 *       200:
 *         description: Permissions synchronized
 *         content:
 *           application/json:
 *             examples:
 *               synced:
 *                 summary: Permissions updated
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Permissions synchronized successfully"
 *                   data:
 *                     id: "019d1eb5-dddd-7000-0000-000000000002"
 *                     type: "role"
 *                     attributes:
 *                       name: "Manager"
 *                       slug: "manager"
 *                       permissions:
 *                         - { id: "019d1eb5-88ac-772d-b30c-816140772535", slug: "user.view",   name: "View Users" }
 *                         - { id: "019d1eb5-88ac-772d-b30c-816140772536", slug: "user.create", name: "Create Users" }
 *                         - { id: "019d1eb5-88ac-772d-b30c-816140772537", slug: "role.view",   name: "View Roles" }
 *               cleared:
 *                 summary: All permissions removed
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Permissions synchronized successfully"
 *                   data:
 *                     id: "019d1eb5-dddd-7000-0000-000000000002"
 *                     type: "role"
 *                     attributes:
 *                       name: "Manager"
 *                       slug: "manager"
 *                       permissions: []
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export const RolePathDoc = {};
