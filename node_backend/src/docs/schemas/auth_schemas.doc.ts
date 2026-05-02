/**
 * @openapi
 * components:
 *   schemas:
 *     AuthTokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT Access Token (short-lived)
 *           example: "eyJhbGciOiJIUzI1NiJ..."
 *         refreshToken:
 *           type: string
 *           description: JWT Refresh Token (long-lived)
 *           example: "eyJhbGciOiJIUzI1NiJ..."
 *
 *     TenantLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "Tenant login successful"
 *         data:
 *           type: object
 *           properties:
 *             tenant:
 *               $ref: '#/components/schemas/Tenant'
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiJ..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiJ..."
 *
 *     RefreshTokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "Token refreshed successfully"
 *         data:
 *           $ref: '#/components/schemas/AuthTokenResponse'
 */
export const AuthSchemaDoc = {};
