/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         errorType:
 *           type: string
 *           enum: [BAD_REQUEST, VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMIT_EXCEEDED, SESSION_LIMIT_REACHED, SERVER_ERROR, SERVICE_UNAVAILABLE]
 *           example: VALIDATION_ERROR
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         help:
 *           type: string
 *           example: "Please check your input parameters."
 *         meta:
 *           $ref: '#/components/schemas/Metadata'
 *
 *     Metadata:
 *       type: object
 *       properties:
 *         requestId:
 *           type: string
 *           example: "req_123456789"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2026-03-26T22:00:00.000Z"
 *         version:
 *           type: string
 *           example: "1.13.0"
 */
export const ErrorDoc = {};
