# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.11.0] - 2026-03-26
### Added
- **Secure Authentication System**: Implemented a robust login/logout system with database-backed session management.
- **Multi-Identifier Login**: Users can now authenticate using their **email**, **username**, or **phone number** using a single `identifier` field.
- **Database Connectivity Middleware**: Integrated a health-check middleware that monitors database status and prevents 500 errors by returning a structured `503 Service Unavailable` response.
- **Role Response Links**: Enhanced the roles API with standardized hypermedia links and full pagination metadata.
### Improved
- **Security**: Enforced mandatory `Authorization: Bearer <token>` headers across all protected resource endpoints.
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
