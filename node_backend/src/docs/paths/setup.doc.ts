/**
 * @openapi
 * tags:
 *   - name: Setup
 *     description: >
 *       First-time application setup wizard endpoints. These routes require **no authentication**
 *       and bypass the `X-Api-Version` and database-check middleware so they can run before
 *       the database exists. Once setup is complete (`SETUP_COMPLETE=true` in `.env`),
 *       the `POST /setup/run` endpoint returns `409 Already Complete`.
 *
 * /setup/status:
 *   get:
 *     tags:
 *       - Setup
 *     summary: Get setup status
 *     description: >
 *       Returns the current setup progress — whether the `.env` is configured, the database
 *       is reachable, tables have been created, permissions seeded, and an admin user exists.
 *       Always accessible, even before setup has run.
 *     responses:
 *       200:
 *         description: Setup status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Setup is required
 *                 data:
 *                   type: object
 *                   properties:
 *                     isComplete:
 *                       type: boolean
 *                       example: false
 *                     steps:
 *                       type: object
 *                       properties:
 *                         envConfigured:
 *                           type: boolean
 *                           example: false
 *                         dbConnected:
 *                           type: boolean
 *                           example: false
 *                         tablesMigrated:
 *                           type: boolean
 *                           example: false
 *                         permissionsSeeded:
 *                           type: boolean
 *                           example: false
 *                         adminCreated:
 *                           type: boolean
 *                           example: false
 *
 * /setup/test-connection:
 *   post:
 *     tags:
 *       - Setup
 *     summary: Test database connection
 *     description: >
 *       Validates the provided MySQL credentials by attempting a live connection.
 *       Does **not** write anything to disk or database. Use this before calling
 *       `/setup/run` to verify credentials are correct.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dbHost, dbName, dbUser]
 *             properties:
 *               dbHost:
 *                 type: string
 *                 example: localhost
 *               dbPort:
 *                 type: integer
 *                 default: 3306
 *                 example: 3306
 *               dbName:
 *                 type: string
 *                 example: fiber_route_map
 *               dbUser:
 *                 type: string
 *                 example: root
 *               dbPass:
 *                 type: string
 *                 example: ""
 *               dbCharset:
 *                 type: string
 *                 default: utf8mb4
 *                 example: utf8mb4
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 summary: Connection successful
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Connected to MySQL at localhost:3306"
 *               failure:
 *                 summary: Connection failed
 *                 value:
 *                   success: false
 *                   statusCode: 503
 *                   message: "Access denied for user 'root'@'localhost'"
 *
 * /setup/run:
 *   post:
 *     tags:
 *       - Setup
 *     summary: Run full setup
 *     description: >
 *       Executes the complete first-time setup sequence in order:
 *
 *       1. Write `.env` file (DB credentials, timezone, port, generates `MGMT_TOKEN_SECRET`)
 *       2. Create the database (`CREATE DATABASE IF NOT EXISTS`)
 *       3. Create all 7 tables (`users`, `countries`, `roles`, `user_roles`, `permissions`, `role_permissions`, `sessions`)
 *       4. Seed 21 permissions auto-generated from route definitions (idempotent — uses `INSERT IGNORE`)
 *       5. Create the **Super Admin** role with all permissions assigned
 *       6. Create the admin user and assign the Super Admin role
 *
 *       **Idempotent:** Safe to retry if a step fails — tables use `IF NOT EXISTS` and
 *       permissions/roles use `INSERT IGNORE` on their unique slugs.
 *
 *       **Blocked after setup:** Returns `409` if `SETUP_COMPLETE=true` is present in `.env`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [env, admin]
 *             properties:
 *               env:
 *                 type: object
 *                 required: [dbHost, dbName, dbUser, timezone]
 *                 properties:
 *                   dbHost:
 *                     type: string
 *                     example: localhost
 *                   dbPort:
 *                     type: integer
 *                     default: 3306
 *                     example: 3306
 *                   dbName:
 *                     type: string
 *                     example: fiber_route_map
 *                   dbUser:
 *                     type: string
 *                     example: root
 *                   dbPass:
 *                     type: string
 *                     example: ""
 *                   dbCharset:
 *                     type: string
 *                     default: utf8mb4
 *                     example: utf8mb4
 *                   timezone:
 *                     type: string
 *                     example: Asia/Kolkata
 *                   port:
 *                     type: integer
 *                     default: 3001
 *                     example: 3001
 *                   apiVersion:
 *                     type: string
 *                     default: v1
 *                     example: v1
 *                   nodeEnv:
 *                     type: string
 *                     enum: [development, production, test]
 *                     default: development
 *               admin:
 *                 type: object
 *                 required: [name, username, email, phone, password, confirmPassword]
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   username:
 *                     type: string
 *                     example: admin
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: admin@example.com
 *                   phone:
 *                     type: string
 *                     pattern: '^\d{10}$'
 *                     example: "9876543210"
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                     example: "Admin@1234"
 *                   confirmPassword:
 *                     type: string
 *                     example: "Admin@1234"
 *     responses:
 *       200:
 *         description: "Setup completed (check `success` field — step failures return HTTP 200 with `success: false`)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           step:
 *                             type: string
 *                             enum: [env, database, tables, permissions, role, admin]
 *                           success:
 *                             type: boolean
 *                           message:
 *                             type: string
 *             examples:
 *               success:
 *                 summary: Setup completed successfully
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Setup completed successfully! Your application is ready."
 *                   data:
 *                     steps:
 *                       - { step: env,         success: true, message: ".env file written successfully" }
 *                       - { step: database,    success: true, message: "Database 'fiber_route_map' created/verified" }
 *                       - { step: tables,      success: true, message: "7 tables created/verified successfully" }
 *                       - { step: permissions, success: true, message: "21 permissions seeded/verified" }
 *                       - { step: role,        success: true, message: "Super Admin role created/verified with all permissions" }
 *                       - { step: admin,       success: true, message: "Admin user 'admin' created and assigned Super Admin role" }
 *       409:
 *         description: Setup already complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 409
 *                 errorType:
 *                   type: string
 *                   example: SETUP_COMPLETE
 *                 message:
 *                   type: string
 *                   example: "Setup is already complete. Re-running setup is not allowed."
 *                 help:
 *                   type: string
 *                   example: "To re-run setup, remove SETUP_COMPLETE=true from your .env file and restart the server."
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 422
 *                 errorType:
 *                   type: string
 *                   example: VALIDATION_ERROR
 *                 message:
 *                   type: string
 *                   example: "Validation failed: admin.phone: Phone must be exactly 10 digits"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 */
export const SetupPathDoc = {};
