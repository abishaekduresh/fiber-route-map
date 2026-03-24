# Changelog

All notable changes to the Fiber Route Map Node.js Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
