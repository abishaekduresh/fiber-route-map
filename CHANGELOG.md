# Changelog

All notable changes to the Fiber Route Map project will be documented in this file.

## [1.9.0] - 2026-03-25
### Added
- **User Registration Requirement**: Updated user registration to require a `countryUuid`.
- **Database Architecture**: Added `countryId` (camelCase) as a foreign key to the `users` table.
- **Validation**: Implemented server-side validation to ensure only `active` countries can be selected during registration.
