/**
 * @openapi
 * /permissions:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: List All Permissions
 *     description: Retrieve all system permissions with pagination and filtering. Requires `permission.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1, example: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10, example: 10 }
 *         description: Use -1 to retrieve all permissions at once
 *       - name: filter[name]
 *         in: query
 *         schema: { type: string, example: "View Users" }
 *       - name: filter[slug]
 *         in: query
 *         schema: { type: string, example: "user.view" }
 *       - name: sort
 *         in: query
 *         schema: { type: string, example: "slug" }
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Permissions retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                   type: "permission"
 *                   attributes:
 *                     name: "View Users"
 *                     slug: "user.view"
 *                     description: "Can view user list and details"
 *                     resource: "user"
 *                   meta:
 *                     createdAt: "2026-03-24T06:44:05.000Z"
 *                     updatedAt: "2026-03-24T06:44:05.000Z"
 *                 - id: "019d1eb5-88ac-772d-b30c-816140772536"
 *                   type: "permission"
 *                   attributes:
 *                     name: "Create Users"
 *                     slug: "user.create"
 *                     description: "Can create new user accounts"
 *                     resource: "user"
 *                   meta:
 *                     createdAt: "2026-03-24T06:44:05.000Z"
 *                     updatedAt: "2026-03-24T06:44:05.000Z"
 *                 - id: "019d1eb5-88ac-772d-b30c-816140772537"
 *                   type: "permission"
 *                   attributes:
 *                     name: "Update Users"
 *                     slug: "user.update"
 *                     description: "Can update user profiles"
 *                     resource: "user"
 *                   meta:
 *                     createdAt: "2026-03-24T06:44:05.000Z"
 *                     updatedAt: "2026-03-24T06:44:05.000Z"
 *               meta:
 *                 pagination:
 *                   total: 29
 *                   count: 10
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 3
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Create Permission
 *     description: >
 *       Create a new permission. Slug must be unique and follow `resource.action` format
 *       (lowercase letters, numbers, dots only). Requires `permission.create`.
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
 *             required: [name, slug]
 *             properties:
 *               name: { type: string, example: "Export Reports" }
 *               slug: { type: string, example: "report.export" }
 *               description: { type: string, example: "Can export reports to CSV" }
 *           example:
 *             name: "Export Reports"
 *             slug: "report.export"
 *             description: "Can export reports to CSV"
 *     responses:
 *       201:
 *         description: Permission created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Permission created successfully"
 *               data:
 *                 id: "019d1eb5-9999-772d-b30c-816140772599"
 *                 type: "permission"
 *                 attributes:
 *                   name: "Export Reports"
 *                   slug: "report.export"
 *                   description: "Can export reports to CSV"
 *                   resource: "report"
 *                 meta:
 *                   createdAt: "2026-05-02T10:00:00.000Z"
 *                   updatedAt: "2026-05-02T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       409:
 *         description: Permission slug already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "Permission with slug 'report.export' already exists."
 *       422:
 *         description: Invalid slug format
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 422
 *               errorType: "VALIDATION_ERROR"
 *               message: "Validation failed"
 *               errors:
 *                 - field: "slug"
 *                   message: "Slug must only contain lowercase letters, numbers, and dots (e.g. user.view)"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /permissions/sync:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Sync Permissions
 *     description: >
 *       Inserts any missing permissions from ROUTE_PERMISSIONS using INSERT IGNORE.
 *       Existing permissions are never modified. This operation is idempotent — safe to run multiple times.
 *       Requires `permission.create`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Sync complete
 *         content:
 *           application/json:
 *             examples:
 *               newPermissionsAdded:
 *                 summary: New permissions were inserted
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Sync complete — 3 new permissions added"
 *                   data:
 *                     added: ["apidoc.view", "tenant.export", "report.view"]
 *                     total: 32
 *               alreadyUpToDate:
 *                 summary: Nothing to insert
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "All permissions are already up to date"
 *                   data:
 *                     added: []
 *                     total: 29
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /permissions/{uuid}:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Get Permission Details
 *     description: Retrieve a specific permission by UUID. Requires `permission.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-88ac-772d-b30c-816140772535"
 *     responses:
 *       200:
 *         description: Permission retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                 type: "permission"
 *                 attributes:
 *                   name: "View Users"
 *                   slug: "user.view"
 *                   description: "Can view user list and details"
 *                   resource: "user"
 *                 meta:
 *                   createdAt: "2026-03-24T06:44:05.000Z"
 *                   updatedAt: "2026-03-24T06:44:05.000Z"
 *                 links:
 *                   self: "/api/permissions/019d1eb5-88ac-772d-b30c-816140772535"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Permission not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Permissions
 *     summary: Update Permission
 *     description: Update a permission's name, slug, or description. Requires `permission.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-88ac-772d-b30c-816140772535"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "View All Users" }
 *               slug: { type: string, example: "user.view" }
 *               description: { type: string, example: "Can view all user profiles and details" }
 *           example:
 *             name: "View All Users"
 *             description: "Can view all user profiles and details"
 *     responses:
 *       200:
 *         description: Permission updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Permission updated successfully"
 *               data:
 *                 id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                 type: "permission"
 *                 attributes:
 *                   name: "View All Users"
 *                   slug: "user.view"
 *                   description: "Can view all user profiles and details"
 *                   resource: "user"
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
 *               message: "Permission with that slug already exists."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Permissions
 *     summary: Delete Permission
 *     description: Hard-deletes a permission record. Requires `permission.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-88ac-772d-b30c-816140772535"
 *     responses:
 *       200:
 *         description: Permission deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Permission deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export {};
