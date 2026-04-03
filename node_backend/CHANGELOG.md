# Changelog

All notable changes to the Fiber Route Map Node.js Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
