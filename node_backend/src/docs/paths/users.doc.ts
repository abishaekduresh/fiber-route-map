/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List Users
 *     description: Retrieve a paginated, filtered, and sorted list of users. Requires `user.view` permission.
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
 *         description: Use -1 to return all records
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked, deleted] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string, example: "John" }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string, example: "john@example.com" }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *         description: "Field to sort by. Prefix with - for descending (e.g. -createdAt)"
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
 *                 - id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                   type: "user"
 *                   attributes:
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                     username: "admin"
 *                     phone: "9876543210"
 *                     status: "active"
 *                     country: { name: "India", code: "IN", phoneCode: "+91" }
 *                     roles: [{ name: "Super Admin", slug: "super-admin" }]
 *                 - id: "019d1eb5-1111-7000-0000-000000000010"
 *                   type: "user"
 *                   attributes:
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                     username: "john_doe"
 *                     phone: "9999999999"
 *                     status: "active"
 *                     country: { name: "India", code: "IN", phoneCode: "+91" }
 *                     roles: [{ name: "Manager", slug: "manager" }]
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
 *       - Users
 *     summary: Create User
 *     description: Create a new user account and assign roles. Requires `user.create` permission.
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
 *             required: [email, username, name, phone, password, confirmPassword]
 *             properties:
 *               email: { type: string, format: email, example: "john.doe@example.com" }
 *               username: { type: string, example: "john_doe" }
 *               name: { type: string, example: "John Doe" }
 *               phone: { type: string, example: "9876543210" }
 *               password: { type: string, format: password, example: "Password@123" }
 *               confirmPassword: { type: string, example: "Password@123" }
 *               countryUuid: { type: string, format: uuid, example: "019d1eb5-0000-7000-0000-000000000001" }
 *               roleUuids: { type: array, items: { type: string, format: uuid }, example: ["019d1eb5-cccc-7000-0000-000000000001"] }
 *               sessionLimit: { type: integer, minimum: 1, maximum: 10, example: 3 }
 *           example:
 *             email: "john.doe@example.com"
 *             username: "john_doe"
 *             name: "John Doe"
 *             phone: "9876543210"
 *             password: "Password@123"
 *             confirmPassword: "Password@123"
 *             countryUuid: "019d1eb5-0000-7000-0000-000000000001"
 *             roleUuids: ["019d1eb5-cccc-7000-0000-000000000001"]
 *             sessionLimit: 3
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
 *                 id: "019d1eb5-1111-7000-0000-000000000010"
 *                 type: "user"
 *                 attributes:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   username: "john_doe"
 *                   phone: "9876543210"
 *                   status: "active"
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *                   roles: [{ name: "Super Admin", slug: "super-admin" }]
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
 *                   message: "A user with email 'john.doe@example.com' already exists."
 *               usernameConflict:
 *                 summary: Username already taken
 *                 value:
 *                   success: false
 *                   statusCode: 409
 *                   errorType: "CONFLICT"
 *                   message: "A user with username 'john_doe' already exists."
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 422
 *               errorType: "VALIDATION_ERROR"
 *               message: "Validation failed"
 *               errors:
 *                 - field: "password"
 *                   message: "Password must be at least 8 characters"
 *                 - field: "confirmPassword"
 *                   message: "Passwords do not match"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /users/{uuid}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get User Details
 *     description: Retrieve the full profile of a specific user by UUID. Requires `user.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-88ac-772d-b30c-816140772535"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                 type: "user"
 *                 attributes:
 *                   name: "Admin User"
 *                   email: "admin@example.com"
 *                   username: "admin"
 *                   phone: "9876543210"
 *                   status: "active"
 *                   sessionLimit: 3
 *                   country: { name: "India", code: "IN", phoneCode: "+91" }
 *                   roles: [{ name: "Super Admin", slug: "super-admin" }]
 *                 meta:
 *                   createdAt: "2026-03-24T06:44:05.000Z"
 *                   updatedAt: "2026-03-24T06:44:05.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "User not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Update User
 *     description: Update a user's profile fields. Requires `user.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-1111-7000-0000-000000000010"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "John Doe Updated" }
 *               username: { type: string, example: "john_doe_v2" }
 *               phone: { type: string, example: "9999999999" }
 *               countryUuid: { type: string, format: uuid }
 *               roleUuids: { type: array, items: { type: string, format: uuid } }
 *               sessionLimit: { type: integer, minimum: 1, maximum: 10, example: 5 }
 *           example:
 *             name: "John Doe Updated"
 *             phone: "9999999999"
 *             sessionLimit: 5
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User updated successfully"
 *               data:
 *                 id: "019d1eb5-1111-7000-0000-000000000010"
 *                 type: "user"
 *                 attributes:
 *                   name: "John Doe Updated"
 *                   email: "john.doe@example.com"
 *                   username: "john_doe"
 *                   phone: "9999999999"
 *                   status: "active"
 *                   sessionLimit: 5
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "Username 'john_doe_v2' is already taken."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete User (Soft Delete)
 *     description: >
 *       Soft-deletes a user (marks as deleted). An authenticated user cannot delete their own account.
 *       Requires `user.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-1111-7000-0000-000000000010"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         description: Forbidden — missing permission or trying to delete own account
 *         content:
 *           application/json:
 *             examples:
 *               missingPermission:
 *                 summary: Missing permission
 *                 value:
 *                   success: false
 *                   statusCode: 403
 *                   errorType: "FORBIDDEN"
 *                   message: "You do not have permission to delete users."
 *               selfDelete:
 *                 summary: Cannot delete own account
 *                 value:
 *                   success: false
 *                   statusCode: 403
 *                   errorType: "FORBIDDEN"
 *                   message: "You cannot delete your own account."
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /users/{uuid}/block:
 *   post:
 *     tags:
 *       - Users
 *     summary: Block User
 *     description: Sets the user's status to `blocked`. They cannot log in while blocked. Requires `user.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-1111-7000-0000-000000000010"
 *     responses:
 *       200:
 *         description: User blocked successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User blocked successfully"
 *               data:
 *                 id: "019d1eb5-1111-7000-0000-000000000010"
 *                 type: "user"
 *                 attributes:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   username: "john_doe"
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
 * /users/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Users
 *     summary: Unblock User
 *     description: Restores a blocked user's status to `active`. Requires `user.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-1111-7000-0000-000000000010"
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User unblocked successfully"
 *               data:
 *                 id: "019d1eb5-1111-7000-0000-000000000010"
 *                 type: "user"
 *                 attributes:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   username: "john_doe"
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
 * /users/{uuid}/reset-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Reset User Password
 *     description: Sets a new password for a user. Requires `user.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-1111-7000-0000-000000000010"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password: { type: string, format: password, example: "NewPassword@456" }
 *               confirmPassword: { type: string, example: "NewPassword@456" }
 *           example:
 *             password: "NewPassword@456"
 *             confirmPassword: "NewPassword@456"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Password reset successfully"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       422:
 *         description: Passwords do not match or too weak
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 422
 *               errorType: "VALIDATION_ERROR"
 *               message: "Validation failed"
 *               errors:
 *                 - field: "confirmPassword"
 *                   message: "Passwords do not match"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export const UserPathDoc = {};
