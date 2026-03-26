/**
 * @openapi
 * /auth/users/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Login
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
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "Admin123"
 *     responses:
 *       200:
 *         description: Login successful or handled failure (200 HTTP for all)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *
 * /auth/users/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *
 * /auth/users/sessions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List Active Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active devices/sessions
 */
export const AuthPathDoc = {};
