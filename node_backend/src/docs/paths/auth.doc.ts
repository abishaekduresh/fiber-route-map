/**
 * @openapi
 * /auth/users/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Login
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     description: Authenticate using email, username, or phone number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, username, or phone number
 *                 example: "test@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: "Login successful" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, example: "fd90b9..." }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Session Limit Reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 statusCode: { type: integer, example: 403 }
 *                 errorType: { type: string, example: "SESSION_LIMIT_REACHED" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     mgmtToken: { type: string }
 *                     sessionLimit: { type: integer }
 *                     activeSessions: { type: array, items: { type: object } }
 *
 * /auth/users/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Logout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Successfully logged out
 *
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get Current Profile
 *     description: Retrieve details of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: User profile retrieved
 *
 * /auth/users/sessions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List Active Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: List of active sessions
 *
 * /auth/users/sessions/{uuid}:
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Terminate Session
 *     security:
 *       - bearerAuth: []
 *       - mgmtAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session terminated
 */
export const AuthPathDoc = {};
