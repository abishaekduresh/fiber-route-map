# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.12.0] - 2026-03-26
### Added
- **Profile & Account Management**: Implemented a dedicated profile page (`/profile`) and TopBar integration for viewing account details and managing active sessions.
- **Auto-Logout Security**: Developed an automatic logout mechanism that triggers immediately when the user's active session is terminated from the profile view.
- **Current Session Flagging**: Enhanced the `/api/auth/me` endpoint to identify and flag the user's active session with a `isCurrent: true` attribute.
- **Frontend Launch**: Developed a futuristic Next.js 16 website with localized authentication and session management.
- **Per-User Session Limits**: Migrated backend to a flexible per-user session constraint system (defaulting to 1).
### Fixed
- **Frontend Refinements**: Resolved hydration mismatches caused by browser extensions and fixed the user data path in the TopBar.

## [1.11.1] - 2026-03-26
### Fixed
- **Type Safety**: Resolved a TypeScript compilation error in `AuthController.ts` where `req.params.uuid` was incorrectly typed, ensuring robust session termination.

## [1.11.0] - 2026-03-26
### Added
- **Secure Authentication System**: Implemented a robust login/logout system with database-backed session management.
- **Multi-Identifier Login**: Users can now authenticate using their **email**, **username**, or **phone number** using a single `identifier` field.
- **Device Identification**: Integrated hardware/device tracking via `X-Device-Id` and `X-Device-Name` headers.
- **Login Device Limits**: Enforced a strict limit of **3 concurrent active sessions** per user to enhance security.
- **Session Management API**: Created new endpoints for listing active devices and performing remote logouts (`GET /api/auth/sessions`, `DELETE /api/auth/sessions/:uuid`).
- **Consolidated Profile View**: Updated `/api/auth/me` to include a live list of all active sessions/devices.
- **Database Connectivity Middleware**: Integrated a health-check middleware that monitors database status and prevents 500 errors by returning a structured `503 Service Unavailable` response.
- **Role Response Links**: Enhanced the roles API with standardized hypermedia links and full pagination metadata.
### Improved
- **Security**: Enforced mandatory `Authorization: Bearer <token>` headers across all protected resource endpoints.
- **Error Handling**: Implemented a specialized `403 Forbidden` response for session limit breaches, including recovery links and session data.
- **Documentation**: Extensively updated the API documentation (v1.11.0) and project-wide documentation.

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
