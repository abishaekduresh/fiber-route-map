# Changelog

All notable changes to the Fiber Route Map Node.js Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
