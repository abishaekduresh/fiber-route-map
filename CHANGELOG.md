# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.38.0] - 2026-05-03
### Added
- **Tenant Impersonation (Super-Admin)**: Super-admins can now switch into any active tenant's dashboard directly from the Manage Tenants page without requiring the tenant's credentials.
  - New backend endpoint `POST /api/auth/users/impersonate/:tenantUuid` generates a short-lived 2-hour JWT marked with `impersonated: true` — no tenant session is created or counted against the session limit.
  - Impersonation banner displayed at the top of the tenant portal (amber, fixed position), showing the tenant name and an **Exit to Admin** button that restores the admin session and returns to `/manage/tenants`.
  - Logout button is hidden in the tenant sidebar during impersonation to prevent accidental session termination.
  - Admin credentials are stashed in `localStorage` during impersonation and restored cleanly on exit.
- **Swagger Documentation**: Added full OpenAPI spec for `POST /auth/users/impersonate/{tenantUuid}`.
### Changed
- **Version Synchronization**: Bumped version to 1.38.0 across frontend, backend, and API docs.

## [1.37.0] - 2026-05-03
### Added
- **Authentication Routing Refactor**: 
  - Moved Tenant Login to the primary `/login` route for improved accessibility.
  - Relocated Super Admin/Staff Login to `/superadmin`.
- **Improved Directory Structure**: Renamed page directories and synchronized CSS modules to match the new URL patterns.
- **Enhanced Redirect Logic**: Updated all `AuthGuards`, middleware, and session termination flows to respect the new routing hierarchy.
### Changed
- **Version Synchronization**: Unified versioning across the entire ecosystem (Frontend, Backend, and API Docs).

## [1.36.0] - 2026-05-03
### Added
- **Tenant Profile Enhancements**: Integrated user role display into the tenant profile header, personal information, and security sections.
- **Improved Tenant Logout**: Implemented backend-driven session invalidation for tenants, ensuring sessions are properly cleared from the database on logout.
- **Database Auto-Migration**: Added self-healing logic to backfill missing `uuid` values in the `tenant_sessions` table for older database installations.
### Fixed
- **Type Safety**: Resolved various TypeScript compilation errors related to session management and route parameters.
- **Frontend Keys**: Fixed a React "duplicate key" warning in the session management list by providing a unique fallback key.

## [1.35.0] - 2026-05-02
### Added
- **Tenant Session Limit Enforcement**: Implemented robust backend checking against `sessionLimit` during tenant login.
- **Session Termination Modal**: Developed a premium glassmorphism modal for tenants to manage and terminate active sessions when the limit is reached.
- **Management Token Flow**: Introduced short-lived, stateless management tokens for secure remote session termination without full authentication.
- **Improved API Error Handling**: Enhanced the API client to gracefully handle non-JSON responses and provide detailed connectivity feedback.
- **Dynamic 404 JSON Handler**: Implemented a catch-all API route handler to prevent HTML responses on undefined endpoints.
- **CORS Optimization**: Refined security policies to allow custom session management headers (`X-Mgmt-Token`).
- **Standardized Tenant Assets**: Integrated official branding and improved responsive layouts for the tenant portal.

## [1.34.0] - 2026-05-02
### Added
- **Enhanced Tenant Validation**: Implemented strict 3-step validation for tenant authentication:
  1. Credential verification (Phone + Password).
  2. Individual tenant status check (`active`).
  3. Associated business status check (`active`).
- **Secure Token Refresh**: Integrated status validation into the tenant token refresh flow to proactively terminate sessions if account/business status changes.
- **Improved Data Modeling**: Extended Tenant repository and models to include comprehensive business status information.

## [1.33.0] - 2026-05-02
### Added
- **Secure Tenant Login Frontend**: Developed a premium emerald-themed login portal for tenants at `/tenant-login`.
- **Tenant Session Management**: Implemented `TenantAuthContext` and specialized API client methods for managing tenant-specific JWT tokens and metadata.
- **Tenant Dashboard**: Created a responsive placeholder dashboard for authenticated tenants at `/tenant/dashboard`.
- **Integrated Feedback**: Integrated `sonner` toasts for comprehensive authentication status messaging in the tenant portal.

## [1.32.0] - 2026-05-02
### Added
- **Secure Tenant Authentication**: Implemented a robust JWT-based login system for tenants using phone number and password.
- **JWT Token Rotation**: Added support for short-lived access tokens and long-lived refresh tokens with automatic rotation for enhanced security.
- **Tenant Session Management**: Created a dedicated `tenant_refresh_tokens` database table to track valid sessions and device metadata.
- **Modular Swagger Documentation**: Refactored the authentication OpenAPI definitions into individual blocks and modular schemas (`auth_schemas.doc.ts`) to resolve parsing issues and improve documentation clarity.
### Fixed
- **Swagger Visibility**: Resolved an issue where tenant login and refresh token endpoints were not appearing in the interactive API documentation.

## [1.31.0] - 2026-05-02
### Added
- **Unified Card Design System**: Redesigned User, Tenant, and Business cards with a premium, boxy aesthetic featuring avatar glows, role-specific pill badges, and theme-colored action buttons.
### Fixed
- **UI Inconsistency**: Synchronized the layout and styling across all management pages for a seamless user experience.
- **Missing Imports**: Resolved a ReferenceError on the Tenant Businesses page.

## [1.30.0] - 2026-05-02
### Added
- **Tenant Account Phone Capture**: Added a phone number field to the tenant account section when creating a new business, ensuring consistent contact data collection.
### Fixed
- **RBAC Slug Consistency**: Resolved a naming mismatch between frontend permission guards and backend slugs (hyphen vs underscore) that was hiding action buttons on the Tenant Businesses page.
- **Business Management Security**: Added missing permission gating to the "Add Business" button.
- **Audit Log Refinement**: Fixed a TypeScript type error in the audit logger and optimized action derivation logic.

## [1.29.0] - 2026-05-02
### Added
- **Audit Logs Management UI**: Implemented a comprehensive audit log viewer with server-side pagination, advanced filtering (by actor, action, resource, date, status), and detailed inspection modals.
- **Audit Logging Middleware**: Developed a high-fidelity logging system that captures actor metadata, request/response bodies (sanitized), IP addresses, and performance metrics for all API requests.
- **Auto-Migration for Audit Logs**: Backend now automatically creates and seeds the `audit_logs` table and associated permissions on startup if they don't exist.
### Fixed
- **Audit Log Duplication**: Resolved a race condition where CORS preflight (OPTIONS) requests were being logged as separate audit entries.
- **Audit Log Theme Support**: Fully integrated the audit log viewer with the global theme system, using unified CSS variables for all UI elements.
- **Tenant Schema Synchronization**: Corrected discrepancies in the `tenants` table schema between the setup script and the manual SQL dump.

## [1.28.0] - 2026-05-02
### Added
- **API Versioning Support**: Added an "API Version" field to the API Docs "Try it out" tool. It defaults to the spec version but can be modified manually; the version is sent via the `X-API-Version` header to prevent backend versioning errors.
- **Enhanced Tenant Management (Full Stack)**: Implemented `phone` and `tenantBusinessId` support across the entire stack. This includes database schema updates, repository joins, service validation, and controller transformations for seamless data flow from the frontend to the database.
### Changed
- **API Docs UX Optimization**: Redesigned the API Documentation viewer to "show full" content. Removed the internal fixed-height scroll container for the endpoint list and the `max-height` constraint on code blocks. The documentation now flows naturally with the page scroll.
- **Sticky API Docs Sidebar**: Converted the API Docs tag sidebar to `position: sticky` so it remains accessible while scrolling through long documentation pages.
- **Summary Wrapping**: Enabled multi-line wrapping for API endpoint summaries to ensure full visibility of descriptions on all screen sizes.

## [1.27.0] - 2026-05-02
### Added
- **Interactive API Docs Viewer** (`/manage/api-docs`): A fully custom, Swagger-style documentation page built in Next.js — fetches the live OpenAPI spec from the backend and renders it with tag-based sidebar navigation, endpoint accordion cards, schema tables, named response examples, and a built-in "Try it out" HTTP client.
- **Sidebar API Docs Link**: Added "API Docs" nav item to the dashboard sidebar under the Management section, guarded by the `apidoc.view` permission.
- **Responses Schema Doc** (`node_backend/src/docs/schemas/responses.doc.ts`): Centralised reusable OpenAPI response component definitions (`400BadRequest`, `401Unauthorized`, `403Forbidden`, `404NotFound`, `422ValidationError`, `500InternalError`, `ApiVersionHeader`).
### Changed
- **Swagger JSDoc — Full Example Rewrite**: Rewrote all nine path doc files (`auth`, `health`, `setup`, `roles`, `users`, `countries`, `permissions`, `tenants`, `tenant_business`) to use top-level `example`/`examples` fields (instead of nested `schema.example`) so the API Docs Viewer can display them correctly.
- **Endpoint Accordion UX**: Endpoint cards now behave as an accordion — opening one automatically closes all others. State is lifted to the parent list component.
- **API Docs Scroll Fix**: Tab content panels (Documentation / Try it out) now scroll vertically via the outer endpoint list rather than a fixed `max-height` container; code blocks have `max-height: 400px` with independent y-scroll.
- **Try it out X-Axis Scroll**: The Try it out panel and URL row are now horizontally scrollable on narrow viewports.
- **HTTP Status Codes**: Corrected all create endpoints from `200` to `201` in Swagger docs to match actual backend responses.

## [1.26.0] - 2026-05-01
### Added
- **Role Tenant Visibility**: Added `showForTenants` boolean attribute to system roles. Administrators can now toggle whether a role should be available when managing tenants.
- **Tenant Reactivation**: Added "Reactivate" button for suspended tenants in the management UI — allows one-click restoration of account access.
- **Database Column `showForTenants`**: Updated `roles` table schema to support role-to-tenant visibility filtering.
- **Role Status Indicators**: Enhanced `RoleCard` with color-coded visibility status ("Visible for Tenants" / "Hidden from Tenants").
### Changed
- **Tenant Role Selection**: `TenantModal` now dynamically filters the roles list, displaying only roles marked as `showForTenants`.
- **Tenant Action Notifications**: Replaced generic "unblocked" toast with status-aware "reactivated" messaging when restoring suspended accounts.

## [1.25.0] - 2026-04-16
### Added
- **View Details Button**: Eye-icon button added to every management card (Users, Tenants, Tenant Businesses) — opens a read-only `ViewModal` showing all record fields grouped by section (Contact, Roles/Account/Business Info, Location, Timestamps).
- **Suspend Action on Cards**: Tenant and Tenant Business cards now expose a dedicated Suspend button alongside Block/Unblock — calls the respective `/suspend` endpoint.
- **`status-suspended` Badge**: Purple status badge added across all card and view modal components for the `suspended` state.
- **ViewModal Component** (`website/src/components/ui/ViewModal.tsx`): Reusable glassmorphism detail-view modal with configurable sections, avatar, badge, and status badge — mounted conditionally to avoid DOM bloat.

### Changed
- **Tenant & Business Sidebar Links**: Removed permission guards from "Businesses" and "Tenants" nav items — links are now always visible like Users and Countries.
- **Add Business Button**: Removed `<Can I="tenant-business.create">` guard — button is always rendered.
- **API Client — `getDeviceName()` Cached**: Device name is now resolved once per session and memoised in a module-level variable instead of recomputing on every request.
- **API Client — Unlimited Tenant/Business Fetch**: `getTenants()` and `getTenantBusinesses()` now use `limit=-1` (matching `getPermissions()`) so all records are returned rather than a hard cap of 100.
- **Card DOM Efficiency**: `ViewModal` is rendered conditionally (`{isViewOpen && <ViewModal>}`) inside the card `div` instead of always mounted inside a fragment wrapper — eliminates idle component instances for every visible card.

## [1.24.0] - 2026-04-16
### Added
- **Tenant Management UI**: Implemented a comprehensive management interface for Tenants, featuring a paginated card grid and a detailed view modal.
- **Tenant Business Management UI**: Launched a dedicated management module for Tenant Businesses (Operators and Distributors) with full CRUD support.
- **ViewModal Component**: Developed a high-fidelity, reusable glassmorphism component for inspecting resource details with grouped data sections.
### Changed
- **Sidebar Navigation**: Reorganized the dashboard sidebar to group Tenant and Business management under a new "Tenants" dropdown for better scalability.
- **User Management**: Enhanced the user card UI and updated action visibility based on permission sets.
### Removed
- **Legacy Test Scripts**: Deleted `test_errors.js` and `test_refactor.js` from the backend to maintain a clean repository.
- **AI Skill Migration**: Moved `.ai-agent/SKILL.md` to `.claude/SKILL.md` to align with the new AI agent environment.


## [1.23.0] - 2026-04-09
### Added
- **Permission Sync**: `POST /api/permissions/sync` inserts any missing endpoint permissions (INSERT IGNORE) — idempotent, never modifies existing records. Returns list of added slugs and total count.
- **Sync Button** (Permissions page): "Sync Permissions" button with spinner, confirm dialog, and toast feedback — visible to users with `permission.create`.
- **Permissions Pagination**: Client-side pagination (12 per page) with Prev/Next and ellipsis-aware page buttons added to the Manage Permissions page.
### Fixed
- **Permissions List Truncated**: `GET /api/permissions` was fetching only 10 records (backend default). Frontend now passes `?limit=-1` to load all permissions — affects both the Permissions page and the Role permission picker in RoleModal.
- **Permission RBAC Slugs**: Permission routes were guarded by `role.view/create/update/delete` instead of `permission.view/create/update/delete`. Corrected.

## [1.22.0] - 2026-04-05
### Added
- **Tenant Management**: Full CRUD API (`GET/POST/PUT/DELETE /api/tenants`) with block, unblock, and suspend actions. Tenants have email, username, name, address, password (hashed), and optional country/role associations.
- **Tenant Business Management**: Full CRUD API (`GET/POST/PUT/DELETE /api/tenant-business`) with block, unblock, and suspend actions. Supports `operator` and `distributor` types with country association.
- **Swagger Docs for Tenants & Tenant Business**: New `Tenants` and `Tenant Business` tag groups in `/api/docs` with full schema, parameter, and request body documentation.
- **8 New RBAC Permissions**: `tenant.view/create/update/delete` and `tenant_business.view/create/update/delete` — seeded automatically during setup.
### Changed
- **DB Schema**: `tenants` and `tenant_business` tables updated to `InnoDB`, `countryId`/`roleId` made nullable, `phone` column normalised to `varchar(30)`, `address` expanded to `varchar(255)`, `email` expanded to `varchar(191)`. Foreign key constraints and search indexes added.
- **Setup Migrate**: Now creates 11 tables (was 9) — includes `tenants` and `tenant_business` with FK constraints and indexes on first run.

## [1.21.0] - 2026-04-04
### Added
- **Setup Reset**: New `DELETE /api/setup/reset` endpoint drops the configured database and resets `SETUP_COMPLETE=false` — frontend partial-setup detection shows a warning banner with inline confirmation before dropping.
- **Default Country Seed**: India (`IN`, `+91`) is automatically inserted during setup as a default country.
- **Health-Aware Redirects**: `HealthStatus` and `/unhealthy` page now check setup status before redirecting — routes to `/setup` if setup is incomplete, `/unhealthy` otherwise.
### Fixed
- **Permissions Missing from Login Response**: All `<Can>` permission gates were permanently hidden after login. Fixed by including `permissions[]` in the login/me response.
- **Backend Default Port**: Changed default port from 3000 (conflicts with Next.js) to 3001.
- **`.env` Path Resolution**: Fixed path bugs in both `index.ts` and `SetupService.ts` that prevented `.env` from being created or loaded correctly.
- **Permissions Sidebar Nav**: Fixed wrong permission slug (`role.view` → `permission.view`) on the Permissions nav item.
- **Health Check Redirect Loop**: `HealthStatus` now skips checks on `/setup`, `/login`, and `/unhealthy` to prevent infinite redirect loops.

## [1.20.0] - 2026-04-03
### Added
- **Web-Based Setup Wizard**: New `/setup` page (frontend) and `/api/setup/*` endpoints (backend) — collects DB credentials, writes `.env`, creates all 9 database tables, seeds 21 permissions, creates a Super Admin role, and sets up the first admin user in a single flow.
- **Declarative Permission Gating**: All management action buttons across Users, Roles, Countries, and Permissions UIs are now controlled by `<Can I="resource.action">` gates for true RBAC-enforced rendering.
### Security
- **RBAC Admin Bypass Removed** (Backend): `rbac.ts` no longer grants blanket access to admin-role users — actual assigned permissions are enforced for every request.
- **RBAC Admin Bypass Removed** (Frontend): `hasPermission()` in `AuthContext.tsx` no longer special-cases admin roles — permission checks always evaluate against the flattened permission list from the API.

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
