/**
 * @openapi
 * components:
 *   responses:
 *     400BadRequest:
 *       description: Bad Request — malformed JSON or unexpected field type
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 400
 *             errorType: BAD_REQUEST
 *             message: "Invalid request body — expected JSON object"
 *
 *     401Unauthorized:
 *       description: Unauthorized — Bearer token missing, expired, or invalid
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 401
 *             errorType: UNAUTHORIZED
 *             message: "Authentication required. Please provide a valid Bearer token."
 *
 *     403Forbidden:
 *       description: Forbidden — authenticated but missing the required RBAC permission
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 403
 *             errorType: FORBIDDEN
 *             message: "You do not have permission to perform this action."
 *
 *     404NotFound:
 *       description: Not Found — the requested resource does not exist
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 404
 *             errorType: NOT_FOUND
 *             message: "Resource not found."
 *
 *     409Conflict:
 *       description: Conflict — a resource with that unique identifier already exists
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 409
 *             errorType: CONFLICT
 *             message: "A record with this value already exists."
 *
 *     422ValidationError:
 *       description: Unprocessable Entity — Zod validation failed on one or more fields
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               statusCode:
 *                 type: integer
 *                 example: 422
 *               errorType:
 *                 type: string
 *                 example: VALIDATION_ERROR
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *                 example:
 *                   - field: email
 *                     message: "Invalid email address"
 *                   - field: password
 *                     message: "Password must be at least 8 characters"
 *
 *     500InternalError:
 *       description: Internal Server Error — unexpected server-side failure
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             statusCode: 500
 *             errorType: SERVER_ERROR
 *             message: "An unexpected error occurred. Please try again later."
 */
export const ResponsesDoc = {};
