/**
 * @openapi
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the audit log entry (UUIDv7)
 *           example: "019f1ab3-1234-7abc-def0-000000000001"
 *         type:
 *           type: string
 *           example: "audit_log"
 *         attributes:
 *           type: object
 *           properties:
 *             actorType:
 *               type: string
 *               enum: [user, system, anonymous]
 *               description: Who performed the action
 *               example: "user"
 *             actorUuid:
 *               type: string
 *               format: uuid
 *               nullable: true
 *               description: UUID of the authenticated user (null for anonymous)
 *               example: "019d1eb5-88ac-772d-b30c-816140772535"
 *             actorName:
 *               type: string
 *               nullable: true
 *               description: Display name of the actor at time of action
 *               example: "John Doe"
 *             actorEmail:
 *               type: string
 *               nullable: true
 *               description: Email of the actor at time of action
 *               example: "john@example.com"
 *             actorRoles:
 *               type: array
 *               items:
 *                 type: string
 *               description: Role slugs held by the actor at time of action
 *               example: ["super-admin"]
 *             action:
 *               type: string
 *               description: Semantic action name (resource.verb)
 *               example: "user.create"
 *             resource:
 *               type: string
 *               description: Resource type affected
 *               example: "user"
 *             resourceUuid:
 *               type: string
 *               nullable: true
 *               description: UUID of the specific resource targeted (if applicable)
 *               example: "019d1eb5-1111-7000-0000-000000000010"
 *             resourceName:
 *               type: string
 *               nullable: true
 *               description: Human-readable name of the target resource
 *               example: "Jane Doe"
 *             httpMethod:
 *               type: string
 *               example: "POST"
 *             endpoint:
 *               type: string
 *               description: Full request URL including query string
 *               example: "/api/users?page=1"
 *             statusCode:
 *               type: integer
 *               description: HTTP status code of the response
 *               example: 201
 *             success:
 *               type: boolean
 *               description: Whether the operation succeeded
 *               example: true
 *             requestBody:
 *               type: object
 *               nullable: true
 *               description: Sanitized request body (sensitive fields redacted)
 *             responseBody:
 *               type: object
 *               nullable: true
 *               description: Summary of the response (not the full body)
 *             ipAddress:
 *               type: string
 *               nullable: true
 *               description: Client IP address (IPv4 or IPv6)
 *               example: "192.168.1.100"
 *             userAgent:
 *               type: string
 *               nullable: true
 *               description: Browser/client user-agent string
 *               example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120"
 *             requestId:
 *               type: string
 *               nullable: true
 *               description: Correlation ID for tracing the request through logs
 *               example: "req_019f1ab3-abcd"
 *             sessionUuid:
 *               type: string
 *               nullable: true
 *               description: UUID of the session used for this request
 *               example: "019d1eb5-sess-0000-0000-000000000001"
 *             durationMs:
 *               type: integer
 *               description: Request processing time in milliseconds
 *               example: 42
 *             errorMessage:
 *               type: string
 *               nullable: true
 *               description: Error message if the operation failed
 *               example: null
 *         meta:
 *           type: object
 *           properties:
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2026-05-02T10:30:00.000Z"
 *         links:
 *           type: object
 *           properties:
 *             self:
 *               type: string
 *               example: "/api/audit-logs/019f1ab3-1234-7abc-def0-000000000001"
 */
export const AuditLogSchemaDoc = {};
