/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: List Audit Logs
 *     description: >
 *       Retrieve a paginated, filtered, and sorted list of all audit log entries.
 *       Each entry captures who did what, when, from where, and the outcome.
 *       Requires `audit_log.view` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, example: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, example: 20 }
 *         description: Records per page. Use -1 to return all.
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *         description: "Field to sort by. Prefix with - for descending. Allowed: createdAt, action, resource, statusCode, durationMs, actorEmail"
 *       - in: query
 *         name: filter[actorUuid]
 *         schema: { type: string, format: uuid, example: "019d1eb5-88ac-772d-b30c-816140772535" }
 *         description: Filter by actor (user) UUID
 *       - in: query
 *         name: filter[actorEmail]
 *         schema: { type: string, example: "admin@example.com" }
 *         description: Filter by actor email (partial match)
 *       - in: query
 *         name: filter[actorType]
 *         schema: { type: string, enum: [user, system, anonymous] }
 *         description: Filter by actor type
 *       - in: query
 *         name: filter[action]
 *         schema: { type: string, example: "user.create" }
 *         description: Filter by action name (partial match)
 *       - in: query
 *         name: filter[resource]
 *         schema: { type: string, example: "user" }
 *         description: Filter by resource type (exact match)
 *       - in: query
 *         name: filter[success]
 *         schema: { type: boolean, example: true }
 *         description: Filter by success/failure
 *       - in: query
 *         name: filter[statusCode]
 *         schema: { type: integer, example: 200 }
 *         description: Filter by HTTP status code
 *       - in: query
 *         name: filter[ipAddress]
 *         schema: { type: string, example: "192.168.1" }
 *         description: Filter by IP address (partial match)
 *       - in: query
 *         name: filter[requestId]
 *         schema: { type: string, example: "req_019f1ab3-abcd" }
 *         description: Filter by request correlation ID (exact match)
 *       - in: query
 *         name: filter[dateFrom]
 *         schema: { type: string, format: date-time, example: "2026-05-01T00:00:00Z" }
 *         description: Return entries on or after this timestamp
 *       - in: query
 *         name: filter[dateTo]
 *         schema: { type: string, format: date-time, example: "2026-05-02T23:59:59Z" }
 *         description: Return entries on or before this timestamp
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Audit logs retrieved successfully"
 *               data:
 *                 - id: "019f1ab3-1234-7abc-def0-000000000001"
 *                   type: "audit_log"
 *                   attributes:
 *                     actorType: "user"
 *                     actorUuid: "019d1eb5-88ac-772d-b30c-816140772535"
 *                     actorName: "Admin User"
 *                     actorEmail: "admin@example.com"
 *                     actorRoles: ["super-admin"]
 *                     action: "user.create"
 *                     resource: "user"
 *                     resourceUuid: "019d1eb5-1111-7000-0000-000000000010"
 *                     resourceName: null
 *                     httpMethod: "POST"
 *                     endpoint: "/api/users"
 *                     statusCode: 200
 *                     success: true
 *                     requestBody: { email: "john@example.com", username: "john_doe", password: "[REDACTED]" }
 *                     responseBody: { success: true, statusCode: 201, message: "User created successfully", resourceId: "019d1eb5-1111-7000-0000-000000000010" }
 *                     ipAddress: "192.168.1.100"
 *                     userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 *                     requestId: "req_019f1ab3-abcd"
 *                     sessionUuid: "019d1eb5-sess-0000-0000-000000000001"
 *                     durationMs: 42
 *                     errorMessage: null
 *                   meta:
 *                     createdAt: "2026-05-02T10:30:00.000Z"
 *                   links:
 *                     self: "/api/audit-logs/019f1ab3-1234-7abc-def0-000000000001"
 *               meta:
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 20
 *                   currentPage: 1
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /audit-logs/{uuid}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get Audit Log Entry
 *     description: >
 *       Retrieve the full detail of a single audit log entry including the complete
 *       sanitized request/response bodies. Requires `audit_log.view` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019f1ab3-1234-7abc-def0-000000000001"
 *         description: UUID of the audit log entry
 *     responses:
 *       200:
 *         description: Audit log entry retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Audit log entry retrieved successfully"
 *               data:
 *                 id: "019f1ab3-1234-7abc-def0-000000000001"
 *                 type: "audit_log"
 *                 attributes:
 *                   actorType: "user"
 *                   actorUuid: "019d1eb5-88ac-772d-b30c-816140772535"
 *                   actorName: "Admin User"
 *                   actorEmail: "admin@example.com"
 *                   actorRoles: ["super-admin"]
 *                   action: "user.delete"
 *                   resource: "user"
 *                   resourceUuid: "019d1eb5-1111-7000-0000-000000000010"
 *                   resourceName: null
 *                   httpMethod: "DELETE"
 *                   endpoint: "/api/users/019d1eb5-1111-7000-0000-000000000010"
 *                   statusCode: 200
 *                   success: true
 *                   requestBody: null
 *                   responseBody: { success: true, statusCode: 200, message: "User deleted successfully" }
 *                   ipAddress: "192.168.1.100"
 *                   userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"
 *                   requestId: "req_019f1ab3-efgh"
 *                   sessionUuid: "019d1eb5-sess-0000-0000-000000000001"
 *                   durationMs: 85
 *                   errorMessage: null
 *                 meta:
 *                   createdAt: "2026-05-02T10:35:00.000Z"
 *                 links:
 *                   self: "/api/audit-logs/019f1ab3-1234-7abc-def0-000000000001"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Audit log entry not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Audit log entry not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export const AuditLogPathDoc = {};
