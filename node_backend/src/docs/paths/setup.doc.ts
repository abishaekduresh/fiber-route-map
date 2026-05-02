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
 *             examples:
 *               notStarted:
 *                 summary: Setup not started
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Setup is required"
 *                   data:
 *                     isComplete: false
 *                     steps:
 *                       envConfigured: false
 *                       dbConnected: false
 *                       tablesMigrated: false
 *                       permissionsSeeded: false
 *                       adminCreated: false
 *               complete:
 *                 summary: Setup already complete
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Setup is complete"
 *                   data:
 *                     isComplete: true
 *                     steps:
 *                       envConfigured: true
 *                       dbConnected: true
 *                       tablesMigrated: true
 *                       permissionsSeeded: true
 *                       adminCreated: true
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
 *               dbHost: { type: string, example: "localhost" }
 *               dbPort: { type: integer, default: 3306, example: 3306 }
 *               dbName: { type: string, example: "fiber_route_map" }
 *               dbUser: { type: string, example: "root" }
 *               dbPass: { type: string, example: "" }
 *               dbCharset: { type: string, default: "utf8mb4", example: "utf8mb4" }
 *           example:
 *             dbHost: "localhost"
 *             dbPort: 3306
 *             dbName: "fiber_route_map"
 *             dbUser: "root"
 *             dbPass: ""
 *             dbCharset: "utf8mb4"
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
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
 *                   message: "Access denied for user 'root'@'localhost' (using password: NO)"
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
 *                   dbHost: { type: string, example: "localhost" }
 *                   dbPort: { type: integer, default: 3306, example: 3306 }
 *                   dbName: { type: string, example: "fiber_route_map" }
 *                   dbUser: { type: string, example: "root" }
 *                   dbPass: { type: string, example: "" }
 *                   dbCharset: { type: string, default: "utf8mb4", example: "utf8mb4" }
 *                   timezone: { type: string, example: "Asia/Kolkata" }
 *                   port: { type: integer, default: 3001, example: 3001 }
 *                   apiVersion: { type: string, default: "v1", example: "v1" }
 *                   nodeEnv: { type: string, enum: [development, production, test], default: "development" }
 *               admin:
 *                 type: object
 *                 required: [name, username, email, phone, password, confirmPassword]
 *                 properties:
 *                   name: { type: string, example: "John Doe" }
 *                   username: { type: string, example: "admin" }
 *                   email: { type: string, format: email, example: "admin@example.com" }
 *                   phone: { type: string, example: "9876543210" }
 *                   password: { type: string, example: "Admin@1234" }
 *                   confirmPassword: { type: string, example: "Admin@1234" }
 *           example:
 *             env:
 *               dbHost: "localhost"
 *               dbPort: 3306
 *               dbName: "fiber_route_map"
 *               dbUser: "root"
 *               dbPass: ""
 *               dbCharset: "utf8mb4"
 *               timezone: "Asia/Kolkata"
 *               port: 3001
 *               apiVersion: "v1"
 *               nodeEnv: "development"
 *             admin:
 *               name: "John Doe"
 *               username: "admin"
 *               email: "admin@example.com"
 *               phone: "9876543210"
 *               password: "Admin@1234"
 *               confirmPassword: "Admin@1234"
 *     responses:
 *       200:
 *         description: "Setup completed (step failures return HTTP 200 with success: false)"
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Setup completed successfully
 *                 value:
 *                   success: true
 *                   statusCode: 200
 *                   message: "Setup completed successfully! Your application is ready."
 *                   data:
 *                     steps:
 *                       - { step: "env",         success: true, message: ".env file written successfully" }
 *                       - { step: "database",    success: true, message: "Database 'fiber_route_map' created/verified" }
 *                       - { step: "tables",      success: true, message: "7 tables created/verified successfully" }
 *                       - { step: "permissions", success: true, message: "21 permissions seeded/verified" }
 *                       - { step: "role",        success: true, message: "Super Admin role created/verified with all permissions" }
 *                       - { step: "admin",       success: true, message: "Admin user 'admin' created and assigned Super Admin role" }
 *               dbFailure:
 *                 summary: Database step failed
 *                 value:
 *                   success: false
 *                   statusCode: 200
 *                   message: "Setup failed at database step"
 *                   data:
 *                     steps:
 *                       - { step: "env",      success: true,  message: ".env file written successfully" }
 *                       - { step: "database", success: false, message: "Access denied for user 'root'@'localhost'" }
 *       409:
 *         description: Setup already complete
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "SETUP_COMPLETE"
 *               message: "Setup is already complete. Re-running setup is not allowed."
 *               help: "To re-run setup, remove SETUP_COMPLETE=true from your .env file and restart the server."
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 422
 *               errorType: "VALIDATION_ERROR"
 *               message: "Validation failed"
 *               errors:
 *                 - field: "admin.phone"
 *                   message: "Phone must be exactly 10 digits"
 *                 - field: "admin.password"
 *                   message: "Password must be at least 8 characters"
 */
export const SetupPathDoc = {};
