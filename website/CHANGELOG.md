# Changelog

All notable changes to the Fiber Route Map Website will be documented in this file.

## [1.18.1] - 2026-04-01
### Added
- **Architectural Policy Constraints**: Formalized Paginated Grid layouts via a new section in `.antigravity/SKILL.md`.
### Changed
- **Roles Management Overhaul**: Refactored the internal Roles list payload to rely on an identical frontend-pagination logic pattern (`itemsPerPage=5`) to perfectly align visually with the Users management layout.
- **Card Styling Isolation**: Abstracted Role card components to utilize an isolated, dedicated `.module.css` footprint.
### Fixed
- **Permissions Synchronization**: Re-wired the `<RoleModal />` component to pass specific UUID identifiers rather than slugs to properly appease backend data queries.
- **Modal Overflow Trapping**: Elevated dynamic overlays by disabling parent layout `z-index` properties to gracefully override lateral navigation bounding boxes.

## [1.17.0] - 2026-03-28
### Added
- **Granular RBAC Management UI**: Developed a new management module for Roles and Permissions.
- **Permission Selection Grid**: Implemented a resource-grouped permission selection UI in the Role Modal.
- **Multi-Role User Assignment**: Enhanced the User Modal to allow toggling multiple system roles per user.
- **RBAC-Aware Navigation**: Integrated the `<Can>` component into the sidebar to dynamically show/hide management links based on user permissions.
- **Centralized Auth Status**: Developed `AuthContext` to manage application-wide user state and permission-checking logic.
- **Role Listing Cards**: Created specialized interactive cards for role discovery with default role protection.

## [1.16.0] - 2026-03-27

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
