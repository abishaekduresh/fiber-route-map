# Changelog

All notable changes to the Fiber Route Map Node.js Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
