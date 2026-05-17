# Changelog

All notable changes to the Fiber Route Map Node.js Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.71.0] - 2026-05-17

### Fixed
- **Route point field data stored in `tenant_route_point_details`** (`TenantRouteRepository`): Replaced the erroneous `fieldData` JSON column insert (which caused `Unknown column 'fieldData' in 'field list'`) with inserts into the pre-existing `tenant_route_point_details` table.
  - `upsertPoints`: Old detail rows are cleaned up before old points are deleted (prevents orphans). After reinserting points, each point with a `routePointTemplateUuid` + non-empty `fieldData` gets a corresponding `tenant_route_point_details` row; `tenant_route_points.tenantRoutePointDetailId` is updated accordingly.
  - Named field mapping: `pointName`, `poleNumber`, `landmark`, `address`→`addressLine1`, `ownerName`, `contactNumber`, `height`→`heightMeters`, `electricity`→`electricityAvailable`, `remarks` → named columns; all other keys → `metadata` JSON.
  - `getPoints`: Now LEFT JOINs `tenant_route_point_details` on `tenantRoutePointDetailId` and reconstructs a `fieldData: Record<string,string>` object from named columns + `metadata`. API response shape is unchanged.
- **`routePointTemplateUuid` auto-migration** (`index.ts`): Idempotent `hasColumn` patch adds `VARCHAR(36) NULL` column to `tenant_route_points` at server start — no manual SQL required.

## [1.70.0] - 2026-05-17

### Added
- **`GET /api/tenant/route-point-templates`** (`tenantRoutePointTemplateRoutes.ts`): New tenant-auth protected read-only endpoint. Returns all active global route point templates with their full 36-flag set plus joined icon fields (`iconSvgTemplate`, `iconUrl`, `iconFileType`, `iconName`, `iconCode`), device type name/code, and `status`. Used by the map panel to build the RPT selector and render dynamic per-point form fields.
- **`routePointTemplateUuid` field in `CreateRoutePointDTO` / `TenantRoutePoint`**: Nullable `VARCHAR(36)` storing which Route Point Template was applied to a route point (auto-migrated at startup).
- **`fieldData` in `CreateRoutePointDTO` / `TenantRoutePoint`**: `Record<string, string>` — collected template-driven field values, persisted via `tenant_route_point_details` (see v1.71.0 fix).
- **`transformPoint` exposes new fields** (`TenantRouteController`): Both `routePointTemplateUuid` and `fieldData` included in every route point response.
- **"Others" icon type**: `others` added to `icons.type` ENUM via auto-migration MODIFY COLUMN on server start.

## [1.69.0] - 2026-05-17
### Added
- **Device type icon joined in RPT API** (`RoutePointTemplateRepository`): Added `LEFT JOIN icons as dt_icons ON device_types.iconId = dt_icons.id` — exposes `deviceTypeIconSvgTemplate`, `deviceTypeIconUrl`, `deviceTypeIconFileType`, `deviceTypeIconName` in every RPT response.
- **RPT controller**: `transform()` emits all 4 device type icon fields.
- **Swagger** (`route_point_templates.doc.ts`): GET example updated with `deviceTypeIconSvgTemplate`, `deviceTypeIconUrl`, `deviceTypeIconFileType`, `deviceTypeIconName` fields.

## [1.68.0] - 2026-05-17
### Added
- **`numericId` in DeviceType API responses**: `DeviceTypeController.transform()` now exposes `attributes.numericId` — required for correct select option matching in Route Point Template modal.
- **`SearchableSelect` frontend component**: Reusable searchable dropdown with live text filter, icon previews per option, hover highlight, and checkmark on selected item.
- **Auto-cleanup of duplicate permissions on startup** (`index.ts`): Deletes all permissions with `resource IN ('device_category', 'device_type')` (old singular form) and their `role_permissions` rows before re-seeding the correct plural forms.

### Changed
- **`ROUTE_PERMISSIONS` in `SetupService.ts`**: Corrected `device_category` → `device_categories` and `device_type` → `device_types` — stops `syncPermissions()` from recreating stale duplicate permissions.
- **Route Point Template Swagger** (`route_point_templates.doc.ts`): Fully rewritten with all 36 field flags in GET example, POST schema, and PUT schema; removed old 3-flag schema.

### Fixed
- **Icon and Device Type selection in RPT modal**: Both dropdowns now use `numericId` as option values, matching the numeric FK stored in the template. Previously used UUID, causing permanent "No selection" state.
- **Device Type icon fields missing from `DeviceTypeData` type** (`api.ts`): Added `iconId`, `iconName`, `iconCode`, `iconFileType`, `iconSvgTemplate`, `iconUrl` to the TypeScript interface.

## [1.67.0] - 2026-05-17
### Added
- **36 dynamic field flags on `route_point_templates`**: All 36 flags (previously on `device_types`) migrated to this table across 10 groups — Basic Information, Identification, Networking, Authentication, GIS/Location, Device Installation, Media/Files, Optical/Signal, Monitoring, Customer & Topology.
- **`isDevice` flag on `route_point_templates`**: Boolean flag indicating whether this template represents a physical device (enables device mapping in the field).
- **Auto-migration** (`index.ts`): Drops 3 obsolete columns (`isOwnerNameRequired`, `isContactNumberRequired`, `isElectricityAvailable`); batch-adds 33 new flag columns to `route_point_templates` via idempotent `hasColumn` checks.

### Changed
- **`device_types` API simplified**: All 36 flag fields removed from `DeviceType` model, `DeviceTypeRepository` (create/update), and `DeviceTypeController` (transform/parseBody). DB columns intentionally left in place. Version bumped to `1.67.0`.
- **`RoutePointTemplateController`**: `transform()` emits all 36 flags + `isDevice`; `parseBody()` coerces all 37 booleans. Version bumped to `1.67.0`.

## [1.66.0] - 2026-05-17
### Added
- **36 dynamic field flags on `device_types`**: Expanded from 5 flags to 36 booleans across 10 logical groups:
  - **Basic Information**: `isPointNameRequired` (default `true`), `isDescriptionRequired`, `isRemarksRequired`
  - **Identification**: `isModelNumberRequired`, `isSerialNumberRequired`, `isAssetTagRequired`
  - **Networking**: `isMacAddressRequired`, `isIpv4AddressRequired`, `isIpv6AddressRequired`, `isSubnetRequired`, `isGatewayRequired`, `isVlanRequired`
  - **Authentication**: `isUsernameRequired`, `isPasswordRequired`, `isSnmpRequired`
  - **GIS / Location**: `isGpsLocationRequired`, `isPoleNumberRequired`, `isLandmarkRequired`, `isAddressRequired`, `isHeightRequired`
  - **Device Installation**: `isRackNumberRequired`, `isPortRequired`, `isPowerSourceRequired`, `isElectricityRequired`
  - **Media / Files**: `isPhotoRequired`, `isDocumentRequired`
  - **Optical / Signal**: `isSignalInputRequired`, `isSignalOutputRequired`, `isAttenuationRequired`, `isFiberCoreRequired`
  - **Monitoring**: `isMonitoringEnabled`, `isSnmpMonitoringEnabled`, `isRealtimeStatusEnabled`
  - **Customer & Topology**: `isCustomerMappingRequired`, `supportsInputPorts`, `supportsOutputPorts`, `supportsBidirectionalPorts`, `supportsSignalFlow`, `supportsOpticalCalculation`
- **`numericId` in DeviceCategory API responses**: `DeviceCategoryController.transform()` now includes `attributes.numericId` (the DB integer id) — enables correct select option matching in frontend modals.
- **`numericId` in Icon API responses**: `IconController.transform()` now includes `attributes.numericId` — fixes icon pre-selection in device type edit modal.
- **Auto-migration patch** (`ensureRoutePointTemplateTables`):
  - Renames `isIPAddressRequired` → `isIpv4AddressRequired` if old column exists.
  - Batch-checks all 31 new flag columns via `Promise.all(hasColumn)` and adds missing ones in a single `db.schema.table()` call.
  - `isPointNameRequired` defaults to `true`; all others default to `false`.

### Changed
- **`isIPAddressRequired` renamed to `isIpv4AddressRequired`** in `DeviceType` model, repository, controller, and Swagger docs.
- **`DeviceTypeController` version bumped to `1.66.0`**.
- **Swagger (`device_types.doc.ts`)**: Updated all request/response examples to reflect the full 36-flag schema; old `isIPAddressRequired` replaced with `isIpv4AddressRequired`.

### Fixed
- **Permission seeding guard** (`index.ts`): Removed `!dcExists` / `!dtExists` gate from `device_categories` and `device_types` permission seeding blocks. Previously, permissions were not inserted when tables already existed (e.g., migrated from `tenant_device_*`). Seeding now always runs (idempotent via `INSERT IGNORE`).
- **Category/Icon pre-selection in device type edit modal**: Selects now use `numericId` as option values — previously used UUID, which never matched the numeric FK stored on the device type.

## [1.65.0] - 2026-05-17
### Removed
- **Tenant device system fully removed**: Deleted `TenantDeviceCategory` and `TenantDeviceType` models, repositories, services, controllers, routes, and Swagger docs. Routes `/api/tenant/device-categories` and `/api/tenant/device-types` deregistered.
### Changed
- **Auto-migration**: `ensureTenantDeviceCategoriesTable` and `ensureTenantDeviceTypesTable` now rename old tables to `device_categories`/`device_types` if they exist, or drop if global tables already present.
- **`db.sql`**: Removed `tenant_device_categories` and `tenant_device_types` DDL blocks.

## [1.64.0] - 2026-05-17
### Added
- **Global Device Categories API** (`/api/device-categories`): DC0001 auto-codes, superadmin-scoped, activate/deactivate, soft-delete, RBAC, Swagger, auto-migration.
- **Global Device Types API** (`/api/device-types`): DT0001 auto-codes, links `device_categories` + `icons`, auto-migration.
- **Route Point Templates API** (`/api/route-point-templates`): RPTxxxx auto-codes, icon + global device type linking via LEFT JOIN, 10 field toggles, search/filter, RBAC, Swagger, auto-migration.
- **`index.ts`**: Auto-creates `device_categories`, `device_types`, `route_point_templates` tables; seeds all permissions; assigns to Super Admin role.

## [1.63.0] - 2026-05-13
### Changed
- No backend changes — frontend-only release. See `website/CHANGELOG.md` for details.

## [1.62.0] - 2026-05-13
### Added
- **Icon file upload** (`POST /api/icons`, `PUT /api/icons/:uuid`): Routes now accept `multipart/form-data` via `multer` (memory storage, 5 MB limit, SVG/PNG/WebP only).
  - SVG uploads: buffer decoded to UTF-8, stored in `svgTemplate` column — no file on disk.
  - PNG/WebP uploads: buffer written to `<uploadDir>/icons/<timestamp>-<uuid>.<ext>`; old file deleted on update/delete via `deleteIconFile()`.
  - `src/utils/uploadPath.ts`: `getIconUploadDir()` / `getUploadBaseDir()` / `getIconPublicUrl()` / `deleteIconFile()`. Resolves to `<backend_root>/upload/` in development, `$UPLOAD_PATH/` in production.
  - Static file serving: `app.use('/uploads', express.static(getUploadBaseDir()))` — public, before auth middleware.
  - `.env`: `UPLOAD_PATH=/data/uploads` — set to Coolify persistent volume path in production.
  - `IconController` version bumped to `1.62.0`; `create` and `update` handlers coerce FormData string fields (`width`, `height`) to numbers.
- **`flag` icon type**: Added to `Icon.ts` `IconType` union, `ensureIconsTable` enum, and MODIFY COLUMN patch.
- **Icon code format `ICOxxxx`**: `generateCode()` now returns `ICO0001`, `ICO0002`, …; `getLastCode()` matches `ICO%` pattern with `SUBSTRING(code, 4)` numeric sort.

## [1.61.0] - 2026-05-13
### Added
- **Icons API** (renamed from Widgets): Full rename of the widget concept to icon.
  - New files: `src/models/Icon.ts`, `src/repositories/IconRepository.ts`, `src/services/IconService.ts`, `src/controllers/IconController.ts`, `src/routes/iconRoutes.ts`, `src/routes/tenantIconRoutes.ts`.
  - DB: `widgets` table renamed to `icons` (auto-migration on start); `widgetUuid` column in `tenant_device_types` renamed to `iconUuid`.
  - API endpoints: `GET/POST /api/icons`, `GET/PUT/DELETE /api/icons/:uuid`, `GET /api/tenant/icons`.
  - RBAC: `icon.view`, `icon.create`, `icon.update`, `icon.delete` (seeded via `SetupService`).
  - `IconType` enum includes `active_device`, `passive_device`, `power_device`, `junction`, `fiber_terminal`, `splitter`, `coupler`, `route_point`, `customer_end`.
  - `TenantDeviceType` model / DTO / repository / controller updated: `widgetUuid` → `iconUuid`; JOIN on `icons` table; transform includes `iconName`, `iconCode`, `iconFileType`, `iconSvgTemplate`, `iconUrl`.

## [1.49.0] - 2026-05-08
### Added
- **Tenant Device Categories API** (`/api/tenant/device-categories`): Full CRUD for device categories scoped per tenant business.
  - Table: `tenant_device_categories` — `id` (auto-increment), `uuid` (v7, unique), `tenantBusinessId` (FK → `tenant_business.id`, CASCADE), `name VARCHAR(255)`, `code VARCHAR(50)` (unique per business), `description TEXT`, `status ENUM(active,inactive,deleted)`, `createdAt`, `updatedAt`, `deletedAt`.
  - Auto-migration: table created on startup if absent.
  - Endpoints: `GET /`, `GET /:uuid`, `POST /`, `PUT /:uuid`, `POST /:uuid/deactivate`, `PUT /:uuid/activate`, `DELETE /:uuid`.
  - Code uniqueness enforced per `tenantBusinessId` — returns 409 on duplicate (excludes self on update).
  - `device_category` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS`.
  - Full OpenAPI/Swagger documentation under the `Tenant Device Categories` tag; version bumped to `1.49.0`.
  - DDL added to `db.sql`.

## [1.48.0] - 2026-05-07
### Added
- **`performerName` column in `tenant_ticket_logs`**: Activity logs now persist the human-readable name of whoever triggered each action at write time, avoiding ambiguous joins between `users` and `tenants` tables (both have independent ID sequences). Auto-migration adds the column to existing tables via `hasColumn` guard.
- **`PUT /api/tenant-business/:uuid/reactivate`**: Reactivates a suspended tenant business. Validates business exists, is not deleted, and is currently suspended before setting `status='active'`. Protected by `rbac('tenant_business.update')`.

### Changed
- **`AdminSupportTicketController`**: `update` and `addMessage` handlers now call `getAdmin()` (returns `{ id, name }`) and pass `adminName` through to `adminUpdate()` for logging.
- **`TenantSupportTicketService.adminUpdate()`**: Accepts optional `performerName` and passes it to all `addLog()` calls.
- **`TenantSupportTicketRepository.addLog()`**: Accepts and persists `performerName?: string | null`.

## [1.47.0] - 2026-05-06
### Added
- **Multi-Tenant Support Ticket API**: Full backend for `tenant_support_tickets`, `tenant_ticket_messages`, and `tenant_ticket_logs` with auto-migration.
  - Endpoints (tenant): `GET/POST /api/tenant/support-tickets`, `GET/PUT /:uuid`, `POST /:uuid/close`, `GET/POST /:uuid/messages`, `GET /:uuid/logs`.
  - Endpoints (admin): `GET /api/support-tickets`, `GET/PUT /:uuid`, `GET/POST /:uuid/messages`, `GET /:uuid/logs`.
  - SLA times derived from priority at creation: critical 60/240 min, high 240/480 min, medium 480/1440 min, low 1440/4320 min.
  - Sequential ticket numbers `TKT-YYYY-XXXX` scoped per calendar year.
  - Status machine: `open → assigned → in_progress ↔ on_hold → resolved → closed ↔ reopened`.
  - `performedBy` + `performerName` stored at log-write time (no ambiguous join at read time).
  - `support_ticket` resource (`view`, `create`, `update`, `delete`) added to `ROUTE_PERMISSIONS`.
  - Full OpenAPI documentation added; Swagger version bumped to `1.47.0`.
  - DDL for all three tables added to `db.sql`.

## [1.23.0] - 2026-04-09
### Added
- **`POST /api/permissions/sync`**: Reads `ROUTE_PERMISSIONS` and `INSERT IGNORE`s any missing slugs. Returns `{ added: string[], total: number }`. Requires `permission.create`.
- **Swagger**: `POST /api/permissions/sync` documented with full request/response schema in `permission.ts`.
### Fixed
- **Permission RBAC Slugs**: Routes were guarded by `role.*` permissions instead of `permission.*`. Fixed in `permissionRoutes.ts`.
- **`ROUTE_PERMISSIONS` Export**: Made `export const` so `PermissionService.syncPermissions()` can import it without duplication.

## [1.22.0] - 2026-04-05
### Added
- **Tenant CRUD API** (`/api/tenants`): List (paginated, filterable by status/name/email/username), create, get, update, soft-delete, block, unblock, suspend. Passwords bcrypt-hashed. Responses include joined country and role objects.
- **Tenant Business CRUD API** (`/api/tenant-business`): List (filterable by status/name/email/type), create, get, update, soft-delete, block, unblock, suspend. Supports `operator` / `distributor` types.
- **8 New RBAC Permissions**: `tenant.view`, `tenant.create`, `tenant.update`, `tenant.delete`, `tenant_business.view`, `tenant_business.create`, `tenant_business.update`, `tenant_business.delete` — seeded via `INSERT IGNORE` during setup.
- **Swagger Docs** (`docs/paths/tenants.doc.ts`, `docs/paths/tenant_business.doc.ts`, `docs/schemas/tenant.doc.ts`): Full OpenAPI 3.0 coverage for both resources.
### Changed
- **`SetupService.migrate()`**: Creates 11 tables (added `tenants` and `tenant_business` with InnoDB engine, FK constraints, and named search indexes).
- **`db.sql`**: Updated `CREATE TABLE` for `tenants` and `tenant_business` — InnoDB, nullable FK columns, `varchar(30)` phone, unique keys on email/username, named `idx_*` indexes, `FOREIGN KEY` constraints. `ALTER TABLE` block added for existing installations.

## [1.21.0] - 2026-04-04
### Added
- **Setup Reset Endpoint** (`DELETE /api/setup/reset`): Drops the configured database and resets `SETUP_COMPLETE=false` in `.env` — blocked with 409 if setup is already complete.
- **Default Country Seed**: India (`IN`, `+91`) is now automatically inserted during setup as a default country using `INSERT IGNORE` (idempotent).
### Fixed
- **Permissions Missing from Login Response**: `AuthController.transformUser()` was not including `permissions[]` in `attributes` — all `<Can>` permission gates were permanently hidden after login. Fixed by destructuring and returning `permissions: permissions || []`.
- **Backend Default Port**: Changed `process.env.PORT || 3000` to `3001` — port 3000 conflicts with the Next.js frontend, preventing all setup API calls.
- **`.env` Auto-Create Path**: `index.ts` was resolving `.env` to the project root (`../../`) instead of `node_backend/` (`../`). `dotenv` never loaded the auto-created file.
- **`.env` Path in SetupService**: All `process.cwd()/.env` references replaced with `import.meta.url`-derived `ENV_PATH` — correct regardless of which directory the server process is started from.
- **Zod Validation**: `parsed.error.errors` → `parsed.error.issues` in `SetupController` (correct Zod v3 API).

## [1.20.0] - 2026-04-03
### Added
- **Setup Wizard Backend**: New `/api/setup/*` endpoints (`GET /status`, `POST /test-connection`, `POST /run`) mounted before all auth/version/dbCheck middleware so they work before the database exists.
- **SetupService**: Idempotent full-stack initializer — writes `.env`, creates database, runs all 9 table migrations (`users`, `countries`, `roles`, `user_roles`, `permissions`, `role_permissions`, `user_sessions`, `user_identities`), seeds 21 permissions auto-generated from route definitions, creates a Super Admin role with all permissions, and creates the first admin user.
- **SetupController**: Zod-validated request handling with a `SETUP_COMPLETE` guard — blocks re-runs once setup is finished.
- **Swagger Documentation**: Added full OpenAPI 3.0 documentation for all three setup endpoints with request/response examples.
### Fixed
- **RBAC Admin Bypass Removed**: `rbac.ts` middleware no longer grants blanket access to `admin`-role users; actual assigned permissions are enforced for every user, ensuring database-level permission assignments are respected.
- **varchar(191) Index Fix**: All uniquely-indexed string columns (`email`, `sessionToken`, `slug`, `token`) capped at 191 characters to comply with MySQL's 767-byte InnoDB index limit for `utf8mb4`.
- **Correct Session Table**: Setup now creates `user_sessions` (with `sessionToken`, `ipAddress`, `userAgent`) and `user_identities` to match `AuthRepository` table names exactly.

## [1.19.0] - 2026-04-03
### Security
- **Self-Deletion Prevention**: `DELETE /api/users/:uuid` now returns `403 Forbidden` with `errorType: FORBIDDEN` when the authenticated user attempts to delete their own account. The check compares `req.params.uuid` against the requesting user's `uuid` from the auth middleware before any service call is made.

## [1.18.1] - 2026-04-01
### Fixed
- **API Continuity**: The `POST /api/roles/:uuid/permissions` sync endpoint implicitly relies perfectly on the resolved frontend `uuid` sync changes. No backend mutations were strictly necessary.

## [1.18.0] - 2026-04-01
### Added
- **Standardized Permission API**: Refactored `PermissionController` and `PermissionRepository` to follow the project's "Universal 200 OK" and JSON:API inspired response format.
- **Permission Service Layer**: Created `PermissionService` to encapsulate all permission management business logic and Zod validation.
- **Enhanced OpenAPI Swagger Docs**: Expanded documentation for all permission CRUD operations (`List`, `Show`, `Create`, `Update`, `Delete`) with request/response schemas.
- **Dynamic Sorting**: Updated repositories to support dynamic sorting by resource attributes.
- **API Reference**: Expanded `API_DOCUMENTATION.md` with full coverage of the standardized permission module.

## [1.17.0] - 2026-03-28
### Added
- **Granular RBAC Middleware**: Implemented `rbac.ts` middleware to enforce permission-based access control on all resource routes.
- **Permission Management API**: Created `PermissionController` and `PermissionRepository` for managing discovery and assignment of system permissions.
- **Role-Permission Synchronization**: Added `syncPermissions` to `RoleService` to allow dynamic linking of permissions to roles.
- **Flattened Permission Loading**: Updated `UserRepository` to automatically aggregate and flatten permission slugs from all assigned roles into the user object.
- **Admin Bypass Logic**: Integrated a hardcoded bypass for the `admin` role slug to ensure system administrators always have full access.
- **Resource Protection**: Secured all User, Role, and Country endpoints with mandatory permission slugs (e.g., `user.create`, `country.delete`).

## [1.15.0] - 2026-03-27

## [1.14.0] - 2026-03-27
### Added
- **Health Check Endpoint**: Implemented `GET /api/health` returning standardized JSON with database connectivity status and system timestamps.
- **Resilient Middleware**: Enhanced `dbCheck.ts` to support granular health reporting for the new health controller.
### Changed
- **Port Assignment**: Updated default server port to **3001** in `.env` and `src/index.ts` to optimize local development orchestration.
- **Swagger Documentation**: Expanded Swagger UI to include the new Health resource category.

## [1.13.0] - 2026-03-26
### Added
- **Interactive Swagger Documentation**: Integrated `swagger-jsdoc` and `swagger-ui-express` to provide an interactive API reference at `/api/docs`.
- **Public User Registration**: Refactored `src/index.ts` and `userRoutes.ts` to support unauthenticated registration via `POST /api/users`.
- **Standardized Error Responses**: Implemented a universal `errorType` field in all failed API responses (e.g., `VALIDATION_ERROR`, `SESSION_LIMIT_REACHED`, `NOT_FOUND`).
### Changed
- **Documentation Modularization**: Transitioned from a single `API_DOCUMENTATION.md` to a modular architecture in `src/docs/paths/` and `src/docs/schemas/`.
- **Header Harmonization**: Integrated the mandatory `X-Api-Version` header parameter into all documented Swagger endpoints.
- **Internal Versioning**: Unified project versioning to v1.13.0 across all components and responses.

## [1.12.0] - 2026-03-26
### Added
- **Per-User Session Limits**: Migrated from a global session limit to a user-configurable `sessionLimit` (defaulting to 1). Added `sessionLimit` column to the `users` table.
- **Current Session Flagging**: Enhanced the `/api/auth/me` endpoint and `auth` middleware to identify and flag the user's active session with `isCurrent: true`.
- **Enhanced Session Management**: Integrated specific management token support for secure session termination during the "Limit Reached" state.
### Fixed
- **Session Termination**: Resolved a critical bug where management sessions were incorrectly counting towards the active limit and implemented dynamic, per-session URLs in the 403 response.
- **Internal Logic**: Fixed a regression where `deviceId` was being overwritten during session creation.
- **Documentation**: Updated `API_DOCUMENTATION.md` to v1.12.0 with full coverage of the stateless management token flow.
### Improved
- **Time Consistency**: Standardized all backend internal time handling to use `Date` objects, ensuring reliable database driver conversions and timezone consistency.

## [1.11.1] - 2026-03-26
### Fixed
- **Type Safety**: Resolved a TypeScript compilation error in `AuthController.ts` where `req.params.uuid` was incorrectly typed, ensuring robust session termination.

## [1.11.0] - 2026-03-26
### Added
- **Secure Authentication System**: Implemented a robust login/logout system with database-backed session management.
- **Multi-Identifier Login**: Users can authenticate using **email**, **username**, or **phone number** via the new `identifier` field.
- **Device Identification**: Integrated hardware/device tracking via `X-Device-Id` and `X-Device-Name` headers.
- **Session Management**: Automatic 30-day session expiration and secure token generation. Added a strict **3-device login limit** per user.
- **Session API**: New endpoints for device list and remote logout (`GET /api/auth/sessions`, `DELETE /api/auth/sessions/:uuid`).
- **Enhanced Profile**: Updated `GET /api/auth/me` to return active sessions alongside user attributes.
- **Database Connectivity Middleware**: Added `dbCheck` middleware to the request lifecycle to ensure database reachability and return `503` errors gracefully.
- **Role response Enhancement**: Integrated `links` and `meta.pagination` into role retrieval endpoints.
### Improved
- **Security**: Implemented a global `auth` middleware, mandating `Authorization: Bearer <token>` for all `users`, `countries`, and `roles` API calls.
- **Error Handling**: Implemented a specialized `403 Forbidden` logic status for session limit breaches, including recovery links.
- **Documentation**: Updated `API_DOCUMENTATION.md` to reflect the multi-identifier login, device headers, and session management.

## [1.10.0] - 2026-03-25
### Added
- **Multi-Role Based Access Control (RBAC)**: Implemented full RBAC infrastructure (`roles` and `user_roles` tables).
- **Roles API**: Created new CRUD endpoints for managing roles (`GET`, `POST`, `PUT`, `DELETE` /api/roles). Added `PUT /api/roles/:uuid/restore` for soft-delete recovery.
- **User Integration**: Updated users to support multiple roles. Included `roleUuids` in create/update payloads and nested `roles` in retrieval responses.
- **REST Standardization**: Enforced strict **HTTP 200 OK** response policy across all RBAC endpoints, delegating error logic to global middleware.
- **Bug Fix**: Enhanced slug uniqueness validation to account for soft-deleted roles, preventing 500 Database errors on duplicate entry.
- **Database Architecture**: Fixed `username` column length issue (increased to 100 characters) in the `users` table.
- **Repository Structure**: Moved `.gitignore` from the root directory to `node_backend/`.

## [1.9.0] - 2026-03-25
### Added
- **User Management**: Updated user registration (POST) and update (PUT) to support optional/required `countryUuid`.
- **Database Architecture**: Added `countryId` (camelCase) as a foreign key to the `users` table.
- **Validation**: Implemented server-side validation to ensure only `active` countries can be selected during registration or update.
- **Documentation**: Updated root and backend documentation to reflect recent changes.

## [1.8.1] - 2026-03-24
### Changed
- **Repository Structure**: Moved the `.git` directory and `.gitignore` file from `node_backend/` to the project root directory.
- **Git Config**: Updated the root `.gitignore` with recursive patterns (`**/`) to correctly manage dependencies and environment files across all project subdirectories.

## [1.8.0] - 2026-03-24
### Added
- **Timestamp Standardization**: Standardized `createdAt`, `updatedAt`, and `deletedAt` across all database tables. Added `deletedAt` to the `users` table.
- **Architectural Standards**: Updated `SKILL.md` to mandate that every future database record must include all three timestamp columns for audit and soft-delete integrity.

## [1.7.1] - 2026-03-24
### Changed
- **Error Handling**: Improved validation error messages by including the specific field name (path) in Zod error responses (e.g., `Validation failed: username: Required`).

## [1.6.2] - 2026-03-24
### Changed
- **Status Validation**: Blocked countries can no longer be updated or deleted. They must be active to be modified or removed.

## [1.6.1] - 2026-03-24
### Added
- **Status Validation**: Implemented strict validation in `CountryService` to prevent redundant or invalid actions (e.g., blocking an already blocked or deleted country) with specific error messages.

## [1.6.0] - 2026-03-24
### Changed
- **Naming Standardization**: Refactored the entire project to use `camelCase` exclusively for all identifiers, including database columns (`phone_code` -> `phoneCode`), API parameters, and internal code variables.
### Added
- **Coding Standards**: Updated `SKILL.md` to mandate `camelCase` as the official naming convention for all future development.

## [1.5.1] - 2026-03-24
### Fixed
- **Country Creation**: Fixed a `500 Internal Server Error` when creating a country with an empty or missing request body. Added robust validation in both controller and service layers.

## [1.5.0] - 2026-03-24
### Added
- **Countries Management**: Implemented a complete management system for countries (`name`, `code`, `phone_code`).
- **Database**: Created the `countries` table with `status` enum support and seeded it with initial country data.
- **API**: Established full CRUD endpoints with advanced filtering and nested JSON:API-style responses.

## [1.4.0] - 2026-03-24
### Added
- **Password Reset**: Implemented a new `POST /api/users/:uuid/reset-password` endpoint.
- **Security**: Added password confirmation validation and secure hashing with `bcrypt` for the reset process.

## [1.3.5] - 2026-03-24
### Added
- **API Documentation**: Created `API_DOCUMENTATION.md` as a comprehensive reference for all endpoints, query parameters, and payloads.
- **Documentation Standards**: Updated `SKILL.md` to mandate the maintenance of API documentation for all future changes.

## [1.3.4] - 2026-03-24
### Added
- **Sort Validation**: Implemented validation for sort fields in `UserRepository` to prevent searching by non-existent or restricted columns.

## [1.3.3] - 2026-03-24
### Changed
- **Messaging**: Updated API to return `No users found matching the criteria` when the result set is empty for better client feedback.

## [1.3.2] - 2026-03-24
### Added
- **Filter Param Merging**: Improved robustness by merging both `filter[...]` and `filters[...]` (plural) query parameters into a single filter object.
- **Link Normalization**: Hypermedia links (`self`, `next`, `prev`) now normalize all filter parameters to the singular `filter[...]` key for consistency.

## [1.3.1] - 2026-03-24
### Added
- **Robust Filtering**: Added support for both `filter` and `filters` (plural) query parameters for better client-side compatibility.
- **Date Filtering**: Implemented exact date matching for `createdAt` when using a `YYYY-MM-DD` string.
- **Flexible Sorting**: Added support for object-based sorting (e.g., `?sort[order]=asc`).

## [1.3.0] - 2026-03-24
### Added
- **Advanced Filtering**: Added support for `filter[field]=value` syntax for the `GET /api/users` endpoint.
- **Multi-Field Sorting**: Added support for the `sort` query parameter (e.g., `?sort=-createdAt,name`).
- **Query Persistence**: Implemented query parameter persistence in hypermedia links (`self`, `next`, `prev`).

## [1.2.0] - 2026-03-24
### Changed
- **Major API Refactor**: Implemented a nested, resource-oriented response format (JSON:API-style).
- Resources now follow the `{ id, type, attributes, meta, links }` structure.
- **Request Tracing**: Integrated `requestId` into the top-level metadata for every response.
- **Enhanced Pagination**: Expanded pagination metadata to include `total`, `count`, `perPage`, `currentPage`, and `totalPages`.

## [1.1.5] - 2026-03-24
### Fixed
- **Knex Typings**: Fixed "Could not find a declaration file for module 'knex'" error in `database.ts` caused by `NodeNext` resolution rules.

## [1.1.4] - 2026-03-24
### Changed
- **UTC Timestamps**: Reverted the entire application to the standard UTC ISO-8601 format for all timestamps.
- Removed local timezone logic and `dateStrings` configuration.

## [1.1.3] - 2026-03-24
### Added
- **API Pagination**: Implemented unified pagination for `GET /api/users`.
- Added support for `page` and `limit` query parameters.
- Added `meta.pagination` object to responses (total, page, limit, totalPages).

## [1.1.2] - 2026-03-24
### Fixed
- **Timezone Serialization**: Configured `mysql2` and API controllers to return all timestamps (including `meta.timestamp`) in the local `Asia/Kolkata` format instead of UTC ISO-8601.
- **Timezone Support**: Centralized timezone handling in `nowDb()` to respect the `.env` setting.

## [1.1.0] - 2026-03-24
### Added
- Mandatory `X-API-Version` header requirement (v1).
- Strict password complexity (min 8 chars, Upper, Lower, Number).
- Password confirmation validation (`confirmPassword`).
- Strict 10-digit phone number validation.
- Dynamic `help` messages in error responses for better developer experience.
- Internal database `id` is now strictly excluded from all API responses (Privacy).

### Changed
- **Global Refactor**: All JSON keys and database attributes changed from `snake_case` to `camelCase` (e.g., `createdAt`, `updatedAt`).
- **Standardized Responses**: All API responses now return HTTP 200 OK status code.
- **Improved Errors**: Standardized error JSON structure with `error: true` and `errorCode` (Logic Status).

### Fixed
- Enhanced `ZodError` handling to return clean, human-readable messages instead of raw JSON.
- Fixed 404/500 inconsistencies in validation and route handling.
- Corrected environment loading order for ESM hoisting support.

## [1.0.0] - 2026-03-23
### Added
- Initial replication of the Fiber Route Map Backend from PHP (Slim 4) to Node.js (Express).
- Implemented `UserRepository` using Knex.js for MySQL interaction.
- Implemented `UserService` for business logic and status management.
- Implemented `UserController` with Zod validation.
- All core user endpoints migrated:
  - `GET /api/users` (List/Filter)
  - `POST /api/users` (Create)
  - `GET /api/users/{uuid}` (Show)
  - `PUT /api/users/{uuid}` (Update)
  - `DELETE /api/users/{uuid}` (Soft Delete)
  - `POST /api/users/{uuid}/block` (Administrative Block)
  - `PUT /api/users/{uuid}/unblock` (Administrative Unblock)
- Integrated TypeScript for end-to-end type safety.
- Integrated Winston for structured logging.
- Integrated Helmet and CORS for basic API security.
- Integrated `tsx` for modern ESM-compliant development.
