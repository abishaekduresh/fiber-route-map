# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.19.0] - 2026-04-03
### Added
- **ConfirmDialog Component**: Replaced all browser-native `window.confirm()` and `alert()` calls with a polished, glassmorphism-styled in-app confirmation dialog across all management pages (Users, Roles, Countries, Permissions) and the Profile page.
### Changed
- **Complete Website UI/UX Overhaul**: Comprehensively redesigned all CSS modules — global design tokens, sidebar, topbar, login, dashboard, user cards, role cards, and profile page — with refined spacing, transitions, focus styles, and visual hierarchy.
### Security
- **Self-Deletion Prevention**: Backend now returns `403 Forbidden` when an authenticated user attempts to delete their own account via `DELETE /api/users/:uuid`.

## [1.18.1] - 2026-04-01
### Fixed
- **Role Permissions Sync**: Standardized frontend data mapping to strictly pass `uuid` identifiers rather than slugs when synchronizing permissions with the Node.js backend.
- **Global Modal Stacking**: Freed component modals from restrictive wrapper sub-stacking contexts to allow genuine overlay positioning across the entire dashboard layout.
### Changed
- **Roles UI Standardization**: Upgraded the Roles list display to use paginated Card Grids identical to the Users management view.
- **Architectural Policy**: Updated `.antigravity/SKILL.md` to rigorously enforce frontend pagination and consistent grid layouts for all management interfaces.

## [1.18.0] - 2026-04-01
### Added
- **Standardized Permission API**: Refactored permission endpoints to follow the "Universal 200 OK" and JSON:API inspired response format.
- **Enhanced Swagger Documentation**: Fully documented all permission CRUD operations (List, Show, Create, Update, Delete) with interactive testing support.
- **Permission Service Layer**: Introduced a specialized layer to manage Permission business logic and validation.
- **Dynamic Permission Sorting**: Enabled multi-field sorting capabilities for permission resource discovery.

## [1.17.0] - 2026-03-28
### Added
- **Granular RBAC System**: Launched a comprehensive Role-Based Access Control (RBAC) architecture across the entire stack.
- **Permission Management**: Added a new permission-based security layer that enables granular control (View, Create, Update, Delete) for all system resources (Users, Roles, Countries).
- **Interactive Role Management UI**: Introduced a new management dashboard for creating roles and assigning system permissions with a visual grouping logic.
- **Declarative Frontend Security**: Integrated the `<Can>` component and `usePermissions` hook for real-time, permission-aware UI rendering on the website.
- **Backend Enforce Middleware**: Developed an `rbac` middleware in Node.js to validate permission slugs on a per-request basis with administrative bypass capabilities.
- **Flat-File Permission Model**: Enhanced the user model to store a flattened list of permission slugs for O(1) checking efficiency.

## [1.15.0] - 2026-03-27

## [1.14.0] - 2026-03-27
### Added
- **Robust Health Monitoring**: Implemented a standardized `/api/health` endpoint in the backend for real-time system and database status.
- **Health-Based Redirects**: Frontend now automatically redirects to a dedicated `/unhealthy` page if the backend or database is unreachable.
- **Dynamic System Status**: Integrated live health checks into the login page footer, replacing hardcoded "System Online" strings.
- **Recovery Workflow**: Added a "Try Again" mechanism on the status page to automatically return to the dashboard upon system recovery.
### Changed
- **Backend Port Reconfiguration**: Moved the Node.js backend to port **3001** to resolve deployment conflicts with the Next.js frontend.

## [1.13.0] - 2026-03-26
### Added
- **Interactive API Documentation**: Launched a fully interactive Swagger/OpenAPI 3.0 UI at `/api/docs` with universal coverage.
- **Public User Registration**: Enabled simplified `POST /api/users` registration without requiring an initial authentication token.
- **Standardized Error System**: Introduced universal `errorType` identifiers across the entire backend for programmatic error handling in the frontend.
### Changed
- **API Versioning**: Standardized on the `X-Api-Version` header naming across all interactive documentation.
- **API Refactoring**: Consolidated authentication and selective route protection into modular resource hierarchies.
- **Documentation Migration**: Migrated legacy `API_DOCUMENTATION.md` to a scalable, modular JSDoc-based architecture in `src/docs/`.

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
