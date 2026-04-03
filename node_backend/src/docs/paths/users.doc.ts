/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List Users
 *     description: Retrieve a paginated list of users with filtering and sorting.
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
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked, deleted] }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[email]
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *     responses:
 *       200:
 *         description: Success
 *
 *   post:
 *     tags:
 *       - Users
 *     summary: Create User (Public)
 *     description: Register a new user. This endpoint does not require authentication.
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
 *               email: { type: string }
 *               username: { type: string }
 *               name: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *               countryUuid: { type: string, format: uuid }
 *               roleUuids: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: User created
 *
 * /users/{uuid}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get User Detail
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
 *         description: Success
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Update User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               username: { type: string }
 *               phone: { type: string }
 *               countryUuid: { type: string, format: uuid }
 *               roleUuids: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: User updated
 *
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete User (Soft Delete)
 *     description: Marks a user as deleted. An authenticated user cannot delete their own account.
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
 *       403:
 *         description: Forbidden — cannot delete your own account
 *
 * /users/{uuid}/block:
 *   post:
 *     tags:
 *       - Users
 *     summary: Block User
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
 *         description: User blocked
 *
 * /users/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Users
 *     summary: Unblock User
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
 *         description: User unblocked
 *
 * /users/{uuid}/reset-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Reset Password
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
 *             required: [password, confirmPassword]
 *             properties:
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
export const UserPathDoc = {};
