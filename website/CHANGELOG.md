# Changelog

All notable changes to the Fiber Route Map Website will be documented in this file.

## [1.13.0] - 2026-03-26
### Changed
- **API Integration**: Re-aligned the centralized API client with the refactored `/api/auth/users/` backend endpoints.
- **Version Sync**: Synchronized project versioning to v1.13.0.

## [1.12.0] - 2026-03-26
### Added
- **Profile Page**: Implemented a comprehensive account management view with real-time session tracking.
- **Auto-Logout Redirection**: Developed logic to automatically redirect users to the login page if their current session is terminated.
- **Current Session Badge**: Added visual indicators to identify the active device among multiple sessions.
- **Session Management UI**: Developed a sophisticated modal to handle session limit conflicts directly from the login screen.
- **Localized Authentication**: Built a secure, multi-identifier login system (Email/Username/Phone).
### Fixed
- **TopBar TypeError**: Corrected the data access path for user profile information.
- **Hydration Mismatch**: Suppressed React hydration warnings for attributes added by browser extensions.
- **Version Sync**: Synchronized internal and UI versioning to v1.12.0.

## [0.1.0] - 2026-03-26
### Added
- **Initial Frontend Launch**: Bootstrapped the project using Next.js 16 and TypeScript.
- **Futuristic Glassmorphism Design**: Implemented a comprehensive design system with blurred backgrounds, vibrant gradients, and micro-animations.
- **Secure Authentication**: Built a multi-identifier login system (Email/Username/Phone).
- **Session Management UI**: Developed a sophisticated modal to handle session limit conflicts, enabling users to manage active devices directly from the login screen.
- **API Integration**: Established a centralized API client with automatic device tracking and error handling.
- **Registration**: Implemented user registration with country selection and password strength validation.
