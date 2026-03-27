# Changelog

All notable changes to the Fiber Route Map Website will be documented in this file.

## [1.16.0] - 2026-03-27
### Added
- **Enhanced User Management**: Moved the user management page to a new `/manage/users` URL.
- **Search & Filtering**: Integrated real-time search (Name, Username, Email) and multi-status/role filtering.
- **Client-Side Pagination**: Added pagination with a default limit of 5 users per page for improved performance.
- **Data Export**: Implemented "Export CSV" functionality to download filtered user lists.
- **Updated Navigation**: Synchronized `Sidebar` and `TopBar` links with the new management and profile routes.

## [1.15.0] - 2026-03-27
### Added
- **Multi-Theme Support**: Integrated a centralized `ThemeContext` enabling users to switch between Light, Dark, and System modes with local storage persistence.
- **Responsive Dashboard Layout**: redesigned `DashboardLayout` and `Sidebar` with mobile-first media queries, including a hamburger menu overlay.
- **Bottom-Right Toast Notifications**: Implemented `sonner` for non-intrusive API feedback, replacing static error/success states in the login and user management pages.
### Changed
- **Login UI/UX Refinement**: Completely overhauled the login experience with modern glassmorphism, animated backgrounds, and responsive card layouts.

## [1.13.0] - 2026-03-26
### Changed
- **API Integration**: Re-aligned the centralized API client with the refactored unauthenticated registration flow.
- **Error Handling**: Enhanced the global response interceptor to support the new backend `errorType` identifiers for more granular user feedback.
- **Version Sync**: Synchronized project versioning to v1.13.0 across all views and metadata.

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
