/**
 * @openapi
 * /auth/users/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Login
 *     description: >
 *       Authenticate using email, username, or phone number + password.
 *       Returns a Bearer token and active session info.
 *       If the session limit is reached, a 403 is returned with a short-lived
 *       mgmtToken you can use to terminate an existing session.
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin@1234"
 *           examples:
 *             byEmail:
 *               summary: Login with email
 *               value: { identifier: "admin@example.com", password: "Admin@1234" }
 *             byUsername:
 *               summary: Login with username
 *               value: { identifier: "admin", password: "Admin@1234" }
 *     responses:
 *       200:
 *         description: Login successful — returns user profile + Bearer token
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                   type: "user"
 *                   attributes:
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                     username: "admin"
 *                     status: "active"
 *                     permissions: ["user.view", "user.create", "role.view", "permission.view"]
 *                 token: "fd90b9c3a2e1d4f5b6c7d8e9f0a1b2c3d4e5f6a7"
 *                 expiresAt: "2026-07-01T00:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               errorType: UNAUTHORIZED
 *               message: "Invalid credentials. Please check your identifier and password."
 *       403:
 *         description: Session limit reached
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 403
 *               errorType: SESSION_LIMIT_REACHED
 *               message: "Session limit of 3 reached. Terminate an existing session to continue."
 *               data:
 *                 mgmtToken: "eyJhbGciOiJIUzI1NiJ9..."
 *                 sessionLimit: 3
 *                 activeSessions:
 *                   - uuid: "019d1eb5-aaaa-7000-0000-000000000001"
 *                     deviceName: "Chrome on Windows"
 *                     ip: "192.168.1.1"
 *                     createdAt: "2026-04-01T10:00:00.000Z"
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /auth/users/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User Logout
 *     description: Invalidates the current Bearer token. The session is removed and the token can no longer be used.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Logout successful"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get Current User Profile
 *     description: Returns the full profile for the authenticated user including all roles, permissions, and active sessions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 user:
 *                   id: "019d1eb5-88ac-772d-b30c-816140772535"
 *                   type: "user"
 *                   attributes:
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                     username: "admin"
 *                     status: "active"
 *                     permissions: ["user.view", "user.create", "user.update", "user.delete"]
 *                 sessions:
 *                   - uuid: "019d1eb5-aaaa-7000-0000-000000000001"
 *                     deviceName: "Chrome on Windows"
 *                     ip: "192.168.1.1"
 *                     isCurrent: true
 *                     createdAt: "2026-04-01T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         description: Account is blocked or deleted
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 403
 *               errorType: FORBIDDEN
 *               message: "Your account has been blocked. Contact an administrator."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /auth/users/sessions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List Active Sessions
 *     description: Returns all active sessions for the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Sessions listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 - uuid: "019d1eb5-aaaa-7000-0000-000000000001"
 *                   deviceName: "Chrome on Windows"
 *                   deviceId: "web_abc123"
 *                   ip: "192.168.1.1"
 *                   isCurrent: true
 *                   createdAt: "2026-04-01T10:00:00.000Z"
 *                   expiresAt: "2026-07-01T00:00:00.000Z"
 *                 - uuid: "019d1eb5-bbbb-7000-0000-000000000002"
 *                   deviceName: "Firefox on macOS"
 *                   deviceId: "web_def456"
 *                   ip: "10.0.0.5"
 *                   isCurrent: false
 *                   createdAt: "2026-03-28T08:30:00.000Z"
 *                   expiresAt: "2026-06-28T08:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /auth/users/sessions/{uuid}:
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Terminate Session
 *     description: >
 *       Terminates a specific session by UUID. Accepts either a Bearer token
 *       (for managing your own sessions) or an X-Mgmt-Token (for forced termination
 *       when session limit is reached during login).
 *     security:
 *       - bearerAuth: []
 *       - mgmtAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-aaaa-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Session terminated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Session terminated successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: NOT_FOUND
 *               message: "Session not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */

/**
 * @openapi
 * /auth/users/impersonate/{tenantUuid}:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Switch to Tenant Dashboard (Super-Admin)
 *     description: >
 *       Allows an authenticated super-admin to generate a short-lived (2-hour)
 *       impersonation JWT for a specific tenant without requiring the tenant's password.
 *       No tenant session is created or counted against the tenant's session limit.
 *       The returned `accessToken` can be used as a Bearer token on tenant-protected
 *       routes. The JWT payload includes `"impersonated": true` for audit traceability.
 *       Only active tenants can be impersonated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: tenantUuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: UUID of the tenant to impersonate
 *         example: "019d1eb5-cccc-7000-0000-000000000003"
 *     responses:
 *       200:
 *         description: Impersonation token generated — use accessToken as Bearer on tenant routes
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Switched to tenant dashboard"
 *               data:
 *                 tenant:
 *                   id: "019d1eb5-cccc-7000-0000-000000000003"
 *                   type: "tenant"
 *                   attributes:
 *                     name: "Abishaek Duresh"
 *                     phone: "9876543210"
 *                     status: "active"
 *                     role: { uuid: "...", name: "Operator", slug: "operator" }
 *                     business: { uuid: "...", name: "Acme Fiber", type: "operator", status: "active" }
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         description: Tenant account is not active
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 403
 *               message: "Cannot switch to a blocked tenant account"
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               message: "Tenant not found"
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */

/**
 * @openapi
 * /auth/tenant/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Tenant Login (Phone + JWT)
 *     description: >
 *       Dedicated authentication for tenants using their phone number and password.
 *       Returns an Access Token (JWT) and a Refresh Token.
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Tenant phone number
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantLoginResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account blocked or suspended
 */

/**
 * @openapi
 * /auth/tenant/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh Tenant Token
 *     description: Exchange a Refresh Token for a new Access Token and a rotated Refresh Token.
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiJ..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */
export const AuthPathDoc = {};
