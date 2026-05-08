/**
 * @openapi
 * /tenant/user-settings:
 *   get:
 *     tags:
 *       - Tenant User Settings
 *     summary: Get User Settings
 *     description: Returns all personalised map/UI settings for the authenticated tenant user. No RBAC required — users can only access their own settings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 - id: "019f4cc1-0000-7000-0000-000000000001"
 *                   type: "user_setting"
 *                   attributes:
 *                     key: "map.defaultLayer"
 *                     name: "Default Map Layer"
 *                     value: "street"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-08T10:00:00.000Z"
 *                     updatedAt: "2026-05-08T10:00:00.000Z"
 *                 - id: "019f4cc1-0000-7000-0000-000000000002"
 *                   type: "user_setting"
 *                   attributes:
 *                     key: "map.defaultZoom"
 *                     name: "Default Zoom Level"
 *                     value: "13"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-08T10:00:00.000Z"
 *                     updatedAt: "2026-05-08T10:00:00.000Z"
 *               meta:
 *                 requestId: "req-abc123"
 *                 timestamp: "2026-05-08T10:00:00.000Z"
 *                 version: "1.51.0"
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Tenant User Settings
 *     summary: Upsert User Settings
 *     description: >
 *       Batch upsert (create or update) one or more settings for the authenticated tenant user.
 *       Each setting is identified by its `key`. Existing keys are updated; new keys are inserted.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - key
 *                     - name
 *                     - value
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "map.defaultLayer"
 *                       description: Dot-notation key identifying the setting (e.g. map.defaultLayer, map.defaultZoom)
 *                     name:
 *                       type: string
 *                       example: "Default Map Layer"
 *                       description: Human-readable label for the setting
 *                     value:
 *                       type: string
 *                       example: "dark"
 *                       description: Stored as a string regardless of the underlying type (e.g. "true", "13", "metric")
 *           example:
 *             settings:
 *               - key: "map.defaultLayer"
 *                 name: "Default Map Layer"
 *                 value: "dark"
 *               - key: "map.defaultZoom"
 *                 name: "Default Zoom Level"
 *                 value: "15"
 *               - key: "map.showScaleBar"
 *                 name: "Show Scale Bar"
 *                 value: "true"
 *               - key: "map.scaleUnit"
 *                 name: "Scale Bar Unit"
 *                 value: "metric"
 *               - key: "map.autoCenterGPS"
 *                 name: "Auto-center on GPS Location"
 *                 value: "false"
 *               - key: "map.filtersOpenByDefault"
 *                 name: "Filter Panel Open by Default"
 *                 value: "true"
 *     responses:
 *       200:
 *         description: Settings saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Settings saved successfully"
 *               data:
 *                 - id: "019f4cc1-0000-7000-0000-000000000001"
 *                   type: "user_setting"
 *                   attributes:
 *                     key: "map.autoCenterGPS"
 *                     name: "Auto-center on GPS Location"
 *                     value: "false"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-08T10:00:00.000Z"
 *                     updatedAt: "2026-05-08T10:05:00.000Z"
 *               meta:
 *                 requestId: "req-abc123"
 *                 timestamp: "2026-05-08T10:05:00.000Z"
 *                 version: "1.51.0"
 *       400:
 *         description: settings array is required or empty
 *       401:
 *         description: Unauthorized
 *
 * /tenant/user-settings/{key}:
 *   delete:
 *     tags:
 *       - Tenant User Settings
 *     summary: Delete a Setting
 *     description: Soft-deletes a single user setting by its key. The row's `status` is set to `deleted` and `deletedAt` is recorded.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: "map.defaultLayer"
 *         description: The dot-notation setting key to delete
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Setting deleted"
 *               meta:
 *                 requestId: "req-abc123"
 *                 timestamp: "2026-05-08T10:10:00.000Z"
 *                 version: "1.51.0"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Setting not found
 */

export {};
