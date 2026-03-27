/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check system health
 *     description: Returns the status of the API and its backend services.
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2026-03-27T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: v1
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 timestamp:
 *                   type: string
 *                   example: 2026-03-27T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: v1
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: disconnected
 *                 error:
 *                   type: string
 */
