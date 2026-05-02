/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check system health
 *     description: Returns the live status of the API and its backend services (database connectivity).
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             examples:
 *               healthy:
 *                 summary: All services operational
 *                 value:
 *                   status: "ok"
 *                   timestamp: "2026-05-02T10:00:00.000Z"
 *                   version: "v1"
 *                   services:
 *                     database: "connected"
 *               degraded:
 *                 summary: Database unreachable
 *                 value:
 *                   status: "error"
 *                   timestamp: "2026-05-02T10:00:00.000Z"
 *                   version: "v1"
 *                   services:
 *                     database: "disconnected"
 *                   error: "ECONNREFUSED: Connection refused to 127.0.0.1:3306"
 */
